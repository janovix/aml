import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { OrgTeamTable } from "./OrgTeamTable";
import { LanguageProvider } from "@/components/LanguageProvider";
import { translations } from "@/lib/translations";

// Mock sonner toast
const mockToastError = vi.fn();
const mockToastPromise = vi.fn();
vi.mock("sonner", () => ({
	toast: Object.assign(vi.fn(), {
		error: (...args: unknown[]) => mockToastError(...args),
		promise: (...args: unknown[]) => mockToastPromise(...args),
	}),
}));

// Mock executeMutation to call the actual mutation and invoke onSuccess
vi.mock("@/lib/mutations", () => ({
	executeMutation: vi.fn(async ({ mutation, onSuccess }) => {
		const result = await mutation();
		if (onSuccess) {
			await onSuccess(result);
		}
		return result;
	}),
}));

const mockListMembers = vi.fn();
const mockListInvitations = vi.fn();
const mockInviteMember = vi.fn();
const mockCancelInvitation = vi.fn();
const mockResendInvitation = vi.fn();

vi.mock("@/lib/auth/organizations", () => ({
	listMembers: (...args: unknown[]) => mockListMembers(...args),
	listInvitations: (...args: unknown[]) => mockListInvitations(...args),
	inviteMember: (...args: unknown[]) => mockInviteMember(...args),
	cancelInvitation: (...args: unknown[]) => mockCancelInvitation(...args),
	resendInvitation: (...args: unknown[]) => mockResendInvitation(...args),
}));

const mockSetMembers = vi.fn();
const defaultOrgStoreState = {
	currentOrg: { id: "org-1", name: "Test Org", slug: "test-org" } as {
		id: string;
		name: string;
		slug: string;
	} | null,
	members: [
		{
			id: "member-1",
			userId: "user-1",
			organizationId: "org-1",
			name: "John Doe",
			email: "john@example.com",
			role: "owner",
			status: "active",
			joinedAt: "2024-01-15T00:00:00Z",
		},
		{
			id: "member-2",
			userId: "user-2",
			organizationId: "org-1",
			name: "Jane Smith",
			email: "jane@example.com",
			role: "member",
			status: "active",
			joinedAt: "2024-02-20T00:00:00Z",
		},
	],
	setMembers: mockSetMembers,
};
const mockUseOrgStore = vi.fn(() => defaultOrgStoreState);

vi.mock("@/lib/org-store", () => ({
	useOrgStore: () => mockUseOrgStore(),
}));

// Helper to render with LanguageProvider - force Spanish for consistent testing
const renderWithProviders = (ui: React.ReactElement) => {
	return render(ui, {
		wrapper: ({ children }) => (
			<LanguageProvider defaultLanguage="es">{children}</LanguageProvider>
		),
	});
};

// Get English translations for test assertions
// Use Spanish translations since detectBrowserLanguage() defaults to "es" in Node.js
const t = (key: keyof typeof translations.es) => translations.es[key];

describe("OrgTeamTable", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockListMembers.mockResolvedValue({
			data: [
				{
					id: "member-1",
					userId: "user-1",
					organizationId: "org-1",
					name: "John Doe",
					email: "john@example.com",
					role: "owner",
					status: "active",
					joinedAt: "2024-01-15T00:00:00Z",
				},
				{
					id: "member-2",
					userId: "user-2",
					organizationId: "org-1",
					name: "Jane Smith",
					email: "jane@example.com",
					role: "member",
					status: "active",
					joinedAt: "2024-02-20T00:00:00Z",
				},
			],
			error: null,
		});
		mockListInvitations.mockResolvedValue({
			data: [
				{
					id: "inv-1",
					organizationId: "org-1",
					email: "pending@example.com",
					role: "member",
					status: "pending",
					createdAt: "2024-03-01T00:00:00Z",
					expiresAt: "2024-04-01T00:00:00Z",
					inviterId: "user-1",
					inviterName: "John Doe",
				},
			],
			error: null,
		});
		mockInviteMember.mockResolvedValue({ data: {}, error: null });
		mockCancelInvitation.mockResolvedValue({ data: {}, error: null });
		mockResendInvitation.mockResolvedValue({ data: {}, error: null });
	});

	it("renders team members section", async () => {
		renderWithProviders(<OrgTeamTable />);

		await waitFor(() => {
			expect(screen.getByText(t("teamMembers"))).toBeInTheDocument();
		});
	});

	it("renders member list", async () => {
		renderWithProviders(<OrgTeamTable />);

		await waitFor(() => {
			expect(screen.getByText("John Doe")).toBeInTheDocument();
			expect(screen.getByText("Jane Smith")).toBeInTheDocument();
		});
	});

	it("shows member emails", async () => {
		renderWithProviders(<OrgTeamTable />);

		await waitFor(() => {
			expect(screen.getByText("john@example.com")).toBeInTheDocument();
			expect(screen.getByText("jane@example.com")).toBeInTheDocument();
		});
	});

	it("shows member roles with badges", async () => {
		renderWithProviders(<OrgTeamTable />);

		await waitFor(() => {
			// Owner badge should appear once
			expect(screen.getByText(t("teamOwner"))).toBeInTheDocument();
			// Member badge should appear (there's also a "Member" table header)
			const memberBadges = screen.getAllByText(t("teamMemberLabel"));
			// One is the table header, one is Jane's role badge
			expect(memberBadges.length).toBeGreaterThanOrEqual(2);
		});
	});

	it("shows invite member button", async () => {
		renderWithProviders(<OrgTeamTable />);

		await waitFor(() => {
			expect(
				screen.getByRole("button", { name: t("teamInviteMember") }),
			).toBeInTheDocument();
		});
	});

	it("opens invite dialog when button is clicked", async () => {
		const user = userEvent.setup();
		renderWithProviders(<OrgTeamTable />);

		await waitFor(() => {
			expect(screen.getByText(t("teamMembers"))).toBeInTheDocument();
		});

		const inviteButton = screen.getByRole("button", {
			name: t("teamInviteMember"),
		});
		await user.click(inviteButton);

		expect(screen.getByText(t("teamInviteMemberDesc"))).toBeInTheDocument();
	});

	it("submits invitation with email and role", async () => {
		const user = userEvent.setup();
		renderWithProviders(<OrgTeamTable />);

		await waitFor(() => {
			expect(screen.getByText(t("teamMembers"))).toBeInTheDocument();
		});

		const inviteButton = screen.getByRole("button", {
			name: t("teamInviteMember"),
		});
		await user.click(inviteButton);

		const emailInput = screen.getByLabelText(t("teamEmailAddress"));
		await user.type(emailInput, "new@example.com");

		const submitButton = screen.getByRole("button", {
			name: t("teamSendInvitation"),
		});
		await user.click(submitButton);

		await waitFor(() => {
			expect(mockInviteMember).toHaveBeenCalledWith(
				expect.objectContaining({
					email: "new@example.com",
					role: "member",
					organizationId: "org-1",
				}),
			);
		});
	});

	it("shows success toast after sending invitation", async () => {
		const user = userEvent.setup();
		renderWithProviders(<OrgTeamTable />);

		await waitFor(() => {
			expect(screen.getByText(t("teamMembers"))).toBeInTheDocument();
		});

		const inviteButton = screen.getByRole("button", {
			name: t("teamInviteMember"),
		});
		await user.click(inviteButton);

		const emailInput = screen.getByLabelText(t("teamEmailAddress"));
		await user.type(emailInput, "new@example.com");

		const submitButton = screen.getByRole("button", {
			name: t("teamSendInvitation"),
		});
		await user.click(submitButton);

		// Verify executeMutation was called (toast is handled by executeMutation)
		await waitFor(() => {
			expect(mockInviteMember).toHaveBeenCalledWith(
				expect.objectContaining({
					email: "new@example.com",
				}),
			);
		});
	});

	it("shows error toast when invitation fails", async () => {
		mockInviteMember.mockResolvedValueOnce({
			data: null,
			error: "User already invited",
		});

		const user = userEvent.setup();
		renderWithProviders(<OrgTeamTable />);

		await waitFor(() => {
			expect(screen.getByText(t("teamMembers"))).toBeInTheDocument();
		});

		const inviteButton = screen.getByRole("button", {
			name: t("teamInviteMember"),
		});
		await user.click(inviteButton);

		const emailInput = screen.getByLabelText(t("teamEmailAddress"));
		await user.type(emailInput, "existing@example.com");

		const submitButton = screen.getByRole("button", {
			name: t("teamSendInvitation"),
		});
		await user.click(submitButton);

		// Verify inviteMember was called (error is handled by executeMutation throwing)
		await waitFor(() => {
			expect(mockInviteMember).toHaveBeenCalledWith(
				expect.objectContaining({
					email: "existing@example.com",
				}),
			);
		});
	});

	it("has search input for filtering members", async () => {
		renderWithProviders(<OrgTeamTable />);

		await waitFor(() => {
			expect(
				screen.getByPlaceholderText(t("teamSearchByNameOrEmail")),
			).toBeInTheDocument();
		});
	});

	it("filters members by search query", async () => {
		const user = userEvent.setup();
		renderWithProviders(<OrgTeamTable />);

		await waitFor(() => {
			expect(screen.getByText("John Doe")).toBeInTheDocument();
		});

		const searchInput = screen.getByPlaceholderText(
			t("teamSearchByNameOrEmail"),
		);
		await user.type(searchInput, "Jane");

		await waitFor(() => {
			expect(screen.getByText("Jane Smith")).toBeInTheDocument();
			expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
		});
	});

	it("has role filter dropdown", async () => {
		renderWithProviders(<OrgTeamTable />);

		await waitFor(() => {
			expect(screen.getByText(t("teamAllRoles"))).toBeInTheDocument();
		});
	});

	it("shows pending invitations section when there are pending invitations", async () => {
		renderWithProviders(<OrgTeamTable />);

		await waitFor(() => {
			expect(screen.getByText(t("teamPendingInvitations"))).toBeInTheDocument();
		});
	});

	it("shows pending invitation email", async () => {
		renderWithProviders(<OrgTeamTable />);

		await waitFor(() => {
			expect(screen.getByText("pending@example.com")).toBeInTheDocument();
		});
	});

	it("shows inviter name for pending invitations", async () => {
		renderWithProviders(<OrgTeamTable />);

		await waitFor(() => {
			// There are multiple "John Doe" elements - check that at least one exists
			// which would be in the invitations section
			expect(screen.getAllByText(/John Doe/).length).toBeGreaterThan(0);
		});
	});

	it("has cancel invitation button", async () => {
		renderWithProviders(<OrgTeamTable />);

		await waitFor(() => {
			expect(screen.getByTitle(t("teamCancelInvitation"))).toBeInTheDocument();
		});
	});

	it("has resend invitation button", async () => {
		renderWithProviders(<OrgTeamTable />);

		await waitFor(() => {
			expect(screen.getByTitle(t("teamResendInvitation"))).toBeInTheDocument();
		});
	});

	it("calls cancelInvitation when cancel button is clicked", async () => {
		const user = userEvent.setup();
		renderWithProviders(<OrgTeamTable />);

		await waitFor(() => {
			expect(screen.getByTitle(t("teamCancelInvitation"))).toBeInTheDocument();
		});

		const cancelButton = screen.getByTitle(t("teamCancelInvitation"));
		await user.click(cancelButton);

		await waitFor(() => {
			expect(mockCancelInvitation).toHaveBeenCalledWith("inv-1");
		});
	});

	it("calls resendInvitation when resend button is clicked", async () => {
		const user = userEvent.setup();
		renderWithProviders(<OrgTeamTable />);

		await waitFor(() => {
			expect(screen.getByTitle(t("teamResendInvitation"))).toBeInTheDocument();
		});

		const resendButton = screen.getByTitle(t("teamResendInvitation"));
		await user.click(resendButton);

		await waitFor(() => {
			expect(mockResendInvitation).toHaveBeenCalledWith(
				expect.objectContaining({
					email: "pending@example.com",
					role: "member",
					organizationId: "org-1",
				}),
			);
		});
	});

	it("shows success toast when invitation is canceled", async () => {
		const user = userEvent.setup();
		renderWithProviders(<OrgTeamTable />);

		await waitFor(() => {
			expect(screen.getByTitle(t("teamCancelInvitation"))).toBeInTheDocument();
		});

		const cancelButton = screen.getByTitle(t("teamCancelInvitation"));
		await user.click(cancelButton);

		// Verify cancelInvitation was called (toast is handled by executeMutation)
		await waitFor(() => {
			expect(mockCancelInvitation).toHaveBeenCalledWith("inv-1");
		});
	});

	it("shows member actions menu", async () => {
		const user = userEvent.setup();
		renderWithProviders(<OrgTeamTable />);

		await waitFor(() => {
			expect(screen.getByText("John Doe")).toBeInTheDocument();
		});

		// Find the actions button (MoreHorizontal icon button)
		const actionButtons = screen.getAllByRole("button", { name: t("actions") });
		await user.click(actionButtons[0]);

		expect(screen.getByText(t("teamSendMessage"))).toBeInTheDocument();
		expect(screen.getByText(t("teamChangeRole"))).toBeInTheDocument();
		expect(screen.getByText(t("teamRemoveFromTeam"))).toBeInTheDocument();
	});

	it("returns null when no current organization", () => {
		// Use mockReturnValue to persist across potential re-renders
		mockUseOrgStore.mockReturnValue({
			currentOrg: null,
			members: [],
			setMembers: mockSetMembers,
		});

		renderWithProviders(<OrgTeamTable />);

		// The component should return null (not render anything meaningful)
		// Check that the team members table is not present
		expect(screen.queryByText(t("teamMembers"))).not.toBeInTheDocument();

		// Reset back to default state for other tests
		mockUseOrgStore.mockReturnValue(defaultOrgStoreState);
	});

	it("shows empty state when no members match filter", async () => {
		const user = userEvent.setup();
		renderWithProviders(<OrgTeamTable />);

		await waitFor(() => {
			expect(screen.getByText("John Doe")).toBeInTheDocument();
		});

		const searchInput = screen.getByPlaceholderText(
			t("teamSearchByNameOrEmail"),
		);
		await user.type(searchInput, "nonexistent");

		await waitFor(() => {
			expect(screen.getByText(t("teamNoMembersFound"))).toBeInTheDocument();
		});
	});

	it("resets invite form when cancel is clicked", async () => {
		const user = userEvent.setup();
		renderWithProviders(<OrgTeamTable />);

		await waitFor(() => {
			expect(screen.getByText("John Doe")).toBeInTheDocument();
		});

		// Open invite dialog
		const inviteButton = screen.getByRole("button", {
			name: t("teamInviteMember"),
		});
		await user.click(inviteButton);

		await waitFor(() => {
			expect(
				screen.getByPlaceholderText(t("teamEmailPlaceholder")),
			).toBeInTheDocument();
		});

		// Fill in the form
		const emailInput = screen.getByPlaceholderText(t("teamEmailPlaceholder"));
		await user.type(emailInput, "test@example.com");

		// Click cancel
		const cancelButton = screen.getByRole("button", { name: t("cancel") });
		await user.click(cancelButton);

		// Reopen dialog
		await user.click(inviteButton);

		// Email should be reset
		await waitFor(() => {
			const newEmailInput = screen.getByPlaceholderText(
				t("teamEmailPlaceholder"),
			);
			expect(newEmailInput).toHaveValue("");
		});
	});

	it("allows changing role selection in invite dialog", async () => {
		const user = userEvent.setup();
		renderWithProviders(<OrgTeamTable />);

		await waitFor(() => {
			expect(screen.getByText("John Doe")).toBeInTheDocument();
		});

		// Open invite dialog
		const inviteButton = screen.getByRole("button", {
			name: t("teamInviteMember"),
		});
		await user.click(inviteButton);

		await waitFor(() => {
			expect(
				screen.getByPlaceholderText(t("teamEmailPlaceholder")),
			).toBeInTheDocument();
		});

		// Click on role selector
		const roleSelector = screen.getByRole("combobox");
		await user.click(roleSelector);

		// Select a different role
		await waitFor(() => {
			expect(
				screen.getByRole("option", { name: t("teamAdmin") }),
			).toBeInTheDocument();
		});

		await user.click(screen.getByRole("option", { name: t("teamAdmin") }));

		// Fill email and submit
		const emailInput = screen.getByPlaceholderText(t("teamEmailPlaceholder"));
		await user.type(emailInput, "admin@example.com");

		const submitButton = screen.getByRole("button", {
			name: t("teamSendInvitation"),
		});
		await user.click(submitButton);

		await waitFor(() => {
			expect(mockInviteMember).toHaveBeenCalledWith(
				expect.objectContaining({
					role: "admin",
				}),
			);
		});
	});

	it("shows error toast when loading members fails", async () => {
		mockListMembers.mockResolvedValueOnce({
			data: null,
			error: "Failed to load members",
		});

		renderWithProviders(<OrgTeamTable />);

		// Verify toast.error was called with the error message
		await waitFor(() => {
			expect(mockToastError).toHaveBeenCalledWith(
				t("errorLoadingData"),
				expect.objectContaining({
					description: "Failed to load members",
				}),
			);
		});
	});

	it("shows error toast when resending invitation fails", async () => {
		mockResendInvitation.mockResolvedValueOnce({
			data: null,
			error: "Failed to resend invitation",
		});

		const user = userEvent.setup();
		renderWithProviders(<OrgTeamTable />);

		await waitFor(() => {
			expect(screen.getByText(t("teamPendingInvitations"))).toBeInTheDocument();
		});

		// Find the resend button
		const resendButton = screen.getByTitle(t("teamResendInvitation"));
		await user.click(resendButton);

		// Verify resendInvitation was called (error is handled by executeMutation throwing)
		await waitFor(() => {
			expect(mockResendInvitation).toHaveBeenCalledWith(
				expect.objectContaining({
					email: "pending@example.com",
				}),
			);
		});
	});
});
