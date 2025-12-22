"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CatalogItem, CatalogPagination } from "@/types/catalog";
import { fetchCatalogEntries } from "@/lib/catalogs";

interface UseCatalogSearchOptions {
	catalogKey: string;
	pageSize?: number;
	debounceMs?: number;
	enabled?: boolean;
	initialSearch?: string;
}

interface UseCatalogSearchResult {
	items: CatalogItem[];
	pagination: CatalogPagination | null;
	loading: boolean;
	loadingMore: boolean;
	error: string | null;
	searchTerm: string;
	setSearchTerm: (value: string) => void;
	loadMore: () => Promise<void>;
	reload: () => void;
	hasMore: boolean;
}

export function useCatalogSearch({
	catalogKey,
	pageSize = 15,
	debounceMs = 350,
	enabled = true,
	initialSearch = "",
}: UseCatalogSearchOptions): UseCatalogSearchResult {
	const [searchTerm, setSearchTerm] = useState(initialSearch);
	const [debouncedSearch, setDebouncedSearch] = useState(initialSearch.trim());
	const [items, setItems] = useState<CatalogItem[]>([]);
	const [pagination, setPagination] = useState<CatalogPagination | null>(null);
	const [loading, setLoading] = useState(false);
	const [loadingMore, setLoadingMore] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [reloadKey, setReloadKey] = useState(0);
	const [currentPage, setCurrentPage] = useState(1);

	useEffect(() => {
		if (!enabled) {
			return;
		}

		const normalizedSearch = searchTerm.trim();
		if (normalizedSearch === debouncedSearch) {
			return;
		}

		const handler = setTimeout(() => {
			setDebouncedSearch(normalizedSearch);
		}, debounceMs);

		return () => {
			clearTimeout(handler);
		};
	}, [searchTerm, debouncedSearch, debounceMs, enabled]);

	// Reset to page 1 when search term changes
	useEffect(() => {
		setCurrentPage(1);
		setItems([]);
	}, [debouncedSearch, catalogKey]);

	useEffect(() => {
		if (!enabled) {
			return;
		}

		let isCancelled = false;
		const controller = new AbortController();

		setLoading(true);
		setError(null);

		fetchCatalogEntries(
			catalogKey,
			{
				search: debouncedSearch,
				page: 1,
				pageSize,
			},
			{ signal: controller.signal },
		)
			.then((response) => {
				if (isCancelled) {
					return;
				}

				setItems(response.data);
				setPagination(response.pagination);
				setCurrentPage(1);
			})
			.catch((fetchError: Error) => {
				if (isCancelled || fetchError.name === "AbortError") {
					return;
				}

				setItems([]);
				setPagination(null);
				setError(fetchError.message ?? "Error al cargar el catálogo.");
			})
			.finally(() => {
				if (!isCancelled) {
					setLoading(false);
				}
			});

		return () => {
			isCancelled = true;
			controller.abort();
		};
	}, [catalogKey, debouncedSearch, pageSize, enabled, reloadKey]);

	const loadMore = useCallback(async (): Promise<void> => {
		if (!pagination || loadingMore || loading) {
			return;
		}

		const nextPage = currentPage + 1;
		if (nextPage > pagination.totalPages) {
			return;
		}

		setLoadingMore(true);
		setError(null);

		try {
			const response = await fetchCatalogEntries(catalogKey, {
				search: debouncedSearch,
				page: nextPage,
				pageSize,
			});

			setItems((prev) => [...prev, ...response.data]);
			setPagination(response.pagination);
			setCurrentPage(nextPage);
		} catch (fetchError) {
			const errorMessage =
				fetchError instanceof Error
					? fetchError.message
					: "Error al cargar más resultados.";
			setError(errorMessage);
		} finally {
			setLoadingMore(false);
		}
	}, [
		catalogKey,
		debouncedSearch,
		pageSize,
		pagination,
		currentPage,
		loadingMore,
		loading,
	]);

	const reload = useCallback(() => {
		setReloadKey((prev) => prev + 1);
		setCurrentPage(1);
		setItems([]);
	}, []);

	const hasMore = useMemo(() => {
		if (!pagination) {
			return false;
		}
		return currentPage < pagination.totalPages;
	}, [pagination, currentPage]);

	return useMemo(
		() => ({
			items,
			pagination,
			loading,
			loadingMore,
			error,
			searchTerm,
			setSearchTerm,
			loadMore,
			reload,
			hasMore,
		}),
		[
			items,
			pagination,
			loading,
			loadingMore,
			error,
			searchTerm,
			loadMore,
			reload,
			hasMore,
		],
	);
}
