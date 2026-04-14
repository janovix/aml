import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InvoicesPageContent } from "./InvoicesPageContent";
import { renderWithProviders } from "@/lib/testHelpers";

vi.mock("@/lib/api/invoices", () => ({
	listInvoices: vi.fn().mockResolvedValue({
		data: [],
		pagination: { page: 1, limit: 1, total: 42, totalPages: 42 },
	}),
}));

vi.mock("@/lib/org-store", () => ({
	useOrgStore: () => ({
		currentOrg: { id: "org-1", slug: "test-org", name: "Org" },
	}),
}));

vi.mock("@/hooks/useJwt", () => ({
	useJwt: () => ({ jwt: "jwt-1", isLoading: false }),
}));

const mockNavigateTo = vi.fn();
vi.mock("@/hooks/useOrgNavigation", () => ({
	useOrgNavigation: () => ({ navigateTo: mockNavigateTo }),
}));

vi.mock("@/components/invoices/InvoicesTable", () => ({
	InvoicesTable: () => <div data-testid="invoices-table" />,
}));

vi.mock("@/lib/toast-utils", () => ({
	showFetchError: vi.fn(),
}));

describe("InvoicesPageContent", () => {
	beforeEach(() => {
		mockNavigateTo.mockClear();
	});

	it("loads total count and renders hero", async () => {
		renderWithProviders(<InvoicesPageContent />);

		await waitFor(() => {
			expect(screen.getByText("42")).toBeInTheDocument();
		});
		expect(screen.getByTestId("invoices-table")).toBeInTheDocument();
	});

	it("navigates to upload when action clicked", async () => {
		const user = userEvent.setup();
		renderWithProviders(<InvoicesPageContent />);

		const uploadButtons = screen.getAllByRole("button", {
			name: /subir xml/i,
		});
		await user.click(uploadButtons[0]!);
		expect(mockNavigateTo).toHaveBeenCalledWith("/invoices/upload");
	});
});
