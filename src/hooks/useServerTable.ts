"use client";

/**
 * useServerTable – generic hook that centralises all server-side data fetching,
 * filter/search/sort state management, URL persistence, pagination, and
 * auto-refresh for every DataTable in the app.
 *
 * Each table component only needs to declare its columns and actions;
 * all boilerplate lives here.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useDataTableUrlFilters } from "./useDataTableUrlFilters";
import { useAutoRefresh } from "./useAutoRefresh";
import { useJwt } from "./useJwt";
import { useOrgStore } from "@/lib/org-store";
import type { FilterMetaDef, Pagination } from "@/types/list-result";
import type { SortState } from "@/components/data-table/types";

// ---------------------------------------------------------------------------
// Public config / return types
// ---------------------------------------------------------------------------

export interface UseServerTableConfig<T> {
	/**
	 * Function that fetches a page of data given the current filter/pagination state.
	 * Called with a `params` object; returns `ListResultWithMeta<T>`.
	 */
	fetcher: (params: FetchParams) => Promise<FetchResult<T>>;

	/**
	 * IDs of filters that should be persisted in the URL (e.g., ["personType", "stateCode"]).
	 * Must match the FilterMetaDef ids returned by the server.
	 */
	allowedFilterIds: string[];

	/** Pagination mode – "infinite-scroll" accumulates rows, "pagination" replaces them */
	paginationMode?: "pagination" | "infinite-scroll";

	/** Number of rows per page (default: 20) */
	itemsPerPage?: number;

	/**
	 * Fixed filters that are always sent to the server (e.g., { clientId: "xxx" }).
	 * These are NOT exposed in the UI filter bar and NOT URL-persisted.
	 */
	fixedFilters?: Record<string, string>;

	/** Enable auto-refresh (default: true) */
	autoRefresh?: boolean;

	/** Auto-refresh interval in ms (default: 30000) */
	autoRefreshInterval?: number;

	/**
	 * Optional callback called when a fetch fails (non-silent).
	 * Use this to show a toast or otherwise notify the user.
	 */
	onError?: (error: unknown) => void;
}

export interface FetchParams {
	page: number;
	limit: number;
	search: string;
	sort: SortState;
	filters: Record<string, string[]>;
	fixedFilters: Record<string, string>;
	jwt: string | null;
}

export interface FetchResult<T> {
	data: T[];
	pagination: Pagination;
	filterMeta?: FilterMetaDef[];
}

export interface UseServerTableReturn<T> {
	// Data
	data: T[];
	isLoading: boolean;
	isLoadingMore: boolean;
	hasMore: boolean;
	pagination: Pagination | null;
	filterMeta: FilterMetaDef[];

	// State (controlled by the hook, passed down to DataTable)
	activeFilters: Record<string, string[]>;
	searchQuery: string;
	sortState: SortState;

	// Callbacks
	handleLoadMore: () => void;
	refresh: () => void;

	// Props to spread onto <DataTable> for URL persistence
	urlFilterProps: {
		initialFilters: Record<string, string[]>;
		onFiltersChange: (filters: Record<string, string[]>) => void;
		initialSearch: string;
		onSearchChange: (search: string) => void;
		initialSort: SortState | undefined;
		onSortChange: (sort: SortState) => void;
	};
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useServerTable<T>(
	config: UseServerTableConfig<T>,
): UseServerTableReturn<T> {
	const {
		fetcher,
		allowedFilterIds,
		paginationMode = "infinite-scroll",
		itemsPerPage = 20,
		fixedFilters = {},
		autoRefresh = true,
		autoRefreshInterval = 30000,
		onError,
	} = config;

	const { jwt, isLoading: isJwtLoading } = useJwt();
	const { currentOrg } = useOrgStore();
	const urlFilters = useDataTableUrlFilters(allowedFilterIds);

	// ---------------------------------------------------------------------------
	// Local state – filters, search, sort are mirrored from URL on mount
	// ---------------------------------------------------------------------------
	const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
		urlFilters.initialFilters ?? {},
	);
	const [searchQuery, setSearchQuery] = useState(
		urlFilters.initialSearch ?? "",
	);
	const [sortState, setSortState] = useState<SortState>(
		urlFilters.initialSort ?? { field: null, direction: "desc" },
	);

	// ---------------------------------------------------------------------------
	// Server data state
	// ---------------------------------------------------------------------------
	const [data, setData] = useState<T[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [hasMore, setHasMore] = useState(false);
	const [pagination, setPagination] = useState<Pagination | null>(null);
	const [filterMeta, setFilterMeta] = useState<FilterMetaDef[]>([]);
	const [currentPage, setCurrentPage] = useState(1);

	// ---------------------------------------------------------------------------
	// Org tracking – reset on org change
	// ---------------------------------------------------------------------------
	const hasLoadedForOrgRef = useRef<string | null>(null);

	// ---------------------------------------------------------------------------
	// Build fetch params from current state
	// ---------------------------------------------------------------------------
	const buildParams = useCallback(
		(page: number): FetchParams => ({
			page,
			limit: itemsPerPage,
			search: searchQuery,
			sort: sortState,
			filters: activeFilters,
			fixedFilters,
			jwt,
		}),
		[searchQuery, sortState, activeFilters, fixedFilters, jwt, itemsPerPage],
	);

	// ---------------------------------------------------------------------------
	// Initial / re-fetch (page 1)
	// ---------------------------------------------------------------------------
	const fetchPage1 = useCallback(
		async (opts: { silent?: boolean } = {}) => {
			if (isJwtLoading || !currentOrg?.id) return;

			if (!opts.silent) setIsLoading(true);

			try {
				const result = await fetcher(buildParams(1));
				setData(result.data);
				setPagination(result.pagination);
				setFilterMeta(result.filterMeta ?? []);
				setCurrentPage(1);
				setHasMore(result.pagination.page < result.pagination.totalPages);
				hasLoadedForOrgRef.current = currentOrg.id;
			} catch (error) {
				console.error("[useServerTable] fetch error:", error);
				hasLoadedForOrgRef.current = currentOrg.id;
				if (!opts.silent && onError) {
					onError(error);
				}
			} finally {
				if (!opts.silent) setIsLoading(false);
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[fetcher, buildParams, isJwtLoading, currentOrg?.id, onError],
	);

	// Clear data when organization is removed
	useEffect(() => {
		if (!currentOrg?.id && !isJwtLoading) {
			setData([]);
			setIsLoading(false);
			hasLoadedForOrgRef.current = null;
		}
	}, [currentOrg?.id, isJwtLoading]);

	// ---------------------------------------------------------------------------
	// Load more (infinite scroll)
	// ---------------------------------------------------------------------------
	const handleLoadMore = useCallback(async () => {
		if (isLoadingMore || !hasMore || isJwtLoading || !currentOrg?.id) return;

		setIsLoadingMore(true);
		try {
			const nextPage = currentPage + 1;
			const result = await fetcher(buildParams(nextPage));
			setData((prev) => [...prev, ...result.data]);
			setPagination(result.pagination);
			setFilterMeta(result.filterMeta ?? []);
			setCurrentPage(nextPage);
			setHasMore(result.pagination.page < result.pagination.totalPages);
		} catch (error) {
			console.error("[useServerTable] load more error:", error);
		} finally {
			setIsLoadingMore(false);
		}
	}, [
		isLoadingMore,
		hasMore,
		isJwtLoading,
		currentOrg?.id,
		currentPage,
		fetcher,
		buildParams,
	]);

	// ---------------------------------------------------------------------------
	// Initial load – triggers when org changes
	// ---------------------------------------------------------------------------
	useEffect(() => {
		if (isJwtLoading || !jwt || !currentOrg?.id) return;
		if (hasLoadedForOrgRef.current === currentOrg.id) return;

		void fetchPage1();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [jwt, isJwtLoading, currentOrg?.id]);

	// ---------------------------------------------------------------------------
	// Re-fetch on filter/search/sort changes (debounced)
	// ---------------------------------------------------------------------------
	const filterDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		// Don't refetch on mount if no org is ready yet
		if (!currentOrg?.id || isJwtLoading || !jwt) return;
		// Don't refetch if we haven't done the initial load
		if (hasLoadedForOrgRef.current !== currentOrg.id) return;

		if (filterDebounceRef.current) clearTimeout(filterDebounceRef.current);
		filterDebounceRef.current = setTimeout(() => {
			void fetchPage1();
		}, 300);

		return () => {
			if (filterDebounceRef.current) clearTimeout(filterDebounceRef.current);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeFilters, searchQuery, sortState]);

	// ---------------------------------------------------------------------------
	// Auto-refresh (silent, page 1 only)
	// ---------------------------------------------------------------------------
	const silentRefresh = useCallback(async () => {
		await fetchPage1({ silent: true });
	}, [fetchPage1]);

	useAutoRefresh(silentRefresh, {
		enabled:
			autoRefresh &&
			!isLoading &&
			!!jwt &&
			!!currentOrg?.id &&
			currentPage === 1,
		interval: autoRefreshInterval,
	});

	// ---------------------------------------------------------------------------
	// URL persistence callbacks (wired to DataTable's onFiltersChange etc.)
	// ---------------------------------------------------------------------------
	const handleFiltersChange = useCallback(
		(filters: Record<string, string[]>) => {
			setActiveFilters(filters);
			urlFilters.onFiltersChange(filters);
		},
		[urlFilters],
	);

	const handleSearchChange = useCallback(
		(search: string) => {
			setSearchQuery(search);
			urlFilters.onSearchChange(search);
		},
		[urlFilters],
	);

	const handleSortChange = useCallback(
		(sort: SortState) => {
			setSortState(sort);
			urlFilters.onSortChange(sort);
		},
		[urlFilters],
	);

	const urlFilterProps = useMemo(
		() => ({
			initialFilters: urlFilters.initialFilters,
			onFiltersChange: handleFiltersChange,
			initialSearch: urlFilters.initialSearch,
			onSearchChange: handleSearchChange,
			initialSort: urlFilters.initialSort,
			onSortChange: handleSortChange,
		}),
		[
			urlFilters.initialFilters,
			urlFilters.initialSearch,
			urlFilters.initialSort,
			handleFiltersChange,
			handleSearchChange,
			handleSortChange,
		],
	);

	return {
		data,
		isLoading,
		isLoadingMore,
		hasMore,
		pagination,
		filterMeta,
		activeFilters,
		searchQuery,
		sortState,
		handleLoadMore,
		refresh: () => void fetchPage1(),
		urlFilterProps,
	};
}
