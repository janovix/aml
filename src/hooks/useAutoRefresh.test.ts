import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAutoRefresh } from "./useAutoRefresh";

describe("useAutoRefresh", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		// Mock document.hidden as false (tab is visible)
		Object.defineProperty(document, "hidden", {
			value: false,
			writable: true,
			configurable: true,
		});
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it("calls refresh function at specified interval", async () => {
		const refreshFn = vi.fn().mockResolvedValue(undefined);

		renderHook(() =>
			useAutoRefresh(refreshFn, {
				interval: 1000,
				onlyWhenVisible: false,
			}),
		);

		expect(refreshFn).not.toHaveBeenCalled();

		// Advance time by 1 second
		await act(async () => {
			vi.advanceTimersByTime(1000);
		});

		expect(refreshFn).toHaveBeenCalledTimes(1);

		// Advance time by another second
		await act(async () => {
			vi.advanceTimersByTime(1000);
		});

		expect(refreshFn).toHaveBeenCalledTimes(2);
	});

	it("does not call refresh when disabled", async () => {
		const refreshFn = vi.fn().mockResolvedValue(undefined);

		renderHook(() =>
			useAutoRefresh(refreshFn, {
				interval: 1000,
				enabled: false,
				onlyWhenVisible: false,
			}),
		);

		await act(async () => {
			vi.advanceTimersByTime(5000);
		});

		expect(refreshFn).not.toHaveBeenCalled();
	});

	it("stops refreshing after maxRetries consecutive failures", async () => {
		const refreshFn = vi.fn().mockRejectedValue(new Error("Network error"));
		const consoleDebugSpy = vi
			.spyOn(console, "debug")
			.mockImplementation(() => {});

		renderHook(() =>
			useAutoRefresh(refreshFn, {
				interval: 1000,
				maxRetries: 3,
				onlyWhenVisible: false,
			}),
		);

		// First failure
		await act(async () => {
			vi.advanceTimersByTime(1000);
		});
		expect(refreshFn).toHaveBeenCalledTimes(1);

		// Second failure
		await act(async () => {
			vi.advanceTimersByTime(1000);
		});
		expect(refreshFn).toHaveBeenCalledTimes(2);

		// Third failure (reaches maxRetries)
		await act(async () => {
			vi.advanceTimersByTime(1000);
		});
		expect(refreshFn).toHaveBeenCalledTimes(3);

		// After maxRetries, should not call refresh anymore
		await act(async () => {
			vi.advanceTimersByTime(5000);
		});
		expect(refreshFn).toHaveBeenCalledTimes(3); // Still 3, no more calls

		consoleDebugSpy.mockRestore();
	});

	it("resets failure count on successful refresh", async () => {
		let callCount = 0;
		const refreshFn = vi.fn().mockImplementation(() => {
			callCount++;
			// Fail on 1st and 2nd call, succeed on 3rd
			if (callCount <= 2) {
				return Promise.reject(new Error("Network error"));
			}
			return Promise.resolve();
		});

		const consoleDebugSpy = vi
			.spyOn(console, "debug")
			.mockImplementation(() => {});

		renderHook(() =>
			useAutoRefresh(refreshFn, {
				interval: 1000,
				maxRetries: 3,
				onlyWhenVisible: false,
			}),
		);

		// First failure
		await act(async () => {
			vi.advanceTimersByTime(1000);
		});
		expect(refreshFn).toHaveBeenCalledTimes(1);

		// Second failure
		await act(async () => {
			vi.advanceTimersByTime(1000);
		});
		expect(refreshFn).toHaveBeenCalledTimes(2);

		// Third call succeeds, resets failure count
		await act(async () => {
			vi.advanceTimersByTime(1000);
		});
		expect(refreshFn).toHaveBeenCalledTimes(3);

		// Should continue refreshing after success
		await act(async () => {
			vi.advanceTimersByTime(1000);
		});
		expect(refreshFn).toHaveBeenCalledTimes(4);

		consoleDebugSpy.mockRestore();
	});

	it("uses default maxRetries of 3", async () => {
		const refreshFn = vi.fn().mockRejectedValue(new Error("Network error"));
		const consoleDebugSpy = vi
			.spyOn(console, "debug")
			.mockImplementation(() => {});

		renderHook(() =>
			useAutoRefresh(refreshFn, {
				interval: 1000,
				onlyWhenVisible: false,
			}),
		);

		// 3 failures (default maxRetries)
		for (let i = 0; i < 3; i++) {
			await act(async () => {
				vi.advanceTimersByTime(1000);
			});
		}
		expect(refreshFn).toHaveBeenCalledTimes(3);

		// Should stop after 3 failures
		await act(async () => {
			vi.advanceTimersByTime(3000);
		});
		expect(refreshFn).toHaveBeenCalledTimes(3);

		consoleDebugSpy.mockRestore();
	});

	it("resets failure count when enabled changes", async () => {
		const refreshFn = vi.fn().mockRejectedValue(new Error("Network error"));
		const consoleDebugSpy = vi
			.spyOn(console, "debug")
			.mockImplementation(() => {});

		const { rerender } = renderHook(
			({ enabled }) =>
				useAutoRefresh(refreshFn, {
					interval: 1000,
					enabled,
					maxRetries: 2,
					onlyWhenVisible: false,
				}),
			{ initialProps: { enabled: true } },
		);

		// 2 failures (reaches maxRetries)
		await act(async () => {
			vi.advanceTimersByTime(1000);
		});
		await act(async () => {
			vi.advanceTimersByTime(1000);
		});
		expect(refreshFn).toHaveBeenCalledTimes(2);

		// Should stop
		await act(async () => {
			vi.advanceTimersByTime(2000);
		});
		expect(refreshFn).toHaveBeenCalledTimes(2);

		// Disable and re-enable to reset
		rerender({ enabled: false });
		rerender({ enabled: true });

		// Should resume refreshing
		await act(async () => {
			vi.advanceTimersByTime(1000);
		});
		expect(refreshFn).toHaveBeenCalledTimes(3);

		consoleDebugSpy.mockRestore();
	});

	it("does not refresh when tab is hidden and onlyWhenVisible is true", async () => {
		const refreshFn = vi.fn().mockResolvedValue(undefined);

		// Set tab as hidden
		Object.defineProperty(document, "hidden", {
			value: true,
			writable: true,
			configurable: true,
		});

		renderHook(() =>
			useAutoRefresh(refreshFn, {
				interval: 1000,
				onlyWhenVisible: true,
			}),
		);

		await act(async () => {
			vi.advanceTimersByTime(5000);
		});

		expect(refreshFn).not.toHaveBeenCalled();
	});

	it("refreshes when tab is hidden and onlyWhenVisible is false", async () => {
		const refreshFn = vi.fn().mockResolvedValue(undefined);

		// Set tab as hidden
		Object.defineProperty(document, "hidden", {
			value: true,
			writable: true,
			configurable: true,
		});

		renderHook(() =>
			useAutoRefresh(refreshFn, {
				interval: 1000,
				onlyWhenVisible: false,
			}),
		);

		await act(async () => {
			vi.advanceTimersByTime(1000);
		});

		expect(refreshFn).toHaveBeenCalledTimes(1);
	});

	it("refreshes when tab becomes visible", async () => {
		const refreshFn = vi.fn().mockResolvedValue(undefined);

		// Start with tab hidden
		Object.defineProperty(document, "hidden", {
			value: true,
			writable: true,
			configurable: true,
		});

		renderHook(() =>
			useAutoRefresh(refreshFn, {
				interval: 10000, // Long interval so visibility change is the trigger
				onlyWhenVisible: true,
			}),
		);

		// Tab becomes visible
		Object.defineProperty(document, "hidden", {
			value: false,
			writable: true,
			configurable: true,
		});

		await act(async () => {
			document.dispatchEvent(new Event("visibilitychange"));
			// Allow promises to resolve
			await Promise.resolve();
		});

		expect(refreshFn).toHaveBeenCalledTimes(1);
	});

	it("skips refresh if already refreshing", async () => {
		let resolveRefresh: (() => void) | null = null;
		const refreshFn = vi.fn().mockImplementation(() => {
			return new Promise<void>((resolve) => {
				resolveRefresh = resolve;
			});
		});

		renderHook(() =>
			useAutoRefresh(refreshFn, {
				interval: 500,
				onlyWhenVisible: false,
			}),
		);

		// First interval - starts refresh
		await act(async () => {
			vi.advanceTimersByTime(500);
		});
		expect(refreshFn).toHaveBeenCalledTimes(1);

		// Second interval - should skip because first is still in progress
		await act(async () => {
			vi.advanceTimersByTime(500);
		});
		expect(refreshFn).toHaveBeenCalledTimes(1); // Still 1

		// Complete first refresh
		await act(async () => {
			resolveRefresh?.();
		});

		// Third interval - should proceed
		await act(async () => {
			vi.advanceTimersByTime(500);
		});
		expect(refreshFn).toHaveBeenCalledTimes(2);
	});

	it("uses default interval of 30 seconds", async () => {
		const refreshFn = vi.fn().mockResolvedValue(undefined);

		renderHook(() =>
			useAutoRefresh(refreshFn, {
				onlyWhenVisible: false,
			}),
		);

		// Should not have called yet at 29 seconds
		await act(async () => {
			vi.advanceTimersByTime(29000);
		});
		expect(refreshFn).not.toHaveBeenCalled();

		// Should call at 30 seconds
		await act(async () => {
			vi.advanceTimersByTime(1000);
		});
		expect(refreshFn).toHaveBeenCalledTimes(1);
	});

	it("cleans up interval on unmount", async () => {
		const refreshFn = vi.fn().mockResolvedValue(undefined);
		const clearIntervalSpy = vi.spyOn(global, "clearInterval");

		const { unmount } = renderHook(() =>
			useAutoRefresh(refreshFn, {
				interval: 1000,
				onlyWhenVisible: false,
			}),
		);

		unmount();

		expect(clearIntervalSpy).toHaveBeenCalled();
		clearIntervalSpy.mockRestore();
	});
});
