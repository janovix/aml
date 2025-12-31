import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { fetchCatalogEntries, createCatalogItem } from "./catalogs";

describe("catalogs", () => {
	let fetchMock: ReturnType<typeof vi.fn>;
	let previousAmlCoreUrl: string | undefined;

	beforeEach(() => {
		previousAmlCoreUrl = process.env.NEXT_PUBLIC_AML_CORE_URL;
		process.env.NEXT_PUBLIC_AML_CORE_URL = "https://aml-bff.example.com/";

		fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);
	});

	afterEach(() => {
		process.env.NEXT_PUBLIC_AML_CORE_URL = previousAmlCoreUrl;
		vi.restoreAllMocks();
	});

	it("fetches catalog entries successfully", async () => {
		const mockResponse = {
			catalog: { id: "1", key: "test-catalog", name: "Test Catalog" },
			data: [
				{
					id: "1",
					catalogId: "1",
					name: "Item 1",
					normalizedName: "item-1",
					active: true,
					createdAt: "2024-01-01",
					updatedAt: "2024-01-01",
				},
			],
			pagination: {
				page: 1,
				pageSize: 10,
				total: 1,
				totalPages: 1,
			},
		};

		fetchMock.mockResolvedValueOnce(
			new Response(JSON.stringify(mockResponse), {
				status: 200,
				headers: { "content-type": "application/json" },
			}),
		);

		const result = await fetchCatalogEntries("test-catalog");

		expect(result).toEqual(mockResponse);
		expect(fetchMock).toHaveBeenCalledWith(
			"https://aml-bff.example.com/api/v1/catalogs/test-catalog",
			expect.objectContaining({
				headers: expect.objectContaining({
					"Content-Type": "application/json",
					accept: "application/json",
				}),
			}),
		);
	});

	it("includes query parameters when provided", async () => {
		const mockResponse = {
			catalog: { id: "1", key: "test-catalog", name: "Test Catalog" },
			data: [],
			pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
		};

		fetchMock.mockResolvedValueOnce(
			new Response(JSON.stringify(mockResponse), {
				status: 200,
				headers: { "content-type": "application/json" },
			}),
		);

		await fetchCatalogEntries("test-catalog", {
			page: 2,
			pageSize: 20,
			search: "test",
		});

		expect(fetchMock).toHaveBeenCalledWith(
			"https://aml-bff.example.com/api/v1/catalogs/test-catalog?page=2&pageSize=20&search=test",
			expect.any(Object),
		);
	});

	it("includes extra query parameters", async () => {
		const mockResponse = {
			catalog: { id: "1", key: "test-catalog", name: "Test Catalog" },
			data: [],
			pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
		};

		fetchMock.mockResolvedValueOnce(
			new Response(JSON.stringify(mockResponse), {
				status: 200,
				headers: { "content-type": "application/json" },
			}),
		);

		await fetchCatalogEntries("test-catalog", {
			extra: { status: "active", type: "test" },
		});

		expect(fetchMock).toHaveBeenCalledWith(
			expect.stringContaining("status=active"),
			expect.any(Object),
		);
		expect(fetchMock).toHaveBeenCalledWith(
			expect.stringContaining("type=test"),
			expect.any(Object),
		);
	});

	it("throws error when fetch fails", async () => {
		fetchMock.mockResolvedValueOnce(
			new Response(JSON.stringify({ error: "Not found" }), {
				status: 404,
				statusText: "Not Found",
				headers: { "content-type": "application/json" },
			}),
		);

		await expect(fetchCatalogEntries("nonexistent-catalog")).rejects.toThrow(
			'No se pudo consultar el catálogo "nonexistent-catalog"',
		);
	});

	it("passes through requestInit options", async () => {
		const mockResponse = {
			catalog: { id: "1", key: "test-catalog", name: "Test Catalog" },
			data: [],
			pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
		};

		fetchMock.mockResolvedValueOnce(
			new Response(JSON.stringify(mockResponse), {
				status: 200,
				headers: { "content-type": "application/json" },
			}),
		);

		await fetchCatalogEntries("test-catalog", undefined, {
			method: "POST",
			headers: { Authorization: "Bearer token" },
		});

		expect(fetchMock).toHaveBeenCalledWith(
			expect.any(String),
			expect.objectContaining({
				method: "POST",
				headers: expect.objectContaining({
					Authorization: "Bearer token",
					"Content-Type": "application/json",
				}),
			}),
		);
	});

	it("handles error when fetch fails with Error instance", async () => {
		fetchMock.mockRejectedValueOnce(new Error("Network error"));

		await expect(fetchCatalogEntries("test-catalog")).rejects.toThrow(
			'No se pudo consultar el catálogo "test-catalog"',
		);
	});

	it("handles error when fetch fails without Error instance", async () => {
		fetchMock.mockRejectedValueOnce("String error");

		await expect(fetchCatalogEntries("test-catalog")).rejects.toThrow(
			'No se pudo consultar el catálogo "test-catalog".',
		);
	});

	it("handles undefined params", async () => {
		const mockResponse = {
			catalog: { id: "1", key: "test-catalog", name: "Test Catalog" },
			data: [],
			pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
		};

		fetchMock.mockResolvedValueOnce(
			new Response(JSON.stringify(mockResponse), {
				status: 200,
				headers: { "content-type": "application/json" },
			}),
		);

		await fetchCatalogEntries("test-catalog", undefined);

		expect(fetchMock).toHaveBeenCalledWith(
			"https://aml-bff.example.com/api/v1/catalogs/test-catalog",
			expect.any(Object),
		);
	});

	it("skips undefined extra params", async () => {
		const mockResponse = {
			catalog: { id: "1", key: "test-catalog", name: "Test Catalog" },
			data: [],
			pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
		};

		fetchMock.mockResolvedValueOnce(
			new Response(JSON.stringify(mockResponse), {
				status: 200,
				headers: { "content-type": "application/json" },
			}),
		);

		await fetchCatalogEntries("test-catalog", {
			extra: { status: "active", type: undefined },
		});

		expect(fetchMock).toHaveBeenCalledWith(
			expect.stringContaining("status=active"),
			expect.any(Object),
		);
		expect(fetchMock).toHaveBeenCalledWith(
			expect.not.stringContaining("type="),
			expect.any(Object),
		);
	});

	describe("createCatalogItem", () => {
		it("creates catalog item successfully", async () => {
			const mockItem = {
				id: "1",
				catalogId: "1",
				name: "New Item",
				normalizedName: "new-item",
				active: true,
				createdAt: "2024-01-01",
				updatedAt: "2024-01-01",
			};

			fetchMock.mockResolvedValueOnce(
				new Response(JSON.stringify(mockItem), {
					status: 201,
					headers: { "content-type": "application/json" },
				}),
			);

			const result = await createCatalogItem("test-catalog", "New Item");

			expect(result).toEqual(mockItem);
			expect(fetchMock).toHaveBeenCalledWith(
				"https://aml-bff.example.com/api/v1/catalogs/test-catalog/items",
				expect.objectContaining({
					method: "POST",
					headers: expect.objectContaining({
						"Content-Type": "application/json",
					}),
					body: JSON.stringify({ name: "New Item" }),
				}),
			);
		});

		it("throws error when creation fails with Error instance", async () => {
			fetchMock.mockRejectedValueOnce(new Error("Conflict"));

			await expect(
				createCatalogItem("test-catalog", "Duplicate Item"),
			).rejects.toThrow(
				'No se pudo crear el elemento en el catálogo "test-catalog"',
			);
		});

		it("throws error when creation fails without Error instance", async () => {
			fetchMock.mockRejectedValueOnce("String error");

			await expect(
				createCatalogItem("test-catalog", "New Item"),
			).rejects.toThrow(
				'No se pudo crear el elemento en el catálogo "test-catalog".',
			);
		});

		it("passes through requestInit options", async () => {
			const mockItem = {
				id: "1",
				catalogId: "1",
				name: "New Item",
				normalizedName: "new-item",
				active: true,
				createdAt: "2024-01-01",
				updatedAt: "2024-01-01",
			};

			fetchMock.mockResolvedValueOnce(
				new Response(JSON.stringify(mockItem), {
					status: 201,
					headers: { "content-type": "application/json" },
				}),
			);

			await createCatalogItem("test-catalog", "New Item", {
				headers: { Authorization: "Bearer token" },
			});

			expect(fetchMock).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					headers: expect.objectContaining({
						Authorization: "Bearer token",
						"Content-Type": "application/json",
					}),
				}),
			);
		});
	});

	it("handles empty params object", async () => {
		const mockResponse = {
			catalog: { id: "1", key: "test-catalog", name: "Test Catalog" },
			data: [],
			pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
		};

		fetchMock.mockResolvedValueOnce(
			new Response(JSON.stringify(mockResponse), {
				status: 200,
				headers: { "content-type": "application/json" },
			}),
		);

		await fetchCatalogEntries("test-catalog", {});

		expect(fetchMock).toHaveBeenCalledWith(
			"https://aml-bff.example.com/api/v1/catalogs/test-catalog",
			expect.any(Object),
		);
	});

	it("handles params with empty extra object", async () => {
		const mockResponse = {
			catalog: { id: "1", key: "test-catalog", name: "Test Catalog" },
			data: [],
			pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
		};

		fetchMock.mockResolvedValueOnce(
			new Response(JSON.stringify(mockResponse), {
				status: 200,
				headers: { "content-type": "application/json" },
			}),
		);

		await fetchCatalogEntries("test-catalog", { extra: {} });

		expect(fetchMock).toHaveBeenCalledWith(
			"https://aml-bff.example.com/api/v1/catalogs/test-catalog",
			expect.any(Object),
		);
	});

	it("handles params with only page", async () => {
		const mockResponse = {
			catalog: { id: "1", key: "test-catalog", name: "Test Catalog" },
			data: [],
			pagination: { page: 2, pageSize: 10, total: 0, totalPages: 0 },
		};

		fetchMock.mockResolvedValueOnce(
			new Response(JSON.stringify(mockResponse), {
				status: 200,
				headers: { "content-type": "application/json" },
			}),
		);

		await fetchCatalogEntries("test-catalog", { page: 2 });

		expect(fetchMock).toHaveBeenCalledWith(
			"https://aml-bff.example.com/api/v1/catalogs/test-catalog?page=2",
			expect.any(Object),
		);
	});

	it("handles params with only pageSize", async () => {
		const mockResponse = {
			catalog: { id: "1", key: "test-catalog", name: "Test Catalog" },
			data: [],
			pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
		};

		fetchMock.mockResolvedValueOnce(
			new Response(JSON.stringify(mockResponse), {
				status: 200,
				headers: { "content-type": "application/json" },
			}),
		);

		await fetchCatalogEntries("test-catalog", { pageSize: 20 });

		expect(fetchMock).toHaveBeenCalledWith(
			"https://aml-bff.example.com/api/v1/catalogs/test-catalog?pageSize=20",
			expect.any(Object),
		);
	});

	it("handles params with only search", async () => {
		const mockResponse = {
			catalog: { id: "1", key: "test-catalog", name: "Test Catalog" },
			data: [],
			pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
		};

		fetchMock.mockResolvedValueOnce(
			new Response(JSON.stringify(mockResponse), {
				status: 200,
				headers: { "content-type": "application/json" },
			}),
		);

		await fetchCatalogEntries("test-catalog", { search: "test" });

		expect(fetchMock).toHaveBeenCalledWith(
			"https://aml-bff.example.com/api/v1/catalogs/test-catalog?search=test",
			expect.any(Object),
		);
	});

	it("handles extra params with boolean values", async () => {
		const mockResponse = {
			catalog: { id: "1", key: "test-catalog", name: "Test Catalog" },
			data: [],
			pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
		};

		fetchMock.mockResolvedValueOnce(
			new Response(JSON.stringify(mockResponse), {
				status: 200,
				headers: { "content-type": "application/json" },
			}),
		);

		await fetchCatalogEntries("test-catalog", {
			extra: { active: true, archived: false },
		});

		expect(fetchMock).toHaveBeenCalledWith(
			expect.stringContaining("active=true"),
			expect.any(Object),
		);
		expect(fetchMock).toHaveBeenCalledWith(
			expect.stringContaining("archived=false"),
			expect.any(Object),
		);
	});

	it("handles extra params with number values", async () => {
		const mockResponse = {
			catalog: { id: "1", key: "test-catalog", name: "Test Catalog" },
			data: [],
			pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
		};

		fetchMock.mockResolvedValueOnce(
			new Response(JSON.stringify(mockResponse), {
				status: 200,
				headers: { "content-type": "application/json" },
			}),
		);

		await fetchCatalogEntries("test-catalog", {
			extra: { categoryId: 123, limit: 50 },
		});

		expect(fetchMock).toHaveBeenCalledWith(
			expect.stringContaining("categoryId=123"),
			expect.any(Object),
		);
		expect(fetchMock).toHaveBeenCalledWith(
			expect.stringContaining("limit=50"),
			expect.any(Object),
		);
	});
});
