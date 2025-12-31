import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useKeyboardScrollFix } from "./use-keyboard-scroll-fix";

describe("useKeyboardScrollFix", () => {
	const originalNavigator = window.navigator;
	const originalVisualViewport = window.visualViewport;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		// Restore original navigator
		Object.defineProperty(window, "navigator", {
			writable: true,
			configurable: true,
			value: originalNavigator,
		});

		// Restore original visualViewport
		Object.defineProperty(window, "visualViewport", {
			writable: true,
			configurable: true,
			value: originalVisualViewport,
		});
	});

	it("should not add event listeners on non-iOS devices", () => {
		// Mock non-iOS navigator
		Object.defineProperty(window, "navigator", {
			writable: true,
			configurable: true,
			value: {
				userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0",
				platform: "Win32",
				maxTouchPoints: 0,
			},
		});

		const addEventListenerSpy = vi.spyOn(document, "addEventListener");

		renderHook(() => useKeyboardScrollFix());

		// Should not add focusin listener on non-iOS
		expect(addEventListenerSpy).not.toHaveBeenCalledWith(
			"focusin",
			expect.any(Function),
			expect.any(Object),
		);

		addEventListenerSpy.mockRestore();
	});

	it("should add event listeners on iOS devices", () => {
		// Mock iOS navigator
		Object.defineProperty(window, "navigator", {
			writable: true,
			configurable: true,
			value: {
				userAgent:
					"Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) Safari/605.1.15",
				platform: "iPhone",
				maxTouchPoints: 5,
			},
		});

		const addEventListenerSpy = vi.spyOn(document, "addEventListener");

		renderHook(() => useKeyboardScrollFix());

		// Should add focusin listener on iOS
		expect(addEventListenerSpy).toHaveBeenCalledWith(
			"focusin",
			expect.any(Function),
			{ passive: true },
		);
		expect(addEventListenerSpy).toHaveBeenCalledWith(
			"focusout",
			expect.any(Function),
			{ passive: true },
		);

		addEventListenerSpy.mockRestore();
	});

	it("should add visualViewport resize listener on iOS when available", () => {
		// Mock iOS navigator
		Object.defineProperty(window, "navigator", {
			writable: true,
			configurable: true,
			value: {
				userAgent:
					"Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) Safari/605.1.15",
				platform: "iPhone",
				maxTouchPoints: 5,
			},
		});

		// Mock visualViewport
		const mockVisualViewport = {
			height: 800,
			offsetTop: 0,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		};

		Object.defineProperty(window, "visualViewport", {
			writable: true,
			configurable: true,
			value: mockVisualViewport,
		});

		renderHook(() => useKeyboardScrollFix());

		expect(mockVisualViewport.addEventListener).toHaveBeenCalledWith(
			"resize",
			expect.any(Function),
			{ passive: true },
		);
	});

	it("should clean up event listeners on unmount", () => {
		// Mock iOS navigator
		Object.defineProperty(window, "navigator", {
			writable: true,
			configurable: true,
			value: {
				userAgent:
					"Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) Safari/605.1.15",
				platform: "iPhone",
				maxTouchPoints: 5,
			},
		});

		const mockVisualViewport = {
			height: 800,
			offsetTop: 0,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		};

		Object.defineProperty(window, "visualViewport", {
			writable: true,
			configurable: true,
			value: mockVisualViewport,
		});

		const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");

		const { unmount } = renderHook(() => useKeyboardScrollFix());

		unmount();

		expect(removeEventListenerSpy).toHaveBeenCalledWith(
			"focusin",
			expect.any(Function),
		);
		expect(removeEventListenerSpy).toHaveBeenCalledWith(
			"focusout",
			expect.any(Function),
		);
		expect(mockVisualViewport.removeEventListener).toHaveBeenCalledWith(
			"resize",
			expect.any(Function),
		);

		removeEventListenerSpy.mockRestore();
	});

	it("should detect iPad via maxTouchPoints on modern iPadOS", () => {
		// Modern iPadOS reports as MacIntel but has touch points
		Object.defineProperty(window, "navigator", {
			writable: true,
			configurable: true,
			value: {
				userAgent:
					"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15",
				platform: "MacIntel",
				maxTouchPoints: 5,
			},
		});

		const addEventListenerSpy = vi.spyOn(document, "addEventListener");

		renderHook(() => useKeyboardScrollFix());

		// Should detect as iOS device
		expect(addEventListenerSpy).toHaveBeenCalledWith(
			"focusin",
			expect.any(Function),
			{ passive: true },
		);

		addEventListenerSpy.mockRestore();
	});
});
