import { describe, it, expect, vi, beforeEach } from "vitest";
import { createAuthJanbotTools } from "./auth-tools";

vi.mock("@/lib/auth/config", () => ({
	getAuthServiceUrl: vi.fn(() => "https://auth.example.com"),
}));

describe("createAuthJanbotTools", () => {
	beforeEach(() => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ success: true, data: [] }),
				text: async () => "",
			} as Response),
		);
	});

	it("uses Cookie header for auth-svc, not Authorization Bearer", async () => {
		const tools = createAuthJanbotTools({
			cookieHeader: "better-auth.session_token=abc",
		});
		await tools.listOrganizationsWithRole.execute();
		expect(fetch).toHaveBeenCalledWith(
			"https://auth.example.com/api/organization/list-with-role",
			expect.objectContaining({
				headers: expect.objectContaining({
					Cookie: "better-auth.session_token=abc",
					Accept: "application/json",
				}),
			}),
		);
		const headers = vi.mocked(fetch).mock.calls[0][1]?.headers as Record<
			string,
			string
		>;
		expect(headers.Authorization).toBeUndefined();
	});
});
