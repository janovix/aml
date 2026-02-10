"use client";

/**
 * Dedicated currency hook with module-level caching.
 *
 * Unlike the generic `useCatalogSearch`, this hook:
 * - Fetches ALL currencies in a single request and caches them for the session
 * - Deduplicates concurrent fetches (multiple MoneyInput mounts = 1 API call)
 * - Supports client-side filtering by shortName (ISO code), name, and country
 * - Provides a `getByCode` helper for instant lookup by ISO code
 *
 * Currencies rarely change, so a session-level cache is appropriate.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchCatalogEntries } from "@/lib/catalogs";
import type { CatalogItem } from "@/types/catalog";

// ---------------------------------------------------------------------------
// Module-level cache (shared across all component instances)
// ---------------------------------------------------------------------------

let cachedCurrencies: CatalogItem[] | null = null;
let fetchPromise: Promise<CatalogItem[]> | null = null;
let fetchError: string | null = null;

/**
 * Fetch all currencies from the API (or return the cached result).
 * Multiple simultaneous callers share a single in-flight request.
 */
async function loadCurrencies(): Promise<CatalogItem[]> {
	// Already cached
	if (cachedCurrencies) {
		return cachedCurrencies;
	}

	// Deduplicate concurrent fetches
	if (fetchPromise) {
		return fetchPromise;
	}

	fetchPromise = (async () => {
		try {
			const response = await fetchCatalogEntries("currencies", {
				pageSize: 200, // Fetch all (~170 currencies)
			});
			cachedCurrencies = response.data;
			fetchError = null;
			return response.data;
		} catch (error) {
			fetchError =
				error instanceof Error ? error.message : "Error loading currencies";
			return [];
		} finally {
			fetchPromise = null;
		}
	})();

	return fetchPromise;
}

// ---------------------------------------------------------------------------
// Currency metadata helpers
// ---------------------------------------------------------------------------

interface CurrencyMeta {
	shortName?: string;
	country?: string;
	decimalPlaces?: number;
}

function getMeta(item: CatalogItem): CurrencyMeta {
	return (item.metadata ?? {}) as CurrencyMeta;
}

function getShortName(item: CatalogItem): string {
	return getMeta(item).shortName ?? item.id;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

interface UseCurrenciesResult {
	/** All currency catalog items (empty while loading) */
	currencies: CatalogItem[];
	/** True during the initial fetch */
	loading: boolean;
	/** Error message if the fetch failed */
	error: string | null;
	/** Look up a currency item by its ISO code (metadata.shortName) */
	getByCode: (code: string) => CatalogItem | undefined;
	/**
	 * Filter currencies by a search query.
	 * Matches against shortName, full name, and country.
	 */
	filter: (query: string) => CatalogItem[];
}

export function useCurrencies(): UseCurrenciesResult {
	const [currencies, setCurrencies] = useState<CatalogItem[]>(
		cachedCurrencies ?? [],
	);
	const [loading, setLoading] = useState(cachedCurrencies === null);
	const [error, setError] = useState<string | null>(fetchError);

	useEffect(() => {
		// If already cached, hydrate immediately (no fetch needed)
		if (cachedCurrencies) {
			setCurrencies(cachedCurrencies);
			setLoading(false);
			return;
		}

		let cancelled = false;

		setLoading(true);
		loadCurrencies().then((items) => {
			if (!cancelled) {
				setCurrencies(items);
				setError(fetchError);
				setLoading(false);
			}
		});

		return () => {
			cancelled = true;
		};
	}, []);

	// Index by shortName for O(1) lookup
	const codeIndex = useMemo(() => {
		const map = new Map<string, CatalogItem>();
		for (const item of currencies) {
			map.set(getShortName(item), item);
		}
		return map;
	}, [currencies]);

	const getByCode = useCallback(
		(code: string): CatalogItem | undefined => {
			return codeIndex.get(code);
		},
		[codeIndex],
	);

	const filter = useCallback(
		(query: string): CatalogItem[] => {
			if (!query.trim()) {
				return currencies;
			}

			const q = query.toLowerCase().trim();

			return currencies.filter((item) => {
				const meta = getMeta(item);
				const shortName = (meta.shortName ?? "").toLowerCase();
				const name = item.name.toLowerCase();
				const country = (meta.country ?? "").toLowerCase();

				return shortName.includes(q) || name.includes(q) || country.includes(q);
			});
		},
		[currencies],
	);

	return useMemo(
		() => ({ currencies, loading, error, getByCode, filter }),
		[currencies, loading, error, getByCode, filter],
	);
}
