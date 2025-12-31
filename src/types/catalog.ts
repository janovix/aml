export interface CatalogMetadata {
	/** Country of origin for the catalog item (e.g., vehicle brand origin country) */
	originCountry?: string;
	/** Type/category of the item (e.g., "Automóviles, SUVs" or "Jets ejecutivos") */
	type?: string;
	/** SAT code for regulatory catalogs */
	code?: string;
	/** Allow additional unknown properties */
	[key: string]: unknown;
}

export interface CatalogItem {
	id: string;
	catalogId: string;
	name: string;
	normalizedName: string;
	active: boolean;
	metadata?: CatalogMetadata;
	createdAt: string;
	updatedAt: string;
}

export interface CatalogInfo {
	id: string;
	key: string;
	name: string;
	allowNewItems?: boolean;
}

export interface CatalogPagination {
	page: number;
	pageSize: number;
	total: number;
	totalPages: number;
}

export interface CatalogResponse {
	catalog: CatalogInfo;
	data: CatalogItem[];
	pagination: CatalogPagination;
}

export interface CatalogQueryParams {
	page?: number;
	pageSize?: number;
	search?: string;
	extra?: Record<string, string | number | boolean | undefined>;
}
