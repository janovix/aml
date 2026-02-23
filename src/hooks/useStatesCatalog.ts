/**
 * Hook to fetch and cache the states catalog
 */

import { useState, useEffect } from "react";
import { listCatalogItems, type CatalogItem } from "@/lib/api/catalogs";
import { useJwt } from "./useJwt";

interface StatesCatalogResult {
	states: CatalogItem[];
	isLoading: boolean;
	error: Error | null;
	getStateName: (stateCode: string | undefined | null) => string;
}

// In-memory cache for states catalog
let statesCache: CatalogItem[] | null = null;
let cachePromise: Promise<CatalogItem[]> | null = null;

/**
 * Hook to access the states catalog
 * Fetches from API once and caches the result
 */
export function useStatesCatalog(): StatesCatalogResult {
	const { jwt } = useJwt();
	const [states, setStates] = useState<CatalogItem[]>(statesCache || []);
	const [isLoading, setIsLoading] = useState(!statesCache);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		// If we already have cached data, use it
		if (statesCache) {
			setStates(statesCache);
			setIsLoading(false);
			return;
		}

		// If there's already a fetch in progress, wait for it
		if (cachePromise) {
			cachePromise
				.then((data) => {
					setStates(data);
					setIsLoading(false);
				})
				.catch((err) => {
					setError(err);
					setIsLoading(false);
				});
			return;
		}

		// Don't fetch without JWT
		if (!jwt) {
			return;
		}

		// Start a new fetch - fetch ALL states by requesting a large page size
		setIsLoading(true);
		cachePromise = listCatalogItems({
			catalogKey: "states",
			activeOnly: true,
			pageSize: 100, // Request all states at once (there are 32 Mexican states)
			jwt,
		}).then((response) => {
			const items = response.data;
			statesCache = items;
			cachePromise = null;
			return items;
		});

		cachePromise
			.then((data) => {
				setStates(data);
				setIsLoading(false);
			})
			.catch((err) => {
				console.error("Error fetching states catalog:", err);
				setError(err);
				setIsLoading(false);
				cachePromise = null;
			});
	}, [jwt]);

	// Helper function to get state name from code
	const getStateName = (stateCode: string | undefined | null): string => {
		if (!stateCode) return "";

		// Find the state by matching the code in metadata
		const state = states.find((s) => {
			const metadata = s.metadata as { code?: string } | null;
			return metadata?.code === stateCode;
		});

		return state?.name || stateCode;
	};

	return {
		states,
		isLoading,
		error,
		getStateName,
	};
}
