import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrgTeamTable } from "./OrgTeamTable";

const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
	useToast: () => ({
		toast: mockToast,
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
		render(<OrgTeamTable />);

		await waitFor(() => {
			expect(screen.getByText("Team Members")).toBeInTheDocument();
		});
	});

	it("renders member list", async () => {
		render(<OrgTeamTable />);

		await waitFor(() => {
			expect(screen.getByText("John Doe")).toBeInTheDocument();
			expect(screen.getByText("Jane Smith")).toBeInTheDocument();
		});
	});

	it("shows member emails", async () => {
		render(<OrgTeamTable />);

		await waitFor(() => {
			expect(screen.getByText("john@example.com")).toBeInTheDocument();
			expect(screen.getByText("jane@example.com")).toBeInTheDocument();
		});
	});

	it("shows member roles with badges", async () => {
		render(<OrgTeamTable />);

		await waitFor(() => {
			// Owner badge should appear once
			expect(screen.getByText("Owner")).toBeInTheDocument();
			// Member badge should appear (there's also a "Member" table header)
			const memberBadges = screen.getAllByText("Member");
			// One is the table header, one is Jane's role badge
			expect(memberBadges.length).toBeGreaterThanOrEqual(2);
		});
	});

	it("shows invite member button", async () => {
		render(<OrgTeamTable />);

		await waitFor(() => {
			expect(
				screen.getByRole("button", { name: /invite member/i }),
			).toBeInTheDocument();
		});
	});

	it("opens invite dialog when button is clicked", async () => {
		const user = userEvent.setup();
		render(<OrgTeamTable />);

		await waitFor(() => {
			expect(screen.getByText("Team Members")).toBeInTheDocument();
		});

		const inviteButton = screen.getByRole("button", { name: /invite member/i });
		await user.click(inviteButton);

		expect(
			screen.getByText("Send an email invitation to join the organization."),
		).toBeInTheDocument();
	});

	it("submits invitation with email and role", async () => {
		const user = userEvent.setup();
		render(<OrgTeamTable />);

		await waitFor(() => {
			expect(screen.getByText("Team Members")).toBeInTheDocument();
		});

		const inviteButton = screen.getByRole("button", { name: /invite member/i });
		await user.click(inviteButton);

		const emailInput = screen.getByLabelText("Email address");
		await user.type(emailInput, "new@example.com");

		const submitButton = screen.getByRole("button", {
			name: /send invitation/i,
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
		render(<OrgTeamTable />);

		await waitFor(() => {
			expect(screen.getByText("Team Members")).toBeInTheDocument();
		});

		const inviteButton = screen.getByRole("button", { name: /invite member/i });
		await user.click(inviteButton);

		const emailInput = screen.getByLabelText("Email address");
		await user.type(emailInput, "new@example.com");

		const submitButton = screen.getByRole("button", {
			name: /send invitation/i,
		});
		await user.click(submitButton);

		await waitFor(() => {
			expect(mockToast).toHaveBeenCalledWith(
				expect.objectContaining({
					title: "Invitation sent",
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
		render(<OrgTeamTable />);

		await waitFor(() => {
			expect(screen.getByText("Team Members")).toBeInTheDocument();
		});

		const inviteButton = screen.getByRole("button", { name: /invite member/i });
		await user.click(inviteButton);

		const emailInput = screen.getByLabelText("Email address");
		await user.type(emailInput, "existing@example.com");

		const submitButton = screen.getByRole("button", {
			name: /send invitation/i,
		});
		await user.click(submitButton);

		await waitFor(() => {
			expect(mockToast).toHaveBeenCalledWith(
				expect.objectContaining({
					variant: "destructive",
					title: "Failed to send invitation",
				}),
			);
		});
	});

	it("has search input for filtering members", async () => {
		render(<OrgTeamTable />);

		await waitFor(() => {
			expect(
				screen.getByPlaceholderText("Search by name or email..."),
			).toBeInTheDocument();
		});
	});

	it("filters members by search query", async () => {
		const user = userEvent.setup();
		render(<OrgTeamTable />);

		await waitFor(() => {
			expect(screen.getByText("John Doe")).toBeInTheDocument();
		});

		const searchInput = screen.getByPlaceholderText(
			"Search by name or email...",
		);
		await user.type(searchInput, "Jane");

		await waitFor(() => {
			expect(screen.getByText("Jane Smith")).toBeInTheDocument();
			expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
		});
	});

	it("has role filter dropdown", async () => {
		render(<OrgTeamTable />);

		await waitFor(() => {
			expect(screen.getByText("All roles")).toBeInTheDocument();
		});
	});

	it("shows pending invitations section when there are pending invitations", async () => {
		render(<OrgTeamTable />);

		await waitFor(() => {
			expect(screen.getByText("Pending Invitations")).toBeInTheDocument();
		});
	});

	it("shows pending invitation email", async () => {
		render(<OrgTeamTable />);

		await waitFor(() => {
			expect(screen.getByText("pending@example.com")).toBeInTheDocument();
		});
	});

	it("shows inviter name for pending invitations", async () => {
		render(<OrgTeamTable />);

		await waitFor(() => {
			expect(screen.getByText("Invited by John Doe")).toBeInTheDocument();
		});
	});

	it("has cancel invitation button", async () => {
		render(<OrgTeamTable />);

		await waitFor(() => {
			expect(screen.getByTitle("Cancel invitation")).toBeInTheDocument();
		});
	});

	it("has resend invitation button", async () => {
		render(<OrgTeamTable />);

		await waitFor(() => {
			expect(screen.getByTitle("Resend invitation")).toBeInTheDocument();
		});
	});

	it("calls cancelInvitation when cancel button is clicked", async () => {
		const user = userEvent.setup();
		render(<OrgTeamTable />);

		await waitFor(() => {
			expect(screen.getByTitle("Cancel invitation")).toBeInTheDocument();
		});

		const cancelButton = screen.getByTitle("Cancel invitation");
		await user.click(cancelButton);

		await waitFor(() => {
			expect(mockCancelInvitation).toHaveBeenCalledWith("inv-1");
		});
	});

	it("calls resendInvitation when resend button is clicked", async () => {
		const user = userEvent.setup();
		render(<OrgTeamTable />);

		await waitFor(() => {
			expect(screen.getByTitle("Resend invitation")).toBeInTheDocument();
		});

		const resendButton = screen.getByTitle("Resend invitation");
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
		render(<OrgTeamTable />);

		await waitFor(() => {
			expect(screen.getByTitle("Cancel invitation")).toBeInTheDocument();
		});

		const cancelButton = screen.getByTitle("Cancel invitation");
		await user.click(cancelButton);

		await waitFor(() => {
			expect(mockToast).toHaveBeenCalledWith(
				expect.objectContaining({
					title: "Invitation canceled",
				}),
			);
		});
	});

	it("shows member actions menu", async () => {
		const user = userEvent.setup();
		render(<OrgTeamTable />);

		await waitFor(() => {
			expect(screen.getByText("John Doe")).toBeInTheDocument();
		});

		// Find the actions button (MoreHorizontal icon button)
		const actionButtons = screen.getAllByRole("button", { name: /actions/i });
		await user.click(actionButtons[0]);

		expect(screen.getByText("Send message")).toBeInTheDocument();
		expect(screen.getByText("Change role")).toBeInTheDocument();
		expect(screen.getByText("Remove from team")).toBeInTheDocument();
	});

	it("returns null when no current organization", () => {
		mockUseOrgStore.mockReturnValueOnce({
			currentOrg: null,
			members: [],
			setMembers: mockSetMembers,
		});

		const { container } = render(<OrgTeamTable />);

		expect(container.firstChild).toBeNull();
	});

	it("shows empty state when no members match filter", async () => {
		const user = userEvent.setup();
		render(<OrgTeamTable />);

		await waitFor(() => {
			expect(screen.getByText("John Doe")).toBeInTheDocument();
		});

		const searchInput = screen.getByPlaceholderText(
			"Search by name or email...",
		);
		await user.type(searchInput, "nonexistent");

		await waitFor(() => {
			expect(
				screen.getByText("No members found with the selected filters"),
			).toBeInTheDocument();
		});
	});

	it("resets invite form when cancel is clicked", async () => {
		const user = userEvent.setup();
		render(<OrgTeamTable />);

		await waitFor(() => {
			expect(screen.getByText("John Doe")).toBeInTheDocument();
		});

		// Open invite dialog
		const inviteButton = screen.getByRole("button", { name: /invite member/i });
		await user.click(inviteButton);

		await waitFor(() => {
			expect(
				screen.getByPlaceholderText("person@company.com"),
			).toBeInTheDocument();
		});

		// Fill in the form
		const emailInput = screen.getByPlaceholderText("person@company.com");
		await user.type(emailInput, "test@example.com");

		// Click cancel
		const cancelButton = screen.getByRole("button", { name: /cancel/i });
		await user.click(cancelButton);

		// Reopen dialog
		await user.click(inviteButton);

		// Email should be reset
		await waitFor(() => {
			const newEmailInput = screen.getByPlaceholderText("person@company.com");
			expect(newEmailInput).toHaveValue("");
		});
	});

	it("allows changing role selection in invite dialog", async () => {
		const user = userEvent.setup();
		render(<OrgTeamTable />);

		await waitFor(() => {
			expect(screen.getByText("John Doe")).toBeInTheDocument();
		});

		// Open invite dialog
		const inviteButton = screen.getByRole("button", { name: /invite member/i });
		await user.click(inviteButton);

		await waitFor(() => {
			expect(
				screen.getByPlaceholderText("person@company.com"),
			).toBeInTheDocument();
		});

		// Click on role selector
		const roleSelector = screen.getByRole("combobox");
		await user.click(roleSelector);

		// Select a different role
		await waitFor(() => {
			expect(
				screen.getByRole("option", { name: "Administrator" }),
			).toBeInTheDocument();
		});

		await user.click(screen.getByRole("option", { name: "Administrator" }));

		// Fill email and submit
		const emailInput = screen.getByPlaceholderText("person@company.com");
		await user.type(emailInput, "admin@example.com");

		const submitButton = screen.getByRole("button", {
			name: /send invitation/i,
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

		render(<OrgTeamTable />);

		await waitFor(() => {
			expect(mockToast).toHaveBeenCalledWith(
				expect.objectContaining({
					variant: "destructive",
					title: "Failed to load members",
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
		render(<OrgTeamTable />);

		await waitFor(() => {
			expect(screen.getByText("Pending Invitations")).toBeInTheDocument();
		});

		// Find the resend button
		const resendButton = screen.getByTitle("Resend invitation");
		await user.click(resendButton);

		await waitFor(() => {
			expect(mockToast).toHaveBeenCalledWith(
				expect.objectContaining({
					variant: "destructive",
					title: "Failed to resend invitation",
				}),
			);
		});
	});
});
