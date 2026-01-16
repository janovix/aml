import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NotFound from "./not-found";
import { renderWithProviders } from "@/lib/testHelpers";

// Mock next/link
vi.mock("next/link", () => ({
	default: ({
		children,
		href,
	}: {
		children: React.ReactNode;
		href: string;
	}) => <a href={href}>{children}</a>,
}));

// Mock window.history.back
const mockHistoryBack = vi.fn();
Object.defineProperty(window, "history", {
	value: { back: mockHistoryBack },
	writable: true,
});

describe("NotFound (global 404 page)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders 404 title", () => {
		renderWithProviders(<NotFound />, { language: "en" });

		expect(screen.getByText("404")).toBeInTheDocument();
	});

	it("renders page not found description", () => {
		renderWithProviders(<NotFound />, { language: "en" });

		expect(screen.getByText("Page not found")).toBeInTheDocument();
	});

	it("renders explanation text", () => {
		renderWithProviders(<NotFound />, { language: "en" });

		expect(
			screen.getByText(/doesn't exist or has been moved/),
		).toBeInTheDocument();
	});

	it("renders Go Back button", () => {
		renderWithProviders(<NotFound />, { language: "en" });

		expect(
			screen.getByRole("button", { name: /Go Back/i }),
		).toBeInTheDocument();
	});

	it("renders Home link pointing to root", () => {
		renderWithProviders(<NotFound />, { language: "en" });

		const homeLink = screen.getByRole("link", { name: /Home/i });
		expect(homeLink).toBeInTheDocument();
		expect(homeLink).toHaveAttribute("href", "/");
	});

	it("calls history.back when Go Back button is clicked", async () => {
		const user = userEvent.setup();
		renderWithProviders(<NotFound />, { language: "en" });

		const backButton = screen.getByRole("button", { name: /Go Back/i });
		await user.click(backButton);

		expect(mockHistoryBack).toHaveBeenCalled();
	});

	it("renders the FileQuestion icon container", () => {
		renderWithProviders(<NotFound />, { language: "en" });

		// The icon is inside a rounded container
		const container = document.querySelector(".rounded-full.bg-muted");
		expect(container).toBeInTheDocument();
	});
});
