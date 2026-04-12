import { describe, expect, it, vi, afterEach } from "vitest";
import { getShareholderById, listClientShareholders } from "./shareholders";

describe("api/shareholders", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("listClientShareholders uses root path without parent", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async (url: RequestInfo | URL) => {
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.pathname).toBe("/api/v1/clients/c1/shareholders");
				return new Response(JSON.stringify({ data: [], total: 0 }), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			}),
		);

		await listClientShareholders({
			clientId: "c1",
			baseUrl: "https://aml.example",
		});
	});

	it("listClientShareholders uses sub-shareholders path when parent set", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async (url: RequestInfo | URL) => {
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.pathname).toBe(
					"/api/v1/clients/c1/shareholders/p1/sub-shareholders",
				);
				return new Response(JSON.stringify({ data: [], total: 0 }), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			}),
		);

		await listClientShareholders({
			clientId: "c1",
			parentShareholderId: "p1",
			baseUrl: "https://aml.example",
		});
	});

	it("getShareholderById fetches single shareholder", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async (url: RequestInfo | URL) => {
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.pathname).toBe("/api/v1/clients/c1/shareholders/s1");
				return new Response(
					JSON.stringify({
						id: "s1",
						clientId: "c1",
						entityType: "PERSON",
						ownershipPercentage: 10,
						createdAt: "",
						updatedAt: "",
					}),
					{
						status: 200,
						headers: { "content-type": "application/json" },
					},
				);
			}),
		);

		const sh = await getShareholderById({
			clientId: "c1",
			shareholderId: "s1",
			baseUrl: "https://aml.example",
		});
		expect(sh.id).toBe("s1");
	});
});
