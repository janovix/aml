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

	it("handles focus on INPUT element", async () => {
		Object.defineProperty(navigator, "userAgent", {
			value:
				"Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15",
			writable: true,
			configurable: true,
		});

		// Mock visualViewport
		const mockVisualViewport = {
			height: 500,
			offsetTop: 0,
		};
		Object.defineProperty(window, "visualViewport", {
			value: mockVisualViewport,
			writable: true,
			configurable: true,
		});

		// Mock scroll container
		const mockMain = document.createElement("main");
		mockMain.scrollBy = vi.fn();
		document.body.appendChild(mockMain);
		vi.spyOn(document, "querySelector").mockReturnValue(mockMain);

		// Mock window.scrollTo
		window.scrollTo = vi.fn();

		renderHook(() => useIOSKeyboardFix());

		// Create and focus an input element
		const input = document.createElement("input");
		document.body.appendChild(input);
		input.getBoundingClientRect = () => ({
			top: 600,
			left: 0,
			right: 100,
			bottom: 620,
			width: 100,
			height: 20,
			x: 0,
			y: 600,
			toJSON: vi.fn(),
		});

		const focusEvent = new FocusEvent("focusin", { bubbles: true });
		Object.defineProperty(focusEvent, "target", {
			value: input,
			enumerable: true,
		});

		// Advance timers to trigger setTimeout
		vi.advanceTimersByTime(300);

		input.dispatchEvent(focusEvent);

		await vi.runAllTimersAsync();

		// Should attempt to scroll
		expect(mockMain.scrollBy).toHaveBeenCalled();
	});

	it("handles focus on TEXTAREA element", async () => {
		Object.defineProperty(navigator, "userAgent", {
			value:
				"Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15",
			writable: true,
			configurable: true,
		});

		const mockVisualViewport = {
			height: 500,
			offsetTop: 0,
		};
		Object.defineProperty(window, "visualViewport", {
			value: mockVisualViewport,
			writable: true,
			configurable: true,
		});

		const mockMain = document.createElement("main");
		mockMain.scrollBy = vi.fn();
		document.body.appendChild(mockMain);
		vi.spyOn(document, "querySelector").mockReturnValue(mockMain);

		window.scrollTo = vi.fn();

		renderHook(() => useIOSKeyboardFix());

		const textarea = document.createElement("textarea");
		document.body.appendChild(textarea);
		textarea.getBoundingClientRect = () => ({
			top: 600,
			left: 0,
			right: 100,
			bottom: 620,
			width: 100,
			height: 20,
			x: 0,
			y: 600,
			toJSON: vi.fn(),
		});

		const focusEvent = new FocusEvent("focusin", { bubbles: true });
		Object.defineProperty(focusEvent, "target", {
			value: textarea,
			enumerable: true,
		});

		vi.advanceTimersByTime(300);
		textarea.dispatchEvent(focusEvent);
		await vi.runAllTimersAsync();

		expect(mockMain.scrollBy).toHaveBeenCalled();
	});

	it("handles focus on SELECT element", async () => {
		Object.defineProperty(navigator, "userAgent", {
			value:
				"Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15",
			writable: true,
			configurable: true,
		});

		const mockVisualViewport = {
			height: 500,
			offsetTop: 0,
		};
		Object.defineProperty(window, "visualViewport", {
			value: mockVisualViewport,
			writable: true,
			configurable: true,
		});

		const mockMain = document.createElement("main");
		mockMain.scrollBy = vi.fn();
		document.body.appendChild(mockMain);
		vi.spyOn(document, "querySelector").mockReturnValue(mockMain);

		window.scrollTo = vi.fn();

		renderHook(() => useIOSKeyboardFix());

		const select = document.createElement("select");
		document.body.appendChild(select);
		select.getBoundingClientRect = () => ({
			top: 600,
			left: 0,
			right: 100,
			bottom: 620,
			width: 100,
			height: 20,
			x: 0,
			y: 600,
			toJSON: vi.fn(),
		});

		const focusEvent = new FocusEvent("focusin", { bubbles: true });
		Object.defineProperty(focusEvent, "target", {
			value: select,
			enumerable: true,
		});

		vi.advanceTimersByTime(300);
		select.dispatchEvent(focusEvent);
		await vi.runAllTimersAsync();

		expect(mockMain.scrollBy).toHaveBeenCalled();
	});

	it("ignores focus on non-input elements", async () => {
		Object.defineProperty(navigator, "userAgent", {
			value:
				"Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15",
			writable: true,
			configurable: true,
		});

		const mockMain = document.createElement("main");
		mockMain.scrollBy = vi.fn();
		document.body.appendChild(mockMain);
		vi.spyOn(document, "querySelector").mockReturnValue(mockMain);

		renderHook(() => useIOSKeyboardFix());

		const div = document.createElement("div");
		document.body.appendChild(div);

		const focusEvent = new FocusEvent("focusin", { bubbles: true });
		Object.defineProperty(focusEvent, "target", {
			value: div,
			enumerable: true,
		});

		vi.advanceTimersByTime(300);
		div.dispatchEvent(focusEvent);
		await vi.runAllTimersAsync();

		// Should not scroll for non-input elements
		expect(mockMain.scrollBy).not.toHaveBeenCalled();
	});

	it("handles missing visualViewport gracefully", async () => {
		Object.defineProperty(navigator, "userAgent", {
			value:
				"Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15",
			writable: true,
			configurable: true,
		});

		Object.defineProperty(window, "visualViewport", {
			value: null,
			writable: true,
			configurable: true,
		});

		const mockMain = document.createElement("main");
		mockMain.scrollBy = vi.fn();
		document.body.appendChild(mockMain);
		vi.spyOn(document, "querySelector").mockReturnValue(mockMain);

		renderHook(() => useIOSKeyboardFix());

		const input = document.createElement("input");
		document.body.appendChild(input);

		const focusEvent = new FocusEvent("focusin", { bubbles: true });
		Object.defineProperty(focusEvent, "target", {
			value: input,
			enumerable: true,
		});

		vi.advanceTimersByTime(300);
		input.dispatchEvent(focusEvent);
		await vi.runAllTimersAsync();

		// Should not crash when visualViewport is null
		expect(mockMain.scrollBy).not.toHaveBeenCalled();
	});

	it("handles missing scroll container gracefully", async () => {
		Object.defineProperty(navigator, "userAgent", {
			value:
				"Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15",
			writable: true,
			configurable: true,
		});

		const mockVisualViewport = {
			height: 500,
			offsetTop: 0,
		};
		Object.defineProperty(window, "visualViewport", {
			value: mockVisualViewport,
			writable: true,
			configurable: true,
		});

		vi.spyOn(document, "querySelector").mockReturnValue(null);

		window.scrollTo = vi.fn();

		renderHook(() => useIOSKeyboardFix());

		const input = document.createElement("input");
		document.body.appendChild(input);

		const focusEvent = new FocusEvent("focusin", { bubbles: true });
		Object.defineProperty(focusEvent, "target", {
			value: input,
			enumerable: true,
		});

		vi.advanceTimersByTime(300);
		input.dispatchEvent(focusEvent);
		await vi.runAllTimersAsync();

		// Should not crash when scroll container is null
		expect(window.scrollTo).not.toHaveBeenCalled();
	});

	it("handles blur event to reset scroll", async () => {
		Object.defineProperty(navigator, "userAgent", {
			value:
				"Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15",
			writable: true,
			configurable: true,
		});

		const mockVisualViewport = {
			height: 500,
			offsetTop: 100,
		};
		Object.defineProperty(window, "visualViewport", {
			value: mockVisualViewport,
			writable: true,
			configurable: true,
		});

		window.scrollTo = vi.fn();

		renderHook(() => useIOSKeyboardFix());

		const input = document.createElement("input");
		document.body.appendChild(input);

		const blurEvent = new FocusEvent("focusout", { bubbles: true });
		Object.defineProperty(blurEvent, "target", {
			value: input,
			enumerable: true,
		});

		vi.advanceTimersByTime(100);
		input.dispatchEvent(blurEvent);
		await vi.runAllTimersAsync();

		// Should reset scroll when viewport offset is > 0
		expect(window.scrollTo).toHaveBeenCalledWith({
			top: 0,
			behavior: "smooth",
		});
	});

	it("does not reset scroll when viewport offset is 0", async () => {
		Object.defineProperty(navigator, "userAgent", {
			value:
				"Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15",
			writable: true,
			configurable: true,
		});

		const mockVisualViewport = {
			height: 500,
			offsetTop: 0,
		};
		Object.defineProperty(window, "visualViewport", {
			value: mockVisualViewport,
			writable: true,
			configurable: true,
		});

		window.scrollTo = vi.fn();

		renderHook(() => useIOSKeyboardFix());

		const input = document.createElement("input");
		document.body.appendChild(input);

		const blurEvent = new FocusEvent("focusout", { bubbles: true });
		Object.defineProperty(blurEvent, "target", {
			value: input,
			enumerable: true,
		});

		vi.advanceTimersByTime(100);
		input.dispatchEvent(blurEvent);
		await vi.runAllTimersAsync();

		// Should not reset scroll when offset is 0
		expect(window.scrollTo).not.toHaveBeenCalled();
	});

	it("handles scroll adjustment when input is below desired position", async () => {
		Object.defineProperty(navigator, "userAgent", {
			value:
				"Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15",
			writable: true,
			configurable: true,
		});

		const mockVisualViewport = {
			height: 500,
			offsetTop: 0,
		};
		Object.defineProperty(window, "visualViewport", {
			value: mockVisualViewport,
			writable: true,
			configurable: true,
		});

		const mockMain = document.createElement("main");
		mockMain.scrollBy = vi.fn();
		document.body.appendChild(mockMain);
		vi.spyOn(document, "querySelector").mockReturnValue(mockMain);

		window.scrollTo = vi.fn();

		renderHook(() => useIOSKeyboardFix());

		const input = document.createElement("input");
		document.body.appendChild(input);
		// Input is at position 600, desired is 150 (30% of 500), so adjustment = 450
		input.getBoundingClientRect = () => ({
			top: 600,
			left: 0,
			right: 100,
			bottom: 620,
			width: 100,
			height: 20,
			x: 0,
			y: 600,
			toJSON: vi.fn(),
		});

		const focusEvent = new FocusEvent("focusin", { bubbles: true });
		Object.defineProperty(focusEvent, "target", {
			value: input,
			enumerable: true,
		});

		vi.advanceTimersByTime(300);
		input.dispatchEvent(focusEvent);
		await vi.runAllTimersAsync();

		// Should scroll by positive amount
		expect(mockMain.scrollBy).toHaveBeenCalledWith({
			top: expect.any(Number),
			behavior: "smooth",
		});
	});

	it("does not scroll when input is above desired position", async () => {
		Object.defineProperty(navigator, "userAgent", {
			value:
				"Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15",
			writable: true,
			configurable: true,
		});

		const mockVisualViewport = {
			height: 500,
			offsetTop: 0,
		};
		Object.defineProperty(window, "visualViewport", {
			value: mockVisualViewport,
			writable: true,
			configurable: true,
		});

		const mockMain = document.createElement("main");
		mockMain.scrollBy = vi.fn();
		document.body.appendChild(mockMain);
		vi.spyOn(document, "querySelector").mockReturnValue(mockMain);

		window.scrollTo = vi.fn();

		renderHook(() => useIOSKeyboardFix());

		const input = document.createElement("input");
		document.body.appendChild(input);
		// Input is at position 100, desired is 150, so adjustment = -50 (negative, should not scroll)
		input.getBoundingClientRect = () => ({
			top: 100,
			left: 0,
			right: 100,
			bottom: 120,
			width: 100,
			height: 20,
			x: 0,
			y: 100,
			toJSON: vi.fn(),
		});

		const focusEvent = new FocusEvent("focusin", { bubbles: true });
		Object.defineProperty(focusEvent, "target", {
			value: input,
			enumerable: true,
		});

		vi.advanceTimersByTime(300);
		input.dispatchEvent(focusEvent);
		await vi.runAllTimersAsync();

		// Should not scroll when adjustment is negative
		expect(mockMain.scrollBy).not.toHaveBeenCalled();
	});

	it("handles viewport offset during focus", async () => {
		Object.defineProperty(navigator, "userAgent", {
			value:
				"Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15",
			writable: true,
			configurable: true,
		});

		const mockVisualViewport = {
			height: 500,
			offsetTop: 50,
		};
		Object.defineProperty(window, "visualViewport", {
			value: mockVisualViewport,
			writable: true,
			configurable: true,
		});

		const mockMain = document.createElement("main");
		mockMain.scrollBy = vi.fn();
		document.body.appendChild(mockMain);
		vi.spyOn(document, "querySelector").mockReturnValue(mockMain);

		window.scrollTo = vi.fn();

		renderHook(() => useIOSKeyboardFix());

		const input = document.createElement("input");
		document.body.appendChild(input);
		input.getBoundingClientRect = () => ({
			top: 600,
			left: 0,
			right: 100,
			bottom: 620,
			width: 100,
			height: 20,
			x: 0,
			y: 600,
			toJSON: vi.fn(),
		});

		const focusEvent = new FocusEvent("focusin", { bubbles: true });
		Object.defineProperty(focusEvent, "target", {
			value: input,
			enumerable: true,
		});

		vi.advanceTimersByTime(300);
		input.dispatchEvent(focusEvent);
		await vi.runAllTimersAsync();

		// Should reset window scroll when viewport offset > 0
		expect(window.scrollTo).toHaveBeenCalledWith({
			top: 0,
			behavior: "instant",
		});
	});
});
