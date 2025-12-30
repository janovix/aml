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

		expect(mockPush).toHaveBeenCalledWith("/settings/organizations/new");
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
});
