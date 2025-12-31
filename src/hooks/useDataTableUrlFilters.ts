"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useEffect } from "react";
import type { SortState } from "@/components/data-table/types";

/**
 * URL parameter keys for DataTable state
 */
const URL_PARAMS = {
	SEARCH: "q",
	SORT_FIELD: "sort",
	SORT_DIR: "dir",
	FILTER_PREFIX: "f_",
} as const;

/**
 * Maximum lengths for security
 */
const MAX_SEARCH_LENGTH = 256;
const MAX_FILTER_VALUE_LENGTH = 128;
const MAX_FILTER_VALUES = 20;

/**
 * Sanitize a string value - removes control characters and limits length
 */
function sanitizeString(value: string, maxLength: number): string {
	return String(value)
		.trim()
		.slice(0, maxLength)
		.replace(/[\x00-\x1F\x7F]/g, "");
}

/**
 * Parse filters from URL search params
 */
function parseFiltersFromUrl(
	searchParams: URLSearchParams,
	allowedFilterIds: string[],
): Record<string, string[]> {
	const filters: Record<string, string[]> = {};

	for (const filterId of allowedFilterIds) {
		const paramKey = URL_PARAMS.FILTER_PREFIX + filterId;
		const rawValue = searchParams.get(paramKey);

		if (rawValue) {
			try {
				// Try to parse as JSON array
				if (rawValue.startsWith("[")) {
					const parsed = JSON.parse(rawValue);
					if (Array.isArray(parsed)) {
						filters[filterId] = parsed
							.slice(0, MAX_FILTER_VALUES)
							.map((v) => sanitizeString(String(v), MAX_FILTER_VALUE_LENGTH))
							.filter(Boolean);
						continue;
					}
				}
			} catch {
				// Not JSON, treat as single value
			}

			// Single value
			const sanitized = sanitizeString(rawValue, MAX_FILTER_VALUE_LENGTH);
			if (sanitized) {
				filters[filterId] = [sanitized];
			}
		}
	}

	return filters;
}

/**
 * Parse search query from URL
 */
function parseSearchFromUrl(searchParams: URLSearchParams): string {
	const raw = searchParams.get(URL_PARAMS.SEARCH);
	return raw ? sanitizeString(raw, MAX_SEARCH_LENGTH) : "";
}

/**
 * Parse sort state from URL
 */
function parseSortFromUrl(
	searchParams: URLSearchParams,
): SortState | undefined {
	const field = searchParams.get(URL_PARAMS.SORT_FIELD);
	const dir = searchParams.get(URL_PARAMS.SORT_DIR);

	if (field) {
		return {
			field: sanitizeString(field, 64),
			direction: dir === "asc" ? "asc" : "desc",
		};
	}

	return undefined;
}

/**
 * Hook for DataTable URL-based state persistence
 *
 * Provides:
 * - Initial state from URL for DataTable
 * - Callbacks to update URL when state changes
 * - Automatic serialization/deserialization with security sanitization
 */
export function useDataTableUrlFilters(allowedFilterIds: string[]) {
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const router = useRouter();
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	// Store latest searchParams in ref to avoid stale closure in setTimeout
	const searchParamsRef = useRef(searchParams);

	// Keep ref in sync with latest searchParams
	useEffect(() => {
		searchParamsRef.current = searchParams;
	}, [searchParams]);

	// Parse initial state from URL
	const initialState = useMemo(
		() => ({
			filters: parseFiltersFromUrl(searchParams, allowedFilterIds),
			search: parseSearchFromUrl(searchParams),
			sort: parseSortFromUrl(searchParams),
		}),
		// Only compute on mount - subsequent updates go through callbacks
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[],
	);

	// Build updated URL with new state
	const buildUrl = useCallback(
		(
			updates: {
				filters?: Record<string, string[]>;
				search?: string;
				sort?: SortState;
			},
			current: URLSearchParams,
		) => {
			const params = new URLSearchParams(current.toString());

			// Update search
			if (updates.search !== undefined) {
				if (updates.search) {
					params.set(URL_PARAMS.SEARCH, updates.search);
				} else {
					params.delete(URL_PARAMS.SEARCH);
				}
			}

			// Update sort
			if (updates.sort !== undefined) {
				if (updates.sort.field) {
					params.set(URL_PARAMS.SORT_FIELD, updates.sort.field);
					params.set(URL_PARAMS.SORT_DIR, updates.sort.direction);
				} else {
					params.delete(URL_PARAMS.SORT_FIELD);
					params.delete(URL_PARAMS.SORT_DIR);
				}
			}

			// Update filters
			if (updates.filters !== undefined) {
				// Clear existing filter params
				for (const filterId of allowedFilterIds) {
					params.delete(URL_PARAMS.FILTER_PREFIX + filterId);
				}

				// Add new filter params
				for (const [filterId, values] of Object.entries(updates.filters)) {
					if (!allowedFilterIds.includes(filterId) || values.length === 0)
						continue;

					if (values.length === 1) {
						params.set(URL_PARAMS.FILTER_PREFIX + filterId, values[0]);
					} else {
						params.set(
							URL_PARAMS.FILTER_PREFIX + filterId,
							JSON.stringify(values),
						);
					}
				}
			}

			const queryString = params.toString();
			return queryString ? `${pathname}?${queryString}` : pathname;
		},
		[pathname, allowedFilterIds],
	);

	// Debounced URL update
	const updateUrl = useCallback(
		(updates: {
			filters?: Record<string, string[]>;
			search?: string;
			sort?: SortState;
		}) => {
			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
			}

			debounceRef.current = setTimeout(() => {
				// Read fresh searchParams from ref to avoid stale closure
				const newUrl = buildUrl(updates, searchParamsRef.current);
				router.replace(newUrl, { scroll: false });
			}, 300);
		},
		[buildUrl, router],
	);

	// Callbacks for DataTable
	const handleFiltersChange = useCallback(
		(filters: Record<string, string[]>) => {
			updateUrl({ filters });
		},
		[updateUrl],
	);

	const handleSearchChange = useCallback(
		(search: string) => {
			updateUrl({ search });
		},
		[updateUrl],
	);

	const handleSortChange = useCallback(
		(sort: SortState) => {
			updateUrl({ sort });
		},
		[updateUrl],
	);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
			}
		};
	}, []);

	return {
		// Initial state from URL
		initialFilters: initialState.filters,
		initialSearch: initialState.search,
		initialSort: initialState.sort,
		// Callbacks for DataTable
		onFiltersChange: handleFiltersChange,
		onSearchChange: handleSearchChange,
		onSortChange: handleSortChange,
	};
}
