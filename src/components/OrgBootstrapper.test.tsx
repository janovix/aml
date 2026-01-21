import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { OrgBootstrapper } from "./OrgBootstrapper";
import {
	useOrgStore,
	type Organization,
	type OrganizationMember,
} from "@/lib/org-store";
import { act, renderHook } from "@testing-library/react";

// Mock next/navigation
vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
	}),
	usePathname: () => "/test-org/clients",
	useSearchParams: () => new URLSearchParams(),
	useParams: () => ({ orgSlug: "test-org" }),
}));

// Mock auth session
const mockSessionData = {
	user: {
		id: "user-1",
		name: "Test User",
		email: "test@example.com",
	},
};

vi.mock("@/lib/auth/useAuthSession", () => ({
	useAuthSession: () => ({
		data: mockSessionData,
		loading: false,
	}),
}));

// Mock organization API functions
const mockListOrganizations = vi.fn();
const mockListMembers = vi.fn();
const mockSetActiveOrganization = vi.fn();

vi.mock("@/lib/auth/organizations", () => ({
	listOrganizations: () => mockListOrganizations(),
	listMembers: (orgId: string) => mockListMembers(orgId),
	setActiveOrganization: (orgId: string) => mockSetActiveOrganization(orgId),
}));

// Mock tokenCache
const mockTokenCacheClear = vi.fn();
vi.mock("@/lib/auth/tokenCache", () => ({
	tokenCache: {
		clear: () => mockTokenCacheClear(),
		getToken: vi.fn().mockResolvedValue("mock-jwt-token"),
		isValid: vi.fn().mockReturnValue(false),
	},
}));

// Mock sonner toast
const mockToastError = vi.fn();
vi.mock("sonner", () => ({
	toast: Object.assign(vi.fn(), {
		error: (...args: unknown[]) => mockToastError(...args),
		success: vi.fn(),
		promise: vi.fn(),
	}),
}));

const mockOrganization: Organization = {
	id: "org-1",
	name: "Test Organization",
	slug: "test-org",
	status: "active",
};

const mockMember: OrganizationMember = {
	id: "member-1",
	userId: "user-1",
	organizationId: "org-1",
	role: "admin",
	permissions: ["clients:read", "clients:create"],
	status: "active",
};

// Helper to reset the store state
function resetOrgStore() {
	const { result } = renderHook(() => useOrgStore());
	act(() => {
		result.current.setCurrentOrg(null);
		result.current.setOrganizations([]);
		result.current.setMembers([]);
		result.current.setCurrentUserId(null);
		result.current.setLoading(false);
		result.current.setError(null);
	});
}

describe("OrgBootstrapper", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		resetOrgStore();
		mockListMembers.mockResolvedValue({ data: [], error: null });
		mockSetActiveOrganization.mockResolvedValue({
			data: { activeOrganizationId: "org-1" },
			error: null,
		});
	});

	it("shows loading skeleton initially", async () => {
		let resolveOrgs: (value: unknown) => void;
		const orgsPromise = new Promise((resolve) => {
			resolveOrgs = resolve;
		});
		mockListOrganizations.mockReturnValue(orgsPromise);

		render(
			<OrgBootstrapper>
				<div>Children Content</div>
			</OrgBootstrapper>,
		);

		// Loading state should show skeleton elements
		expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);

		// Resolve to finish test
		resolveOrgs!({
			data: {
				organizations: [mockOrganization],
				activeOrganizationId: mockOrganization.id,
			},
		});

		await waitFor(() => {
			expect(screen.getByText("Children Content")).toBeInTheDocument();
		});
	});

	it("renders children when organization is loaded from URL", async () => {
		mockListOrganizations.mockResolvedValue({
			data: {
				organizations: [mockOrganization],
				activeOrganizationId: mockOrganization.id,
			},
		});
		mockListMembers.mockResolvedValue({
			data: [mockMember],
		});

		render(
			<OrgBootstrapper>
				<div>Children Content</div>
			</OrgBootstrapper>,
		);

		await waitFor(() => {
			expect(screen.getByText("Children Content")).toBeInTheDocument();
		});
	});

	it("uses initial organizations data when provided", async () => {
		mockListMembers.mockResolvedValue({
			data: [mockMember],
		});

		render(
			<OrgBootstrapper
				initialOrganizations={{
					organizations: [mockOrganization],
					activeOrganizationId: mockOrganization.id,
				}}
			>
				<div>Children Content</div>
			</OrgBootstrapper>,
		);

		await waitFor(() => {
			expect(screen.getByText("Children Content")).toBeInTheDocument();
		});

		// Should not call listOrganizations when initial data is provided
		expect(mockListOrganizations).not.toHaveBeenCalled();
	});

	it("fetches members for the current organization", async () => {
		mockListOrganizations.mockResolvedValue({
			data: {
				organizations: [mockOrganization],
				activeOrganizationId: mockOrganization.id,
			},
		});
		mockListMembers.mockResolvedValue({
			data: [mockMember],
		});

		render(
			<OrgBootstrapper>
				<div>Children Content</div>
			</OrgBootstrapper>,
		);

		await waitFor(() => {
			expect(mockListMembers).toHaveBeenCalledWith(mockOrganization.id);
		});
	});

	it("syncs activeOrganizationId when visiting a different org", async () => {
		// URL org (matching URL slug "test-org")
		const urlOrg: Organization = {
			id: "org-url",
			name: "URL Org",
			slug: "test-org", // Matches URL slug from useParams mock
			status: "active",
		};

		// Different org that is currently "active" in the session
		const activeSessionOrg: Organization = {
			id: "org-session",
			name: "Session Org",
			slug: "session-org", // Different slug
			status: "active",
		};

		mockListOrganizations.mockResolvedValue({
			data: {
				organizations: [activeSessionOrg, urlOrg],
				activeOrganizationId: activeSessionOrg.id, // Session has different org active
			},
		});
		mockListMembers.mockResolvedValue({ data: [] });

		render(
			<OrgBootstrapper>
				<div>Children Content</div>
			</OrgBootstrapper>,
		);

		await waitFor(() => {
			expect(screen.getByText("Children Content")).toBeInTheDocument();
		});

		// Should sync active org to match URL org
		await waitFor(() => {
			expect(mockSetActiveOrganization).toHaveBeenCalledWith(urlOrg.id);
		});
	});

	it("clears token cache when syncing active organization", async () => {
		// URL org (matching URL slug)
		const urlOrg: Organization = {
			id: "org-url",
			name: "URL Org",
			slug: "test-org", // Matches URL slug from useParams mock
			status: "active",
		};

		// Different org that is currently "active" in the session
		const sessionOrg: Organization = {
			id: "org-session",
			name: "Session Org",
			slug: "session-org",
			status: "active",
		};

		mockListOrganizations.mockResolvedValue({
			data: {
				organizations: [sessionOrg, urlOrg],
				activeOrganizationId: sessionOrg.id, // Different from URL org
			},
		});
		mockListMembers.mockResolvedValue({ data: [] });

		render(
			<OrgBootstrapper>
				<div>Children Content</div>
			</OrgBootstrapper>,
		);

		// Token cache should be cleared when switching to URL org
		await waitFor(() => {
			expect(mockTokenCacheClear).toHaveBeenCalled();
		});
	});

	it("shows error toast when loading organizations fails", async () => {
		mockListOrganizations.mockResolvedValue({
			error: "Failed to load organizations",
			data: null,
		});

		render(
			<OrgBootstrapper>
				<div>Children Content</div>
			</OrgBootstrapper>,
		);

		await waitFor(() => {
			expect(mockToastError).toHaveBeenCalledWith(
				"Error loading organizations",
				expect.objectContaining({
					description: "Failed to load organizations",
				}),
			);
		});
	});

	it("shows error toast when loading members fails", async () => {
		mockListOrganizations.mockResolvedValue({
			data: {
				organizations: [mockOrganization],
				activeOrganizationId: mockOrganization.id,
			},
		});
		mockListMembers.mockResolvedValue({
			error: "Failed to load members",
			data: null,
		});

		render(
			<OrgBootstrapper>
				<div>Children Content</div>
			</OrgBootstrapper>,
		);

		await waitFor(() => {
			expect(mockToastError).toHaveBeenCalledWith(
				"Failed to load team members",
				expect.objectContaining({
					description: "Failed to load members",
				}),
			);
		});
	});

	it("sets current user ID from session", async () => {
		mockListOrganizations.mockResolvedValue({
			data: {
				organizations: [mockOrganization],
				activeOrganizationId: mockOrganization.id,
			},
		});
		mockListMembers.mockResolvedValue({ data: [] });

		render(
			<OrgBootstrapper>
				<div>Children Content</div>
			</OrgBootstrapper>,
		);

		await waitFor(() => {
			expect(screen.getByText("Children Content")).toBeInTheDocument();
		});

		const storeState = useOrgStore.getState();
		expect(storeState.currentUserId).toBe("user-1");
	});

	it("updates store with current organization", async () => {
		mockListOrganizations.mockResolvedValue({
			data: {
				organizations: [mockOrganization],
				activeOrganizationId: mockOrganization.id,
			},
		});
		mockListMembers.mockResolvedValue({ data: [mockMember] });

		render(
			<OrgBootstrapper>
				<div>Children Content</div>
			</OrgBootstrapper>,
		);

		await waitFor(() => {
			expect(screen.getByText("Children Content")).toBeInTheDocument();
		});

		const storeState = useOrgStore.getState();
		expect(storeState.currentOrg?.id).toBe(mockOrganization.id);
		expect(storeState.organizations).toHaveLength(1);
		expect(storeState.members).toHaveLength(1);
	});

	it("handles sync error gracefully and still renders children", async () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		mockListOrganizations.mockResolvedValue({
			data: {
				organizations: [mockOrganization],
				activeOrganizationId: "different-org-id",
			},
		});
		mockListMembers.mockResolvedValue({ data: [] });
		mockSetActiveOrganization.mockResolvedValue({
			data: null,
			error: "Sync failed",
		});

		render(
			<OrgBootstrapper>
				<div>Children Content</div>
			</OrgBootstrapper>,
		);

		await waitFor(() => {
			expect(screen.getByText("Children Content")).toBeInTheDocument();
		});

		expect(consoleSpy).toHaveBeenCalledWith(
			expect.stringContaining("[OrgBootstrapper] Failed to sync active org:"),
			expect.any(String),
		);

		consoleSpy.mockRestore();
	});

	it("logs warning when org from URL is not found", async () => {
		const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

		// Return orgs that don't include the URL org slug
		mockListOrganizations.mockResolvedValue({
			data: {
				organizations: [{ ...mockOrganization, slug: "other-org" }],
				activeOrganizationId: mockOrganization.id,
			},
		});

		render(
			<OrgBootstrapper>
				<div>Children Content</div>
			</OrgBootstrapper>,
		);

		await waitFor(() => {
			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining('Org "test-org" not found'),
			);
		});

		consoleSpy.mockRestore();
	});

	it("handles listOrganizations returning null data", async () => {
		mockListOrganizations.mockResolvedValue({
			data: null,
			error: null,
		});

		render(
			<OrgBootstrapper>
				<div>Children Content</div>
			</OrgBootstrapper>,
		);

		await waitFor(() => {
			expect(mockToastError).toHaveBeenCalledWith(
				"Error loading organizations",
				expect.anything(),
			);
		});
	});

	it("handles listOrganizations with error", async () => {
		mockListOrganizations.mockResolvedValue({
			data: null,
			error: "API Error",
		});

		render(
			<OrgBootstrapper>
				<div>Children Content</div>
			</OrgBootstrapper>,
		);

		await waitFor(() => {
			expect(mockToastError).toHaveBeenCalledWith(
				"Error loading organizations",
				expect.objectContaining({
					description: "API Error",
				}),
			);
		});
	});

	it("fetches members when members data is null", async () => {
		mockListOrganizations.mockResolvedValue({
			data: {
				organizations: [mockOrganization],
				activeOrganizationId: mockOrganization.id,
			},
		});
		mockListMembers.mockResolvedValue({
			data: null,
			error: null,
		});

		render(
			<OrgBootstrapper>
				<div>Children Content</div>
			</OrgBootstrapper>,
		);

		await waitFor(() => {
			expect(screen.getByText("Children Content")).toBeInTheDocument();
		});

		expect(mockListMembers).toHaveBeenCalled();
	});

	it("handles initial organizations matching current org", async () => {
		mockListMembers.mockResolvedValue({
			data: [mockMember],
		});

		render(
			<OrgBootstrapper
				initialOrganizations={{
					organizations: [mockOrganization],
					activeOrganizationId: mockOrganization.id, // Matches the URL org
				}}
			>
				<div>Children Content</div>
			</OrgBootstrapper>,
		);

		await waitFor(() => {
			expect(screen.getByText("Children Content")).toBeInTheDocument();
		});

		// Should always call setActiveOrganization to ensure session is synced
		// This is critical on initial load/redirect to ensure JWT has org ID
		expect(mockSetActiveOrganization).toHaveBeenCalledWith(mockOrganization.id);
	});

	it("skips sync when already synced to same org", async () => {
		mockListOrganizations.mockResolvedValue({
			data: {
				organizations: [mockOrganization],
				activeOrganizationId: mockOrganization.id,
			},
		});
		mockListMembers.mockResolvedValue({
			data: [mockMember],
		});

		const { rerender } = render(
			<OrgBootstrapper>
				<div>Children Content</div>
			</OrgBootstrapper>,
		);

		await waitFor(() => {
			expect(screen.getByText("Children Content")).toBeInTheDocument();
		});

		const initialCallCount = mockListOrganizations.mock.calls.length;

		// Rerender with same props
		rerender(
			<OrgBootstrapper>
				<div>Updated Children</div>
			</OrgBootstrapper>,
		);

		// Should not call listOrganizations again
		await waitFor(() => {
			expect(screen.getByText("Updated Children")).toBeInTheDocument();
		});

		expect(mockListOrganizations.mock.calls.length).toBe(initialCallCount);
	});
});
