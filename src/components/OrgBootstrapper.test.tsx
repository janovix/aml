import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrgBootstrapper } from "./OrgBootstrapper";
import {
	useOrgStore,
	type Organization,
	type OrganizationMember,
} from "@/lib/org-store";
import { act, renderHook } from "@testing-library/react";

// Mock zustand persist middleware
vi.mock("zustand/middleware", async (importOriginal) => {
	const actual = (await importOriginal()) as Record<string, unknown>;
	return {
		...actual,
		persist: (fn: unknown) => fn,
	};
});

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
const mockCreateOrganization = vi.fn();
const mockSetActiveOrganization = vi.fn();

vi.mock("@/lib/auth/organizations", () => ({
	listOrganizations: () => mockListOrganizations(),
	listMembers: (orgId: string) => mockListMembers(orgId),
	createOrganization: (data: { name: string; slug: string }) =>
		mockCreateOrganization(data),
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
const mockToastSuccess = vi.fn();
const mockToastPromise = vi.fn();
vi.mock("sonner", () => ({
	toast: Object.assign(vi.fn(), {
		error: (...args: unknown[]) => mockToastError(...args),
		success: (...args: unknown[]) => mockToastSuccess(...args),
		promise: (...args: unknown[]) => mockToastPromise(...args),
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
		// Default mock implementations
		mockListMembers.mockResolvedValue({ data: [], error: null });
		// setActiveOrganization succeeds by default
		mockSetActiveOrganization.mockResolvedValue({
			data: { activeOrganizationId: "org-1" },
			error: null,
		});
	});

	it("shows loading state initially", async () => {
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

		// Loading state should show the app skeleton (skeleton elements are rendered)
		// The AppSkeleton renders multiple skeleton elements with data-testid="skeleton"
		expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);

		// Resolve to avoid hanging test
		resolveOrgs!({
			data: {
				organizations: [mockOrganization],
				activeOrganizationId: mockOrganization.id,
			},
		});

		// After resolving, children should be shown
		await waitFor(() => {
			expect(screen.getByText("Children Content")).toBeInTheDocument();
		});
	});

	it("renders children when organization is loaded", async () => {
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

	it("shows create organization form when no organizations exist", async () => {
		mockListOrganizations.mockResolvedValue({
			data: {
				organizations: [],
				activeOrganizationId: null,
			},
		});

		render(
			<OrgBootstrapper>
				<div>Children Content</div>
			</OrgBootstrapper>,
		);

		await waitFor(() => {
			expect(
				screen.getByText("Create your first organization"),
			).toBeInTheDocument();
		});

		expect(screen.getByLabelText("Name")).toBeInTheDocument();
		expect(screen.getByLabelText("Slug (URL identifier)")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Create organization" }),
		).toBeInTheDocument();
	});

	it("shows error message when loading organizations fails", async () => {
		mockListOrganizations.mockResolvedValue({
			error: "Failed to load organizations",
			data: null,
		});

		render(
			<OrgBootstrapper>
				<div>Children Content</div>
			</OrgBootstrapper>,
		);

		// Wait for the error toast to be shown via Sonner
		await waitFor(() => {
			expect(mockToastError).toHaveBeenCalledWith(
				"Error loading organizations",
				expect.objectContaining({
					description: "Failed to load organizations",
				}),
			);
		});
	});

	it("updates slug preview as user types name", async () => {
		const user = userEvent.setup();

		mockListOrganizations.mockResolvedValue({
			data: {
				organizations: [],
				activeOrganizationId: null,
			},
		});

		render(
			<OrgBootstrapper>
				<div>Children Content</div>
			</OrgBootstrapper>,
		);

		await waitFor(() => {
			expect(
				screen.getByText("Create your first organization"),
			).toBeInTheDocument();
		});

		const nameInput = screen.getByLabelText("Name");
		await user.type(nameInput, "My Test Organization");

		await waitFor(() => {
			expect(screen.getByText("my-test-organization")).toBeInTheDocument();
		});
	});

	it("allows custom slug input", async () => {
		const user = userEvent.setup();

		mockListOrganizations.mockResolvedValue({
			data: {
				organizations: [],
				activeOrganizationId: null,
			},
		});

		render(
			<OrgBootstrapper>
				<div>Children Content</div>
			</OrgBootstrapper>,
		);

		await waitFor(() => {
			expect(
				screen.getByText("Create your first organization"),
			).toBeInTheDocument();
		});

		const slugInput = screen.getByLabelText("Slug (URL identifier)");
		await user.type(slugInput, "custom-slug");

		await waitFor(() => {
			expect(screen.getByText("custom-slug")).toBeInTheDocument();
		});
	});

	it("creates organization successfully", async () => {
		const user = userEvent.setup();

		mockListOrganizations.mockResolvedValue({
			data: {
				organizations: [],
				activeOrganizationId: null,
			},
		});

		const createdOrg: Organization = {
			id: "new-org",
			name: "New Organization",
			slug: "new-organization",
			status: "active",
		};

		mockCreateOrganization.mockResolvedValue({
			data: createdOrg,
		});

		render(
			<OrgBootstrapper>
				<div>Children Content</div>
			</OrgBootstrapper>,
		);

		await waitFor(() => {
			expect(
				screen.getByText("Create your first organization"),
			).toBeInTheDocument();
		});

		const nameInput = screen.getByLabelText("Name");
		await user.type(nameInput, "New Organization");

		const createButton = screen.getByRole("button", {
			name: "Create organization",
		});
		await user.click(createButton);

		await waitFor(() => {
			expect(mockCreateOrganization).toHaveBeenCalledWith({
				name: "New Organization",
				slug: "new-organization",
			});
		});

		// Should render children after successful creation (toast is handled by executeMutation)
		await waitFor(() => {
			expect(screen.getByText("Children Content")).toBeInTheDocument();
		});
	});

	it("shows error toast when organization creation fails", async () => {
		const user = userEvent.setup();

		mockListOrganizations.mockResolvedValue({
			data: {
				organizations: [],
				activeOrganizationId: null,
			},
		});

		mockCreateOrganization.mockResolvedValue({
			error: "Organization already exists",
			data: null,
		});

		render(
			<OrgBootstrapper>
				<div>Children Content</div>
			</OrgBootstrapper>,
		);

		await waitFor(() => {
			expect(
				screen.getByText("Create your first organization"),
			).toBeInTheDocument();
		});

		const nameInput = screen.getByLabelText("Name");
		await user.type(nameInput, "Existing Org");

		const createButton = screen.getByRole("button", {
			name: "Create organization",
		});
		await user.click(createButton);

		// Verify createOrganization was called (error is handled by executeMutation via Sonner toast)
		await waitFor(() => {
			expect(mockCreateOrganization).toHaveBeenCalledWith({
				name: "Existing Org",
				slug: "existing-org",
			});
		});
	});

	it("disables create button when name or slug is empty", async () => {
		mockListOrganizations.mockResolvedValue({
			data: {
				organizations: [],
				activeOrganizationId: null,
			},
		});

		render(
			<OrgBootstrapper>
				<div>Children Content</div>
			</OrgBootstrapper>,
		);

		await waitFor(() => {
			expect(
				screen.getByText("Create your first organization"),
			).toBeInTheDocument();
		});

		const createButton = screen.getByRole("button", {
			name: "Create organization",
		});
		expect(createButton).toBeDisabled();
	});

	it("shows loading state during organization creation", async () => {
		const user = userEvent.setup();

		mockListOrganizations.mockResolvedValue({
			data: {
				organizations: [],
				activeOrganizationId: null,
			},
		});

		let resolveCreate: (value: unknown) => void;
		const createPromise = new Promise((resolve) => {
			resolveCreate = resolve;
		});
		mockCreateOrganization.mockReturnValue(createPromise);

		render(
			<OrgBootstrapper>
				<div>Children Content</div>
			</OrgBootstrapper>,
		);

		await waitFor(() => {
			expect(
				screen.getByText("Create your first organization"),
			).toBeInTheDocument();
		});

		const nameInput = screen.getByLabelText("Name");
		await user.type(nameInput, "New Org");

		const createButton = screen.getByRole("button", {
			name: "Create organization",
		});
		await user.click(createButton);

		await waitFor(() => {
			expect(screen.getByText("Creating...")).toBeInTheDocument();
		});

		// Resolve the promise to finish the test
		resolveCreate!({
			data: {
				id: "new-org",
				name: "New Org",
				slug: "new-org",
			},
		});

		await waitFor(() => {
			expect(screen.queryByText("Creating...")).not.toBeInTheDocument();
		});
	});

	it("loads members after organizations are loaded", async () => {
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

		await waitFor(() => {
			expect(screen.getByText("Children Content")).toBeInTheDocument();
		});
	});

	it("shows toast when loading members fails", async () => {
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

		// Verify toast.error was called via Sonner
		await waitFor(() => {
			expect(mockToastError).toHaveBeenCalledWith(
				"Failed to load members",
				expect.objectContaining({
					description: "Failed to load members",
				}),
			);
		});
	});

	it("uses first organization as active when activeOrganizationId does not match", async () => {
		mockListOrganizations.mockResolvedValue({
			data: {
				organizations: [mockOrganization],
				activeOrganizationId: "non-existent-id",
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

		await waitFor(() => {
			expect(screen.getByText("Children Content")).toBeInTheDocument();
		});
	});

	it("uses persisted organization when it's still in the list (client-side fetch)", async () => {
		const persistedOrg: Organization = {
			id: "org-2",
			name: "Persisted Organization",
			slug: "persisted-org",
			status: "active",
		};

		const serverActiveOrg = mockOrganization;

		// Set up persisted organization in store
		const { result } = renderHook(() => useOrgStore());
		act(() => {
			result.current.setCurrentOrg(persistedOrg);
		});

		mockListOrganizations.mockResolvedValue({
			data: {
				organizations: [persistedOrg, serverActiveOrg],
				activeOrganizationId: serverActiveOrg.id, // Server says this is active
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

		// Should use persisted org, not server's active org
		await waitFor(() => {
			expect(mockListMembers).toHaveBeenCalledWith(persistedOrg.id);
		});

		await waitFor(() => {
			expect(screen.getByText("Children Content")).toBeInTheDocument();
		});

		// Verify persisted org is still set
		const storeState = useOrgStore.getState();
		expect(storeState.currentOrg?.id).toBe(persistedOrg.id);
	});

	it("uses persisted organization when it's still in the list (server-side initial data)", async () => {
		const persistedOrg: Organization = {
			id: "org-2",
			name: "Persisted Organization",
			slug: "persisted-org",
			status: "active",
		};

		const serverActiveOrg = mockOrganization;

		// Set up persisted organization in store
		const { result } = renderHook(() => useOrgStore());
		act(() => {
			result.current.setCurrentOrg(persistedOrg);
		});

		mockListMembers.mockResolvedValue({
			data: [mockMember],
		});

		render(
			<OrgBootstrapper
				initialOrganizations={{
					organizations: [persistedOrg, serverActiveOrg],
					activeOrganizationId: serverActiveOrg.id, // Server says this is active
				}}
			>
				<div>Children Content</div>
			</OrgBootstrapper>,
		);

		// Should use persisted org, not server's active org
		await waitFor(() => {
			expect(mockListMembers).toHaveBeenCalledWith(persistedOrg.id);
		});

		await waitFor(() => {
			expect(screen.getByText("Children Content")).toBeInTheDocument();
		});

		// Verify persisted org is still set
		const storeState = useOrgStore.getState();
		expect(storeState.currentOrg?.id).toBe(persistedOrg.id);
	});

	it("falls back to server's active organization when persisted org is not in the list", async () => {
		const persistedOrg: Organization = {
			id: "old-org",
			name: "Old Organization",
			slug: "old-org",
			status: "active",
		};

		// Set up persisted organization in store
		const { result } = renderHook(() => useOrgStore());
		act(() => {
			result.current.setCurrentOrg(persistedOrg);
		});

		mockListOrganizations.mockResolvedValue({
			data: {
				organizations: [mockOrganization], // Persisted org not in list
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

		// Should use server's active org since persisted org is not available
		await waitFor(() => {
			expect(mockListMembers).toHaveBeenCalledWith(mockOrganization.id);
		});

		await waitFor(() => {
			expect(screen.getByText("Children Content")).toBeInTheDocument();
		});

		// Verify server's org is now set
		const storeState = useOrgStore.getState();
		expect(storeState.currentOrg?.id).toBe(mockOrganization.id);
	});

	it("falls back to server's active organization when no persisted org exists", async () => {
		// Ensure no persisted org
		const { result } = renderHook(() => useOrgStore());
		act(() => {
			result.current.setCurrentOrg(null);
		});

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

		// Should use server's active org
		await waitFor(() => {
			expect(mockListMembers).toHaveBeenCalledWith(mockOrganization.id);
		});

		await waitFor(() => {
			expect(screen.getByText("Children Content")).toBeInTheDocument();
		});

		// Verify server's org is set
		const storeState = useOrgStore.getState();
		expect(storeState.currentOrg?.id).toBe(mockOrganization.id);
	});

	it("handles error when result.data is null but no error message", async () => {
		mockListOrganizations.mockResolvedValue({
			data: null,
		});

		render(
			<OrgBootstrapper>
				<div>Children Content</div>
			</OrgBootstrapper>,
		);

		// Verify toast.error was called via Sonner
		await waitFor(() => {
			expect(mockToastError).toHaveBeenCalledWith(
				"Error loading organizations",
				expect.objectContaining({
					description: "Please try again later.",
				}),
			);
		});
	});

	it("handles slugify correctly with special characters", async () => {
		const user = userEvent.setup();

		mockListOrganizations.mockResolvedValue({
			data: {
				organizations: [],
				activeOrganizationId: null,
			},
		});

		render(
			<OrgBootstrapper>
				<div>Children Content</div>
			</OrgBootstrapper>,
		);

		await waitFor(() => {
			expect(
				screen.getByText("Create your first organization"),
			).toBeInTheDocument();
		});

		const nameInput = screen.getByLabelText("Name");
		await user.type(nameInput, "My Org & Company #1!");

		await waitFor(() => {
			expect(screen.getByText("my-org-company-1")).toBeInTheDocument();
		});
	});

	it("handles slugify correctly with leading/trailing special characters", async () => {
		const user = userEvent.setup();

		mockListOrganizations.mockResolvedValue({
			data: {
				organizations: [],
				activeOrganizationId: null,
			},
		});

		render(
			<OrgBootstrapper>
				<div>Children Content</div>
			</OrgBootstrapper>,
		);

		await waitFor(() => {
			expect(
				screen.getByText("Create your first organization"),
			).toBeInTheDocument();
		});

		const nameInput = screen.getByLabelText("Name");
		await user.type(nameInput, "---My Org---");

		await waitFor(() => {
			expect(screen.getByText("my-org")).toBeInTheDocument();
		});
	});

	it("displays '...' when slug is empty", async () => {
		mockListOrganizations.mockResolvedValue({
			data: {
				organizations: [],
				activeOrganizationId: null,
			},
		});

		render(
			<OrgBootstrapper>
				<div>Children Content</div>
			</OrgBootstrapper>,
		);

		await waitFor(() => {
			expect(
				screen.getByText("Create your first organization"),
			).toBeInTheDocument();
		});

		expect(screen.getByText("...")).toBeInTheDocument();
	});

	it("shows error toast with error description when organizations fail to load", async () => {
		mockListOrganizations.mockResolvedValue({
			error: "Network error",
			data: null,
		});

		render(
			<OrgBootstrapper>
				<div>Children Content</div>
			</OrgBootstrapper>,
		);

		// The error toast should be shown via Sonner with the error message
		await waitFor(() => {
			expect(mockToastError).toHaveBeenCalledWith(
				"Error loading organizations",
				expect.objectContaining({
					description: "Network error",
				}),
			);
		});
	});

	it("shows default description when no error and no organizations", async () => {
		mockListOrganizations.mockResolvedValue({
			data: {
				organizations: [],
				activeOrganizationId: null,
			},
		});

		render(
			<OrgBootstrapper>
				<div>Children Content</div>
			</OrgBootstrapper>,
		);

		await waitFor(() => {
			expect(
				screen.getByText(/You need at least one organization to continue/),
			).toBeInTheDocument();
		});
	});

	it("shows error when createOrganization returns error without data", async () => {
		const user = userEvent.setup();

		mockListOrganizations.mockResolvedValue({
			data: {
				organizations: [],
				activeOrganizationId: null,
			},
		});

		mockCreateOrganization.mockResolvedValue({
			error: null,
			data: null,
		});

		render(
			<OrgBootstrapper>
				<div>Children Content</div>
			</OrgBootstrapper>,
		);

		await waitFor(() => {
			expect(
				screen.getByText("Create your first organization"),
			).toBeInTheDocument();
		});

		const nameInput = screen.getByLabelText("Name");
		await user.type(nameInput, "New Org");

		const createButton = screen.getByRole("button", {
			name: "Create organization",
		});
		await user.click(createButton);

		// Verify createOrganization was called (error is handled by executeMutation via Sonner toast)
		await waitFor(() => {
			expect(mockCreateOrganization).toHaveBeenCalledWith({
				name: "New Org",
				slug: "new-org",
			});
		});
	});

	it("does not call listMembers when no active organization", async () => {
		mockListOrganizations.mockResolvedValue({
			data: {
				organizations: [],
				activeOrganizationId: null,
			},
		});

		render(
			<OrgBootstrapper>
				<div>Children Content</div>
			</OrgBootstrapper>,
		);

		await waitFor(() => {
			expect(
				screen.getByText("Create your first organization"),
			).toBeInTheDocument();
		});

		expect(mockListMembers).not.toHaveBeenCalled();
	});

	it("does not submit when name is empty", async () => {
		const user = userEvent.setup();

		mockListOrganizations.mockResolvedValue({
			data: {
				organizations: [],
				activeOrganizationId: null,
			},
		});

		render(
			<OrgBootstrapper>
				<div>Children Content</div>
			</OrgBootstrapper>,
		);

		await waitFor(() => {
			expect(
				screen.getByText("Create your first organization"),
			).toBeInTheDocument();
		});

		const slugInput = screen.getByLabelText("Slug (URL identifier)");
		await user.type(slugInput, "custom-slug");

		const createButton = screen.getByRole("button", {
			name: "Create organization",
		});
		// Button should still be disabled since name is empty
		expect(createButton).toBeDisabled();
	});

	it("properly derives slug from custom slug input over name input", async () => {
		const user = userEvent.setup();

		mockListOrganizations.mockResolvedValue({
			data: {
				organizations: [],
				activeOrganizationId: null,
			},
		});

		render(
			<OrgBootstrapper>
				<div>Children Content</div>
			</OrgBootstrapper>,
		);

		await waitFor(() => {
			expect(
				screen.getByText("Create your first organization"),
			).toBeInTheDocument();
		});

		const nameInput = screen.getByLabelText("Name");
		await user.type(nameInput, "My Organization");

		const slugInput = screen.getByLabelText("Slug (URL identifier)");
		await user.clear(slugInput);
		await user.type(slugInput, "my-custom-slug");

		await waitFor(() => {
			expect(screen.getByText("my-custom-slug")).toBeInTheDocument();
		});
	});

	it("syncs session with auth service when organization is selected", async () => {
		mockListOrganizations.mockResolvedValue({
			data: {
				organizations: [mockOrganization],
				activeOrganizationId: mockOrganization.id,
			},
		});
		mockListMembers.mockResolvedValue({
			data: [mockMember],
		});
		mockSetActiveOrganization.mockResolvedValue({
			data: { activeOrganizationId: mockOrganization.id },
			error: null,
		});

		render(
			<OrgBootstrapper>
				<div>Children Content</div>
			</OrgBootstrapper>,
		);

		// Wait for children to be rendered (session sync should complete)
		await waitFor(() => {
			expect(screen.getByText("Children Content")).toBeInTheDocument();
		});

		// Verify setActiveOrganization was called to sync the session
		await waitFor(() => {
			expect(mockSetActiveOrganization).toHaveBeenCalledWith(
				mockOrganization.id,
			);
		});

		// Verify token cache was cleared before sync
		expect(mockTokenCacheClear).toHaveBeenCalled();
	});

	it("logs warning when persisted organization is no longer accessible", async () => {
		const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

		const persistedOrg: Organization = {
			id: "deleted-org",
			name: "Deleted Organization",
			slug: "deleted-org",
			status: "active",
		};

		// Set up persisted organization in store
		const { result } = renderHook(() => useOrgStore());
		act(() => {
			result.current.setCurrentOrg(persistedOrg);
		});

		mockListOrganizations.mockResolvedValue({
			data: {
				organizations: [mockOrganization], // Persisted org not in list
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

		// Verify warning was logged
		expect(consoleSpy).toHaveBeenCalledWith(
			expect.stringContaining(
				'Persisted organization "deleted-org" is no longer accessible',
			),
		);

		consoleSpy.mockRestore();
	});

	it("handles session sync error gracefully", async () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		mockListOrganizations.mockResolvedValue({
			data: {
				organizations: [mockOrganization],
				activeOrganizationId: mockOrganization.id,
			},
		});
		mockListMembers.mockResolvedValue({
			data: [mockMember],
		});
		// Simulate session sync failure
		mockSetActiveOrganization.mockResolvedValue({
			data: null,
			error: "Session sync failed",
		});

		render(
			<OrgBootstrapper>
				<div>Children Content</div>
			</OrgBootstrapper>,
		);

		// Should still render children even if sync fails
		await waitFor(() => {
			expect(screen.getByText("Children Content")).toBeInTheDocument();
		});

		// Verify error was logged
		expect(consoleSpy).toHaveBeenCalledWith(
			expect.stringContaining("[OrgBootstrapper] Failed to sync organization:"),
			expect.any(String),
		);

		consoleSpy.mockRestore();
	});
});
