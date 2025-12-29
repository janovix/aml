import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { toast } from "sonner";
import { ApiError } from "./api/http";

// Mock sonner toast
vi.mock("sonner", () => ({
	toast: {
		promise: vi.fn(),
	},
}));

// Import after mocking
import { executeMutation } from "./mutations";

describe("mutations", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("executeMutation", () => {
		it("calls toast.promise with the mutation promise", async () => {
			const result = { id: 1, name: "test" };
			const mutation = vi.fn().mockResolvedValue(result);

			await executeMutation({
				mutation,
				loading: "Loading...",
				success: "Success!",
			});

			expect(mutation).toHaveBeenCalled();
			expect(toast.promise).toHaveBeenCalledWith(
				expect.any(Promise),
				expect.objectContaining({
					loading: "Loading...",
				}),
			);
		});

		it("returns the mutation result", async () => {
			const result = { id: 1, name: "test" };
			const mutation = vi.fn().mockResolvedValue(result);

			const actualResult = await executeMutation({
				mutation,
				loading: "Loading...",
				success: "Success!",
			});

			expect(actualResult).toEqual(result);
		});

		it("uses success string message", async () => {
			const result = { id: 1 };
			const mutation = vi.fn().mockResolvedValue(result);

			await executeMutation({
				mutation,
				loading: "Loading...",
				success: "Created successfully",
			});

			const toastConfig = (toast.promise as ReturnType<typeof vi.fn>).mock
				.calls[0][1];
			const successMessage = toastConfig.success(result);
			expect(successMessage).toBe("Created successfully");
		});

		it("uses success function message", async () => {
			const result = { id: 123, name: "Test Item" };
			const mutation = vi.fn().mockResolvedValue(result);

			await executeMutation({
				mutation,
				loading: "Loading...",
				success: (data) => `Created item: ${data.name}`,
			});

			const toastConfig = (toast.promise as ReturnType<typeof vi.fn>).mock
				.calls[0][1];
			const successMessage = toastConfig.success(result);
			expect(successMessage).toBe("Created item: Test Item");
		});

		it("calls onSuccess callback after success", async () => {
			const result = { id: 1 };
			const mutation = vi.fn().mockResolvedValue(result);
			const onSuccess = vi.fn();

			await executeMutation({
				mutation,
				loading: "Loading...",
				success: "Success!",
				onSuccess,
			});

			const toastConfig = (toast.promise as ReturnType<typeof vi.fn>).mock
				.calls[0][1];
			toastConfig.success(result);

			// Wait for async callback execution
			await new Promise((resolve) => setTimeout(resolve, 0));

			expect(onSuccess).toHaveBeenCalledWith(result);
		});

		it("logs error when onSuccess callback fails", async () => {
			const result = { id: 1 };
			const mutation = vi.fn().mockResolvedValue(result);
			const onSuccess = vi.fn().mockRejectedValue(new Error("Callback error"));
			const consoleErrorSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});

			await executeMutation({
				mutation,
				loading: "Loading...",
				success: "Success!",
				onSuccess,
			});

			const toastConfig = (toast.promise as ReturnType<typeof vi.fn>).mock
				.calls[0][1];
			toastConfig.success(result);

			// Wait for async callback execution
			await new Promise((resolve) => setTimeout(resolve, 10));

			expect(consoleErrorSpy).toHaveBeenCalledWith(
				"Error in onSuccess callback:",
				expect.any(Error),
			);
		});

		it("uses custom error string message when provided", async () => {
			const mutation = vi.fn().mockResolvedValue({});

			await executeMutation({
				mutation,
				loading: "Loading...",
				success: "Success!",
				error: "Custom error message",
			});

			const toastConfig = (toast.promise as ReturnType<typeof vi.fn>).mock
				.calls[0][1];
			const errorMessage = toastConfig.error(new Error("Any error"));
			expect(errorMessage).toBe("Custom error message");
		});

		it("uses custom error function message when provided", async () => {
			const mutation = vi.fn().mockResolvedValue({});

			await executeMutation({
				mutation,
				loading: "Loading...",
				success: "Success!",
				error: (err) =>
					`Error: ${err instanceof Error ? err.message : "unknown"}`,
			});

			const toastConfig = (toast.promise as ReturnType<typeof vi.fn>).mock
				.calls[0][1];
			const errorMessage = toastConfig.error(new Error("Test error"));
			expect(errorMessage).toBe("Error: Test error");
		});

		it("extracts message from ApiError with body.message", async () => {
			const mutation = vi.fn().mockResolvedValue({});

			await executeMutation({
				mutation,
				loading: "Loading...",
				success: "Success!",
			});

			const apiError = new ApiError("Request failed", {
				status: 400,
				body: { message: "Validation failed" },
			});

			const toastConfig = (toast.promise as ReturnType<typeof vi.fn>).mock
				.calls[0][1];
			const errorMessage = toastConfig.error(apiError);
			expect(errorMessage).toBe("Validation failed");
		});

		it("extracts error from ApiError with body.error", async () => {
			const mutation = vi.fn().mockResolvedValue({});

			await executeMutation({
				mutation,
				loading: "Loading...",
				success: "Success!",
			});

			const apiError = new ApiError("Request failed", {
				status: 400,
				body: { error: "Not found" },
			});

			const toastConfig = (toast.promise as ReturnType<typeof vi.fn>).mock
				.calls[0][1];
			const errorMessage = toastConfig.error(apiError);
			expect(errorMessage).toBe("Not found");
		});

		it("uses ApiError.message when body has no message or error", async () => {
			const mutation = vi.fn().mockResolvedValue({});

			await executeMutation({
				mutation,
				loading: "Loading...",
				success: "Success!",
			});

			const apiError = new ApiError("Request failed: 500", {
				status: 500,
				body: { data: "something else" },
			});

			const toastConfig = (toast.promise as ReturnType<typeof vi.fn>).mock
				.calls[0][1];
			const errorMessage = toastConfig.error(apiError);
			expect(errorMessage).toBe("Request failed: 500");
		});

		it("uses default message when ApiError has no message", async () => {
			const mutation = vi.fn().mockResolvedValue({});

			await executeMutation({
				mutation,
				loading: "Loading...",
				success: "Success!",
			});

			const apiError = new ApiError("", {
				status: 500,
				body: null,
			});

			const toastConfig = (toast.promise as ReturnType<typeof vi.fn>).mock
				.calls[0][1];
			const errorMessage = toastConfig.error(apiError);
			expect(errorMessage).toBe("Ocurrió un error en la solicitud");
		});

		it("extracts message from regular Error", async () => {
			const mutation = vi.fn().mockResolvedValue({});

			await executeMutation({
				mutation,
				loading: "Loading...",
				success: "Success!",
			});

			const toastConfig = (toast.promise as ReturnType<typeof vi.fn>).mock
				.calls[0][1];
			const errorMessage = toastConfig.error(new Error("Regular error"));
			expect(errorMessage).toBe("Regular error");
		});

		it("returns default message for unknown error types", async () => {
			const mutation = vi.fn().mockResolvedValue({});

			await executeMutation({
				mutation,
				loading: "Loading...",
				success: "Success!",
			});

			const toastConfig = (toast.promise as ReturnType<typeof vi.fn>).mock
				.calls[0][1];
			const errorMessage = toastConfig.error("string error");
			expect(errorMessage).toBe("Ocurrió un error inesperado");
		});

		it("returns default message for null error", async () => {
			const mutation = vi.fn().mockResolvedValue({});

			await executeMutation({
				mutation,
				loading: "Loading...",
				success: "Success!",
			});

			const toastConfig = (toast.promise as ReturnType<typeof vi.fn>).mock
				.calls[0][1];
			const errorMessage = toastConfig.error(null);
			expect(errorMessage).toBe("Ocurrió un error inesperado");
		});

		it("handles ApiError with non-object body", async () => {
			const mutation = vi.fn().mockResolvedValue({});

			await executeMutation({
				mutation,
				loading: "Loading...",
				success: "Success!",
			});

			const apiError = new ApiError("Request failed", {
				status: 500,
				body: "string body",
			});

			const toastConfig = (toast.promise as ReturnType<typeof vi.fn>).mock
				.calls[0][1];
			const errorMessage = toastConfig.error(apiError);
			expect(errorMessage).toBe("Request failed");
		});

		it("handles ApiError with null body", async () => {
			const mutation = vi.fn().mockResolvedValue({});

			await executeMutation({
				mutation,
				loading: "Loading...",
				success: "Success!",
			});

			const apiError = new ApiError("Request failed", {
				status: 500,
				body: null,
			});

			const toastConfig = (toast.promise as ReturnType<typeof vi.fn>).mock
				.calls[0][1];
			const errorMessage = toastConfig.error(apiError);
			expect(errorMessage).toBe("Request failed");
		});
	});
});
