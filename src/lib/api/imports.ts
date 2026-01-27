/**
 * Imports API Client
 * Functions for interacting with the imports API
 */

import { getAmlCoreBaseUrl } from "./config";
import { fetchJson } from "./http";

export type ImportStatus =
	| "PENDING"
	| "VALIDATING"
	| "PROCESSING"
	| "COMPLETED"
	| "FAILED";

export type ImportEntityType = "CLIENT" | "TRANSACTION";

export type ImportRowStatus =
	| "PENDING"
	| "SUCCESS"
	| "WARNING"
	| "ERROR"
	| "SKIPPED";

export interface Import {
	id: string;
	organizationId: string;
	entityType: ImportEntityType;
	fileName: string;
	fileUrl: string;
	fileSize: number;
	status: ImportStatus;
	totalRows: number;
	processedRows: number;
	successCount: number;
	warningCount: number;
	errorCount: number;
	errorMessage: string | null;
	createdBy: string;
	startedAt: string | null;
	completedAt: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface ImportRowResult {
	id: string;
	importId: string;
	rowNumber: number;
	status: ImportRowStatus;
	rawData: string;
	entityId: string | null;
	message: string | null;
	errors: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface ImportWithResults extends Import {
	rowResults: ImportRowResult[];
}

export interface Pagination {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

export interface ImportsListResponse {
	data: Import[];
	pagination: Pagination;
}

export interface ImportRowsListResponse {
	data: ImportRowResult[];
	pagination: Pagination;
}

export interface ListImportsOptions {
	page?: number;
	limit?: number;
	status?: ImportStatus;
	entityType?: ImportEntityType;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}

/**
 * List imports for the organization
 */
export async function listImports(
	opts?: ListImportsOptions,
): Promise<ImportsListResponse> {
	const baseUrl = opts?.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL("/api/v1/imports", baseUrl);

	if (opts?.page) url.searchParams.set("page", String(opts.page));
	if (opts?.limit) url.searchParams.set("limit", String(opts.limit));
	if (opts?.status) url.searchParams.set("status", opts.status);
	if (opts?.entityType) url.searchParams.set("entityType", opts.entityType);

	const { json } = await fetchJson<ImportsListResponse>(url.toString(), {
		method: "GET",
		cache: "no-store",
		signal: opts?.signal,
		jwt: opts?.jwt,
	});
	return json;
}

/**
 * Get a single import with row results
 */
export async function getImport(opts: {
	id: string;
	rowPage?: number;
	rowLimit?: number;
	rowStatus?: ImportRowStatus;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<ImportWithResults> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/imports/${opts.id}`, baseUrl);

	if (opts.rowPage) url.searchParams.set("page", String(opts.rowPage));
	if (opts.rowLimit) url.searchParams.set("limit", String(opts.rowLimit));
	if (opts.rowStatus) url.searchParams.set("status", opts.rowStatus);

	const { json } = await fetchJson<ImportWithResults>(url.toString(), {
		method: "GET",
		cache: "no-store",
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

/**
 * Get row results for an import
 */
export async function getImportRows(opts: {
	importId: string;
	page?: number;
	limit?: number;
	status?: ImportRowStatus;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<ImportRowsListResponse> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/imports/${opts.importId}/rows`, baseUrl);

	if (opts.page) url.searchParams.set("page", String(opts.page));
	if (opts.limit) url.searchParams.set("limit", String(opts.limit));
	if (opts.status) url.searchParams.set("status", opts.status);

	const { json } = await fetchJson<ImportRowsListResponse>(url.toString(), {
		method: "GET",
		cache: "no-store",
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

/**
 * Upload a file and create an import
 */
export async function createImport(opts: {
	file: File;
	entityType: ImportEntityType;
	baseUrl?: string;
	jwt?: string;
}): Promise<{ success: boolean; data: Import }> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL("/api/v1/imports", baseUrl);

	const formData = new FormData();
	formData.append("file", opts.file);
	formData.append("entityType", opts.entityType);

	// Need to use fetch directly for FormData
	const headers: Record<string, string> = {};
	if (opts.jwt) {
		headers.Authorization = `Bearer ${opts.jwt}`;
	}

	const res = await fetch(url.toString(), {
		method: "POST",
		headers,
		body: formData,
	});

	if (!res.ok) {
		const errorBody = await res.json().catch(() => ({}));
		throw new Error(
			(errorBody as { message?: string }).message ||
				`Upload failed: ${res.status}`,
		);
	}

	return res.json();
}

/**
 * Delete an import
 */
export async function deleteImport(opts: {
	id: string;
	baseUrl?: string;
	jwt?: string;
}): Promise<void> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/imports/${opts.id}`, baseUrl);

	await fetchJson(url.toString(), {
		method: "DELETE",
		jwt: opts.jwt,
	});
}

/**
 * Download CSV template for entity type
 */
export function getTemplateUrl(
	entityType: ImportEntityType,
	baseUrl?: string,
): string {
	const base = baseUrl ?? getAmlCoreBaseUrl();
	return `${base}/api/v1/imports/templates/${entityType}`;
}
