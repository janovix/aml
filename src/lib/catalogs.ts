import type {
	CatalogItem,
	CatalogQueryParams,
	CatalogResponse,
} from "@/types/catalog";
import { getAmlCoreBaseUrl } from "./api/config";
import { fetchJson } from "./api/http";

const buildQueryString = (params?: CatalogQueryParams): string => {
	const searchParams = new URLSearchParams();

	if (!params) {
		return "";
	}

	if (params.page) {
		searchParams.set("page", String(params.page));
	}

	if (params.pageSize) {
		searchParams.set("pageSize", String(params.pageSize));
	}

	if (params.search) {
		searchParams.set("search", params.search);
	}

	if (params.extra) {
		Object.entries(params.extra).forEach(([key, value]) => {
			if (value === undefined) {
				return;
			}

			searchParams.set(key, String(value));
		});
	}

	const queryString = searchParams.toString();

	return queryString ? `?${queryString}` : "";
};

export async function fetchCatalogEntries(
	catalogKey: string,
	params?: CatalogQueryParams,
	requestInit?: RequestInit,
): Promise<CatalogResponse> {
	const baseUrl = getAmlCoreBaseUrl();
	const url = `${baseUrl}/api/v1/catalogs/${catalogKey}${buildQueryString(params)}`;

	try {
		const { json } = await fetchJson<CatalogResponse>(url, {
			...requestInit,
			headers: {
				"Content-Type": "application/json",
				...requestInit?.headers,
			},
		});
		return json;
	} catch (error) {
		if (error instanceof Error) {
			throw new Error(
				`No se pudo consultar el catálogo "${catalogKey}": ${error.message}`,
			);
		}
		throw new Error(`No se pudo consultar el catálogo "${catalogKey}".`);
	}
}

export async function createCatalogItem(
	catalogKey: string,
	name: string,
	requestInit?: RequestInit,
): Promise<CatalogItem> {
	const baseUrl = getAmlCoreBaseUrl();
	const url = `${baseUrl}/api/v1/catalogs/${catalogKey}/items`;

	try {
		const { json } = await fetchJson<CatalogItem>(url, {
			method: "POST",
			...requestInit,
			headers: {
				"Content-Type": "application/json",
				...requestInit?.headers,
			},
			body: JSON.stringify({ name }),
		});
		return json;
	} catch (error) {
		if (error instanceof Error) {
			throw new Error(
				`No se pudo crear el elemento en el catálogo "${catalogKey}": ${error.message}`,
			);
		}
		throw new Error(
			`No se pudo crear el elemento en el catálogo "${catalogKey}".`,
		);
	}
}

// Client-side cache for catalog items by ID
// Key format: `${catalogKey}:${itemId}`
const catalogItemCache = new Map<string, CatalogItem>();
const catalogItemCacheTimestamps = new Map<string, number>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCacheKey(catalogKey: string, itemId: string): string {
	return `${catalogKey}:${itemId}`;
}

function isCacheValid(key: string): boolean {
	const timestamp = catalogItemCacheTimestamps.get(key);
	if (!timestamp) {
		return false;
	}
	return Date.now() - timestamp < CACHE_TTL_MS;
}

export async function fetchCatalogItemById(
	catalogKey: string,
	itemId: string,
	requestInit?: RequestInit,
): Promise<CatalogItem> {
	const cacheKey = getCacheKey(catalogKey, itemId);

	// Check cache first
	if (catalogItemCache.has(cacheKey) && isCacheValid(cacheKey)) {
		return catalogItemCache.get(cacheKey)!;
	}

	const baseUrl = getAmlCoreBaseUrl();
	const url = `${baseUrl}/api/v1/catalogs/${catalogKey}/items/${itemId}`;

	try {
		const headers = requestInit?.headers
			? { "Content-Type": "application/json", ...requestInit.headers }
			: { "Content-Type": "application/json" };

		const { json } = await fetchJson<CatalogItem>(url, {
			...requestInit,
			headers,
		});

		// Update cache
		catalogItemCache.set(cacheKey, json);
		catalogItemCacheTimestamps.set(cacheKey, Date.now());

		return json;
	} catch (error) {
		if (error instanceof Error) {
			throw new Error(
				`No se pudo obtener el elemento del catálogo "${catalogKey}": ${error.message}`,
			);
		}
		throw new Error(
			`No se pudo obtener el elemento del catálogo "${catalogKey}".`,
		);
	}
}

/**
 * Clear the cache for a specific catalog item or all items
 */
export function clearCatalogItemCache(
	catalogKey?: string,
	itemId?: string,
): void {
	if (catalogKey && itemId) {
		const cacheKey = getCacheKey(catalogKey, itemId);
		catalogItemCache.delete(cacheKey);
		catalogItemCacheTimestamps.delete(cacheKey);
	} else if (catalogKey) {
		// Clear all items for a specific catalog
		for (const [key] of catalogItemCache) {
			if (key.startsWith(`${catalogKey}:`)) {
				catalogItemCache.delete(key);
				catalogItemCacheTimestamps.delete(key);
			}
		}
	} else {
		// Clear all cache
		catalogItemCache.clear();
		catalogItemCacheTimestamps.clear();
	}
}
