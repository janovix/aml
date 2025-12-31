import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

// Mock zustand persist middleware to use in-memory storage
vi.mock("zustand/middleware", async (importOriginal) => {
	const actual = (await importOriginal()) as Record<string, unknown>;
	return {
		...actual,
		persist: (fn: unknown) => fn,
	};
});

import {
	useOrgStore,
	DEFAULT_ORG_SETTINGS,
	rolePermissions,
	type Organization,
	type OrganizationMember,
} from "./org-store";

const mockOrganization: Organization = {
	id: "org-1",
	name: "Test Organization",
	slug: "test-org",
	logo: "https://example.com/logo.png",
	description: "A test organization",
	website: "https://example.com",
	email: "contact@example.com",
	phone: "+1234567890",
	address: {
		street: "123 Main St",
		city: "Test City",
		state: "TS",
		postalCode: "12345",
		country: "US",
	},
	taxId: "RFC123456789",
	status: "active",
	plan: "professional",
	settings: DEFAULT_ORG_SETTINGS,
	metadata: { custom: "value" },
	createdAt: "2024-01-01T00:00:00Z",
	updatedAt: "2024-01-01T00:00:00Z",
};

const mockOrganization2: Organization = {
	id: "org-2",
	name: "Second Organization",
	slug: "second-org",
	status: "active",
};

const mockMember: OrganizationMember = {
	id: "member-1",
	userId: "user-1",
	organizationId: "org-1",
	role: "admin",
	permissions: rolePermissions.admin,
	status: "active",
	email: "admin@example.com",
	name: "Admin User",
};

const mockMember2: OrganizationMember = {
	id: "member-2",
	userId: "user-2",
	organizationId: "org-1",
	role: "member",
	permissions: rolePermissions.member,
	status: "active",
};

const mockMemberOrg2: OrganizationMember = {
	id: "member-3",
	userId: "user-1",
	organizationId: "org-2",
	role: "owner",
	permissions: rolePermissions.owner,
	status: "active",
};

describe("org-store", () => {
	beforeEach(() => {
		// Reset the store before each test
		const { result } = renderHook(() => useOrgStore());
		act(() => {
			result.current.setCurrentOrg(null);
			result.current.setOrganizations([]);
			result.current.setMembers([]);
			result.current.setCurrentUserId(null);
			result.current.setLoading(false);
			result.current.setError(null);
		});
	});

	describe("initial state", () => {
		it("should have default initial state", () => {
			const { result } = renderHook(() => useOrgStore());

			expect(result.current.currentOrg).toBeNull();
			expect(result.current.currentUserId).toBeNull();
			expect(result.current.organizations).toEqual([]);
			expect(result.current.members).toEqual([]);
			expect(result.current.isLoading).toBe(false);
			expect(result.current.error).toBeNull();
		});
	});

	describe("setCurrentOrg", () => {
		it("should set the current organization", () => {
			const { result } = renderHook(() => useOrgStore());

			act(() => {
				result.current.setCurrentOrg(mockOrganization);
			});

			expect(result.current.currentOrg).toEqual(mockOrganization);
		});

		it("should clear the current organization when set to null", () => {
			const { result } = renderHook(() => useOrgStore());

			act(() => {
				result.current.setCurrentOrg(mockOrganization);
			});

			expect(result.current.currentOrg).toEqual(mockOrganization);

			act(() => {
				result.current.setCurrentOrg(null);
			});

			expect(result.current.currentOrg).toBeNull();
		});
	});

	describe("setCurrentOrgById", () => {
		it("should set current org by id from organizations list", () => {
			const { result } = renderHook(() => useOrgStore());

			act(() => {
				result.current.setOrganizations([mockOrganization, mockOrganization2]);
				result.current.setCurrentOrgById(mockOrganization2.id);
			});

			expect(result.current.currentOrg).toEqual(mockOrganization2);
		});

		it("should set current org to null if id not found", () => {
			const { result } = renderHook(() => useOrgStore());

			act(() => {
				result.current.setOrganizations([mockOrganization]);
				result.current.setCurrentOrg(mockOrganization);
			});

			expect(result.current.currentOrg).toEqual(mockOrganization);

			act(() => {
				result.current.setCurrentOrgById("non-existent-id");
			});

			expect(result.current.currentOrg).toBeNull();
		});

		it("should set current org to null when id is null", () => {
			const { result } = renderHook(() => useOrgStore());

			act(() => {
				result.current.setOrganizations([mockOrganization]);
				result.current.setCurrentOrg(mockOrganization);
			});

			expect(result.current.currentOrg).toEqual(mockOrganization);

			act(() => {
				result.current.setCurrentOrgById(null);
			});

			expect(result.current.currentOrg).toBeNull();
		});
	});

	describe("setCurrentUserId", () => {
		it("should set the current user id", () => {
			const { result } = renderHook(() => useOrgStore());

			act(() => {
				result.current.setCurrentUserId("user-123");
			});

			expect(result.current.currentUserId).toBe("user-123");
		});

		it("should clear the current user id when set to null", () => {
			const { result } = renderHook(() => useOrgStore());

			act(() => {
				result.current.setCurrentUserId("user-123");
			});

			expect(result.current.currentUserId).toBe("user-123");

			act(() => {
				result.current.setCurrentUserId(null);
			});

			expect(result.current.currentUserId).toBeNull();
		});
	});

	describe("setOrganizations", () => {
		it("should set the organizations list", () => {
			const { result } = renderHook(() => useOrgStore());

			act(() => {
				result.current.setOrganizations([mockOrganization, mockOrganization2]);
			});

			expect(result.current.organizations).toHaveLength(2);
			expect(result.current.organizations[0]).toEqual(mockOrganization);
			expect(result.current.organizations[1]).toEqual(mockOrganization2);
		});

		it("should replace existing organizations", () => {
			const { result } = renderHook(() => useOrgStore());

			act(() => {
				result.current.setOrganizations([mockOrganization]);
			});

			expect(result.current.organizations).toHaveLength(1);

			act(() => {
				result.current.setOrganizations([mockOrganization2]);
			});

			expect(result.current.organizations).toHaveLength(1);
			expect(result.current.organizations[0]).toEqual(mockOrganization2);
		});
	});

	describe("addOrganization", () => {
		it("should add an organization and set it as current", () => {
			const { result } = renderHook(() => useOrgStore());

			act(() => {
				result.current.setOrganizations([mockOrganization]);
			});

			expect(result.current.organizations).toHaveLength(1);

			act(() => {
				result.current.addOrganization(mockOrganization2);
			});

			expect(result.current.organizations).toHaveLength(2);
			expect(result.current.organizations[1]).toEqual(mockOrganization2);
			expect(result.current.currentOrg).toEqual(mockOrganization2);
		});
	});

	describe("updateOrganization", () => {
		it("should update an organization in the list", () => {
			const { result } = renderHook(() => useOrgStore());

			act(() => {
				result.current.setOrganizations([mockOrganization]);
			});

			act(() => {
				result.current.updateOrganization(mockOrganization.id, {
					name: "Updated Name",
				});
			});

			expect(result.current.organizations[0].name).toBe("Updated Name");
			expect(result.current.organizations[0].updatedAt).toBeDefined();
		});

		it("should update currentOrg if it matches the updated org id", () => {
			const { result } = renderHook(() => useOrgStore());

			act(() => {
				result.current.setOrganizations([mockOrganization]);
				result.current.setCurrentOrg(mockOrganization);
			});

			act(() => {
				result.current.updateOrganization(mockOrganization.id, {
					name: "Updated Current Org",
				});
			});

			expect(result.current.currentOrg?.name).toBe("Updated Current Org");
			expect(result.current.currentOrg?.updatedAt).toBeDefined();
		});

		it("should not update currentOrg if it does not match the updated org id", () => {
			const { result } = renderHook(() => useOrgStore());

			act(() => {
				result.current.setOrganizations([mockOrganization, mockOrganization2]);
				result.current.setCurrentOrg(mockOrganization);
			});

			act(() => {
				result.current.updateOrganization(mockOrganization2.id, {
					name: "Updated Second Org",
				});
			});

			expect(result.current.currentOrg?.name).toBe(mockOrganization.name);
			expect(result.current.organizations[1].name).toBe("Updated Second Org");
		});

		it("should not update any org if id does not match", () => {
			const { result } = renderHook(() => useOrgStore());

			act(() => {
				result.current.setOrganizations([mockOrganization]);
			});

			act(() => {
				result.current.updateOrganization("non-existent-id", {
					name: "Should not update",
				});
			});

			expect(result.current.organizations[0].name).toBe(mockOrganization.name);
		});
	});

	describe("setMembers", () => {
		it("should set the members list", () => {
			const { result } = renderHook(() => useOrgStore());

			act(() => {
				result.current.setMembers([mockMember, mockMember2]);
			});

			expect(result.current.members).toHaveLength(2);
			expect(result.current.members[0]).toEqual(mockMember);
		});
	});

	describe("setMembersForOrg", () => {
		it("should set members for a specific organization", () => {
			const { result } = renderHook(() => useOrgStore());

			act(() => {
				result.current.setMembers([mockMemberOrg2]);
			});

			expect(result.current.members).toHaveLength(1);

			act(() => {
				result.current.setMembersForOrg("org-1", [mockMember, mockMember2]);
			});

			expect(result.current.members).toHaveLength(3);
			expect(
				result.current.members.filter((m) => m.organizationId === "org-1"),
			).toHaveLength(2);
			expect(
				result.current.members.filter((m) => m.organizationId === "org-2"),
			).toHaveLength(1);
		});

		it("should replace members for the specific organization only", () => {
			const { result } = renderHook(() => useOrgStore());

			act(() => {
				result.current.setMembers([mockMember, mockMemberOrg2]);
			});

			expect(result.current.members).toHaveLength(2);

			const newMember: OrganizationMember = {
				id: "member-new",
				userId: "user-new",
				organizationId: "org-1",
				role: "readonly",
				permissions: rolePermissions.readonly,
				status: "active",
			};

			act(() => {
				result.current.setMembersForOrg("org-1", [newMember]);
			});

			expect(result.current.members).toHaveLength(2);
			expect(
				result.current.members.find((m) => m.id === "member-new"),
			).toBeDefined();
			expect(
				result.current.members.find((m) => m.id === "member-1"),
			).toBeUndefined();
			expect(
				result.current.members.find((m) => m.organizationId === "org-2"),
			).toBeDefined();
		});
	});

	describe("setLoading", () => {
		it("should set the loading state", () => {
			const { result } = renderHook(() => useOrgStore());

			expect(result.current.isLoading).toBe(false);

			act(() => {
				result.current.setLoading(true);
			});

			expect(result.current.isLoading).toBe(true);

			act(() => {
				result.current.setLoading(false);
			});

			expect(result.current.isLoading).toBe(false);
		});
	});

	describe("setError", () => {
		it("should set the error state", () => {
			const { result } = renderHook(() => useOrgStore());

			expect(result.current.error).toBeNull();

			act(() => {
				result.current.setError("Something went wrong");
			});

			expect(result.current.error).toBe("Something went wrong");

			act(() => {
				result.current.setError(null);
			});

			expect(result.current.error).toBeNull();
		});
	});

	describe("getCurrentMember", () => {
		it("should return the current member for the current org and user", () => {
			const { result } = renderHook(() => useOrgStore());

			act(() => {
				result.current.setCurrentOrg(mockOrganization);
				result.current.setCurrentUserId("user-1");
				result.current.setMembers([mockMember, mockMember2]);
			});

			const currentMember = result.current.getCurrentMember();
			expect(currentMember).toEqual(mockMember);
		});

		it("should return null if no current org", () => {
			const { result } = renderHook(() => useOrgStore());

			act(() => {
				result.current.setCurrentUserId("user-1");
				result.current.setMembers([mockMember]);
			});

			const currentMember = result.current.getCurrentMember();
			expect(currentMember).toBeNull();
		});

		it("should return null if member not found", () => {
			const { result } = renderHook(() => useOrgStore());

			act(() => {
				result.current.setCurrentOrg(mockOrganization);
				result.current.setCurrentUserId("non-existent-user");
				result.current.setMembers([mockMember]);
			});

			const currentMember = result.current.getCurrentMember();
			expect(currentMember).toBeNull();
		});
	});

	describe("hasPermission", () => {
		it("should return true if member has the permission", () => {
			const { result } = renderHook(() => useOrgStore());

			act(() => {
				result.current.setCurrentOrg(mockOrganization);
				result.current.setCurrentUserId("user-1");
				result.current.setMembers([mockMember]);
			});

			expect(result.current.hasPermission("clients:create")).toBe(true);
			expect(result.current.hasPermission("clients:read")).toBe(true);
			expect(result.current.hasPermission("team:manage")).toBe(true);
		});

		it("should return false if member does not have the permission", () => {
			const { result } = renderHook(() => useOrgStore());

			const limitedMember: OrganizationMember = {
				...mockMember,
				role: "readonly",
				permissions: rolePermissions.readonly,
			};

			act(() => {
				result.current.setCurrentOrg(mockOrganization);
				result.current.setCurrentUserId("user-1");
				result.current.setMembers([limitedMember]);
			});

			expect(result.current.hasPermission("clients:create")).toBe(false);
			expect(result.current.hasPermission("clients:read")).toBe(true);
		});

		it("should return false if no current member", () => {
			const { result } = renderHook(() => useOrgStore());

			act(() => {
				result.current.setCurrentOrg(mockOrganization);
				result.current.setCurrentUserId("non-existent-user");
				result.current.setMembers([mockMember]);
			});

			expect(result.current.hasPermission("clients:read")).toBe(false);
		});
	});

	describe("DEFAULT_ORG_SETTINGS", () => {
		it("should have correct default values", () => {
			expect(DEFAULT_ORG_SETTINGS).toEqual({
				currency: "MXN",
				timezone: "America/Mexico_City",
				language: "es",
				notificationPreferences: {
					email: true,
					sms: false,
					push: false,
				},
			});
		});
	});

	describe("rolePermissions", () => {
		it("should define permissions for owner role", () => {
			expect(rolePermissions.owner).toContain("clients:create");
			expect(rolePermissions.owner).toContain("team:manage");
			expect(rolePermissions.owner).toContain("settings:update");
		});

		it("should define permissions for admin role", () => {
			expect(rolePermissions.admin).toContain("clients:create");
			expect(rolePermissions.admin).toContain("team:manage");
			expect(rolePermissions.admin).toContain("settings:update");
		});

		it("should define permissions for manager role", () => {
			expect(rolePermissions.manager).toContain("clients:create");
			expect(rolePermissions.manager).toContain("team:invite");
			expect(rolePermissions.manager).not.toContain("team:manage");
		});

		it("should define permissions for member role", () => {
			expect(rolePermissions.member).toContain("clients:read");
			expect(rolePermissions.member).not.toContain("clients:create");
			expect(rolePermissions.member).not.toContain("team:invite");
		});

		it("should define permissions for analyst role", () => {
			expect(rolePermissions.analyst).toContain("clients:read");
			expect(rolePermissions.analyst).toContain("reports:generate");
			expect(rolePermissions.analyst).not.toContain("clients:create");
		});

		it("should define permissions for readonly role", () => {
			expect(rolePermissions.readonly).toContain("clients:read");
			expect(rolePermissions.readonly).toContain("transactions:read");
			expect(rolePermissions.readonly).not.toContain("clients:create");
			expect(rolePermissions.readonly).not.toContain("alerts:acknowledge");
		});
	});
});
