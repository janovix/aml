import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
	OrganizationSwitcher,
	type Organization,
} from "./OrganizationSwitcher";
import { SidebarProvider } from "@/components/ui/sidebar";

describe("OrganizationSwitcher", () => {
	const mockOrganizations: Organization[] = [
		{
			id: "1",
			name: "Org 1",
			slug: "org-1",
			logo: undefined,
		},
		{
			id: "2",
			name: "Org 2",
			slug: "org-2",
			logo: "https://example.com/logo.jpg",
		},
	];

	it("renders loading state when isLoading is true", () => {
		render(
			<SidebarProvider defaultOpen={true}>
				<OrganizationSwitcher
					organizations={[]}
					activeOrganization={null}
					onOrganizationChange={vi.fn()}
					isLoading={true}
				/>
			</SidebarProvider>,
		);

		const loadingElements = document.querySelectorAll(".animate-pulse");
		expect(loadingElements.length).toBeGreaterThan(0);
	});

	it("renders collapsed state with org avatar when sidebar is collapsed", () => {
		render(
			<SidebarProvider defaultOpen={false}>
				<OrganizationSwitcher
					organizations={[]}
					activeOrganization={null}
					onOrganizationChange={vi.fn()}
					isLoading={false}
				/>
			</SidebarProvider>,
		);

		// When collapsed with no active org, it should show a "?" placeholder
		expect(screen.getByText("?")).toBeInTheDocument();
	});

	it("renders create organization button when no organizations", () => {
		const mockOnCreate = vi.fn();
		render(
			<SidebarProvider defaultOpen={true}>
				<OrganizationSwitcher
					organizations={[]}
					activeOrganization={null}
					onOrganizationChange={vi.fn()}
					onCreateOrganization={mockOnCreate}
					isLoading={false}
				/>
			</SidebarProvider>,
		);

		expect(screen.getByText("Crear organización")).toBeInTheDocument();
		expect(screen.getByText("Configura tu empresa")).toBeInTheDocument();
	});

	it("renders organization dropdown when organizations exist", () => {
		render(
			<SidebarProvider defaultOpen={true}>
				<OrganizationSwitcher
					organizations={mockOrganizations}
					activeOrganization={mockOrganizations[0]}
					onOrganizationChange={vi.fn()}
					isLoading={false}
				/>
			</SidebarProvider>,
		);

		expect(screen.getByText("ORG 1")).toBeInTheDocument();
		expect(screen.getByText("org-1")).toBeInTheDocument();
	});

	it("calls onOrganizationChange when organization is selected", async () => {
		const mockOnChange = vi.fn();
		const user = userEvent.setup();

		render(
			<SidebarProvider defaultOpen={true}>
				<OrganizationSwitcher
					organizations={mockOrganizations}
					activeOrganization={mockOrganizations[0]}
					onOrganizationChange={mockOnChange}
					isLoading={false}
				/>
			</SidebarProvider>,
		);

		// Click on the organization button to open dropdown
		const orgButton = screen.getByText("ORG 1");
		await user.click(orgButton);

		// Find and click on the second organization
		const org2Item = await screen.findByText("ORG 2");
		await user.click(org2Item);

		expect(mockOnChange).toHaveBeenCalledWith(mockOrganizations[1]);
	});

	it("calls onCreateOrganization when create button is clicked", async () => {
		const mockOnCreate = vi.fn();
		const user = userEvent.setup();

		render(
			<SidebarProvider defaultOpen={true}>
				<OrganizationSwitcher
					organizations={[]}
					activeOrganization={null}
					onOrganizationChange={vi.fn()}
					onCreateOrganization={mockOnCreate}
					isLoading={false}
				/>
			</SidebarProvider>,
		);

		const createButton = screen.getByText("Crear organización");
		await user.click(createButton);

		expect(mockOnCreate).toHaveBeenCalledTimes(1);
	});

	it("renders organization with logo when provided", () => {
		render(
			<SidebarProvider defaultOpen={true}>
				<OrganizationSwitcher
					organizations={mockOrganizations}
					activeOrganization={mockOrganizations[1]}
					onOrganizationChange={vi.fn()}
					isLoading={false}
				/>
			</SidebarProvider>,
		);

		const logo = document.querySelector('img[alt="Org 2"]');
		expect(logo).toBeInTheDocument();
		expect(logo).toHaveAttribute("src", "https://example.com/logo.jpg");
	});

	it("shows create organization option in dropdown when onCreateOrganization is provided", async () => {
		const mockOnCreate = vi.fn();
		const user = userEvent.setup();

		render(
			<SidebarProvider defaultOpen={true}>
				<OrganizationSwitcher
					organizations={mockOrganizations}
					activeOrganization={mockOrganizations[0]}
					onOrganizationChange={vi.fn()}
					onCreateOrganization={mockOnCreate}
					isLoading={false}
				/>
			</SidebarProvider>,
		);

		// Open dropdown
		const orgButton = screen.getByText("ORG 1");
		await user.click(orgButton);

		// Find and click create organization option
		const createOption = await screen.findByText("Crear organización");
		await user.click(createOption);

		expect(mockOnCreate).toHaveBeenCalledTimes(1);
	});

	it("shows Activa label for current organization in dropdown", async () => {
		const user = userEvent.setup();

		render(
			<SidebarProvider defaultOpen={true}>
				<OrganizationSwitcher
					organizations={mockOrganizations}
					activeOrganization={mockOrganizations[0]}
					onOrganizationChange={vi.fn()}
					isLoading={false}
				/>
			</SidebarProvider>,
		);

		// Open dropdown
		const orgButton = screen.getByText("ORG 1");
		await user.click(orgButton);

		// Check for "Activa" label
		expect(await screen.findByText("Activa")).toBeInTheDocument();
	});

	it("renders collapsed state with organizations and opens dropdown on click", async () => {
		const mockOnChange = vi.fn();
		const user = userEvent.setup();

		render(
			<SidebarProvider defaultOpen={false}>
				<OrganizationSwitcher
					organizations={mockOrganizations}
					activeOrganization={mockOrganizations[0]}
					onOrganizationChange={mockOnChange}
					isLoading={false}
				/>
			</SidebarProvider>,
		);

		// Find the collapsed button with Building2 icon
		const buttons = screen.getAllByRole("button");
		expect(buttons.length).toBeGreaterThan(0);

		// Click to open dropdown
		await user.click(buttons[0]);

		// Should show organizations in dropdown
		expect(await screen.findByText("Organizaciones")).toBeInTheDocument();
	});

	it("renders active organization with logo in collapsed state", () => {
		render(
			<SidebarProvider defaultOpen={false}>
				<OrganizationSwitcher
					organizations={mockOrganizations}
					activeOrganization={mockOrganizations[1]}
					onOrganizationChange={vi.fn()}
					isLoading={false}
				/>
			</SidebarProvider>,
		);

		// Should show the org logo in collapsed state
		const logo = document.querySelector('img[alt="Org 2"]');
		expect(logo).toBeInTheDocument();
	});

	it("displays Seleccionar when no active organization", () => {
		render(
			<SidebarProvider defaultOpen={true}>
				<OrganizationSwitcher
					organizations={mockOrganizations}
					activeOrganization={null}
					onOrganizationChange={vi.fn()}
					isLoading={false}
				/>
			</SidebarProvider>,
		);

		expect(screen.getByText("Seleccionar")).toBeInTheDocument();
		expect(screen.getByText("organización")).toBeInTheDocument();
	});

	it("renders organization logo in dropdown items when available", async () => {
		const user = userEvent.setup();

		render(
			<SidebarProvider defaultOpen={true}>
				<OrganizationSwitcher
					organizations={mockOrganizations}
					activeOrganization={mockOrganizations[0]}
					onOrganizationChange={vi.fn()}
					isLoading={false}
				/>
			</SidebarProvider>,
		);

		// Open dropdown
		const orgButton = screen.getByText("ORG 1");
		await user.click(orgButton);

		// Org 2 has a logo
		const logo = document.querySelector('img[alt="Org 2"]');
		expect(logo).toBeInTheDocument();
	});
});
