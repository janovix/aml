"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Client, ClientsListResponse, Pagination } from "@/types/client";
import { listClients } from "@/lib/api/clients";
import { useJwt } from "./useJwt";

interface UseClientSearchOptions {
	pageSize?: number;
	debounceMs?: number;
	enabled?: boolean;
	initialSearch?: string;
}

interface UseClientSearchResult {
	items: Client[];
	pagination: Pagination | null;
	loading: boolean;
	error: string | null;
	searchTerm: string;
	setSearchTerm: (value: string) => void;
	reload: () => void;
}

export function useClientSearch({
	pageSize = 15,
	debounceMs = 350,
	enabled = true,
	initialSearch = "",
}: UseClientSearchOptions = {}): UseClientSearchResult {
	const { jwt, isLoading: isJwtLoading } = useJwt();
	const [searchTerm, setSearchTerm] = useState(initialSearch);
	const [debouncedSearch, setDebouncedSearch] = useState(initialSearch.trim());
	const [items, setItems] = useState<Client[]>([]);
	const [pagination, setPagination] = useState<Pagination | null>(null);
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
		// Wait for JWT to be ready and valid (requires organization to be selected)
		// Without a valid JWT, API calls will fail with 403 "Organization Required"
		if (!enabled || isJwtLoading || !jwt) {
			// Clear results when JWT is not available
			if (!isJwtLoading && !jwt) {
				setItems([]);
				setPagination(null);
				setLoading(false);
			}
			return;
		}

		let isCancelled = false;
		const controller = new AbortController();

		setLoading(true);
		setError(null);

		listClients({
			search: debouncedSearch || undefined,
			page: 1,
			limit: pageSize,
			signal: controller.signal,
			jwt,
		})
			.then((response: ClientsListResponse) => {
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
				setError(fetchError.message ?? "Error al cargar los clientes.");
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
	}, [debouncedSearch, pageSize, enabled, reloadKey, jwt, isJwtLoading]);

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
