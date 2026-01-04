import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useIOSKeyboardFix } from "./use-ios-keyboard-fix";

describe("useIOSKeyboardFix", () => {
	const originalUserAgent = navigator.userAgent;
	const originalPlatform = navigator.platform;
	const originalMaxTouchPoints = navigator.maxTouchPoints;

	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.clearAllMocks();

		// Restore navigator properties
		Object.defineProperty(navigator, "userAgent", {
			value: originalUserAgent,
			writable: true,
			configurable: true,
		});
		Object.defineProperty(navigator, "platform", {
			value: originalPlatform,
			writable: true,
			configurable: true,
		});
		Object.defineProperty(navigator, "maxTouchPoints", {
			value: originalMaxTouchPoints,
			writable: true,
			configurable: true,
		});
	});

	it("does not add event listeners on non-iOS devices", () => {
		// Mock non-iOS user agent
		Object.defineProperty(navigator, "userAgent", {
			value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
			writable: true,
			configurable: true,
		});
		Object.defineProperty(navigator, "platform", {
			value: "Win32",
			writable: true,
			configurable: true,
		});
		Object.defineProperty(navigator, "maxTouchPoints", {
			value: 0,
			writable: true,
			configurable: true,
		});

		const addEventListenerSpy = vi.spyOn(document, "addEventListener");

		renderHook(() => useIOSKeyboardFix());

		// Should not add focusin/focusout listeners for non-iOS
		expect(addEventListenerSpy).not.toHaveBeenCalledWith(
			"focusin",
			expect.any(Function),
			expect.any(Object),
		);
	});

	it("adds event listeners on iOS devices", () => {
		// Mock iOS user agent (iPhone)
		Object.defineProperty(navigator, "userAgent", {
			value:
				"Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15",
			writable: true,
			configurable: true,
		});

		const addEventListenerSpy = vi.spyOn(document, "addEventListener");

		renderHook(() => useIOSKeyboardFix());

		// Should add focusin listener for iOS
		expect(addEventListenerSpy).toHaveBeenCalledWith(
			"focusin",
			expect.any(Function),
			{ capture: true },
		);
		expect(addEventListenerSpy).toHaveBeenCalledWith(
			"focusout",
			expect.any(Function),
			{ capture: true },
		);
	});

	it("detects iPad via maxTouchPoints", () => {
		// Mock iPad Pro (which reports as MacIntel but has touch)
		Object.defineProperty(navigator, "userAgent", {
			value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
			writable: true,
			configurable: true,
		});
		Object.defineProperty(navigator, "platform", {
			value: "MacIntel",
			writable: true,
			configurable: true,
		});
		Object.defineProperty(navigator, "maxTouchPoints", {
			value: 5,
			writable: true,
			configurable: true,
		});

		const addEventListenerSpy = vi.spyOn(document, "addEventListener");

		renderHook(() => useIOSKeyboardFix());

		// Should detect as iOS via maxTouchPoints
		expect(addEventListenerSpy).toHaveBeenCalledWith(
			"focusin",
			expect.any(Function),
			{ capture: true },
		);
	});

	it("cleans up event listeners on unmount", () => {
		// Mock iOS
		Object.defineProperty(navigator, "userAgent", {
			value:
				"Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15",
			writable: true,
			configurable: true,
		});

		const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");

		const { unmount } = renderHook(() => useIOSKeyboardFix());
		unmount();

		expect(removeEventListenerSpy).toHaveBeenCalledWith(
			"focusin",
			expect.any(Function),
			{ capture: true },
		);
		expect(removeEventListenerSpy).toHaveBeenCalledWith(
			"focusout",
			expect.any(Function),
			{ capture: true },
		);
	});
});
