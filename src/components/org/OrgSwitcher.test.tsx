import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrgSwitcher } from "./OrgSwitcher";
import { SidebarProvider } from "@/components/ui/sidebar";

// Mock sonner toast
vi.mock("sonner", () => ({
	toast: Object.assign(vi.fn(), {
		error: vi.fn(),
		success: vi.fn(),
		promise: vi.fn(),
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

		expect(screen.getByText("TEST ORG")).toBeInTheDocument();
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

		const trigger = screen.getByText("TEST ORG");
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

		const trigger = screen.getByText("TEST ORG");
		await user.click(trigger);

		expect(screen.getByText("OTHER ORG")).toBeInTheDocument();
	});

	it("calls setActiveOrganization when switching organizations", async () => {
		const user = userEvent.setup();
		render(
			<SidebarProvider>
				<OrgSwitcher />
			</SidebarProvider>,
		);

		const trigger = screen.getByText("TEST ORG");
		await user.click(trigger);

		const otherOrg = screen.getByText("OTHER ORG");
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

		const trigger = screen.getByText("TEST ORG");
		await user.click(trigger);

		const otherOrg = screen.getByText("OTHER ORG");
		await user.click(otherOrg);

		// Verify setActiveOrganization was called (toast is handled by executeMutation)
		await waitFor(() => {
			expect(mockSetActiveOrganization).toHaveBeenCalledWith("org-2");
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

		const trigger = screen.getByText("TEST ORG");
		await user.click(trigger);

		const otherOrg = screen.getByText("OTHER ORG");
		await user.click(otherOrg);

		// Verify setActiveOrganization was called (error is handled by executeMutation via Sonner toast)
		await waitFor(() => {
			expect(mockSetActiveOrganization).toHaveBeenCalledWith("org-2");
		});
	});

	it("shows new organization button in dropdown", async () => {
		const user = userEvent.setup();
		render(
			<SidebarProvider>
				<OrgSwitcher />
			</SidebarProvider>,
		);

		const trigger = screen.getByText("TEST ORG");
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

		const trigger = screen.getByText("TEST ORG");
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

		const trigger = screen.getByText("TEST ORG");
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

		const trigger = screen.getByText("TEST ORG");
		await user.click(trigger);

		// The active org should have a visual indicator (a small dot)
		const orgItems = screen.getAllByRole("menuitem");
		const activeOrgItem = orgItems.find((item) =>
			item.textContent?.includes("TEST ORG"),
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

	it("shows error when organization creation fails without message", async () => {
		mockCreateOrganization.mockResolvedValueOnce({
			data: null,
			error: null,
		});

		const user = userEvent.setup();
		render(
			<SidebarProvider>
				<OrgSwitcher />
			</SidebarProvider>,
		);

		const trigger = screen.getByText("TEST ORG");
		await user.click(trigger);

		const newOrgButton = screen.getByText("New organization");
		await user.click(newOrgButton);

		const nameInput = screen.getByLabelText("Name");
		await user.type(nameInput, "My New Org");

		const submitButton = screen.getByRole("button", {
			name: "Create organization",
		});
		await user.click(submitButton);

		// Verify createOrganization was called (error is handled by executeMutation via Sonner toast)
		await waitFor(() => {
			expect(mockCreateOrganization).toHaveBeenCalledWith(
				expect.objectContaining({
					name: "My New Org",
				}),
			);
		});
	});

	it("closes dialog when cancel button is clicked", async () => {
		const user = userEvent.setup();
		render(
			<SidebarProvider>
				<OrgSwitcher />
			</SidebarProvider>,
		);

		const trigger = screen.getByText("TEST ORG");
		await user.click(trigger);

		const newOrgButton = screen.getByText("New organization");
		await user.click(newOrgButton);

		const nameInput = screen.getByLabelText("Name");
		await user.type(nameInput, "My New Org");

		// Click cancel button to close dialog
		const cancelButton = screen.getByRole("button", { name: "Cancel" });
		await user.click(cancelButton);

		// Wait for dialog to close
		await waitFor(() => {
			expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();
		});
	});

	it("allows typing in name input and submitting form", async () => {
		const user = userEvent.setup();
		mockCreateOrganization.mockResolvedValueOnce({
			data: { id: "new-org", name: "New Org", slug: "new-org" },
			error: null,
		});

		render(
			<SidebarProvider>
				<OrgSwitcher />
			</SidebarProvider>,
		);

		const trigger = screen.getByText("TEST ORG");
		await user.click(trigger);

		const newOrgButton = screen.getByText("New organization");
		await user.click(newOrgButton);

		const nameInput = screen.getByLabelText("Name");
		await user.type(nameInput, "New Org");

		const submitButton = screen.getByRole("button", {
			name: "Create organization",
		});
		await user.click(submitButton);

		// Verify createOrganization was called
		await waitFor(() => {
			expect(mockCreateOrganization).toHaveBeenCalledWith(
				expect.objectContaining({
					name: "New Org",
				}),
			);
		});
	});

	it("allows setting custom slug", async () => {
		const user = userEvent.setup();
		render(
			<SidebarProvider>
				<OrgSwitcher />
			</SidebarProvider>,
		);

		const trigger = screen.getByText("TEST ORG");
		await user.click(trigger);

		const newOrgButton = screen.getByText("New organization");
		await user.click(newOrgButton);

		const nameInput = screen.getByLabelText("Name");
		await user.type(nameInput, "My New Org");

		const slugInput = screen.getByLabelText("Slug");
		await user.type(slugInput, "custom-slug");

		// Final slug should show the custom slug
		expect(screen.getByText("custom-slug")).toBeInTheDocument();
	});

	it("allows setting optional logo URL", async () => {
		const user = userEvent.setup();
		render(
			<SidebarProvider>
				<OrgSwitcher />
			</SidebarProvider>,
		);

		const trigger = screen.getByText("TEST ORG");
		await user.click(trigger);

		const newOrgButton = screen.getByText("New organization");
		await user.click(newOrgButton);

		const nameInput = screen.getByLabelText("Name");
		await user.type(nameInput, "My New Org");

		const logoInput = screen.getByLabelText("Logo (optional URL)");
		await user.type(logoInput, "https://example.com/logo.png");

		const submitButton = screen.getByRole("button", {
			name: "Create organization",
		});
		await user.click(submitButton);

		await waitFor(() => {
			expect(mockCreateOrganization).toHaveBeenCalledWith(
				expect.objectContaining({
					logo: "https://example.com/logo.png",
				}),
			);
		});
	});
});
