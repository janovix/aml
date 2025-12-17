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
	error: string | null;
	searchTerm: string;
	setSearchTerm: (value: string) => void;
	reload: () => void;
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
	const [error, setError] = useState<string | null>(null);
	const [reloadKey, setReloadKey] = useState(0);

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

	const reload = useCallback(() => {
		setReloadKey((prev) => prev + 1);
	}, []);

	return useMemo(
		() => ({
			items,
			pagination,
			loading,
			error,
			searchTerm,
			setSearchTerm,
			reload,
		}),
		[items, pagination, loading, error, searchTerm, reload],
	);
}
