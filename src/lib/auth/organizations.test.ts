import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
	listOrganizations,
	createOrganization,
	setActiveOrganization,
	listMembers,
	inviteMember,
	acceptInvitation,
	listInvitations,
	cancelInvitation,
	resendInvitation,
} from "./organizations";

const mockFetch = vi.fn();
global.fetch = mockFetch;

vi.mock("./config", () => ({
	getAuthServiceUrl: () => "https://auth-svc.test",
	getAuthAppUrl: () => "https://auth.test",
}));

describe("organizations API", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("listOrganizations", () => {
		it("returns organizations list with active org ID", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () =>
					Promise.resolve({
						organizations: [
							{ id: "org-1", name: "Org One", slug: "org-one" },
							{ id: "org-2", name: "Org Two", slug: "org-two" },
						],
						activeOrganizationId: "org-1",
					}),
			});

			const result = await listOrganizations();

			expect(result.error).toBeNull();
			expect(result.data?.organizations).toHaveLength(2);
			expect(result.data?.activeOrganizationId).toBe("org-1");
		});

		it("normalizes organization data", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () =>
					Promise.resolve({
						organizations: [
							{
								id: "org-1",
								name: "Test Org",
								slug: "test-org",
								metadata: { status: "active", plan: "professional" },
							},
						],
						activeOrganizationId: "org-1",
					}),
			});

			const result = await listOrganizations();

			expect(result.data?.organizations[0]).toMatchObject({
				id: "org-1",
				name: "Test Org",
				slug: "test-org",
				status: "active",
				plan: "professional",
			});
		});

		it("returns error on failed request", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				statusText: "Unauthorized",
				json: () => Promise.resolve({ message: "Not authorized" }),
			});

			const result = await listOrganizations();

			expect(result.data).toBeNull();
			expect(result.error).toBe("Not authorized");
		});

		it("handles network errors", async () => {
			mockFetch.mockRejectedValueOnce(new Error("Network error"));

			const result = await listOrganizations();

			expect(result.data).toBeNull();
			expect(result.error).toBe("Network error");
		});
	});

	describe("createOrganization", () => {
		it("creates organization with name and slug", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () =>
					Promise.resolve({
						organization: {
							id: "new-org",
							name: "New Org",
							slug: "new-org",
						},
					}),
			});

			const result = await createOrganization({
				name: "New Org",
				slug: "new-org",
			});

			expect(result.error).toBeNull();
			expect(result.data).toMatchObject({
				id: "new-org",
				name: "New Org",
				slug: "new-org",
			});

			expect(mockFetch).toHaveBeenCalledWith(
				"https://auth-svc.test/api/auth/organization/create",
				expect.objectContaining({
					method: "POST",
					body: JSON.stringify({ name: "New Org", slug: "new-org" }),
				}),
			);
		});

		it("returns error for duplicate slug", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				statusText: "Conflict",
				json: () =>
					Promise.resolve({
						code: "ORGANIZATION_ALREADY_EXISTS",
					}),
			});

			const result = await createOrganization({
				name: "Existing Org",
				slug: "existing-org",
			});

			expect(result.data).toBeNull();
			expect(result.error).toBe(
				"An organization with this slug already exists. Please choose another.",
			);
		});
	});

	describe("setActiveOrganization", () => {
		it("sets active organization", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () =>
					Promise.resolve({
						activeOrganizationId: "org-2",
					}),
			});

			const result = await setActiveOrganization("org-2");

			expect(result.error).toBeNull();
			expect(result.data?.activeOrganizationId).toBe("org-2");

			expect(mockFetch).toHaveBeenCalledWith(
				"https://auth-svc.test/api/auth/organization/set-active",
				expect.objectContaining({
					method: "POST",
					body: JSON.stringify({ organizationId: "org-2" }),
				}),
			);
		});
	});

	describe("listMembers", () => {
		it("lists organization members", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () =>
					Promise.resolve({
						members: [
							{
								id: "member-1",
								userId: "user-1",
								organizationId: "org-1",
								role: "owner",
								user: {
									name: "John Doe",
									email: "john@example.com",
								},
							},
						],
					}),
			});

			const result = await listMembers("org-1");

			expect(result.error).toBeNull();
			expect(result.data).toHaveLength(1);
			expect(result.data?.[0]).toMatchObject({
				userId: "user-1",
				role: "owner",
				name: "John Doe",
				email: "john@example.com",
			});
		});
	});

	describe("inviteMember", () => {
		it("sends invitation", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ success: true }),
			});

			const result = await inviteMember({
				email: "new@example.com",
				role: "member",
				organizationId: "org-1",
			});

			expect(result.error).toBeNull();

			expect(mockFetch).toHaveBeenCalledWith(
				"https://auth-svc.test/api/auth/organization/invite-member",
				expect.objectContaining({
					method: "POST",
					body: JSON.stringify({
						email: "new@example.com",
						role: "member",
						organizationId: "org-1",
					}),
				}),
			);
		});

		it("returns error for existing member", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				statusText: "Conflict",
				json: () =>
					Promise.resolve({
						code: "MEMBER_ALREADY_EXISTS",
					}),
			});

			const result = await inviteMember({
				email: "existing@example.com",
				role: "member",
				organizationId: "org-1",
			});

			expect(result.data).toBeNull();
			expect(result.error).toBe(
				"This user is already a member of the organization.",
			);
		});
	});

	describe("acceptInvitation", () => {
		it("accepts invitation", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ success: true }),
			});

			const result = await acceptInvitation("inv-123");

			expect(result.error).toBeNull();

			expect(mockFetch).toHaveBeenCalledWith(
				"https://auth-svc.test/api/auth/organization/accept-invitation",
				expect.objectContaining({
					method: "POST",
					body: JSON.stringify({ invitationId: "inv-123" }),
				}),
			);
		});

		it("returns translated error for expired invitation", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				statusText: "Not Found",
				json: () =>
					Promise.resolve({
						message: "Invitation not found",
					}),
			});

			const result = await acceptInvitation("inv-expired");

			expect(result.data).toBeNull();
			expect(result.error).toBe(
				"Invitation expired or revoked. Please contact your administrator.",
			);
		});
	});

	describe("listInvitations", () => {
		it("lists pending invitations", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () =>
					Promise.resolve({
						invitations: [
							{
								id: "inv-1",
								email: "pending@example.com",
								role: "member",
								status: "pending",
								expiresAt: "2024-04-01T00:00:00Z",
								createdAt: "2024-03-01T00:00:00Z",
								inviter: {
									id: "user-1",
									name: "John Doe",
									email: "john@example.com",
								},
							},
						],
					}),
			});

			const result = await listInvitations("org-1", "pending");

			expect(result.error).toBeNull();
			expect(result.data).toHaveLength(1);
			expect(result.data?.[0]).toMatchObject({
				id: "inv-1",
				email: "pending@example.com",
				role: "member",
				status: "pending",
				inviterName: "John Doe",
			});
		});
	});

	describe("cancelInvitation", () => {
		it("cancels invitation", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ success: true }),
			});

			const result = await cancelInvitation("inv-123");

			expect(result.error).toBeNull();

			expect(mockFetch).toHaveBeenCalledWith(
				"https://auth-svc.test/api/auth/organization/cancel-invitation",
				expect.objectContaining({
					method: "POST",
					body: JSON.stringify({ invitationId: "inv-123" }),
				}),
			);
		});
	});

	describe("resendInvitation", () => {
		it("resends invitation by calling inviteMember with resend flag", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ success: true }),
			});

			const result = await resendInvitation({
				email: "pending@example.com",
				role: "member",
				organizationId: "org-1",
			});

			expect(result.error).toBeNull();

			expect(mockFetch).toHaveBeenCalledWith(
				"https://auth-svc.test/api/auth/organization/invite-member",
				expect.objectContaining({
					method: "POST",
					body: JSON.stringify({
						email: "pending@example.com",
						role: "member",
						organizationId: "org-1",
						resend: true,
					}),
				}),
			);
		});
	});
});
