import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Suspense } from "react";
import OrgNotFoundPage from "./page";

// Mock next/navigation
vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
	}),
}));

// Mock window.history.back
const mockHistoryBack = vi.fn();
Object.defineProperty(window, "history", {
	value: { back: mockHistoryBack },
	writable: true,
});

describe("OrgNotFoundPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders not found message with org slug", async () => {
		const paramsPromise = Promise.resolve({ orgSlug: "acme" });

		await act(async () => {
			render(
				<Suspense fallback={<div>Loading...</div>}>
					<OrgNotFoundPage params={paramsPromise} />
				</Suspense>,
			);
			// Wait for the promise to resolve
			await paramsPromise;
		});

		expect(screen.getByText("Organization Not Found")).toBeInTheDocument();
		expect(screen.getByText("acme")).toBeInTheDocument();
		expect(screen.getByText(/doesn't exist/)).toBeInTheDocument();
	});

	it("renders explanation text", async () => {
		const paramsPromise = Promise.resolve({ orgSlug: "test-org" });

		await act(async () => {
			render(
				<Suspense fallback={<div>Loading...</div>}>
					<OrgNotFoundPage params={paramsPromise} />
				</Suspense>,
			);
			await paramsPromise;
		});

		expect(screen.getByText(/organization was deleted/)).toBeInTheDocument();
	});

	it("renders Go Back button", async () => {
		const paramsPromise = Promise.resolve({ orgSlug: "test-org" });

		await act(async () => {
			render(
				<Suspense fallback={<div>Loading...</div>}>
					<OrgNotFoundPage params={paramsPromise} />
				</Suspense>,
			);
			await paramsPromise;
		});

		expect(
			screen.getByRole("button", { name: /Go Back/i }),
		).toBeInTheDocument();
	});

	it("renders Home link", async () => {
		const paramsPromise = Promise.resolve({ orgSlug: "test-org" });

		await act(async () => {
			render(
				<Suspense fallback={<div>Loading...</div>}>
					<OrgNotFoundPage params={paramsPromise} />
				</Suspense>,
			);
			await paramsPromise;
		});

		const homeLink = screen.getByRole("link", { name: /Home/i });
		expect(homeLink).toBeInTheDocument();
		expect(homeLink).toHaveAttribute("href", "/");
	});

	it("calls history.back when Go Back button is clicked", async () => {
		const user = userEvent.setup();
		const paramsPromise = Promise.resolve({ orgSlug: "test-org" });

		await act(async () => {
			render(
				<Suspense fallback={<div>Loading...</div>}>
					<OrgNotFoundPage params={paramsPromise} />
				</Suspense>,
			);
			await paramsPromise;
		});

		const backButton = screen.getByRole("button", { name: /Go Back/i });
		await user.click(backButton);

		expect(mockHistoryBack).toHaveBeenCalled();
	});
});
