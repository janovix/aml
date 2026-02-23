import { describe, it, expect, vi, afterEach } from "vitest";
import {
	getOrganizationSettings,
	updateOrganizationSettings,
} from "./organization-settings";

describe("api/organization-settings", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("getOrganizationSettings calls GET on correct URL", async () => {
		const mockSettings = {
			id: "s-1",
			organizationId: "org-1",
			obligatedSubjectKey: "SO-VEH",
			activityKey: "VEH",
			createdAt: "2024-01-01",
			updatedAt: "2024-01-01",
		};

		vi.stubGlobal(
			"fetch",
			vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.pathname).toBe("/api/v1/organization-settings");
				expect(init?.method).toBe("GET");
				return new Response(JSON.stringify(mockSettings), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			}),
		);

		const res = await getOrganizationSettings({
			baseUrl: "https://example.com",
		});
		expect(res).toEqual(mockSettings);
	});

	it("getOrganizationSettings returns null on 404", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(
				async () =>
					new Response(JSON.stringify({ message: "Not found" }), {
						status: 404,
						headers: { "content-type": "application/json" },
					}),
			),
		);

		const res = await getOrganizationSettings({
			baseUrl: "https://example.com",
		});
		expect(res).toBeNull();
	});

	it("getOrganizationSettings throws on non-404 errors", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(
				async () =>
					new Response(JSON.stringify({ message: "Server error" }), {
						status: 500,
						headers: { "content-type": "application/json" },
					}),
			),
		);

		await expect(
			getOrganizationSettings({ baseUrl: "https://example.com" }),
		).rejects.toThrow();
	});

	it("updateOrganizationSettings sends PUT with body", async () => {
		const updatedSettings = {
			id: "s-1",
			organizationId: "org-1",
			obligatedSubjectKey: "SO-INM",
			activityKey: "INM",
			createdAt: "2024-01-01",
			updatedAt: "2024-06-01",
		};

		vi.stubGlobal(
			"fetch",
			vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
				expect(init?.method).toBe("PUT");
				const body = JSON.parse(init?.body as string);
				expect(body.obligatedSubjectKey).toBe("SO-INM");
				expect(body.activityKey).toBe("INM");
				return new Response(JSON.stringify(updatedSettings), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			}),
		);

		const res = await updateOrganizationSettings({
			input: { obligatedSubjectKey: "SO-INM", activityKey: "INM" },
			baseUrl: "https://example.com",
		});
		expect(res.activityKey).toBe("INM");
	});

	it("updateOrganizationSettings passes JWT", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
				const headers = init?.headers as Record<string, string>;
				expect(headers.Authorization).toBe("Bearer jwt-token");
				return new Response(JSON.stringify({}), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			}),
		);

		await updateOrganizationSettings({
			input: { obligatedSubjectKey: "SO", activityKey: "VEH" },
			baseUrl: "https://example.com",
			jwt: "jwt-token",
		});
	});
});
