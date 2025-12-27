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

	it("loads more pages when loadMore is called", async () => {
		const page1Items = sampleItems;
		const page2Items: CatalogItem[] = [
			{
				id: "brand-3",
				catalogId: "cat-1",
				name: "Honda",
				normalizedName: "honda",
				active: true,
				metadata: {},
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
			},
		];

		mockFetch
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					...buildResponse(page1Items),
					pagination: {
						page: 1,
						pageSize: 2,
						total: 3,
						totalPages: 2,
					},
				}),
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					...buildResponse(page2Items),
					pagination: {
						page: 2,
						pageSize: 2,
						total: 3,
						totalPages: 2,
					},
				}),
			});

		const { result } = renderHook(() =>
			useCatalogSearch({ catalogKey: "vehicle-brands", debounceMs: 0 }),
		);

		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.items).toHaveLength(2);
		expect(result.current.hasMore).toBe(true);

		await act(async () => {
			await result.current.loadMore();
		});

		await waitFor(() => expect(result.current.loadingMore).toBe(false));
		expect(result.current.items).toHaveLength(3);
		expect(result.current.items[2].name).toBe("Honda");
		expect(mockFetch).toHaveBeenCalledTimes(2);
		expect(mockFetch.mock.calls[1][0]).toContain("page=2");
	});

	it("has correct hasMore value based on pagination", async () => {
		mockFetch.mockResolvedValue({
			ok: true,
			json: async () => ({
				...buildResponse(sampleItems),
				pagination: {
					page: 1,
					pageSize: 2,
					total: 5,
					totalPages: 3,
				},
			}),
		});

		const { result } = renderHook(() =>
			useCatalogSearch({ catalogKey: "vehicle-brands", debounceMs: 0 }),
		);

		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.hasMore).toBe(true);
		expect(result.current.pagination?.totalPages).toBe(3);
	});

	it("does not load more if no more pages available", async () => {
		mockFetch.mockResolvedValue({
			ok: true,
			json: async () => ({
				...buildResponse(sampleItems),
				pagination: {
					page: 1,
					pageSize: 2,
					total: 2,
					totalPages: 1,
				},
			}),
		});

		const { result } = renderHook(() =>
			useCatalogSearch({ catalogKey: "vehicle-brands", debounceMs: 0 }),
		);

		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.hasMore).toBe(false);

		const initialCallCount = mockFetch.mock.calls.length;

		await act(async () => {
			await result.current.loadMore();
		});

		// Should not make additional fetch calls
		expect(mockFetch.mock.calls.length).toBe(initialCallCount);
	});

	it("resets to page 1 when search term changes", async () => {
		const page1Items = sampleItems;
		const page2Items: CatalogItem[] = [
			{
				id: "brand-3",
				catalogId: "cat-1",
				name: "Honda",
				normalizedName: "honda",
				active: true,
				metadata: {},
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
			},
		];

		mockFetch
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					...buildResponse(page1Items),
					pagination: {
						page: 1,
						pageSize: 2,
						total: 3,
						totalPages: 2,
					},
				}),
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					...buildResponse(page2Items),
					pagination: {
						page: 2,
						pageSize: 2,
						total: 3,
						totalPages: 2,
					},
				}),
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					...buildResponse([page1Items[0]]),
					pagination: {
						page: 1,
						pageSize: 2,
						total: 1,
						totalPages: 1,
					},
				}),
			});

		const { result } = renderHook(() =>
			useCatalogSearch({ catalogKey: "vehicle-brands", debounceMs: 0 }),
		);

		await waitFor(() => expect(result.current.loading).toBe(false));

		// Load page 2
		await act(async () => {
			await result.current.loadMore();
		});

		await waitFor(() => expect(result.current.loadingMore).toBe(false));
		expect(result.current.items).toHaveLength(3);

		// Change search term - should reset to page 1
		act(() => {
			result.current.setSearchTerm("toy");
		});

		await waitFor(() => expect(result.current.items).toHaveLength(1));
		expect(result.current.items[0].name).toBe("Toyota");
	});

	it("handles errors when loading more pages", async () => {
		mockFetch
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					...buildResponse(sampleItems),
					pagination: {
						page: 1,
						pageSize: 2,
						total: 4,
						totalPages: 2,
					},
				}),
			})
			.mockRejectedValueOnce(new Error("Network error"));

		const { result } = renderHook(() =>
			useCatalogSearch({ catalogKey: "vehicle-brands", debounceMs: 0 }),
		);

		await waitFor(() => expect(result.current.loading).toBe(false));

		await act(async () => {
			await result.current.loadMore();
		});

		await waitFor(() => expect(result.current.loadingMore).toBe(false));
		expect(result.current.error).toBe("Network error");
		expect(result.current.items).toHaveLength(2); // Should not have added items
	});
});
