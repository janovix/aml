import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
	listOrganizations,
	setActiveOrganization,
	listMembers,
	acceptInvitation,
} from "./organizations";

const mockFetch = vi.fn();
global.fetch = mockFetch;

vi.mock("./config", () => ({
	getAuthServiceUrl: () => "https://auth-svc.test",
	getAuthAppUrl: () => "https://auth.test",
}));

const mockOrganizationSetActive = vi.fn();
const mockOrganizationListMembers = vi.fn();
const mockOrganizationAcceptInvitation = vi.fn();

vi.mock("./authClient", () => ({
	authClient: {
		organization: {
			setActive: (...args: unknown[]) => mockOrganizationSetActive(...args),
			listMembers: (...args: unknown[]) => mockOrganizationListMembers(...args),
			acceptInvitation: (...args: unknown[]) =>
				mockOrganizationAcceptInvitation(...args),
		},
	},
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
						success: true,
						data: [
							{ id: "org-1", name: "Org One", slug: "org-one", role: "owner" },
							{ id: "org-2", name: "Org Two", slug: "org-two", role: "member" },
						],
					}),
			});

			const result = await listOrganizations();

			expect(result.error).toBeNull();
			expect(result.data?.organizations).toHaveLength(2);
			// list-with-role does not return activeOrganizationId
			expect(result.data?.activeOrganizationId).toBeNull();
		});

		it("normalizes organization data", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () =>
					Promise.resolve({
						success: true,
						data: [
							{
								id: "org-1",
								name: "Test Org",
								slug: "test-org",
								role: "owner",
								metadata: { status: "active", plan: "professional" },
							},
						],
					}),
			});

			const result = await listOrganizations();

			expect(result.data?.organizations[0]).toMatchObject({
				id: "org-1",
				name: "Test Org",
				slug: "test-org",
				status: "active",
				plan: "professional",
				userRole: "owner",
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

	describe("setActiveOrganization", () => {
		it("sets active organization", async () => {
			mockOrganizationSetActive.mockResolvedValueOnce({
				data: {},
				error: null,
			});

			const result = await setActiveOrganization("org-2");

			expect(result.error).toBeNull();
			expect(result.data?.activeOrganizationId).toBe("org-2");

			expect(mockOrganizationSetActive).toHaveBeenCalledWith({
				organizationId: "org-2",
			});
		});
	});

	describe("listMembers", () => {
		it("lists organization members", async () => {
			mockOrganizationListMembers.mockResolvedValueOnce({
				data: {
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
				},
				error: null,
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

			expect(mockOrganizationListMembers).toHaveBeenCalledWith({
				query: { organizationId: "org-1" },
			});
		});
	});

	describe("acceptInvitation", () => {
		it("accepts invitation", async () => {
			mockOrganizationAcceptInvitation.mockResolvedValueOnce({
				data: { invitation: {}, member: {} },
				error: null,
			});

			const result = await acceptInvitation("inv-123");

			expect(result.error).toBeNull();

			expect(mockOrganizationAcceptInvitation).toHaveBeenCalledWith({
				invitationId: "inv-123",
			});
		});

		it("returns translated error for expired invitation", async () => {
			mockOrganizationAcceptInvitation.mockResolvedValueOnce({
				data: null,
				error: {
					message: "Invitation not found",
					body: { message: "Invitation not found" },
				},
			});

			const result = await acceptInvitation("inv-expired");

			expect(result.data).toBeNull();
			expect(result.error).toBe(
				"Invitation expired or revoked. Please contact your administrator.",
			);
		});
	});
});
