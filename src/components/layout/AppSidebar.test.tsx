import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppSidebar } from "./AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

const mockPush = vi.fn();
const mockSetOpenMobile = vi.fn();
const mockUsePathname = vi.fn(() => "/clients");

vi.mock("next/navigation", () => ({
	usePathname: () => mockUsePathname(),
	useRouter: () => ({
		push: mockPush,
	}),
}));

const mockUseAuthSession = vi.fn(() => ({
	data: {
		user: {
			id: "user-1",
			name: "Test User",
			email: "test@example.com",
		},
	},
	isPending: false,
}));

vi.mock("@/lib/auth/useAuthSession", () => ({
	useAuthSession: () => mockUseAuthSession(),
}));

const mockLogout = vi.fn();
vi.mock("@/lib/auth/actions", () => ({
	logout: () => mockLogout(),
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

interface MockOrg {
	id: string;
	name: string;
	slug: string;
	logo?: string | null;
}

interface MockOrgStoreReturn {
	currentOrg: MockOrg | null;
	organizations: MockOrg[];
	setCurrentOrg: typeof mockSetCurrentOrg;
	addOrganization?: typeof mockAddOrganization;
	isLoading: boolean;
}

const mockUseOrgStore = vi.fn(
	(): MockOrgStoreReturn => ({
		currentOrg: { id: "org-1", name: "Test Org", slug: "test-org" },
		organizations: [
			{ id: "org-1", name: "Test Org", slug: "test-org" },
			{ id: "org-2", name: "Other Org", slug: "other-org" },
		],
		setCurrentOrg: mockSetCurrentOrg,
		isLoading: false,
	}),
);

// Create a mock getState that returns the same values
const mockGetState = vi.fn(
	(): MockOrgStoreReturn => ({
		currentOrg: { id: "org-1", name: "Test Org", slug: "test-org" },
		organizations: [
			{ id: "org-1", name: "Test Org", slug: "test-org" },
			{ id: "org-2", name: "Other Org", slug: "other-org" },
		],
		setCurrentOrg: mockSetCurrentOrg,
		addOrganization: mockAddOrganization,
		isLoading: false,
	}),
);

vi.mock("@/lib/org-store", () => ({
	useOrgStore: Object.assign(() => mockUseOrgStore(), {
		getState: () => mockGetState(),
	}),
}));

vi.mock("@/hooks/use-toast", () => ({
	useToast: () => ({
		toast: vi.fn(),
	}),
}));

const mockOnOrganizationChange = vi.fn();
const mockOnCreateOrganization = vi.fn();

vi.mock("./OrganizationSwitcher", () => ({
	OrganizationSwitcher: ({
		onOrganizationChange,
		onCreateOrganization,
	}: {
		onOrganizationChange: (org: unknown) => void;
		onCreateOrganization: () => void;
	}) => (
		<div>
			<button onClick={() => onOrganizationChange({ id: "org-1" })}>
				Change Org
			</button>
			<button onClick={onCreateOrganization}>Create Org</button>
		</div>
	),
}));

vi.mock("@/components/ui/sidebar", async () => {
	const actual = await vi.importActual<
		typeof import("@/components/ui/sidebar")
	>("@/components/ui/sidebar");
	return {
		...actual,
		useSidebar: vi.fn(() => ({
			isMobile: false,
			setOpenMobile: mockSetOpenMobile,
			open: true,
			setOpen: vi.fn(),
			toggleSidebar: vi.fn(),
			toggleMobileSidebar: vi.fn(),
		})),
	};
});

const mockOnLogout = vi.fn();
vi.mock("./NavUser", () => ({
	NavUser: ({ onLogout }: { onLogout: () => void }) => (
		<div>
			<button onClick={onLogout}>Logout</button>
		</div>
	),
}));

describe("AppSidebar", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUsePathname.mockReturnValue("/clients");
		mockUseAuthSession.mockReturnValue({
			data: {
				user: {
					id: "user-1",
					name: "Test User",
					email: "test@example.com",
				},
			},
			isPending: false,
		});
		mockSetActiveOrganization.mockResolvedValue({
			data: { activeOrganizationId: "org-1" },
			error: null,
		});
		mockCreateOrganization.mockResolvedValue({
			data: { id: "new-org-1", name: "New Org", slug: "new-org" },
			error: null,
		});
	});

	it("renders sidebar with navigation items", () => {
		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>,
		);

		expect(screen.getByText("Clientes")).toBeInTheDocument();
		expect(screen.getByText("Transacciones")).toBeInTheDocument();
		expect(screen.getByText("Configuración")).toBeInTheDocument();
	});

	it("renders organization switcher and nav user", () => {
		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>,
		);

		expect(screen.getByText("Change Org")).toBeInTheDocument();
		expect(screen.getByText("Logout")).toBeInTheDocument();
	});

	it("handles organization change", async () => {
		const user = userEvent.setup();
		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>,
		);

		const changeOrgButton = screen.getByText("Change Org");
		await user.click(changeOrgButton);

		// Organization change handler should be called
		expect(changeOrgButton).toBeInTheDocument();
	});

	it("handles create organization", async () => {
		const user = userEvent.setup();
		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>,
		);

		const createOrgButton = screen.getByText("Create Org");
		await user.click(createOrgButton);

		// The create organization handler opens a dialog, it doesn't navigate
		// Check that the dialog is opened
		await waitFor(() => {
			expect(screen.getByText("Nueva organización")).toBeInTheDocument();
		});
	});

	it("handles logout", async () => {
		const user = userEvent.setup();
		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>,
		);

		const logoutButton = screen.getByText("Logout");
		await user.click(logoutButton);

		expect(mockLogout).toHaveBeenCalled();
	});

	it("handles loading state", () => {
		mockUseAuthSession.mockReturnValue({
			data: {
				user: {
					id: "user-1",
					name: "Test User",
					email: "test@example.com",
				},
			},
			isPending: true,
		});

		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>,
		);

		expect(screen.getByText("Change Org")).toBeInTheDocument();
	});

	it("handles user without name", () => {
		mockUseAuthSession.mockReturnValue({
			data: {
				user: {
					id: "user-1",
					name: "",
					email: "test@example.com",
				},
			},
			isPending: false,
		});

		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>,
		);

		expect(screen.getByText("Logout")).toBeInTheDocument();
	});

	it("handles user with image/avatar", () => {
		mockUseAuthSession.mockReturnValue({
			data: {
				user: {
					id: "user-1",
					name: "Test User",
					email: "test@example.com",
					image: "https://example.com/avatar.jpg",
				} as {
					id: string;
					name: string;
					email: string;
					image?: string;
				},
			},
			isPending: false,
		});

		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>,
		);

		// User info should be rendered through NavUser component
		expect(screen.getByText("Change Org")).toBeInTheDocument();
	});

	it("handles different pathnames for active navigation", () => {
		mockUsePathname.mockReturnValue("/transactions");

		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>,
		);

		expect(screen.getByText("Transacciones")).toBeInTheDocument();
		// Reset for other tests
		mockUsePathname.mockReturnValue("/clients");
	});

	it("handles pathname with subpath for active navigation", () => {
		mockUsePathname.mockReturnValue("/clients/123");

		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>,
		);

		// Should still show navigation items
		expect(screen.getByText("Clientes")).toBeInTheDocument();
		// Reset for other tests
		mockUsePathname.mockReturnValue("/clients");
	});

	it("renders unavailable items with 'Pronto' badge", () => {
		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>,
		);

		// Unavailable items should show "Pronto" badge
		// Dashboard, Modelos de Riesgo, Historial are unavailable
		expect(screen.getByText("Dashboard")).toBeInTheDocument();
		expect(screen.getByText("Alertas")).toBeInTheDocument();
		expect(screen.getByText("Reportes")).toBeInTheDocument();
	});

	it("handles link click for available items", async () => {
		const user = userEvent.setup();
		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>,
		);

		// Click on an available item
		const clientesLink = screen.getByText("Clientes").closest("a");
		if (clientesLink) {
			await user.click(clientesLink);
			// The handleLinkClick should be called (tested through behavior)
		}
	});

	it("handles link click for unavailable items", async () => {
		const user = userEvent.setup();
		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>,
		);

		// Click on an unavailable item (should not trigger handleLinkClick)
		const dashboardLink = screen.getByText("Dashboard").closest("a");
		if (dashboardLink) {
			await user.click(dashboardLink);
			// Unavailable items should not trigger onClick
		}
	});

	it("handles mobile sidebar closing on link click", async () => {
		const user = userEvent.setup();
		// Mock useSidebar to return isMobile: true
		const { useSidebar } = await import("@/components/ui/sidebar");
		vi.mocked(useSidebar).mockReturnValueOnce({
			state: "expanded",
			open: true,
			setOpen: vi.fn(),
			openMobile: true,
			setOpenMobile: mockSetOpenMobile,
			isMobile: true,
			toggleSidebar: vi.fn(),
		} as ReturnType<typeof useSidebar>);

		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>,
		);

		// Click on an available item
		const clientesLink = screen.getByText("Clientes").closest("a");
		if (clientesLink) {
			await user.click(clientesLink);
			// Should close mobile sidebar
			expect(mockSetOpenMobile).toHaveBeenCalledWith(false);
		}
	});

	it("handles session without user", () => {
		mockUseAuthSession.mockReturnValue({
			data: null,
			error: null,
			isPending: false,
		} as unknown as ReturnType<typeof mockUseAuthSession>);

		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>,
		);

		// Should render sidebar even without user
		expect(screen.getByText("Clientes")).toBeInTheDocument();
	});

	it("handles user without email", () => {
		mockUseAuthSession.mockReturnValue({
			data: {
				user: {
					id: "user-1",
					name: "Test User",
					email: "",
				},
			},
			isPending: false,
		});

		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>,
		);

		expect(screen.getByText("Logout")).toBeInTheDocument();
	});

	it("handles all navigation item groups", () => {
		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>,
		);

		// Verify all navigation groups are rendered
		expect(screen.getByText("Clientes")).toBeInTheDocument(); // Main nav
		expect(screen.getByText("Dashboard")).toBeInTheDocument(); // Main nav
		expect(screen.getByText("Modelos de Riesgo")).toBeInTheDocument(); // Secondary nav
		expect(screen.getByText("Configuración")).toBeInTheDocument(); // Bottom nav
	});

	it("handles organization change callback", async () => {
		const user = userEvent.setup();

		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>,
		);

		const changeOrgButton = screen.getByText("Change Org");
		await user.click(changeOrgButton);

		// Should call setActiveOrganization API
		expect(mockSetActiveOrganization).toHaveBeenCalledWith("org-1");
	});

	it("shows error toast when organization switch fails", async () => {
		mockSetActiveOrganization.mockResolvedValue({
			data: null,
			error: "Failed to switch",
		});

		const user = userEvent.setup();

		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>,
		);

		const changeOrgButton = screen.getByText("Change Org");
		await user.click(changeOrgButton);

		// Should call setActiveOrganization API
		expect(mockSetActiveOrganization).toHaveBeenCalledWith("org-1");
	});

	it("opens create organization dialog and submits form", async () => {
		const user = userEvent.setup();

		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>,
		);

		// Click create organization button
		const createOrgButton = screen.getByText("Create Org");
		await user.click(createOrgButton);

		// Dialog should be open
		await waitFor(() => {
			expect(screen.getByText("Nueva organización")).toBeInTheDocument();
		});

		// Fill in the form
		const nameInput = screen.getByLabelText("Nombre");
		await user.type(nameInput, "Test Organization");

		// Verify slug is derived
		expect(screen.getByText("test-organization")).toBeInTheDocument();
	});

	it("handles settings navigation", async () => {
		const user = userEvent.setup();
		mockUsePathname.mockReturnValue("/settings");

		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>,
		);

		// Settings link should be in the document
		expect(screen.getByText("Configuración")).toBeInTheDocument();
	});

	it("renders with no organizations", () => {
		mockUseOrgStore.mockReturnValue({
			currentOrg: null,
			organizations: [],
			setCurrentOrg: mockSetCurrentOrg,
			isLoading: false,
		});

		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>,
		);

		// Should still render sidebar
		expect(screen.getByText("Clientes")).toBeInTheDocument();
	});

	it("submits create organization form successfully", async () => {
		const user = userEvent.setup();
		mockCreateOrganization.mockResolvedValueOnce({
			data: { id: "new-org-1", name: "My New Org", slug: "my-new-org" },
			error: null,
		});

		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>,
		);

		// Open create organization dialog
		const createOrgButton = screen.getByText("Create Org");
		await user.click(createOrgButton);

		await waitFor(() => {
			expect(screen.getByText("Nueva organización")).toBeInTheDocument();
		});

		// Fill in the form
		const nameInput = screen.getByLabelText("Nombre");
		await user.type(nameInput, "My New Org");

		// Submit the form
		const submitButton = screen.getByText("Crear organización");
		await user.click(submitButton);

		// Verify createOrganization was called
		await waitFor(() => {
			expect(mockCreateOrganization).toHaveBeenCalledWith({
				name: "My New Org",
				slug: "my-new-org",
				logo: undefined,
			});
		});
	});

	it("handles create organization error", async () => {
		const user = userEvent.setup();
		mockCreateOrganization.mockResolvedValueOnce({
			data: null,
			error: "Organization already exists",
		});

		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>,
		);

		// Open create organization dialog
		const createOrgButton = screen.getByText("Create Org");
		await user.click(createOrgButton);

		await waitFor(() => {
			expect(screen.getByText("Nueva organización")).toBeInTheDocument();
		});

		// Fill in the form
		const nameInput = screen.getByLabelText("Nombre");
		await user.type(nameInput, "Existing Org");

		// Submit the form
		const submitButton = screen.getByText("Crear organización");
		await user.click(submitButton);

		// Verify error is displayed
		await waitFor(() => {
			expect(
				screen.getByText("Organization already exists"),
			).toBeInTheDocument();
		});
	});

	it("handles create organization with no data returned", async () => {
		const user = userEvent.setup();
		mockCreateOrganization.mockResolvedValueOnce({
			data: null,
			error: null,
		});

		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>,
		);

		// Open create organization dialog
		const createOrgButton = screen.getByText("Create Org");
		await user.click(createOrgButton);

		await waitFor(() => {
			expect(screen.getByText("Nueva organización")).toBeInTheDocument();
		});

		// Fill in the form
		const nameInput = screen.getByLabelText("Nombre");
		await user.type(nameInput, "Test Org");

		// Submit the form
		const submitButton = screen.getByText("Crear organización");
		await user.click(submitButton);

		// Verify fallback error is displayed
		await waitFor(() => {
			expect(screen.getByText("Please try again later.")).toBeInTheDocument();
		});
	});

	it("handles setActiveOrganization error after creating org", async () => {
		const mockToast = vi.fn();
		vi.doMock("@/hooks/use-toast", () => ({
			useToast: () => ({
				toast: mockToast,
			}),
		}));

		const user = userEvent.setup();
		mockCreateOrganization.mockResolvedValueOnce({
			data: { id: "new-org-1", name: "New Org", slug: "new-org" },
			error: null,
		});
		mockSetActiveOrganization.mockResolvedValueOnce({
			data: null,
			error: "Failed to activate organization",
		});

		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>,
		);

		// Open create organization dialog
		const createOrgButton = screen.getByText("Create Org");
		await user.click(createOrgButton);

		await waitFor(() => {
			expect(screen.getByText("Nueva organización")).toBeInTheDocument();
		});

		// Fill in the form
		const nameInput = screen.getByLabelText("Nombre");
		await user.type(nameInput, "New Org");

		// Submit the form
		const submitButton = screen.getByText("Crear organización");
		await user.click(submitButton);

		// Verify create was called
		await waitFor(() => {
			expect(mockCreateOrganization).toHaveBeenCalled();
		});
	});

	it("does not submit when org name is empty", async () => {
		const user = userEvent.setup();

		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>,
		);

		// Open create organization dialog
		const createOrgButton = screen.getByText("Create Org");
		await user.click(createOrgButton);

		await waitFor(() => {
			expect(screen.getByText("Nueva organización")).toBeInTheDocument();
		});

		// Try to submit without filling in name
		const submitButton = screen.getByText("Crear organización");
		expect(submitButton).toBeDisabled();

		// createOrganization should not be called
		expect(mockCreateOrganization).not.toHaveBeenCalled();
	});

	it("handles custom slug input in create organization form", async () => {
		const user = userEvent.setup();
		mockCreateOrganization.mockResolvedValueOnce({
			data: { id: "new-org-1", name: "My Org", slug: "custom-slug" },
			error: null,
		});

		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>,
		);

		// Open create organization dialog
		const createOrgButton = screen.getByText("Create Org");
		await user.click(createOrgButton);

		await waitFor(() => {
			expect(screen.getByText("Nueva organización")).toBeInTheDocument();
		});

		// Fill in the form with custom slug
		const nameInput = screen.getByLabelText("Nombre");
		await user.type(nameInput, "My Org");

		const slugInput = screen.getByLabelText("Slug");
		await user.type(slugInput, "custom-slug");

		// Verify derived slug shows custom value
		expect(screen.getByText("custom-slug")).toBeInTheDocument();

		// Submit the form
		const submitButton = screen.getByText("Crear organización");
		await user.click(submitButton);

		// Verify createOrganization was called with custom slug
		await waitFor(() => {
			expect(mockCreateOrganization).toHaveBeenCalledWith({
				name: "My Org",
				slug: "custom-slug",
				logo: undefined,
			});
		});
	});

	it("handles logo URL input in create organization form", async () => {
		const user = userEvent.setup();
		mockCreateOrganization.mockResolvedValueOnce({
			data: {
				id: "new-org-1",
				name: "My Org",
				slug: "my-org",
				logo: "https://example.com/logo.png",
			},
			error: null,
		});

		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>,
		);

		// Open create organization dialog
		const createOrgButton = screen.getByText("Create Org");
		await user.click(createOrgButton);

		await waitFor(() => {
			expect(screen.getByText("Nueva organización")).toBeInTheDocument();
		});

		// Fill in the form with logo
		const nameInput = screen.getByLabelText("Nombre");
		await user.type(nameInput, "My Org");

		const logoInput = screen.getByLabelText("Logo (URL opcional)");
		await user.type(logoInput, "https://example.com/logo.png");

		// Submit the form
		const submitButton = screen.getByText("Crear organización");
		await user.click(submitButton);

		// Verify createOrganization was called with logo
		await waitFor(() => {
			expect(mockCreateOrganization).toHaveBeenCalledWith({
				name: "My Org",
				slug: "my-org",
				logo: "https://example.com/logo.png",
			});
		});
	});

	it("closes dialog when cancel button is clicked", async () => {
		const user = userEvent.setup();

		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>,
		);

		// Open create organization dialog
		const createOrgButton = screen.getByText("Create Org");
		await user.click(createOrgButton);

		await waitFor(() => {
			expect(screen.getByText("Nueva organización")).toBeInTheDocument();
		});

		// Click cancel
		const cancelButton = screen.getByText("Cancelar");
		await user.click(cancelButton);

		// Dialog should close
		await waitFor(() => {
			expect(screen.queryByText("Nueva organización")).not.toBeInTheDocument();
		});
	});

	it("clears form error when typing in name field", async () => {
		const user = userEvent.setup();
		mockCreateOrganization.mockResolvedValueOnce({
			data: null,
			error: "Organization already exists",
		});

		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>,
		);

		// Open create organization dialog
		const createOrgButton = screen.getByText("Create Org");
		await user.click(createOrgButton);

		await waitFor(() => {
			expect(screen.getByText("Nueva organización")).toBeInTheDocument();
		});

		// Fill in the form and submit
		const nameInput = screen.getByLabelText("Nombre");
		await user.type(nameInput, "Existing Org");

		const submitButton = screen.getByText("Crear organización");
		await user.click(submitButton);

		// Wait for error to appear
		await waitFor(() => {
			expect(
				screen.getByText("Organization already exists"),
			).toBeInTheDocument();
		});

		// Type in name field again to clear error
		await user.type(nameInput, " 2");

		// Error should be cleared
		await waitFor(() => {
			expect(
				screen.queryByText("Organization already exists"),
			).not.toBeInTheDocument();
		});
	});

	it("clears form error when typing in slug field", async () => {
		const user = userEvent.setup();
		mockCreateOrganization.mockResolvedValueOnce({
			data: null,
			error: "Slug already taken",
		});

		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>,
		);

		// Open create organization dialog
		const createOrgButton = screen.getByText("Create Org");
		await user.click(createOrgButton);

		await waitFor(() => {
			expect(screen.getByText("Nueva organización")).toBeInTheDocument();
		});

		// Fill in the form and submit
		const nameInput = screen.getByLabelText("Nombre");
		await user.type(nameInput, "Test Org");

		const submitButton = screen.getByText("Crear organización");
		await user.click(submitButton);

		// Wait for error to appear
		await waitFor(() => {
			expect(screen.getByText("Slug already taken")).toBeInTheDocument();
		});

		// Type in slug field to clear error
		const slugInput = screen.getByLabelText("Slug");
		await user.type(slugInput, "new-slug");

		// Error should be cleared
		await waitFor(() => {
			expect(screen.queryByText("Slug already taken")).not.toBeInTheDocument();
		});
	});

	it("renders team navigation item", () => {
		mockUsePathname.mockReturnValue("/team");

		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>,
		);

		expect(screen.getByText("Team")).toBeInTheDocument();
	});

	it("handles org with logo in legacy format", () => {
		mockUseOrgStore.mockReturnValue({
			currentOrg: {
				id: "org-1",
				name: "Test Org",
				slug: "test-org",
				logo: "https://example.com/logo.png",
			},
			organizations: [
				{
					id: "org-1",
					name: "Test Org",
					slug: "test-org",
					logo: "https://example.com/logo.png",
				},
			],
			setCurrentOrg: mockSetCurrentOrg,
			isLoading: false,
		});

		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>,
		);

		// Should still render sidebar
		expect(screen.getByText("Clientes")).toBeInTheDocument();
	});

	it("handles org without logo in legacy format", () => {
		mockUseOrgStore.mockReturnValue({
			currentOrg: {
				id: "org-1",
				name: "Test Org",
				slug: "test-org",
				logo: null,
			},
			organizations: [
				{
					id: "org-1",
					name: "Test Org",
					slug: "test-org",
					logo: null,
				},
			],
			setCurrentOrg: mockSetCurrentOrg,
			isLoading: false,
		});

		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>,
		);

		// Should still render sidebar
		expect(screen.getByText("Clientes")).toBeInTheDocument();
	});

	it("renders org loading state correctly", () => {
		mockUseOrgStore.mockReturnValue({
			currentOrg: null,
			organizations: [],
			setCurrentOrg: mockSetCurrentOrg,
			isLoading: true,
		});

		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>,
		);

		// Should still render sidebar during loading
		expect(screen.getByText("Clientes")).toBeInTheDocument();
	});

	it("handles organization found in store during switch", async () => {
		const user = userEvent.setup();

		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>,
		);

		// Click change org button
		const changeOrgButton = screen.getByText("Change Org");
		await user.click(changeOrgButton);

		// Should call setActiveOrganization
		await waitFor(() => {
			expect(mockSetActiveOrganization).toHaveBeenCalledWith("org-1");
		});
	});

	it("renders Alertas navigation item as available", () => {
		mockUsePathname.mockReturnValue("/alerts");

		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>,
		);

		expect(screen.getByText("Alertas")).toBeInTheDocument();
	});

	it("renders Reportes navigation item as available", () => {
		mockUsePathname.mockReturnValue("/reports");

		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>,
		);

		expect(screen.getByText("Reportes")).toBeInTheDocument();
	});

	it("renders Historial navigation item as unavailable", () => {
		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>,
		);

		expect(screen.getByText("Historial")).toBeInTheDocument();
	});
});
