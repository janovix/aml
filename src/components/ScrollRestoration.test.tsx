import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { ScrollRestoration } from "./ScrollRestoration";

// Mock next/navigation
const mockPathname = vi.fn(() => "/clients");
const mockSearchParams = vi.fn(() => new URLSearchParams());

vi.mock("next/navigation", () => ({
	usePathname: () => mockPathname(),
	useSearchParams: () => mockSearchParams(),
}));

describe("ScrollRestoration", () => {
	let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
	let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		vi.clearAllMocks();
		addEventListenerSpy = vi.spyOn(window, "addEventListener");
		removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
		// Mock sessionStorage
		vi.spyOn(Storage.prototype, "getItem").mockReturnValue(null);
		vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {});
	});

	afterEach(() => {
		addEventListenerSpy.mockRestore();
		removeEventListenerSpy.mockRestore();
	});

	it("renders nothing", () => {
		const { container } = render(<ScrollRestoration />);
		expect(container.firstChild).toBeNull();
	});

	it("adds popstate event listener on mount", () => {
		render(<ScrollRestoration />);
		expect(addEventListenerSpy).toHaveBeenCalledWith(
			"popstate",
			expect.any(Function),
		);
	});

	it("adds beforeunload event listener on mount", () => {
		render(<ScrollRestoration />);
		expect(addEventListenerSpy).toHaveBeenCalledWith(
			"beforeunload",
			expect.any(Function),
		);
	});

	it("removes event listeners on unmount", () => {
		const { unmount } = render(<ScrollRestoration />);
		unmount();

		expect(removeEventListenerSpy).toHaveBeenCalledWith(
			"popstate",
			expect.any(Function),
		);
		expect(removeEventListenerSpy).toHaveBeenCalledWith(
			"beforeunload",
			expect.any(Function),
		);
	});

	it("loads scroll positions from sessionStorage on mount", () => {
		const getItemSpy = vi.spyOn(Storage.prototype, "getItem");
		render(<ScrollRestoration />);
		expect(getItemSpy).toHaveBeenCalledWith("scroll-positions");
	});
});
