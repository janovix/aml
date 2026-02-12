import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { toast } from "sonner";
import { ApiError, isUsageLimitError, getUsageLimitDetails } from "./api/http";
import {
	extractErrorMessage,
	executeMutation,
	showUsageLimitToast,
} from "./mutations";

// Mock sonner toast - mutations uses loading, success, error, dismiss
vi.mock("sonner", () => ({
	toast: {
		loading: vi.fn(() => "loading-toast-id"),
		success: vi.fn(),
		error: vi.fn(),
		dismiss: vi.fn(),
	},
}));

describe("mutations", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("extractErrorMessage", () => {
		it("returns body.message from ApiError when present", () => {
			const apiError = new ApiError("Request failed", {
				status: 400,
				body: { message: "Invalid input" },
			});
			expect(extractErrorMessage(apiError)).toBe("Invalid input");
		});

		it("returns body.error from ApiError when message not present", () => {
			const apiError = new ApiError("Request failed", {
				status: 400,
				body: { error: "Not found" },
			});
			expect(extractErrorMessage(apiError)).toBe("Not found");
		});

		it("returns validation messages from Zod-format details", () => {
			const apiError = new ApiError("Request failed", {
				status: 400,
				body: {
					message: "Validation failed",
					details: {
						rfc: { _errors: ["RFC es requerido"] },
						email: { _errors: ["Email inválido"] },
					},
				},
			});
			expect(extractErrorMessage(apiError)).toBe(
				"rfc: RFC es requerido y email: Email inválido",
			);
		});

		it("returns generic message for non-ApiError errors (Error instance)", () => {
			expect(extractErrorMessage(new Error("Something went wrong"))).toBe(
				"Something went wrong",
			);
		});

		it('returns "Ocurrió un error inesperado" for unknown errors', () => {
			expect(extractErrorMessage(null)).toBe("Ocurrió un error inesperado");
			expect(extractErrorMessage(undefined)).toBe(
				"Ocurrió un error inesperado",
			);
			expect(extractErrorMessage("string error")).toBe(
				"Ocurrió un error inesperado",
			);
			expect(extractErrorMessage(123)).toBe("Ocurrió un error inesperado");
		});

		it("returns ApiError.message when body has no message or error", () => {
			const apiError = new ApiError("Request failed: 500", {
				status: 500,
				body: { data: "something else" },
			});
			expect(extractErrorMessage(apiError)).toBe("Request failed: 500");
		});

		it("returns single validation message from Zod-format details", () => {
			const apiError = new ApiError("Request failed", {
				status: 400,
				body: {
					details: {
						rfc: { _errors: ["RFC es requerido"] },
					},
				},
			});
			expect(extractErrorMessage(apiError)).toBe("rfc: RFC es requerido");
		});

		it("prefers validation messages over body.message when both present", () => {
			const apiError = new ApiError("Request failed", {
				status: 400,
				body: {
					message: "Validation failed",
					details: {
						field: { _errors: ["Field error"] },
					},
				},
			});
			expect(extractErrorMessage(apiError)).toBe("field: Field error");
		});

		it("returns Ocurrió un error en la solicitud for ApiError with empty message and no body fields", () => {
			const apiError = new ApiError("", {
				status: 500,
				body: null,
			});
			expect(extractErrorMessage(apiError)).toBe(
				"Ocurrió un error en la solicitud",
			);
		});
	});

	describe("isUsageLimitError (from http.ts)", () => {
		it("returns true for ApiError with status 403 and code USAGE_LIMIT_EXCEEDED", () => {
			const error = new ApiError("Limit exceeded", {
				status: 403,
				body: {},
				code: "USAGE_LIMIT_EXCEEDED",
			});
			expect(isUsageLimitError(error)).toBe(true);
		});

		it("returns true for ApiError with status 403 and body.upgradeRequired=true", () => {
			const error = new ApiError("Limit exceeded", {
				status: 403,
				body: { upgradeRequired: true },
			});
			expect(isUsageLimitError(error)).toBe(true);
		});

		it("returns false for non-403 errors", () => {
			const error = new ApiError("Forbidden", {
				status: 401,
				body: { code: "USAGE_LIMIT_EXCEEDED" },
			});
			expect(isUsageLimitError(error)).toBe(false);
		});

		it("returns false for 403 without USAGE_LIMIT_EXCEEDED or upgradeRequired", () => {
			const error = new ApiError("Forbidden", {
				status: 403,
				body: { message: "Access denied" },
			});
			expect(isUsageLimitError(error)).toBe(false);
		});

		it("returns false for non-ApiError errors", () => {
			expect(isUsageLimitError(new Error("Generic error"))).toBe(false);
			expect(isUsageLimitError("string error")).toBe(false);
			expect(isUsageLimitError(null)).toBe(false);
		});

		it("returns false for body.upgradeRequired=false", () => {
			const error = new ApiError("Forbidden", {
				status: 403,
				body: { upgradeRequired: false },
			});
			expect(isUsageLimitError(error)).toBe(false);
		});
	});

	describe("getUsageLimitDetails (from http.ts)", () => {
		it("returns metric, used, limit, entitlementType for usage limit errors", () => {
			const error = new ApiError("Limit exceeded", {
				status: 403,
				body: {
					upgradeRequired: true,
					metric: "notices_per_month",
					used: 10,
					limit: 10,
					entitlementType: "subscription",
					message: "Has alcanzado el límite de avisos.",
				},
			});
			const details = getUsageLimitDetails(error);
			expect(details).not.toBeNull();
			expect(details?.metric).toBe("notices_per_month");
			expect(details?.used).toBe(10);
			expect(details?.limit).toBe(10);
			expect(details?.entitlementType).toBe("subscription");
			expect(details?.message).toBe("Has alcanzado el límite de avisos.");
		});

		it("returns null for non-usage-limit errors", () => {
			const error = new ApiError("Forbidden", {
				status: 403,
				body: { message: "Access denied" },
			});
			expect(getUsageLimitDetails(error)).toBeNull();
		});

		it("returns null for non-ApiError errors", () => {
			expect(getUsageLimitDetails(new Error("Generic"))).toBeNull();
			expect(getUsageLimitDetails(null)).toBeNull();
		});

		it("returns undefined for missing optional fields", () => {
			const error = new ApiError("Limit exceeded", {
				status: 403,
				body: { upgradeRequired: true },
			});
			const details = getUsageLimitDetails(error);
			expect(details).not.toBeNull();
			expect(details?.metric).toBeUndefined();
			expect(details?.used).toBeUndefined();
			expect(details?.limit).toBeUndefined();
			expect(details?.entitlementType).toBeUndefined();
			expect(details?.message).toBeUndefined();
		});

		it("returns empty object for usage limit error with non-object body", () => {
			// This case: isUsageLimitError is true (via code), but body is malformed
			const error = new ApiError("Limit exceeded", {
				status: 403,
				body: "string body",
				code: "USAGE_LIMIT_EXCEEDED",
			});
			// body is string, so typeof body === "object" is false - returns {}
			const details = getUsageLimitDetails(error);
			expect(details).toEqual({});
		});
	});

	describe("executeMutation", () => {
		it("shows loading toast, then success on mutation success", async () => {
			const result = { id: 1, name: "test" };
			const mutation = vi.fn().mockResolvedValue(result);

			await executeMutation({
				mutation,
				loading: "Loading...",
				success: "Success!",
			});

			expect(toast.loading).toHaveBeenCalledWith("Loading...");
			expect(toast.success).toHaveBeenCalledWith("Success!", {
				id: "loading-toast-id",
			});
			expect(toast.error).not.toHaveBeenCalled();
			expect(toast.dismiss).not.toHaveBeenCalled();
		});

		it("shows error toast on mutation failure", async () => {
			const mutation = vi.fn().mockRejectedValue(new Error("Network failed"));

			await expect(
				executeMutation({
					mutation,
					loading: "Loading...",
					success: "Success!",
				}),
			).rejects.toThrow("Network failed");

			expect(toast.loading).toHaveBeenCalledWith("Loading...");
			expect(toast.error).toHaveBeenCalledWith("Network failed", {
				id: "loading-toast-id",
			});
			expect(toast.success).not.toHaveBeenCalled();
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

			expect(onSuccess).toHaveBeenCalledWith(result);
		});

		it("uses success string message", async () => {
			const result = { id: 1 };
			const mutation = vi.fn().mockResolvedValue(result);

			await executeMutation({
				mutation,
				loading: "Creating...",
				success: "Created successfully",
			});

			expect(toast.success).toHaveBeenCalledWith("Created successfully", {
				id: "loading-toast-id",
			});
		});

		it("uses success function message", async () => {
			const result = { id: 123, name: "Test Item" };
			const mutation = vi.fn().mockResolvedValue(result);

			await executeMutation({
				mutation,
				loading: "Creating...",
				success: (data: { id: number; name: string }) =>
					`Created item: ${data.name}`,
			});

			expect(toast.success).toHaveBeenCalledWith("Created item: Test Item", {
				id: "loading-toast-id",
			});
		});

		it("uses custom error string when provided", async () => {
			const mutation = vi.fn().mockRejectedValue(new Error("Raw error"));

			await expect(
				executeMutation({
					mutation,
					loading: "Loading...",
					success: "Success!",
					error: "Custom error message",
				}),
			).rejects.toThrow("Raw error");

			expect(toast.error).toHaveBeenCalledWith("Custom error message", {
				id: "loading-toast-id",
			});
		});

		it("uses custom error function when provided", async () => {
			const mutation = vi.fn().mockRejectedValue(new Error("Raw error"));

			await expect(
				executeMutation({
					mutation,
					loading: "Loading...",
					success: "Success!",
					error: (err) =>
						`Error: ${err instanceof Error ? err.message : "unknown"}`,
				}),
			).rejects.toThrow("Raw error");

			expect(toast.error).toHaveBeenCalledWith("Error: Raw error", {
				id: "loading-toast-id",
			});
		});

		it("extracts error message from ApiError when no custom error provided", async () => {
			const apiError = new ApiError("Request failed", {
				status: 400,
				body: { message: "Validation failed" },
			});
			const mutation = vi.fn().mockRejectedValue(apiError);

			await expect(
				executeMutation({
					mutation,
					loading: "Loading...",
					success: "Success!",
				}),
			).rejects.toThrow(apiError);

			expect(toast.error).toHaveBeenCalledWith("Validation failed", {
				id: "loading-toast-id",
			});
		});

		it("shows usage limit toast and dismisses loading for usage limit errors", async () => {
			const usageLimitError = new ApiError("Limit exceeded", {
				status: 403,
				body: {
					upgradeRequired: true,
					message: "Has alcanzado el límite de avisos.",
				},
				code: "USAGE_LIMIT_EXCEEDED",
			});
			const mutation = vi.fn().mockRejectedValue(usageLimitError);

			await expect(
				executeMutation({
					mutation,
					loading: "Creating...",
					success: "Success!",
				}),
			).rejects.toThrow(usageLimitError);

			expect(toast.dismiss).toHaveBeenCalledWith("loading-toast-id");
			expect(toast.error).toHaveBeenCalledWith(
				"Has alcanzado el límite de avisos.",
				expect.objectContaining({
					duration: 10_000,
					action: expect.objectContaining({
						label: "Mejorar plan",
					}),
				}),
			);
			expect(toast.success).not.toHaveBeenCalled();
		});

		it("returns mutation result on success", async () => {
			const result = { id: 1, name: "test" };
			const mutation = vi.fn().mockResolvedValue(result);

			const actualResult = await executeMutation({
				mutation,
				loading: "Loading...",
				success: "Success!",
			});

			expect(actualResult).toEqual(result);
		});

		it("does not swallow onSuccess errors but logs them", async () => {
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

			// Wait for async callback execution
			await new Promise((resolve) => setTimeout(resolve, 10));

			expect(consoleErrorSpy).toHaveBeenCalledWith(
				"Error in onSuccess callback:",
				expect.any(Error),
			);
		});
	});

	describe("showUsageLimitToast", () => {
		it("shows toast with message from getUsageLimitDetails", () => {
			const error = new ApiError("Limit exceeded", {
				status: 403,
				body: {
					upgradeRequired: true,
					message: "Custom limit message",
				},
				code: "USAGE_LIMIT_EXCEEDED",
			});

			showUsageLimitToast(error);

			expect(toast.error).toHaveBeenCalledWith(
				"Custom limit message",
				expect.objectContaining({
					duration: 10_000,
					action: expect.objectContaining({
						label: "Mejorar plan",
					}),
				}),
			);
		});

		it("shows default message when details has no message", () => {
			const error = new ApiError("Limit exceeded", {
				status: 403,
				body: { upgradeRequired: true },
				code: "USAGE_LIMIT_EXCEEDED",
			});

			showUsageLimitToast(error);

			expect(toast.error).toHaveBeenCalledWith(
				"Has alcanzado el límite de uso de tu plan.",
				expect.any(Object),
			);
		});
	});
});
