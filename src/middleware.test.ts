import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";

const mockGetSessionCookie = vi.fn();
vi.mock("better-auth/cookies", () => ({
	getSessionCookie: (request: NextRequest) => mockGetSessionCookie(request),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("middleware", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		vi.clearAllMocks();
		mockFetch.mockReset();
		process.env = { ...originalEnv };
		process.env.NEXT_PUBLIC_AUTH_SERVICE_URL =
			"https://auth-svc.example.workers.dev";
		process.env.NEXT_PUBLIC_AUTH_APP_URL = "https://auth.example.workers.dev";
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	it("should not redirect to onboarding when user has zero organizations (avoid auth loop)", async () => {
		mockGetSessionCookie.mockReturnValue("session-token-123");
		mockFetch
			.mockResolvedValueOnce({
				ok: true,
				headers: { getSetCookie: () => [] },
				json: () =>
					Promise.resolve({
						session: {
							id: "s1",
							activeOrganizationId: "orphan-org-id",
						},
						user: { id: "u1", name: "Test User", banned: false },
					}),
			})
			.mockResolvedValueOnce({
				ok: true,
				headers: { getSetCookie: () => [] },
				json: () => Promise.resolve({ success: true, data: [] }),
			});

		const request = new NextRequest("http://localhost:3000/");
		const response = await middleware(request);

		expect(response.status).toBe(200);
		const location = response.headers.get("location");
		expect(location).toBeNull();
	});

	it("should still redirect to onboarding when user has no display name", async () => {
		mockGetSessionCookie.mockReturnValue("session-token-123");
		mockFetch.mockResolvedValue({
			ok: true,
			headers: { getSetCookie: () => [] },
			json: () =>
				Promise.resolve({
					session: { id: "s1" },
					user: { id: "u1", name: "", banned: false },
				}),
		});
		process.env.NEXT_PUBLIC_AUTH_APP_URL = "https://auth.example.com";

		const request = new NextRequest("http://localhost:3000/dashboard");
		const response = await middleware(request);

		expect(response.status).toBe(307);
		expect(response.headers.get("location")).toContain(
			"https://auth.example.com/onboarding",
		);
	});
});
