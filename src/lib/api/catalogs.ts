/**
 * Catalogs API Client
 * Handles fetching catalog data from aml-svc
 */

import { getAmlCoreBaseUrl } from "./config";
import { fetchJson } from "./http";

export interface CatalogItem {
	id: string;
	catalogId: string;
	name: string;
	normalizedName: string;
	active: boolean;
	metadata: Record<string, unknown> | null;
	createdAt: string;
	updatedAt: string;
}

export interface CatalogListResponse {
	catalogKey: string;
	items: CatalogItem[];
	total: number;
}

/**
 * List all items in a catalog
 */
export async function listCatalogItems(opts: {
	catalogKey: string;
	activeOnly?: boolean;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<CatalogListResponse> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/catalogs/${opts.catalogKey}`, baseUrl);

	if (opts.activeOnly !== undefined) {
		url.searchParams.set("activeOnly", String(opts.activeOnly));
	}

	const { json } = await fetchJson<CatalogListResponse>(url.toString(), {
		method: "GET",
		cache: "force-cache", // Cache catalog data
		signal: opts.signal,
		jwt: opts.jwt,
	});

	return json;
}

/**
 * Get a specific catalog item by ID
 */
export async function getCatalogItem(opts: {
	catalogKey: string;
	itemId: string;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<CatalogItem> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(
		`/api/v1/catalogs/${opts.catalogKey}/items/${opts.itemId}`,
		baseUrl,
	);

	const { json } = await fetchJson<CatalogItem>(url.toString(), {
		method: "GET",
		cache: "force-cache", // Cache catalog data
		signal: opts.signal,
		jwt: opts.jwt,
	});

	return json;
}
