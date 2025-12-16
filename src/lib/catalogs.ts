import { getAmlCoreBaseUrl } from "./api/config";
import type { CatalogQueryParams, CatalogResponse } from "@/types/catalog";

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

	const response = await fetch(url, {
		...requestInit,
		headers: {
			"Content-Type": "application/json",
			...requestInit?.headers,
		},
	});

	if (!response.ok) {
		throw new Error(`No se pudo consultar el catálogo "${catalogKey}".`);
	}

	return (await response.json()) as CatalogResponse;
}
