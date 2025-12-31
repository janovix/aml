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
