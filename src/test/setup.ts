import "@testing-library/jest-dom/vitest";
import { afterEach, beforeAll, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Mock Sentry globally - use factory function to avoid hoisting issues
vi.mock("@sentry/nextjs", () => {
	return {
		captureException: vi.fn(),
		captureMessage: vi.fn(),
		captureRequestError: vi.fn(),
		init: vi.fn(),
		replayIntegration: vi.fn(() => ({})),
		captureRouterTransitionStart: vi.fn(),
		// Sentry.startSpan mock - executes the callback immediately
		startSpan: vi.fn((options, callback) =>
			callback({ setAttribute: vi.fn() }),
		),
		// Sentry.logger mock
		logger: {
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
			fmt: (strings: TemplateStringsArray, ...values: unknown[]) =>
				strings.reduce((acc, str, i) => acc + str + (values[i] ?? ""), ""),
		},
	};
});

// Mock view-skeletons globally to prevent import hang
vi.mock("@/lib/view-skeletons", () => ({
	getViewSkeleton: vi.fn(() => {
		return function MockSkeleton() {
			return null;
		};
	}),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
		back: vi.fn(),
		forward: vi.fn(),
		refresh: vi.fn(),
		prefetch: vi.fn(),
	}),
	usePathname: () => "/test-org/clients",
	useSearchParams: () => new URLSearchParams(),
	useParams: () => ({ orgSlug: "test-org" }),
	redirect: vi.fn(),
	notFound: vi.fn(),
}));

// Mock ResizeObserver for cmdk/Command component
class ResizeObserverMock {
	observe() {}
	unobserve() {}
	disconnect() {}
}

// Mock IntersectionObserver for infinite scroll
class IntersectionObserverMock {
	observe() {}
	unobserve() {}
	disconnect() {}
	constructor() {}
}

// Mock window.matchMedia
beforeAll(() => {
	// Add ResizeObserver mock
	global.ResizeObserver = ResizeObserverMock;

	// Add IntersectionObserver mock
	global.IntersectionObserver =
		IntersectionObserverMock as unknown as typeof IntersectionObserver;
	window.IntersectionObserver =
		IntersectionObserverMock as unknown as typeof IntersectionObserver;

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
