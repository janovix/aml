import { getAmlCoreBaseUrl } from "./config";
import { fetchJson } from "./http";
import { downloadFile } from "./download";

/**
 * Report type enum matching backend
 */
export type ReportType = "MONTHLY" | "QUARTERLY" | "ANNUAL" | "CUSTOM";

/**
 * Report status enum matching backend
 */
export type ReportStatus = "DRAFT" | "GENERATED";

/**
 * Report entity from backend
 */
export interface Report {
	id: string;
	organizationId: string;
	name: string;
	periodType: ReportType;
	status: ReportStatus;
	periodStart: string;
	periodEnd: string;
	reportedMonth?: string | null;
	recordCount: number;
	pdfFileUrl?: string | null;
	fileSize?: number | null;
	generatedAt?: string | null;
	createdBy?: string | null;
	notes?: string | null;
	createdAt: string;
	updatedAt: string;
}

/**
 * Report with alert summary from backend
 */
export interface ReportWithAlertSummary extends Report {
	alertSummary: {
		total: number;
		bySeverity: Record<string, number>;
		byStatus: Record<string, number>;
		byRule: Array<{ ruleId: string; ruleName: string; count: number }>;
	};
}

/**
 * Pagination metadata
 */
export interface Pagination {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

/**
 * Report list response from backend
 */
export interface ReportsListResponse {
	data: Report[];
	pagination: Pagination;
}

/**
 * Report preview response
 */
export interface ReportPreviewResponse {
	total: number;
	bySeverity: Record<string, number>;
	byStatus: Record<string, number>;
	periodStart: string;
	periodEnd: string;
}

/**
 * Options for listing reports
 */
export interface ListReportsOptions {
	page?: number;
	limit?: number;
	periodType?: ReportType;
	status?: ReportStatus;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}

/**
 * List reports with optional filters and pagination
 */
export async function listReports(
	opts?: ListReportsOptions,
): Promise<ReportsListResponse> {
	const baseUrl = opts?.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL("/api/v1/reports", baseUrl);

	if (opts?.page) url.searchParams.set("page", String(opts.page));
	if (opts?.limit) url.searchParams.set("limit", String(opts.limit));
	if (opts?.periodType) url.searchParams.set("periodType", opts.periodType);
	if (opts?.status) url.searchParams.set("status", opts.status);

	const { json } = await fetchJson<ReportsListResponse>(url.toString(), {
		method: "GET",
		cache: "no-store",
		signal: opts?.signal,
		jwt: opts?.jwt,
	});
	return json;
}

/**
 * Get a single report by ID with alert summary
 */
export async function getReportById(opts: {
	id: string;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<ReportWithAlertSummary> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/reports/${opts.id}`, baseUrl);

	const { json } = await fetchJson<ReportWithAlertSummary>(url.toString(), {
		method: "GET",
		cache: "no-store",
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

/**
 * Preview alerts for a potential report
 */
export async function previewReport(opts: {
	periodType: ReportType;
	periodStart: string;
	periodEnd: string;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<ReportPreviewResponse> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL("/api/v1/reports/preview", baseUrl);

	url.searchParams.set("periodType", opts.periodType);
	url.searchParams.set("periodStart", opts.periodStart);
	url.searchParams.set("periodEnd", opts.periodEnd);

	const { json } = await fetchJson<ReportPreviewResponse>(url.toString(), {
		method: "GET",
		cache: "no-store",
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

/**
 * Create a new report
 */
export async function createReport(opts: {
	name: string;
	periodType: ReportType;
	periodStart: string;
	periodEnd: string;
	reportedMonth: string;
	notes?: string | null;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<Report> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL("/api/v1/reports", baseUrl);

	const { json } = await fetchJson<Report>(url.toString(), {
		method: "POST",
		cache: "no-store",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({
			name: opts.name,
			periodType: opts.periodType,
			periodStart: opts.periodStart,
			periodEnd: opts.periodEnd,
			reportedMonth: opts.reportedMonth,
			notes: opts.notes,
		}),
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

/**
 * Update a report
 */
export async function updateReport(opts: {
	id: string;
	name?: string;
	status?: ReportStatus;
	notes?: string | null;
	satFolioNumber?: string | null;
	submittedAt?: string | null;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<Report> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/reports/${opts.id}`, baseUrl);

	const body: Record<string, unknown> = {};
	if (opts.name !== undefined) body.name = opts.name;
	if (opts.status !== undefined) body.status = opts.status;
	if (opts.notes !== undefined) body.notes = opts.notes;
	if (opts.satFolioNumber !== undefined)
		body.satFolioNumber = opts.satFolioNumber;
	if (opts.submittedAt !== undefined) body.submittedAt = opts.submittedAt;

	const { json } = await fetchJson<Report>(url.toString(), {
		method: "PATCH",
		cache: "no-store",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(body),
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

/**
 * Delete a report (only DRAFT status)
 */
export async function deleteReport(opts: {
	id: string;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<void> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/reports/${opts.id}`, baseUrl);

	await fetchJson(url.toString(), {
		method: "DELETE",
		cache: "no-store",
		signal: opts.signal,
		jwt: opts.jwt,
	});
}

/**
 * Generate report file
 * - MONTHLY reports generate both XML (for SAT) and PDF (for internal use)
 * - QUARTERLY/ANNUAL/CUSTOM reports generate PDF only
 */
export async function generateReportFile(opts: {
	id: string;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<{
	message: string;
	reportId: string;
	alertCount: number;
	types: ("XML" | "PDF")[];
}> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/reports/${opts.id}/generate`, baseUrl);

	const { json } = await fetchJson<{
		message: string;
		reportId: string;
		alertCount: number;
		types: ("XML" | "PDF")[];
	}>(url.toString(), {
		method: "POST",
		cache: "no-store",
		headers: { "content-type": "application/json" },
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

/**
 * Download the generated report file
 * Fetches the file as a blob and triggers a download in the browser
 */
export async function downloadReportFile(opts: {
	id: string;
	fileName?: string;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<void> {
	return downloadFile({
		url: `/api/v1/reports/${opts.id}/download`,
		defaultFileName: opts.fileName || `report_${opts.id}.html`,
		baseUrl: opts.baseUrl,
		signal: opts.signal,
		jwt: opts.jwt,
	});
}

/**
 * @deprecated Use downloadReportFile instead - this function may not work as expected
 * Get download URL for a generated report
 */
export async function getReportDownloadUrl(opts: {
	id: string;
	format?: "xml" | "pdf";
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<{
	fileUrl: string;
	fileSize?: number | null;
	format: "xml" | "pdf";
}> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/reports/${opts.id}/download`, baseUrl);

	if (opts.format) {
		url.searchParams.set("format", opts.format);
	}

	const { json } = await fetchJson<{
		fileUrl: string;
		fileSize?: number | null;
		format: "xml" | "pdf";
	}>(url.toString(), {
		method: "GET",
		cache: "no-store",
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

/**
 * Submit a monthly report to SAT
 */
export async function submitReportToSat(opts: {
	id: string;
	satFolioNumber?: string;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<Report> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/reports/${opts.id}/submit`, baseUrl);

	const { json } = await fetchJson<Report>(url.toString(), {
		method: "POST",
		cache: "no-store",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({
			satFolioNumber: opts.satFolioNumber,
		}),
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

/**
 * Record SAT acknowledgment for a monthly report
 */
export async function acknowledgeReport(opts: {
	id: string;
	satFolioNumber: string;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<Report> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/reports/${opts.id}/acknowledge`, baseUrl);

	const { json } = await fetchJson<Report>(url.toString(), {
		method: "POST",
		cache: "no-store",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({
			satFolioNumber: opts.satFolioNumber,
		}),
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

/**
 * Calculate monthly period dates (17th-16th cycle)
 * @param year - The year of the report
 * @param month - The month of the report (1-12)
 * @returns Period start and end dates, and reported month string
 */
export function calculateMonthlyPeriod(
	year: number,
	month: number,
): {
	periodStart: Date;
	periodEnd: Date;
	reportedMonth: string;
	displayName: string;
} {
	// For month M in year Y, the period is:
	// Start: Day 17 of month M-1
	// End: Day 16 of month M (at 23:59:59.999)

	const MONTH_NAMES_ES = [
		"Enero",
		"Febrero",
		"Marzo",
		"Abril",
		"Mayo",
		"Junio",
		"Julio",
		"Agosto",
		"Septiembre",
		"Octubre",
		"Noviembre",
		"Diciembre",
	];

	let startMonth = month - 1;
	let startYear = year;
	if (startMonth === 0) {
		startMonth = 12;
		startYear = year - 1;
	}
	const periodStart = new Date(
		Date.UTC(startYear, startMonth - 1, 17, 0, 0, 0, 0),
	);
	const periodEnd = new Date(Date.UTC(year, month - 1, 16, 23, 59, 59, 999));

	const reportedMonth = `${year}${String(month).padStart(2, "0")}`;
	const displayName = `${MONTH_NAMES_ES[month - 1]} ${year}`;

	return {
		periodStart,
		periodEnd,
		reportedMonth,
		displayName,
	};
}

/**
 * Calculate quarterly period dates
 */
export function calculateQuarterlyPeriod(
	year: number,
	quarter: 1 | 2 | 3 | 4,
): {
	periodStart: Date;
	periodEnd: Date;
	reportedMonth: string;
	displayName: string;
} {
	const quarterMonths: Record<1 | 2 | 3 | 4, [number, number]> = {
		1: [1, 3],
		2: [4, 6],
		3: [7, 9],
		4: [10, 12],
	};

	const [startMonth, endMonth] = quarterMonths[quarter];
	const periodStart = new Date(Date.UTC(year, startMonth - 1, 1, 0, 0, 0, 0));
	const periodEnd = new Date(Date.UTC(year, endMonth, 0, 23, 59, 59, 999));

	return {
		periodStart,
		periodEnd,
		reportedMonth: `${year}Q${quarter}`,
		displayName: `Q${quarter} ${year}`,
	};
}

/**
 * Calculate annual period dates
 */
export function calculateAnnualPeriod(year: number): {
	periodStart: Date;
	periodEnd: Date;
	reportedMonth: string;
	displayName: string;
} {
	return {
		periodStart: new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0)),
		periodEnd: new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)),
		reportedMonth: `${year}`,
		displayName: `Anual ${year}`,
	};
}
