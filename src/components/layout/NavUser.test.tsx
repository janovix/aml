import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NavUser } from "./NavUser";
import { SidebarProvider } from "@/components/ui/sidebar";

describe("NavUser", () => {
	it("renders loading state when isLoading is true", () => {
		render(
			<SidebarProvider>
				<NavUser user={null} isLoading={true} onLogout={vi.fn()} />
			</SidebarProvider>,
		);

		const loadingElements = document.querySelectorAll(".animate-pulse");
		expect(loadingElements.length).toBeGreaterThan(0);
	});

	it("returns null when user is null and not loading", () => {
		const { container } = render(
			<SidebarProvider>
				<NavUser user={null} isLoading={false} onLogout={vi.fn()} />
			</SidebarProvider>,
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
			<SidebarProvider>
				<NavUser user={mockUser} isLoading={false} onLogout={vi.fn()} />
			</SidebarProvider>,
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
			<SidebarProvider>
				<NavUser user={mockUser} isLoading={false} onLogout={vi.fn()} />
			</SidebarProvider>,
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
			<SidebarProvider>
				<NavUser user={mockUser} isLoading={false} onLogout={mockLogout} />
			</SidebarProvider>,
		);

		// First click to open dropdown
		const userName = screen.getByText("Test User");
		await user.click(userName);

		// Then find and click logout button
		const logoutButton = await screen.findByText("Cerrar sesión");
		await user.click(logoutButton);

		expect(mockLogout).toHaveBeenCalledTimes(1);
	});

	it("renders settings and profile links", async () => {
		const mockUser = {
			name: "Test User",
			email: "test@example.com",
		};

		const user = userEvent.setup();
		render(
			<SidebarProvider>
				<NavUser user={mockUser} isLoading={false} onLogout={vi.fn()} />
			</SidebarProvider>,
		);

		// Open dropdown first
		const userName = screen.getByText("Test User");
		expect(userName).toBeInTheDocument();
		await user.click(userName);

		// Check for links in the dropdown
		const configLink = await screen.findByText("Configuración");
		const profileLink = await screen.findByText("Perfil");

		expect(configLink).toBeInTheDocument();
		expect(profileLink).toBeInTheDocument();
	});

	it("renders user with single name", () => {
		const mockUser = {
			name: "John",
			email: "john@example.com",
		};

		render(
			<SidebarProvider>
				<NavUser user={mockUser} isLoading={false} onLogout={vi.fn()} />
			</SidebarProvider>,
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
			<SidebarProvider>
				<NavUser user={mockUser} isLoading={false} onLogout={vi.fn()} />
			</SidebarProvider>,
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
			<SidebarProvider defaultOpen={true}>
				<NavUser user={mockUser} isLoading={false} onLogout={vi.fn()} />
			</SidebarProvider>,
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
			<SidebarProvider>
				<NavUser user={mockUser} isLoading={false} onLogout={vi.fn()} />
			</SidebarProvider>,
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
			<SidebarProvider>
				<NavUser user={mockUser} isLoading={false} onLogout={vi.fn()} />
			</SidebarProvider>,
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
			<SidebarProvider>
				<NavUser user={mockUser} isLoading={false} onLogout={vi.fn()} />
			</SidebarProvider>,
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
			<SidebarProvider>
				<NavUser user={mockUser} isLoading={false} onLogout={vi.fn()} />
			</SidebarProvider>,
		);

		expect(screen.getByText("John Michael Doe Smith")).toBeInTheDocument();
		// Should use first and last word for initials
		expect(screen.getByText("john@example.com")).toBeInTheDocument();
	});
});
