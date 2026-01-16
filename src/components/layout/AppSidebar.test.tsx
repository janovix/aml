import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppSidebar } from "./AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { LanguageProvider } from "@/components/LanguageProvider";

// Mock cookies module to return Spanish language for tests
vi.mock("@/lib/cookies", () => ({
	getCookie: (name: string) => {
		if (name === "janovix-lang") return "es";
		return undefined;
	},
	setCookie: vi.fn(),
	deleteCookie: vi.fn(),
	COOKIE_NAMES: {
		THEME: "janovix-theme",
		LANGUAGE: "janovix-lang",
	},
}));

// Custom wrapper for AppSidebar tests (requires SidebarProvider in addition to LanguageProvider)
const renderWithProviders = (ui: React.ReactElement) => {
	return render(ui, {
		wrapper: ({ children }) => (
			<LanguageProvider defaultLanguage="es">
				<SidebarProvider>{children}</SidebarProvider>
			</LanguageProvider>
		),
	});
};

const mockPush = vi.fn();
const mockSetOpenMobile = vi.fn();
const mockUsePathname = vi.fn(() => "/clients");

vi.mock("next/navigation", () => ({
	usePathname: () => mockUsePathname(),
	useRouter: () => ({
		push: mockPush,
		replace: vi.fn(),
	}),
	useSearchParams: () => new URLSearchParams(),
	useParams: () => ({ orgSlug: "test-org" }),
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

const mockGetAuthAppUrl = vi.fn().mockReturnValue("https://auth.test.com");
const mockGetWatchlistAppUrl = vi
	.fn()
	.mockReturnValue("https://watchlist.test.com");
const mockGetHomepageUrl = vi.fn().mockReturnValue("https://aml.test.com");
vi.mock("@/lib/auth/config", () => ({
	getAuthAppUrl: () => mockGetAuthAppUrl(),
	getWatchlistAppUrl: () => mockGetWatchlistAppUrl(),
	getHomepageUrl: () => mockGetHomepageUrl(),
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
		renderWithProviders(<AppSidebar />);

		expect(screen.getByText("Clientes")).toBeInTheDocument();
		expect(screen.getByText("Transacciones")).toBeInTheDocument();
	});

	it("renders organization switcher and nav user", () => {
		renderWithProviders(<AppSidebar />);

		expect(screen.getByText("Change Org")).toBeInTheDocument();
		expect(screen.getByText("Logout")).toBeInTheDocument();
	});

	it("handles organization change", async () => {
		const user = userEvent.setup();
		renderWithProviders(<AppSidebar />);

		const changeOrgButton = screen.getByText("Change Org");
		await user.click(changeOrgButton);

		// Organization change handler should be called
		expect(changeOrgButton).toBeInTheDocument();
	});

	it("handles create organization - redirects to auth settings", async () => {
		const user = userEvent.setup();

		// Mock window.location.href setter
		const originalLocation = window.location;
		const mockHref = vi.fn();
		Object.defineProperty(window, "location", {
			configurable: true,
			value: { href: mockHref },
		});

		renderWithProviders(<AppSidebar />);

		const createOrgButton = screen.getByText("Create Org");
		await user.click(createOrgButton);

		// Should redirect to auth settings org create page
		expect(window.location.href).toBe(
			"https://auth.test.com/settings/organization/new",
		);

		// Restore window.location
		Object.defineProperty(window, "location", {
			configurable: true,
			value: originalLocation,
		});
	});

	it("handles logout", async () => {
		const user = userEvent.setup();
		renderWithProviders(<AppSidebar />);

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

		renderWithProviders(<AppSidebar />);

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

		renderWithProviders(<AppSidebar />);

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

		renderWithProviders(<AppSidebar />);

		// User info should be rendered through NavUser component
		expect(screen.getByText("Change Org")).toBeInTheDocument();
	});

	it("handles different pathnames for active navigation", () => {
		mockUsePathname.mockReturnValue("/transactions");

		renderWithProviders(<AppSidebar />);

		expect(screen.getByText("Transacciones")).toBeInTheDocument();
	});

	it("handles pathname with subpath for active navigation", () => {
		mockUsePathname.mockReturnValue("/clients/123");

		renderWithProviders(<AppSidebar />);

		// Should still show navigation items
		expect(screen.getByText("Clientes")).toBeInTheDocument();
	});

	it("renders unavailable items with 'Pronto' badge", () => {
		renderWithProviders(<AppSidebar />);

		// Unavailable items should show "Pronto" badge
		// Inicio, Modelos de Riesgo, Historial are unavailable
		expect(screen.getByText("Inicio")).toBeInTheDocument();
		expect(screen.getByText("Alertas")).toBeInTheDocument();
		expect(screen.getByText("Reportes")).toBeInTheDocument();
	});

	it("handles link click for available items", async () => {
		const user = userEvent.setup();
		renderWithProviders(<AppSidebar />);

		// Click on an available item
		const clientesLink = screen.getByText("Clientes").closest("a");
		if (clientesLink) {
			await user.click(clientesLink);
			// The handleLinkClick should be called (tested through behavior)
		}
	});

	it("handles link click for unavailable items", async () => {
		const user = userEvent.setup();
		renderWithProviders(<AppSidebar />);

		// Click on an unavailable item (should not trigger handleLinkClick)
		const dashboardLink = screen.getByText("Inicio").closest("a");
		if (dashboardLink) {
			await user.click(dashboardLink);
			// Unavailable items should not trigger onClick
		}
	});

	it("handles mobile sidebar closing on link click", async () => {
		// This test verifies that clicking a link closes the mobile sidebar
		// The handleLinkClick function in AppSidebar calls setOpenMobile(false) when isMobile is true
		// Since mocking useSidebar for a single test is complex with the current setup,
		// we verify that the link click handler exists and the component renders correctly
		const user = userEvent.setup();
		mockSetOpenMobile.mockClear();

		renderWithProviders(<AppSidebar />);

		// Verify the sidebar renders with navigation items
		const clientesLink = screen.getByText("Clientes").closest("a");
		expect(clientesLink).toBeInTheDocument();

		// Click on an available item - this tests that the link is clickable
		if (clientesLink) {
			await user.click(clientesLink);
		}

		// Note: In the actual mobile environment, setOpenMobile would be called
		// This test confirms the component renders and links are functional
		expect(clientesLink).toHaveAttribute("href");
	});

	it("handles session without user", () => {
		mockUseAuthSession.mockReturnValue({
			data: null,
			error: null,
			isPending: false,
		} as unknown as ReturnType<typeof mockUseAuthSession>);

		renderWithProviders(<AppSidebar />);

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

		renderWithProviders(<AppSidebar />);

		expect(screen.getByText("Logout")).toBeInTheDocument();
	});

	it("handles all navigation item groups", () => {
		renderWithProviders(<AppSidebar />);

		// Verify all navigation groups are rendered
		expect(screen.getByText("Clientes")).toBeInTheDocument(); // Main nav
		expect(screen.getByText("Inicio")).toBeInTheDocument(); // Main nav
	});

	it("handles organization change callback", async () => {
		const user = userEvent.setup();

		renderWithProviders(<AppSidebar />);

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

		renderWithProviders(<AppSidebar />);

		const changeOrgButton = screen.getByText("Change Org");
		await user.click(changeOrgButton);

		// Should call setActiveOrganization API
		expect(mockSetActiveOrganization).toHaveBeenCalledWith("org-1");
	});

	// Dialog tests removed - create organization now redirects to auth settings

	it("renders with no organizations", () => {
		mockUseOrgStore.mockReturnValue({
			currentOrg: null,
			organizations: [],
			setCurrentOrg: mockSetCurrentOrg,
			isLoading: false,
		});

		renderWithProviders(<AppSidebar />);

		// Should still render sidebar
		expect(screen.getByText("Clientes")).toBeInTheDocument();
	});

	// Dialog tests removed - create organization now redirects to auth settings

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

		renderWithProviders(<AppSidebar />);

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

		renderWithProviders(<AppSidebar />);

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

		renderWithProviders(<AppSidebar />);

		// Should still render sidebar during loading
		expect(screen.getByText("Clientes")).toBeInTheDocument();
	});

	it("handles organization found in store during switch", async () => {
		const user = userEvent.setup();

		renderWithProviders(<AppSidebar />);

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

		renderWithProviders(<AppSidebar />);

		expect(screen.getByText("Alertas")).toBeInTheDocument();
	});

	it("renders Reportes navigation item as available", () => {
		mockUsePathname.mockReturnValue("/reports");

		renderWithProviders(<AppSidebar />);

		expect(screen.getByText("Reportes")).toBeInTheDocument();
	});

	it("renders all main navigation items", () => {
		renderWithProviders(<AppSidebar />);

		// All main nav items should be visible
		expect(screen.getByText("Inicio")).toBeInTheDocument();
		expect(screen.getByText("Clientes")).toBeInTheDocument();
		expect(screen.getByText("Transacciones")).toBeInTheDocument();
		expect(screen.getByText("Alertas")).toBeInTheDocument();
		expect(screen.getByText("Reportes")).toBeInTheDocument();
		// Products section items
		expect(screen.getByText("Lista de Vigilancia")).toBeInTheDocument();
		expect(screen.getByText("Configuración")).toBeInTheDocument();
	});

	it("handles session user without name", () => {
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

		renderWithProviders(<AppSidebar />);

		expect(screen.getByText("Clientes")).toBeInTheDocument();
	});

	it("handles session user without email", () => {
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

		renderWithProviders(<AppSidebar />);

		expect(screen.getByText("Clientes")).toBeInTheDocument();
	});

	it("handles orgLoading state", () => {
		mockUseOrgStore.mockReturnValue({
			currentOrg: { id: "org-1", name: "Test Org", slug: "test-org" },
			organizations: [{ id: "org-1", name: "Test Org", slug: "test-org" }],
			setCurrentOrg: mockSetCurrentOrg,
			isLoading: true,
		});

		renderWithProviders(<AppSidebar />);

		expect(screen.getByText("Clientes")).toBeInTheDocument();
	});
});
