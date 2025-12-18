import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { fetchCatalogEntries } from "./catalogs";

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

		fetchMock.mockResolvedValueOnce({
			ok: true,
			json: async () => mockResponse,
		});

		const result = await fetchCatalogEntries("test-catalog");

		expect(result).toEqual(mockResponse);
		expect(fetchMock).toHaveBeenCalledWith(
			"https://aml-bff.example.com/api/v1/catalogs/test-catalog",
			expect.objectContaining({
				headers: {
					"Content-Type": "application/json",
				},
			}),
		);
	});

	it("includes query parameters when provided", async () => {
		const mockResponse = {
			catalog: { id: "1", key: "test-catalog", name: "Test Catalog" },
			data: [],
			pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
		};

		fetchMock.mockResolvedValueOnce({
			ok: true,
			json: async () => mockResponse,
		});

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

		fetchMock.mockResolvedValueOnce({
			ok: true,
			json: async () => mockResponse,
		});

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
		fetchMock.mockResolvedValueOnce({
			ok: false,
			status: 404,
		});

		await expect(fetchCatalogEntries("nonexistent-catalog")).rejects.toThrow(
			'No se pudo consultar el catálogo "nonexistent-catalog".',
		);
	});

	it("passes through requestInit options", async () => {
		const mockResponse = {
			catalog: { id: "1", key: "test-catalog", name: "Test Catalog" },
			data: [],
			pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
		};

		fetchMock.mockResolvedValueOnce({
			ok: true,
			json: async () => mockResponse,
		});

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
});
