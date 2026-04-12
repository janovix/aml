import { describe, expect, it, vi, afterEach } from "vitest";
import {
	createShareholder,
	deleteShareholder,
	getShareholderById,
	listClientShareholders,
	patchShareholder,
	updateShareholder,
} from "./shareholders";
import type { ShareholderCreateRequest } from "@/types/shareholder";

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

	it("createShareholder posts JSON body", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.pathname).toBe("/api/v1/clients/c1/shareholders");
				expect(init?.method?.toUpperCase()).toBe("POST");
				expect(JSON.parse(String(init?.body))).toMatchObject({
					entityType: "PERSON",
				});
				return new Response(
					JSON.stringify({
						id: "new",
						clientId: "c1",
						entityType: "PERSON",
						ownershipPercentage: 5,
						createdAt: "",
						updatedAt: "",
					}),
					{ status: 200, headers: { "content-type": "application/json" } },
				);
			}),
		);

		const input: ShareholderCreateRequest = {
			entityType: "PERSON",
			ownershipPercentage: 5,
		};
		const sh = await createShareholder({
			clientId: "c1",
			baseUrl: "https://aml.example",
			input,
		});
		expect(sh.id).toBe("new");
	});

	it("updateShareholder sends PUT", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.pathname).toBe("/api/v1/clients/c1/shareholders/s1");
				expect(init?.method?.toUpperCase()).toBe("PUT");
				return new Response(
					JSON.stringify({
						id: "s1",
						clientId: "c1",
						entityType: "PERSON",
						ownershipPercentage: 9,
						createdAt: "",
						updatedAt: "",
					}),
					{ status: 200, headers: { "content-type": "application/json" } },
				);
			}),
		);

		const upd: ShareholderCreateRequest = {
			entityType: "PERSON",
			ownershipPercentage: 9,
		};
		const sh = await updateShareholder({
			clientId: "c1",
			shareholderId: "s1",
			baseUrl: "https://aml.example",
			input: upd,
		});
		expect(sh.ownershipPercentage).toBe(9);
	});

	it("patchShareholder sends PATCH", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
				expect(init?.method?.toUpperCase()).toBe("PATCH");
				return new Response(
					JSON.stringify({
						id: "s1",
						clientId: "c1",
						entityType: "PERSON",
						ownershipPercentage: 11,
						createdAt: "",
						updatedAt: "",
					}),
					{ status: 200, headers: { "content-type": "application/json" } },
				);
			}),
		);

		const sh = await patchShareholder({
			clientId: "c1",
			shareholderId: "s1",
			baseUrl: "https://aml.example",
			input: { ownershipPercentage: 11 },
		});
		expect(sh.ownershipPercentage).toBe(11);
	});

	it("deleteShareholder sends DELETE", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.pathname).toBe("/api/v1/clients/c1/shareholders/s1");
				expect(init?.method?.toUpperCase()).toBe("DELETE");
				return new Response(null, { status: 204 });
			}),
		);

		await deleteShareholder({
			clientId: "c1",
			shareholderId: "s1",
			baseUrl: "https://aml.example",
		});
	});
});
