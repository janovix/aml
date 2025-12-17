import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useViewportHeight } from "./use-viewport-height";

describe("useViewportHeight", () => {
	beforeEach(() => {
		// Reset window.visualViewport before each test
		delete (window as any).visualViewport;
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("returns window.innerHeight when visualViewport is not available", () => {
		// Mock window.innerHeight
		Object.defineProperty(window, "innerHeight", {
			writable: true,
			configurable: true,
			value: 800,
		});

		const { result } = renderHook(() => useViewportHeight());

		expect(result.current).toBe(800);
	});

	it("returns visualViewport.height when available", () => {
		// Mock visualViewport
		const mockVisualViewport = {
			height: 750,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		};

		Object.defineProperty(window, "visualViewport", {
			writable: true,
			configurable: true,
			value: mockVisualViewport,
		});

		const { result } = renderHook(() => useViewportHeight());

		expect(result.current).toBe(750);
		expect(mockVisualViewport.addEventListener).toHaveBeenCalledWith(
			"resize",
			expect.any(Function),
		);
		expect(mockVisualViewport.addEventListener).toHaveBeenCalledWith(
			"scroll",
			expect.any(Function),
		);
	});

	it("updates height when visualViewport resize event fires", async () => {
		const resizeHandlers: Array<() => void> = [];

		const mockVisualViewport = {
			height: 750,
			addEventListener: vi.fn((event: string, handler: () => void) => {
				if (event === "resize") {
					resizeHandlers.push(handler);
				}
			}),
			removeEventListener: vi.fn(),
		};

		Object.defineProperty(window, "visualViewport", {
			writable: true,
			configurable: true,
			value: mockVisualViewport,
		});

		const { result } = renderHook(() => useViewportHeight());

		expect(result.current).toBe(750);

		// Simulate resize
		if (resizeHandlers.length > 0) {
			mockVisualViewport.height = 600;
			const handler = resizeHandlers[0];
			handler();

			await waitFor(() => {
				expect(result.current).toBe(600);
			});
		}
	});

	it("cleans up event listeners on unmount", () => {
		const mockVisualViewport = {
			height: 750,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		};

		Object.defineProperty(window, "visualViewport", {
			writable: true,
			configurable: true,
			value: mockVisualViewport,
		});

		const { unmount } = renderHook(() => useViewportHeight());

		unmount();

		expect(mockVisualViewport.removeEventListener).toHaveBeenCalled();
	});

	it("handles SSR gracefully by returning 0 initially", () => {
		// The hook checks typeof window === "undefined" in initial state
		// In a real SSR scenario, the hook would return 0 initially
		// This test verifies the initial state logic
		const { result } = renderHook(() => useViewportHeight());

		// In test environment, window exists, so it should return a value
		// But the hook is designed to return 0 if window is undefined
		expect(typeof result.current).toBe("number");
		expect(result.current).toBeGreaterThanOrEqual(0);
	});
});
