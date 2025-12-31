import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DashboardLayout } from "./DashboardLayout";

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

vi.mock("@/components/ThemeSwitcher", () => ({
	ThemeSwitcher: () => <div data-testid="theme-switcher">Theme Switcher</div>,
}));

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

describe("DashboardLayout", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders children", () => {
		render(
			<DashboardLayout>
				<div>Test Content</div>
			</DashboardLayout>,
		);

		expect(screen.getByText("Test Content")).toBeInTheDocument();
	});

	it("renders sidebar with navigation items", () => {
		render(
			<DashboardLayout>
				<div>Test</div>
			</DashboardLayout>,
		);

		// Check for main navigation items
		const clientesLink = screen.getByRole("link", { name: /clientes/i });
		expect(clientesLink).toBeInTheDocument();
	});

	it("renders sidebar trigger button", () => {
		render(
			<DashboardLayout>
				<div>Test</div>
			</DashboardLayout>,
		);

		// Check for sidebar trigger by data attribute
		const triggerButton = document.querySelector('[data-sidebar="trigger"]');
		expect(triggerButton).toBeInTheDocument();
	});

	it("renders theme switcher in header", () => {
		render(
			<DashboardLayout>
				<div>Test</div>
			</DashboardLayout>,
		);

		expect(screen.getByTestId("theme-switcher")).toBeInTheDocument();
	});

	it("renders avatar dropdown", () => {
		render(
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
		render(
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
		render(
			<DashboardLayout>
				<div>Test</div>
			</DashboardLayout>,
		);

		const clientesLink = screen.getByRole("link", { name: /clientes/i });
		expect(clientesLink).toHaveAttribute("data-active", "true");
	});

	it("renders sidebar logo", () => {
		render(
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
});
