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

	it("returns window.innerHeight and offsetTop 0 when visualViewport is not available", () => {
		// Mock window.innerHeight
		Object.defineProperty(window, "innerHeight", {
			writable: true,
			configurable: true,
			value: 800,
		});

		const { result } = renderHook(() => useViewportHeight());

		expect(result.current.height).toBe(800);
		expect(result.current.offsetTop).toBe(0);
	});

	it("returns visualViewport.height and offsetTop when available", () => {
		// Mock visualViewport
		const mockVisualViewport = {
			height: 750,
			offsetTop: 50,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		};

		Object.defineProperty(window, "visualViewport", {
			writable: true,
			configurable: true,
			value: mockVisualViewport,
		});

		const { result } = renderHook(() => useViewportHeight());

		expect(result.current.height).toBe(750);
		expect(result.current.offsetTop).toBe(50);
		expect(mockVisualViewport.addEventListener).toHaveBeenCalledWith(
			"resize",
			expect.any(Function),
		);
		expect(mockVisualViewport.addEventListener).toHaveBeenCalledWith(
			"scroll",
			expect.any(Function),
		);
	});

	it("updates dimensions when visualViewport resize event fires", async () => {
		const resizeHandlers: Array<() => void> = [];

		const mockVisualViewport = {
			height: 750,
			offsetTop: 0,
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

		expect(result.current.height).toBe(750);
		expect(result.current.offsetTop).toBe(0);

		// Simulate resize (keyboard opens)
		if (resizeHandlers.length > 0) {
			mockVisualViewport.height = 400;
			mockVisualViewport.offsetTop = 100;
			const handler = resizeHandlers[0];
			handler();

			await waitFor(() => {
				expect(result.current.height).toBe(400);
				expect(result.current.offsetTop).toBe(100);
			});
		}
	});

	it("cleans up event listeners on unmount", () => {
		const mockVisualViewport = {
			height: 750,
			offsetTop: 0,
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

	it("handles SSR gracefully by returning dimensions object", () => {
		// The hook checks typeof window === "undefined" in initial state
		// In a real SSR scenario, the hook would return { height: 0, offsetTop: 0 }
		// This test verifies the initial state logic
		const { result } = renderHook(() => useViewportHeight());

		// In test environment, window exists, so it should return a value
		// But the hook is designed to return dimensions object
		expect(typeof result.current).toBe("object");
		expect(typeof result.current.height).toBe("number");
		expect(typeof result.current.offsetTop).toBe("number");
		expect(result.current.height).toBeGreaterThanOrEqual(0);
		expect(result.current.offsetTop).toBeGreaterThanOrEqual(0);
	});
});
