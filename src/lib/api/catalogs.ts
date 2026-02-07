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
	catalog: {
		id: string;
		key: string;
		name: string;
		allowNewItems: boolean;
	};
	data: CatalogItem[];
	pagination: {
		page: number;
		pageSize: number;
		total: number;
		totalPages: number;
	};
}

/**
 * List all items in a catalog
 */
export async function listCatalogItems(opts: {
	catalogKey: string;
	activeOnly?: boolean;
	page?: number;
	pageSize?: number;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<CatalogListResponse> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/catalogs/${opts.catalogKey}`, baseUrl);

	if (opts.activeOnly !== undefined) {
		url.searchParams.set("activeOnly", String(opts.activeOnly));
	}

	if (opts.page !== undefined) {
		url.searchParams.set("page", String(opts.page));
	}

	if (opts.pageSize !== undefined) {
		url.searchParams.set("pageSize", String(opts.pageSize));
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
