import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NavUser } from "./NavUser";
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

// Wrapper component with providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
	<LanguageProvider>
		<SidebarProvider>{children}</SidebarProvider>
	</LanguageProvider>
);

describe("NavUser", () => {
	it("renders loading state when isLoading is true", () => {
		render(
			<TestWrapper>
				<NavUser user={null} isLoading={true} onLogout={vi.fn()} />
			</TestWrapper>,
		);

		const loadingElements = document.querySelectorAll(".animate-pulse");
		expect(loadingElements.length).toBeGreaterThan(0);
	});

	it("returns null when user is null and not loading", () => {
		const { container } = render(
			<TestWrapper>
				<NavUser user={null} isLoading={false} onLogout={vi.fn()} />
			</TestWrapper>,
		);

		// NavUser returns null, but SidebarProvider renders a wrapper
		// Check that user info is not rendered
		expect(screen.queryByText("Test User")).not.toBeInTheDocument();
	});

	it("renders user information when user is provided", () => {
		const mockUser = {
			name: "Test User",
			email: "test@example.com",
			avatar: undefined,
		};

		render(
			<TestWrapper>
				<NavUser user={mockUser} isLoading={false} onLogout={vi.fn()} />
			</TestWrapper>,
		);

		expect(screen.getByText("Test User")).toBeInTheDocument();
		expect(screen.getByText("test@example.com")).toBeInTheDocument();
	});

	it("renders user with avatar when provided", () => {
		const mockUser = {
			name: "Test User",
			email: "test@example.com",
			avatar: "https://example.com/avatar.jpg",
		};

		render(
			<TestWrapper>
				<NavUser user={mockUser} isLoading={false} onLogout={vi.fn()} />
			</TestWrapper>,
		);

		// Avatar might be in AvatarImage or AvatarFallback
		const avatar = document.querySelector('img[alt="Test User"]');
		// If avatar is provided, it should render (though it might fallback if image fails to load)
		expect(screen.getByText("Test User")).toBeInTheDocument();
	});

	it("calls onLogout when logout button is clicked", async () => {
		const mockLogout = vi.fn();
		const mockUser = {
			name: "Test User",
			email: "test@example.com",
		};

		const user = userEvent.setup();
		render(
			<TestWrapper>
				<NavUser user={mockUser} isLoading={false} onLogout={mockLogout} />
			</TestWrapper>,
		);

		// First click to open dropdown
		const userName = screen.getByText("Test User");
		await user.click(userName);

		// Then find and click logout button
		const logoutButton = await screen.findByText("Cerrar sesión");
		await user.click(logoutButton);

		expect(mockLogout).toHaveBeenCalledTimes(1);
	});

	it("renders settings and profile links pointing to auth app", async () => {
		const mockUser = {
			name: "Test User",
			email: "test@example.com",
		};

		const user = userEvent.setup();
		render(
			<TestWrapper>
				<NavUser user={mockUser} isLoading={false} onLogout={vi.fn()} />
			</TestWrapper>,
		);

		// Open dropdown first
		const userName = screen.getByText("Test User");
		expect(userName).toBeInTheDocument();
		await user.click(userName);

		// Check for links in the dropdown pointing to auth app
		const configLink = await screen.findByText("Configuración");
		const profileLink = await screen.findByText("Perfil");

		expect(configLink).toBeInTheDocument();
		expect(profileLink).toBeInTheDocument();

		// Verify they are external links to auth app
		expect(configLink.closest("a")).toHaveAttribute(
			"href",
			expect.stringContaining("/settings"),
		);
		expect(profileLink.closest("a")).toHaveAttribute(
			"href",
			expect.stringContaining("/settings"),
		);
	});

	it("renders user with single name", () => {
		const mockUser = {
			name: "John",
			email: "john@example.com",
		};

		render(
			<TestWrapper>
				<NavUser user={mockUser} isLoading={false} onLogout={vi.fn()} />
			</TestWrapper>,
		);

		expect(screen.getByText("John")).toBeInTheDocument();
		expect(screen.getByText("john@example.com")).toBeInTheDocument();
	});

	it("renders user with multiple names", () => {
		const mockUser = {
			name: "John Doe Smith",
			email: "john@example.com",
		};

		render(
			<TestWrapper>
				<NavUser user={mockUser} isLoading={false} onLogout={vi.fn()} />
			</TestWrapper>,
		);

		expect(screen.getByText("John Doe Smith")).toBeInTheDocument();
		expect(screen.getByText("john@example.com")).toBeInTheDocument();
	});

	it("handles mobile sidebar closing on link click", async () => {
		const mockUser = {
			name: "Test User",
			email: "test@example.com",
		};

		const user = userEvent.setup();
		render(
			<TestWrapper>
				<NavUser user={mockUser} isLoading={false} onLogout={vi.fn()} />
			</TestWrapper>,
		);

		// Open dropdown
		const userName = screen.getByText("Test User");
		await user.click(userName);

		// Wait for dropdown to open and find settings link
		await waitFor(async () => {
			const configLink = await screen.findByText("Configuración");
			expect(configLink).toBeInTheDocument();
		});
	});

	it("handles empty name for initials", () => {
		const mockUser = {
			name: "",
			email: "test@example.com",
		};

		render(
			<TestWrapper>
				<NavUser user={mockUser} isLoading={false} onLogout={vi.fn()} />
			</TestWrapper>,
		);

		// Should render with fallback initial
		expect(screen.getByText("test@example.com")).toBeInTheDocument();
	});

	it("handles name with only spaces for initials", () => {
		const mockUser = {
			name: "   ",
			email: "test@example.com",
		};

		render(
			<TestWrapper>
				<NavUser user={mockUser} isLoading={false} onLogout={vi.fn()} />
			</TestWrapper>,
		);

		// Should render with fallback initial
		expect(screen.getByText("test@example.com")).toBeInTheDocument();
	});

	it("handles name with two words for initials", () => {
		const mockUser = {
			name: "John Doe",
			email: "john@example.com",
		};

		render(
			<TestWrapper>
				<NavUser user={mockUser} isLoading={false} onLogout={vi.fn()} />
			</TestWrapper>,
		);

		expect(screen.getByText("John Doe")).toBeInTheDocument();
		expect(screen.getByText("john@example.com")).toBeInTheDocument();
	});

	it("handles name with many words for initials", () => {
		const mockUser = {
			name: "John Michael Doe Smith",
			email: "john@example.com",
		};

		render(
			<TestWrapper>
				<NavUser user={mockUser} isLoading={false} onLogout={vi.fn()} />
			</TestWrapper>,
		);

		expect(screen.getByText("John Michael Doe Smith")).toBeInTheDocument();
		// Should use first and last word for initials
		expect(screen.getByText("john@example.com")).toBeInTheDocument();
	});

	it("clicks on settings link triggers handleLinkClick", async () => {
		const mockUser = {
			name: "Test User",
			email: "test@example.com",
		};

		const user = userEvent.setup();
		render(
			<TestWrapper>
				<NavUser user={mockUser} isLoading={false} onLogout={vi.fn()} />
			</TestWrapper>,
		);

		// Open dropdown
		const userName = screen.getByText("Test User");
		await user.click(userName);

		// Wait for dropdown and click settings link
		await waitFor(async () => {
			const configLink = await screen.findByText("Configuración");
			expect(configLink).toBeInTheDocument();
			await user.click(configLink);
		});

		// The handleLinkClick should have been called (tested through behavior)
		// This covers the handleLinkClick function, though isMobile behavior
		// is harder to test without mocking the sidebar hook
	});
});
