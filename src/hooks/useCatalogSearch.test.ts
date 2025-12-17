import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import type { CatalogItem, CatalogResponse } from "@/types/catalog";
import { useCatalogSearch } from "./useCatalogSearch";

const buildResponse = (data: CatalogItem[]): CatalogResponse => ({
	catalog: {
		id: "cat-1",
		key: "vehicle-brands",
		name: "Vehicle Brands",
	},
	data,
	pagination: {
		page: 1,
		pageSize: 25,
		total: data.length,
		totalPages: 1,
	},
});

const sampleItems: CatalogItem[] = [
	{
		id: "brand-1",
		catalogId: "cat-1",
		name: "Toyota",
		normalizedName: "toyota",
		active: true,
		metadata: {},
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: "brand-2",
		catalogId: "cat-1",
		name: "Nissan",
		normalizedName: "nissan",
		active: true,
		metadata: {},
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
];

const mockFetch = vi.fn();

beforeEach(() => {
	mockFetch.mockReset();
	global.fetch = mockFetch as unknown as typeof fetch;
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe("useCatalogSearch", () => {
	it("fetches catalog data on mount", async () => {
		mockFetch.mockResolvedValue({
			ok: true,
			json: async () => buildResponse(sampleItems),
		});

		const { result } = renderHook(() =>
			useCatalogSearch({ catalogKey: "vehicle-brands", debounceMs: 0 }),
		);

		await waitFor(() => expect(result.current.loading).toBe(false));

		expect(result.current.items).toHaveLength(2);
		expect(mockFetch).toHaveBeenCalledTimes(1);
		expect(mockFetch.mock.calls[0][0]).toContain("/vehicle-brands");
	});

	it("updates results when the search term changes", async () => {
		mockFetch
			.mockResolvedValueOnce({
				ok: true,
				json: async () => buildResponse(sampleItems),
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => buildResponse([sampleItems[0]]),
			});

		const { result } = renderHook(() =>
			useCatalogSearch({ catalogKey: "vehicle-brands", debounceMs: 0 }),
		);

		await waitFor(() => expect(result.current.loading).toBe(false));

		act(() => {
			result.current.setSearchTerm("toy");
		});

		await waitFor(() => expect(result.current.items).toHaveLength(1));

		expect(result.current.items[0].name).toBe("Toyota");
		expect(mockFetch).toHaveBeenCalledTimes(2);
		expect(mockFetch.mock.calls[1][0]).toContain("search=toy");
	});
});
