import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import type { CatalogItem, CatalogResponse } from "@/types/catalog";
import { useCatalogSearch } from "./useCatalogSearch";

const buildResponse = (
	data: CatalogItem[],
	options?: { allowNewItems?: boolean; page?: number; totalPages?: number },
): CatalogResponse => ({
	catalog: {
		id: "cat-1",
		key: "vehicle-brands",
		name: "Vehicle Brands",
		allowNewItems: options?.allowNewItems ?? false,
	},
	data,
	pagination: {
		page: options?.page ?? 1,
		pageSize: 25,
		total: data.length,
		totalPages: options?.totalPages ?? 1,
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
let previousAmlCoreUrl: string | undefined;

beforeEach(() => {
	previousAmlCoreUrl = process.env.NEXT_PUBLIC_AML_CORE_URL;
	process.env.NEXT_PUBLIC_AML_CORE_URL = "https://aml-bff.example.com";
	mockFetch.mockReset();
	global.fetch = mockFetch as unknown as typeof fetch;
});

afterEach(() => {
	process.env.NEXT_PUBLIC_AML_CORE_URL = previousAmlCoreUrl;
	vi.restoreAllMocks();
});

describe("useCatalogSearch", () => {
	it("fetches catalog data on mount", async () => {
		mockFetch.mockResolvedValue(
			new Response(JSON.stringify(buildResponse(sampleItems)), {
				status: 200,
				headers: { "content-type": "application/json" },
			}),
		);

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
			.mockResolvedValueOnce(
				new Response(JSON.stringify(buildResponse(sampleItems)), {
					status: 200,
					headers: { "content-type": "application/json" },
				}),
			)
			.mockResolvedValueOnce(
				new Response(JSON.stringify(buildResponse([sampleItems[0]])), {
					status: 200,
					headers: { "content-type": "application/json" },
				}),
			);

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
			.mockResolvedValueOnce(
				new Response(
					JSON.stringify({
						...buildResponse(page1Items),
						pagination: {
							page: 1,
							pageSize: 2,
							total: 3,
							totalPages: 2,
						},
					}),
					{
						status: 200,
						headers: { "content-type": "application/json" },
					},
				),
			)
			.mockResolvedValueOnce(
				new Response(
					JSON.stringify({
						...buildResponse(page2Items),
						pagination: {
							page: 2,
							pageSize: 2,
							total: 3,
							totalPages: 2,
						},
					}),
					{
						status: 200,
						headers: { "content-type": "application/json" },
					},
				),
			);

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
		mockFetch.mockResolvedValue(
			new Response(
				JSON.stringify({
					...buildResponse(sampleItems),
					pagination: {
						page: 1,
						pageSize: 2,
						total: 5,
						totalPages: 3,
					},
				}),
				{
					status: 200,
					headers: { "content-type": "application/json" },
				},
			),
		);

		const { result } = renderHook(() =>
			useCatalogSearch({ catalogKey: "vehicle-brands", debounceMs: 0 }),
		);

		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.hasMore).toBe(true);
		expect(result.current.pagination?.totalPages).toBe(3);
	});

	it("does not load more if no more pages available", async () => {
		mockFetch.mockResolvedValue(
			new Response(
				JSON.stringify({
					...buildResponse(sampleItems),
					pagination: {
						page: 1,
						pageSize: 2,
						total: 2,
						totalPages: 1,
					},
				}),
				{
					status: 200,
					headers: { "content-type": "application/json" },
				},
			),
		);

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
			.mockResolvedValueOnce(
				new Response(
					JSON.stringify({
						...buildResponse(page1Items),
						pagination: {
							page: 1,
							pageSize: 2,
							total: 3,
							totalPages: 2,
						},
					}),
					{
						status: 200,
						headers: { "content-type": "application/json" },
					},
				),
			)
			.mockResolvedValueOnce(
				new Response(
					JSON.stringify({
						...buildResponse(page2Items),
						pagination: {
							page: 2,
							pageSize: 2,
							total: 3,
							totalPages: 2,
						},
					}),
					{
						status: 200,
						headers: { "content-type": "application/json" },
					},
				),
			)
			.mockResolvedValueOnce(
				new Response(
					JSON.stringify({
						...buildResponse([page1Items[0]]),
						pagination: {
							page: 1,
							pageSize: 2,
							total: 1,
							totalPages: 1,
						},
					}),
					{
						status: 200,
						headers: { "content-type": "application/json" },
					},
				),
			);

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
			.mockResolvedValueOnce(
				new Response(
					JSON.stringify({
						...buildResponse(sampleItems),
						pagination: {
							page: 1,
							pageSize: 2,
							total: 4,
							totalPages: 2,
						},
					}),
					{
						status: 200,
						headers: { "content-type": "application/json" },
					},
				),
			)
			.mockRejectedValueOnce(new Error("Network error"));

		const { result } = renderHook(() =>
			useCatalogSearch({ catalogKey: "vehicle-brands", debounceMs: 0 }),
		);

		await waitFor(() => expect(result.current.loading).toBe(false));

		await act(async () => {
			await result.current.loadMore();
		});

		await waitFor(() => expect(result.current.loadingMore).toBe(false));
		expect(result.current.error).toContain("Network error");
		expect(result.current.items).toHaveLength(2); // Should not have added items
	});

	it("returns catalog info with allowNewItems flag", async () => {
		mockFetch.mockResolvedValue(
			new Response(
				JSON.stringify(buildResponse(sampleItems, { allowNewItems: true })),
				{
					status: 200,
					headers: { "content-type": "application/json" },
				},
			),
		);

		const { result } = renderHook(() =>
			useCatalogSearch({ catalogKey: "vehicle-brands", debounceMs: 0 }),
		);

		await waitFor(() => expect(result.current.loading).toBe(false));

		expect(result.current.catalog).not.toBeNull();
		expect(result.current.catalog?.allowNewItems).toBe(true);
		expect(result.current.catalog?.key).toBe("vehicle-brands");
	});

	it("returns catalog info with allowNewItems false by default", async () => {
		mockFetch.mockResolvedValue(
			new Response(JSON.stringify(buildResponse(sampleItems)), {
				status: 200,
				headers: { "content-type": "application/json" },
			}),
		);

		const { result } = renderHook(() =>
			useCatalogSearch({ catalogKey: "vehicle-brands", debounceMs: 0 }),
		);

		await waitFor(() => expect(result.current.loading).toBe(false));

		expect(result.current.catalog).not.toBeNull();
		expect(result.current.catalog?.allowNewItems).toBe(false);
	});

	it("does not fetch when enabled is false", async () => {
		const { result } = renderHook(() =>
			useCatalogSearch({
				catalogKey: "vehicle-brands",
				debounceMs: 0,
				enabled: false,
			}),
		);

		// Wait a bit to make sure no fetch is made
		await new Promise((resolve) => setTimeout(resolve, 100));

		expect(mockFetch).not.toHaveBeenCalled();
		expect(result.current.loading).toBe(false);
		expect(result.current.items).toHaveLength(0);
	});

	it("does not update when search term is same after trim", async () => {
		mockFetch.mockResolvedValue(
			new Response(JSON.stringify(buildResponse(sampleItems)), {
				status: 200,
				headers: { "content-type": "application/json" },
			}),
		);

		const { result } = renderHook(() =>
			useCatalogSearch({
				catalogKey: "vehicle-brands",
				debounceMs: 0,
				initialSearch: "test",
			}),
		);

		await waitFor(() => expect(result.current.loading).toBe(false));

		const initialCallCount = mockFetch.mock.calls.length;

		// Set same search term with spaces - should not trigger new fetch
		act(() => {
			result.current.setSearchTerm("  test  ");
		});

		await new Promise((resolve) => setTimeout(resolve, 100));

		// Should not have made additional calls
		expect(mockFetch.mock.calls.length).toBe(initialCallCount);
	});

	it("handles non-Error exception in loadMore", async () => {
		mockFetch
			.mockResolvedValueOnce(
				new Response(
					JSON.stringify({
						...buildResponse(sampleItems),
						pagination: {
							page: 1,
							pageSize: 2,
							total: 4,
							totalPages: 2,
						},
					}),
					{
						status: 200,
						headers: { "content-type": "application/json" },
					},
				),
			)
			.mockRejectedValueOnce("String error");

		const { result } = renderHook(() =>
			useCatalogSearch({ catalogKey: "vehicle-brands", debounceMs: 0 }),
		);

		await waitFor(() => expect(result.current.loading).toBe(false));

		await act(async () => {
			await result.current.loadMore();
		});

		await waitFor(() => expect(result.current.loadingMore).toBe(false));
		expect(result.current.error).toBeTruthy();
	});

	it("does not load more when already loading", async () => {
		mockFetch.mockResolvedValue(
			new Response(
				JSON.stringify({
					...buildResponse(sampleItems),
					pagination: {
						page: 1,
						pageSize: 2,
						total: 4,
						totalPages: 2,
					},
				}),
				{
					status: 200,
					headers: { "content-type": "application/json" },
				},
			),
		);

		const { result } = renderHook(() =>
			useCatalogSearch({ catalogKey: "vehicle-brands", debounceMs: 0 }),
		);

		// Call loadMore while still loading initial data
		await act(async () => {
			await result.current.loadMore();
		});

		// Should only have the initial fetch call
		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(mockFetch).toHaveBeenCalledTimes(1);
	});

	it("triggers reload correctly", async () => {
		mockFetch.mockResolvedValue(
			new Response(JSON.stringify(buildResponse(sampleItems)), {
				status: 200,
				headers: { "content-type": "application/json" },
			}),
		);

		const { result } = renderHook(() =>
			useCatalogSearch({ catalogKey: "vehicle-brands", debounceMs: 0 }),
		);

		await waitFor(() => expect(result.current.loading).toBe(false));

		const initialCallCount = mockFetch.mock.calls.length;

		act(() => {
			result.current.reload();
		});

		await waitFor(() => expect(result.current.loading).toBe(false));

		// Should have made an additional fetch call
		expect(mockFetch.mock.calls.length).toBeGreaterThan(initialCallCount);
	});

	it("handles fetch error with no message", async () => {
		mockFetch.mockRejectedValueOnce({});

		const { result } = renderHook(() =>
			useCatalogSearch({ catalogKey: "vehicle-brands", debounceMs: 0 }),
		);

		await waitFor(() => expect(result.current.loading).toBe(false));

		expect(result.current.error).toContain("catálogo");
		expect(result.current.items).toHaveLength(0);
	});

	it("handles abort error gracefully", async () => {
		const abortError = new Error("Aborted");
		abortError.name = "AbortError";
		mockFetch.mockRejectedValueOnce(abortError);

		const { result, unmount } = renderHook(() =>
			useCatalogSearch({ catalogKey: "vehicle-brands", debounceMs: 0 }),
		);

		// Unmount immediately to trigger abort
		unmount();

		// The error should not be set for abort errors
		expect(result.current.error).toBeNull();
	});

	it("does not load more when pagination is null", async () => {
		mockFetch.mockResolvedValue(
			new Response(JSON.stringify(buildResponse([])), {
				status: 200,
				headers: { "content-type": "application/json" },
			}),
		);

		const { result } = renderHook(() =>
			useCatalogSearch({ catalogKey: "vehicle-brands", debounceMs: 0 }),
		);

		await waitFor(() => expect(result.current.loading).toBe(false));

		const initialCallCount = mockFetch.mock.calls.length;

		await act(async () => {
			await result.current.loadMore();
		});

		// Should not have made additional calls
		expect(mockFetch.mock.calls.length).toBe(initialCallCount);
		expect(result.current.hasMore).toBe(false);
	});
});
