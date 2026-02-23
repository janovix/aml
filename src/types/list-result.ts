/**
 * Shared list result types mirroring aml-svc's lib/list-result.ts.
 * These types describe the shape of all paginated list API responses
 * that include server-driven filter metadata.
 */

export interface Pagination {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

export type FilterType = "enum" | "date-range" | "number-range";

export interface FilterMetaOption {
	value: string;
	label: string;
	count: number;
}

export interface FilterMetaDef {
	id: string;
	label: string;
	type: FilterType;
	/** Available for "enum" type filters */
	options?: FilterMetaOption[];
	/** Available for "date-range" / "number-range" filters */
	min?: string;
	max?: string;
}

export interface ListResultWithMeta<T> {
	data: T[];
	pagination: Pagination;
	/** Server-driven filter metadata. Empty array when the endpoint doesn't compute it yet. */
	filterMeta: FilterMetaDef[];
}

/** Backwards-compatible list result where filterMeta is optional */
export interface ListResult<T> {
	data: T[];
	pagination: Pagination;
	filterMeta?: FilterMetaDef[];
}
