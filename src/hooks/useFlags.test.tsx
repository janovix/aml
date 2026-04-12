import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useFlags } from "./useFlags";
import { evaluateFlagsForSession } from "@/lib/flags/evaluateFlags";

vi.mock("@/lib/flags/evaluateFlags", () => ({
	evaluateFlagsForSession: vi.fn(),
}));

describe("useFlags", () => {
	beforeEach(() => {
		vi.mocked(evaluateFlagsForSession).mockReset();
	});

	it("does not fetch when keys empty", async () => {
		const { result } = renderHook(() => useFlags([]));
		await waitFor(() => expect(result.current.isLoading).toBe(false));
		expect(result.current.flags).toEqual({});
		expect(evaluateFlagsForSession).not.toHaveBeenCalled();
	});

	it("loads flags from evaluateFlagsForSession", async () => {
		vi.mocked(evaluateFlagsForSession).mockResolvedValue({
			flags: { beta: true },
			error: null,
		});
		const { result } = renderHook(() => useFlags(["beta"]));
		await waitFor(() => expect(result.current.isLoading).toBe(false));
		expect(result.current.flags.beta).toBe(true);
		expect(result.current.error).toBeNull();
	});

	it("surfaces error from server action", async () => {
		vi.mocked(evaluateFlagsForSession).mockResolvedValue({
			flags: {},
			error: "Not authenticated",
		});
		const { result } = renderHook(() => useFlags(["x"]));
		await waitFor(() => expect(result.current.isLoading).toBe(false));
		expect(result.current.error).toBe("Not authenticated");
	});
});
