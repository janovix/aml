import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DashboardLayout } from "./DashboardLayout";
import { renderWithProviders } from "@/lib/testHelpers";

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

const mockPathname = vi.fn(() => "/clients");
const mockPush = vi.fn();
const mockRouter = {
	push: mockPush,
	replace: vi.fn(),
	prefetch: vi.fn(),
	back: vi.fn(),
	forward: vi.fn(),
	refresh: vi.fn(),
};

vi.mock("next/navigation", () => ({
	usePathname: () => mockPathname(),
	useRouter: () => mockRouter,
	useSearchParams: () => new URLSearchParams(),
	useParams: () => ({ orgSlug: "test-org" }),
}));

vi.mock("next-themes", () => ({
	useTheme: () => ({
		resolvedTheme: "light",
		setTheme: vi.fn(),
	}),
}));

vi.mock("@janovix/blocks", async () => {
	const actual = await vi.importActual("@janovix/blocks");
	return {
		...actual,
		ThemeSwitcher: () => <div data-testid="theme-switcher">Theme Switcher</div>,
		LanguageSwitcher: () => (
			<div data-testid="language-switcher">Language Switcher</div>
		),
	};
});

vi.mock("@/lib/auth/useAuthSession", () => ({
	useAuthSession: () => ({
		data: {
			user: {
				id: "1",
				name: "Test User",
				email: "test@example.com",
				image: null,
			},
		},
		error: null,
		isPending: false,
	}),
}));

vi.mock("@/lib/auth/actions", () => ({
	logout: vi.fn(),
}));

// Mock settings client to prevent async window access in tests
vi.mock("@/lib/settings/settingsClient", () => ({
	setSidebarCollapsed: vi.fn().mockResolvedValue(undefined),
	getResolvedSettings: vi.fn().mockResolvedValue({
		timezone: "America/New_York",
		clockFormat: "12h",
	}),
}));

describe("DashboardLayout", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Mock window.addEventListener to prevent unhandled rejections
		if (typeof window !== "undefined") {
			window.addEventListener = vi.fn();
			window.removeEventListener = vi.fn();
		}
	});

	it("renders children", () => {
		renderWithProviders(
			<DashboardLayout>
				<div>Test Content</div>
			</DashboardLayout>,
		);

		expect(screen.getByText("Test Content")).toBeInTheDocument();
	});

	it("renders sidebar with navigation items", () => {
		renderWithProviders(
			<DashboardLayout>
				<div>Test</div>
			</DashboardLayout>,
		);

		// Check for main navigation items (may appear in both sidebar and breadcrumb)
		const clientesLinks = screen.getAllByRole("link", { name: /clientes/i });
		expect(clientesLinks.length).toBeGreaterThan(0);
	});

	it("renders sidebar trigger button", () => {
		renderWithProviders(
			<DashboardLayout>
				<div>Test</div>
			</DashboardLayout>,
		);

		// Check for sidebar trigger by data attribute
		const triggerButton = document.querySelector('[data-sidebar="trigger"]');
		expect(triggerButton).toBeInTheDocument();
	});

	it("renders theme switcher in header", () => {
		renderWithProviders(
			<DashboardLayout>
				<div>Test</div>
			</DashboardLayout>,
		);

		const themeSwitchers = screen.getAllByTestId("theme-switcher");
		expect(themeSwitchers.length).toBeGreaterThan(0);
	});

	it("renders avatar dropdown", () => {
		renderWithProviders(
			<DashboardLayout>
				<div>Test</div>
			</DashboardLayout>,
		);

		// Avatar button is in the sidebar footer, find by checking for user name or email
		const userName = screen.getByText("Test User");
		expect(userName).toBeInTheDocument();
	});

	it("opens avatar dropdown menu when clicked", async () => {
		const user = userEvent.setup();
		renderWithProviders(
			<DashboardLayout>
				<div>Test</div>
			</DashboardLayout>,
		);

		// Find the dropdown trigger button by user name
		const userName = screen.getByText("Test User");
		expect(userName).toBeInTheDocument();

		// Click on the user name to open dropdown
		await user.click(userName);

		// Wait for dropdown menu content to appear
		// The dropdown content should be rendered (Radix UI renders it in a portal)
		// Check if dropdown is open by looking for the menu items
		// There might be multiple "Configuración" texts (sidebar and dropdown)
		const configTexts = await screen.findAllByText("Configuración", undefined, {
			timeout: 2000,
		});
		expect(configTexts.length).toBeGreaterThan(0);
		expect(
			await screen.findByText("Cerrar sesión", undefined, { timeout: 2000 }),
		).toBeInTheDocument();
	});

	it("highlights active navigation item", () => {
		mockPathname.mockReturnValue("/test-org/clients");
		renderWithProviders(
			<DashboardLayout>
				<div>Test</div>
			</DashboardLayout>,
		);

		// Find the sidebar link (the one with data-active attribute)
		const clientesLinks = screen.getAllByRole("link", { name: /clientes/i });
		const sidebarLink = clientesLinks.find(
			(link) => link.getAttribute("data-active") !== null,
		);
		expect(sidebarLink).toHaveAttribute("data-active", "true");
	});

	it("renders sidebar logo", () => {
		renderWithProviders(
			<DashboardLayout>
				<div>Test</div>
			</DashboardLayout>,
		);

		// Check for Logo SVG element (should be in sidebar header)
		// When sidebar is open (defaultOpen={true}), OrganizationSwitcher shows "Crear organización"
		// When collapsed, it shows the icon variant. Check for either the logo or the organization switcher
		const logoSvg = document.querySelector('svg[viewBox="0 0 102 16"]');
		const logoIcon = document.querySelector('svg[viewBox="0 0 200 200"]');
		const orgSwitcher = screen.queryByText("Crear organización");

		// Logo should be present either as full logo, icon, or organization switcher should be visible
		expect(logoSvg || logoIcon || orgSwitcher).toBeTruthy();
	});

	it("renders footer with Janovix logo at the bottom", () => {
		renderWithProviders(
			<DashboardLayout>
				<div>Test</div>
			</DashboardLayout>,
		);

		// Check for the footer element
		const footer = document.querySelector("footer");
		expect(footer).toBeInTheDocument();

		// Check that the footer contains the Janovix text logo (viewBox 0 0 102 16)
		const footerLogo = footer?.querySelector('svg[viewBox="0 0 102 16"]');
		expect(footerLogo).toBeInTheDocument();
	});
});
