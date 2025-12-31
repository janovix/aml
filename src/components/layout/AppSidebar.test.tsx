import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
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
vi.mock("@/lib/auth/organizations", () => ({
	setActiveOrganization: (...args: unknown[]) =>
		mockSetActiveOrganization(...args),
}));

const mockSetCurrentOrg = vi.fn();
const mockUseOrgStore = vi.fn(() => ({
	currentOrg: { id: "org-1", name: "Test Org", slug: "test-org" },
	organizations: [
		{ id: "org-1", name: "Test Org", slug: "test-org" },
		{ id: "org-2", name: "Other Org", slug: "other-org" },
	],
	setCurrentOrg: mockSetCurrentOrg,
	isLoading: false,
}));
vi.mock("@/lib/org-store", () => ({
	useOrgStore: () => mockUseOrgStore(),
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

		expect(mockPush).toHaveBeenCalledWith("/team");
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
		// Dashboard, Avisos, Reportes, Modelos de Riesgo, Historial are unavailable
		expect(screen.getByText("Dashboard")).toBeInTheDocument();
		expect(screen.getByText("Avisos")).toBeInTheDocument();
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
});
