export interface CatalogMetadata {
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
