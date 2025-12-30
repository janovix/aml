import "@testing-library/jest-dom/vitest";
import { afterEach, beforeAll } from "vitest";
import { cleanup } from "@testing-library/react";

// Mock ResizeObserver for cmdk/Command component
class ResizeObserverMock {
	observe() {}
	unobserve() {}
	disconnect() {}
}

// Mock window.matchMedia
beforeAll(() => {
	// Add ResizeObserver mock
	global.ResizeObserver = ResizeObserverMock;

	// Add scrollIntoView mock for cmdk/Command component
	Element.prototype.scrollIntoView = () => {};

	// Add hasPointerCapture mock for Radix UI Select component
	Element.prototype.hasPointerCapture = () => false;
	Element.prototype.setPointerCapture = () => {};
	Element.prototype.releasePointerCapture = () => {};

	Object.defineProperty(window, "matchMedia", {
		writable: true,
		value: (query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: () => {},
			removeListener: () => {},
			addEventListener: () => {},
			removeEventListener: () => {},
			dispatchEvent: () => {},
		}),
	});
});

afterEach(() => {
	cleanup();
});
