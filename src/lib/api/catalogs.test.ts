import { describe, it, expect, vi, afterEach } from "vitest";
import { listCatalogItems, getCatalogItem } from "./catalogs";

describe("api/catalogs", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("listCatalogItems calls correct URL with catalogKey", async () => {
		const mockResponse = {
			catalog: {
				id: "cat-1",
				key: "states",
				name: "Estados",
				allowNewItems: false,
			},
			data: [
				{
					id: "1",
					catalogId: "cat-1",
					name: "Nuevo León",
					normalizedName: "nuevo leon",
					active: true,
					metadata: { code: "NL" },
					createdAt: "2024-01-01",
					updatedAt: "2024-01-01",
				},
			],
			pagination: { page: 1, pageSize: 10, total: 1, totalPages: 1 },
		};

		vi.stubGlobal(
			"fetch",
			vi.fn(async (url: RequestInfo | URL) => {
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.pathname).toBe("/api/v1/catalogs/states");
				return new Response(JSON.stringify(mockResponse), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			}),
		);

		const res = await listCatalogItems({
			catalogKey: "states",
			baseUrl: "https://example.com",
		});
		expect(res.data).toHaveLength(1);
		expect(res.catalog.key).toBe("states");
	});

	it("listCatalogItems sets activeOnly query param", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async (url: RequestInfo | URL) => {
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.searchParams.get("activeOnly")).toBe("true");
				return new Response(
					JSON.stringify({
						catalog: {},
						data: [],
						pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
					}),
					{ status: 200, headers: { "content-type": "application/json" } },
				);
			}),
		);

		await listCatalogItems({
			catalogKey: "states",
			activeOnly: true,
			baseUrl: "https://example.com",
		});
	});

	it("listCatalogItems sets page and pageSize", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async (url: RequestInfo | URL) => {
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.searchParams.get("page")).toBe("2");
				expect(u.searchParams.get("pageSize")).toBe("50");
				return new Response(
					JSON.stringify({
						catalog: {},
						data: [],
						pagination: { page: 2, pageSize: 50, total: 0, totalPages: 0 },
					}),
					{ status: 200, headers: { "content-type": "application/json" } },
				);
			}),
		);

		await listCatalogItems({
			catalogKey: "states",
			page: 2,
			pageSize: 50,
			baseUrl: "https://example.com",
		});
	});

	it("getCatalogItem calls correct URL", async () => {
		const mockItem = {
			id: "item-1",
			catalogId: "cat-1",
			name: "Nuevo León",
			normalizedName: "nuevo leon",
			active: true,
			metadata: { code: "NL" },
			createdAt: "2024-01-01",
			updatedAt: "2024-01-01",
		};

		vi.stubGlobal(
			"fetch",
			vi.fn(async (url: RequestInfo | URL) => {
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.pathname).toBe("/api/v1/catalogs/states/items/item-1");
				return new Response(JSON.stringify(mockItem), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			}),
		);

		const res = await getCatalogItem({
			catalogKey: "states",
			itemId: "item-1",
			baseUrl: "https://example.com",
		});
		expect(res.name).toBe("Nuevo León");
	});

	it("listCatalogItems passes JWT", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
				const headers = init?.headers as Record<string, string> | undefined;
				expect(headers?.Authorization).toBe("Bearer test-jwt");
				return new Response(
					JSON.stringify({
						catalog: {},
						data: [],
						pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
					}),
					{ status: 200, headers: { "content-type": "application/json" } },
				);
			}),
		);

		await listCatalogItems({
			catalogKey: "states",
			baseUrl: "https://example.com",
			jwt: "test-jwt",
		});
	});

	it("listCatalogItems omits optional params", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async (url: RequestInfo | URL) => {
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.searchParams.has("activeOnly")).toBe(false);
				expect(u.searchParams.has("page")).toBe(false);
				expect(u.searchParams.has("pageSize")).toBe(false);
				return new Response(
					JSON.stringify({
						catalog: {},
						data: [],
						pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
					}),
					{ status: 200, headers: { "content-type": "application/json" } },
				);
			}),
		);

		await listCatalogItems({
			catalogKey: "states",
			baseUrl: "https://example.com",
		});
	});
});
