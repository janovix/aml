import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrgSwitcher } from "./OrgSwitcher";
import { SidebarProvider } from "@/components/ui/sidebar";

const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
	useToast: () => ({
		toast: mockToast,
	}),
}));

const mockSetActiveOrganization = vi.fn();
const mockCreateOrganization = vi.fn();

vi.mock("@/lib/auth/organizations", () => ({
	setActiveOrganization: (...args: unknown[]) =>
		mockSetActiveOrganization(...args),
	createOrganization: (...args: unknown[]) => mockCreateOrganization(...args),
}));

const mockSetCurrentOrg = vi.fn();
const mockAddOrganization = vi.fn();
const mockUseOrgStore = vi.fn(() => ({
	currentOrg: {
		id: "org-1",
		name: "Test Org",
		slug: "test-org",
		plan: "starter",
	},
	organizations: [
		{
			id: "org-1",
			name: "Test Org",
			slug: "test-org",
			status: "active",
			plan: "starter",
		},
		{
			id: "org-2",
			name: "Other Org",
			slug: "other-org",
			status: "active",
			plan: "professional",
		},
	],
	setCurrentOrg: mockSetCurrentOrg,
	addOrganization: mockAddOrganization,
}));
vi.mock("@/lib/org-store", () => ({
	useOrgStore: () => mockUseOrgStore(),
}));

describe("OrgSwitcher", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockSetActiveOrganization.mockResolvedValue({
			data: { activeOrganizationId: "org-1" },
			error: null,
		});
		mockCreateOrganization.mockResolvedValue({
			data: { id: "new-org", name: "New Org", slug: "new-org" },
			error: null,
		});
	});

	it("renders current organization name", () => {
		render(
			<SidebarProvider>
				<OrgSwitcher />
			</SidebarProvider>,
		);

		expect(screen.getByText("Test Org")).toBeInTheDocument();
	});

	it("renders current organization plan", () => {
		render(
			<SidebarProvider>
				<OrgSwitcher />
			</SidebarProvider>,
		);

		expect(screen.getByText("starter plan")).toBeInTheDocument();
	});

	it("opens dropdown when clicked", async () => {
		const user = userEvent.setup();
		render(
			<SidebarProvider>
				<OrgSwitcher />
			</SidebarProvider>,
		);

		const trigger = screen.getByText("Test Org");
		await user.click(trigger);

		expect(screen.getByText("My Organizations")).toBeInTheDocument();
	});

	it("shows all organizations in dropdown", async () => {
		const user = userEvent.setup();
		render(
			<SidebarProvider>
				<OrgSwitcher />
			</SidebarProvider>,
		);

		const trigger = screen.getByText("Test Org");
		await user.click(trigger);

		expect(screen.getByText("Other Org")).toBeInTheDocument();
	});

	it("calls setActiveOrganization when switching organizations", async () => {
		const user = userEvent.setup();
		render(
			<SidebarProvider>
				<OrgSwitcher />
			</SidebarProvider>,
		);

		const trigger = screen.getByText("Test Org");
		await user.click(trigger);

		const otherOrg = screen.getByText("Other Org");
		await user.click(otherOrg);

		expect(mockSetActiveOrganization).toHaveBeenCalledWith("org-2");
	});

	it("shows success toast after switching organization", async () => {
		const user = userEvent.setup();
		render(
			<SidebarProvider>
				<OrgSwitcher />
			</SidebarProvider>,
		);

		const trigger = screen.getByText("Test Org");
		await user.click(trigger);

		const otherOrg = screen.getByText("Other Org");
		await user.click(otherOrg);

		await waitFor(() => {
			expect(mockToast).toHaveBeenCalledWith(
				expect.objectContaining({
					title: "Active organization updated",
				}),
			);
		});
	});

	it("shows error toast when switching fails", async () => {
		mockSetActiveOrganization.mockResolvedValueOnce({
			data: null,
			error: "Failed to switch",
		});

		const user = userEvent.setup();
		render(
			<SidebarProvider>
				<OrgSwitcher />
			</SidebarProvider>,
		);

		const trigger = screen.getByText("Test Org");
		await user.click(trigger);

		const otherOrg = screen.getByText("Other Org");
		await user.click(otherOrg);

		await waitFor(() => {
			expect(mockToast).toHaveBeenCalledWith(
				expect.objectContaining({
					variant: "destructive",
					title: "Failed to switch organization",
				}),
			);
		});
	});

	it("shows new organization button in dropdown", async () => {
		const user = userEvent.setup();
		render(
			<SidebarProvider>
				<OrgSwitcher />
			</SidebarProvider>,
		);

		const trigger = screen.getByText("Test Org");
		await user.click(trigger);

		expect(screen.getByText("New organization")).toBeInTheDocument();
	});

	it("opens create organization dialog", async () => {
		const user = userEvent.setup();
		render(
			<SidebarProvider>
				<OrgSwitcher />
			</SidebarProvider>,
		);

		const trigger = screen.getByText("Test Org");
		await user.click(trigger);

		const newOrgButton = screen.getByText("New organization");
		await user.click(newOrgButton);

		expect(
			screen.getByText("Create an organization to manage your team and data."),
		).toBeInTheDocument();
	});

	it("creates new organization when form is submitted", async () => {
		const user = userEvent.setup();
		render(
			<SidebarProvider>
				<OrgSwitcher />
			</SidebarProvider>,
		);

		const trigger = screen.getByText("Test Org");
		await user.click(trigger);

		const newOrgButton = screen.getByText("New organization");
		await user.click(newOrgButton);

		const nameInput = screen.getByLabelText("Name");
		await user.type(nameInput, "My New Org");

		const submitButton = screen.getByRole("button", {
			name: "Create organization",
		});
		await user.click(submitButton);

		await waitFor(() => {
			expect(mockCreateOrganization).toHaveBeenCalledWith(
				expect.objectContaining({
					name: "My New Org",
					slug: "my-new-org",
				}),
			);
		});
	});

	it("shows active indicator for current organization", async () => {
		const user = userEvent.setup();
		render(
			<SidebarProvider>
				<OrgSwitcher />
			</SidebarProvider>,
		);

		const trigger = screen.getByText("Test Org");
		await user.click(trigger);

		// The active org should have a visual indicator (a small dot)
		const orgItems = screen.getAllByRole("menuitem");
		const activeOrgItem = orgItems.find((item) =>
			item.textContent?.includes("Test Org"),
		);
		expect(activeOrgItem).toBeInTheDocument();
	});

	it("renders organization initials when no logo", () => {
		render(
			<SidebarProvider>
				<OrgSwitcher />
			</SidebarProvider>,
		);

		// "Test Org" should show "TO" initials
		expect(screen.getByText("TO")).toBeInTheDocument();
	});
});
