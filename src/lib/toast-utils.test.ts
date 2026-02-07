import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { showFetchError } from "./toast-utils";

vi.mock("sonner", () => ({
	toast: {
		error: vi.fn(),
	},
}));

vi.mock("./mutations", () => ({
	extractErrorMessage: vi.fn((err: unknown) => {
		if (err instanceof Error) return err.message;
		return "Unknown error";
	}),
}));

describe("toast-utils", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it("shows toast error for first call", async () => {
		const { toast } = await import("sonner");

		showFetchError("test-id-1", new Error("Network failed"));

		expect(toast.error).toHaveBeenCalledWith("Network failed", {
			id: "test-id-1",
		});
	});

	it("deduplicates calls within 5-second window", async () => {
		const { toast } = await import("sonner");

		showFetchError("test-id-2", new Error("Error A"));
		expect(toast.error).toHaveBeenCalledTimes(1);

		// Call again immediately - should be deduplicated
		showFetchError("test-id-2", new Error("Error B"));
		expect(toast.error).toHaveBeenCalledTimes(1);
	});

	it("shows toast again after dedup window expires", async () => {
		const { toast } = await import("sonner");

		showFetchError("test-id-3", new Error("Error A"));
		expect(toast.error).toHaveBeenCalledTimes(1);

		// Advance past dedup window (5 seconds)
		vi.advanceTimersByTime(5001);

		showFetchError("test-id-3", new Error("Error B"));
		expect(toast.error).toHaveBeenCalledTimes(2);
	});

	it("allows different IDs within the same window", async () => {
		const { toast } = await import("sonner");

		showFetchError("id-a", new Error("Error A"));
		showFetchError("id-b", new Error("Error B"));

		expect(toast.error).toHaveBeenCalledTimes(2);
	});
});
