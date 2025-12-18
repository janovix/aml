import type { CatalogQueryParams, CatalogResponse } from "@/types/catalog";

const DEFAULT_BFF_BASE_URL = "https://aml-svc.example.workers.dev";

const stripTrailingSlash = (value: string): string =>
	value.endsWith("/") ? value.slice(0, -1) : value;

const resolveBaseUrl = (): string => {
	// Safely access process.env (may not be available in Storybook/browser)
	try {
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		const envValue =
			typeof process !== "undefined" && process?.env?.NEXT_PUBLIC_BFF_BASE_URL;
		if (
			envValue &&
			typeof envValue === "string" &&
			envValue.trim().length > 0
		) {
			return stripTrailingSlash(envValue.trim());
		}
	} catch {
		// process is not available (e.g., in Storybook browser environment)
	}

	return DEFAULT_BFF_BASE_URL;
};

// Lazy evaluation to avoid process.env access at module load time
const getBffBaseUrl = (): string => resolveBaseUrl();

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
	const url = `${getBffBaseUrl()}/api/v1/catalogs/${catalogKey}${buildQueryString(params)}`;

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
