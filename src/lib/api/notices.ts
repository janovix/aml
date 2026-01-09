import { getAmlCoreBaseUrl } from "./config";
import { fetchJson } from "./http";

/**
 * Notice status enum matching backend
 */
export type NoticeStatus = "DRAFT" | "GENERATED" | "SUBMITTED" | "ACKNOWLEDGED";

/**
 * Notice entity from backend
 */
export interface Notice {
	id: string;
	organizationId: string;
	name: string;
	status: NoticeStatus;
	periodStart: string;
	periodEnd: string;
	reportedMonth: string;
	recordCount: number;
	xmlFileUrl?: string | null;
	fileSize?: number | null;
	generatedAt?: string | null;
	submittedAt?: string | null;
	satFolioNumber?: string | null;
	createdBy?: string | null;
	notes?: string | null;
	createdAt: string;
	updatedAt: string;
}

/**
 * Notice with alert summary from backend
 */
export interface NoticeWithAlertSummary extends Notice {
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
 * Notice list response from backend
 */
export interface NoticesListResponse {
	data: Notice[];
	pagination: Pagination;
}

/**
 * Notice preview response
 */
export interface NoticePreviewResponse {
	total: number;
	bySeverity: Record<string, number>;
	byStatus: Record<string, number>;
	periodStart: string;
	periodEnd: string;
	reportedMonth: string;
	displayName: string;
	submissionDeadline: string;
}

/**
 * Available month for notice creation
 */
export interface AvailableMonth {
	year: number;
	month: number;
	displayName: string;
	/** True if a pending notice exists (blocks creation) - kept for backward compatibility */
	hasNotice: boolean;
	/** True if there is a DRAFT or GENERATED notice for this period */
	hasPendingNotice: boolean;
	/** True if there is a SUBMITTED or ACKNOWLEDGED notice for this period */
	hasSubmittedNotice: boolean;
	/** Total number of notices for this period */
	noticeCount: number;
}

/**
 * Options for listing notices
 */
export interface ListNoticesOptions {
	page?: number;
	limit?: number;
	status?: NoticeStatus;
	year?: number;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}

/**
 * List notices with optional filters and pagination
 */
export async function listNotices(
	opts?: ListNoticesOptions,
): Promise<NoticesListResponse> {
	const baseUrl = opts?.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL("/api/v1/notices", baseUrl);

	if (opts?.page) url.searchParams.set("page", String(opts.page));
	if (opts?.limit) url.searchParams.set("limit", String(opts.limit));
	if (opts?.status) url.searchParams.set("status", opts.status);
	if (opts?.year) url.searchParams.set("year", String(opts.year));

	const { json } = await fetchJson<NoticesListResponse>(url.toString(), {
		method: "GET",
		cache: "no-store",
		signal: opts?.signal,
		jwt: opts?.jwt,
	});
	return json;
}

/**
 * Get a single notice by ID with alert summary
 */
export async function getNoticeById(opts: {
	id: string;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<NoticeWithAlertSummary> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/notices/${opts.id}`, baseUrl);

	const { json } = await fetchJson<NoticeWithAlertSummary>(url.toString(), {
		method: "GET",
		cache: "no-store",
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

/**
 * Preview alerts for a potential notice
 */
export async function previewNotice(opts: {
	year: number;
	month: number;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<NoticePreviewResponse> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL("/api/v1/notices/preview", baseUrl);

	url.searchParams.set("year", String(opts.year));
	url.searchParams.set("month", String(opts.month));

	const { json } = await fetchJson<NoticePreviewResponse>(url.toString(), {
		method: "GET",
		cache: "no-store",
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

/**
 * Get available months for creating notices
 */
export async function getAvailableMonths(opts?: {
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<{ months: AvailableMonth[] }> {
	const baseUrl = opts?.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL("/api/v1/notices/available-months", baseUrl);

	const { json } = await fetchJson<{ months: AvailableMonth[] }>(
		url.toString(),
		{
			method: "GET",
			cache: "no-store",
			signal: opts?.signal,
			jwt: opts?.jwt,
		},
	);
	return json;
}

/**
 * Create a new notice
 */
export async function createNotice(opts: {
	name: string;
	year: number;
	month: number;
	notes?: string | null;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<Notice> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL("/api/v1/notices", baseUrl);

	const { json } = await fetchJson<Notice>(url.toString(), {
		method: "POST",
		cache: "no-store",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({
			name: opts.name,
			year: opts.year,
			month: opts.month,
			notes: opts.notes,
		}),
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

/**
 * Update a notice
 */
export async function updateNotice(opts: {
	id: string;
	name?: string;
	notes?: string | null;
	satFolioNumber?: string | null;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<Notice> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/notices/${opts.id}`, baseUrl);

	const body: Record<string, unknown> = {};
	if (opts.name !== undefined) body.name = opts.name;
	if (opts.notes !== undefined) body.notes = opts.notes;
	if (opts.satFolioNumber !== undefined)
		body.satFolioNumber = opts.satFolioNumber;

	const { json } = await fetchJson<Notice>(url.toString(), {
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
 * Delete a notice (only DRAFT status)
 */
export async function deleteNotice(opts: {
	id: string;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<void> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/notices/${opts.id}`, baseUrl);

	await fetchJson(url.toString(), {
		method: "DELETE",
		cache: "no-store",
		signal: opts.signal,
		jwt: opts.jwt,
	});
}

/**
 * Generate XML file for a notice
 */
export async function generateNoticeFile(opts: {
	id: string;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<{
	message: string;
	noticeId: string;
	alertCount: number;
}> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/notices/${opts.id}/generate`, baseUrl);

	const { json } = await fetchJson<{
		message: string;
		noticeId: string;
		alertCount: number;
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
 * Download the generated notice XML file
 * Fetches the file as a blob and triggers a download in the browser
 */
export async function downloadNoticeXml(opts: {
	id: string;
	fileName?: string;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<void> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/notices/${opts.id}/download`, baseUrl);

	const headers: HeadersInit = {};
	if (opts.jwt) {
		headers["Authorization"] = `Bearer ${opts.jwt}`;
	}

	const response = await fetch(url.toString(), {
		method: "GET",
		headers,
		signal: opts.signal,
	});

	if (!response.ok) {
		// Try to parse error message from response
		const contentType = response.headers.get("content-type");
		if (contentType?.includes("application/json")) {
			const errorData = (await response.json()) as { message?: string };
			throw new Error(
				errorData.message || `Download failed: ${response.status}`,
			);
		}
		throw new Error(
			`Download failed: ${response.status} ${response.statusText}`,
		);
	}

	// Get filename from Content-Disposition header or use provided/default name
	const contentDisposition = response.headers.get("Content-Disposition");
	let fileName = opts.fileName || `aviso_${opts.id}.xml`;
	if (contentDisposition) {
		const match = contentDisposition.match(/filename="?([^";\n]+)"?/);
		if (match?.[1]) {
			fileName = match[1];
		}
	}

	// Download the file as a blob
	const blob = await response.blob();

	// Create a download link and trigger it
	const downloadUrl = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = downloadUrl;
	link.download = fileName;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);

	// Clean up the object URL
	URL.revokeObjectURL(downloadUrl);
}

/**
 * @deprecated Use downloadNoticeXml instead - this function no longer works as the backend now streams the file directly
 * Get download URL for a generated notice XML
 */
export async function getNoticeDownloadUrl(opts: {
	id: string;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<{
	fileUrl: string;
	fileSize?: number | null;
	format: "xml";
}> {
	// This is deprecated - the backend now streams the file directly
	// Keep for backwards compatibility but it will fail
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/notices/${opts.id}/download`, baseUrl);

	const { json } = await fetchJson<{
		fileUrl: string;
		fileSize?: number | null;
		format: "xml";
	}>(url.toString(), {
		method: "GET",
		cache: "no-store",
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

/**
 * Submit a notice to SAT
 */
export async function submitNoticeToSat(opts: {
	id: string;
	satFolioNumber?: string;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<Notice> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/notices/${opts.id}/submit`, baseUrl);

	const { json } = await fetchJson<Notice>(url.toString(), {
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
 * Record SAT acknowledgment for a notice
 */
export async function acknowledgeNotice(opts: {
	id: string;
	satFolioNumber: string;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<Notice> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/notices/${opts.id}/acknowledge`, baseUrl);

	const { json } = await fetchJson<Notice>(url.toString(), {
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
 * Calculate SAT notice period dates (17th-16th cycle)
 * @param year - The year of the notice
 * @param month - The month of the notice (1-12)
 * @returns Period start and end dates, reported month, and submission deadline
 */
export function calculateNoticePeriod(
	year: number,
	month: number,
): {
	periodStart: Date;
	periodEnd: Date;
	reportedMonth: string;
	displayName: string;
	submissionDeadline: Date;
} {
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

	// Calculate start month (previous month)
	let startMonth = month - 1;
	let startYear = year;
	if (startMonth === 0) {
		startMonth = 12;
		startYear = year - 1;
	}

	// Period starts on day 17 of previous month
	const periodStart = new Date(
		Date.UTC(startYear, startMonth - 1, 17, 0, 0, 0, 0),
	);

	// Period ends on day 16 of current month at end of day
	const periodEnd = new Date(Date.UTC(year, month - 1, 16, 23, 59, 59, 999));

	// Submission deadline is day 17 of following month
	let deadlineMonth = month + 1;
	let deadlineYear = year;
	if (deadlineMonth > 12) {
		deadlineMonth = 1;
		deadlineYear = year + 1;
	}
	const submissionDeadline = new Date(
		Date.UTC(deadlineYear, deadlineMonth - 1, 17, 23, 59, 59, 999),
	);

	const reportedMonth = `${year}${String(month).padStart(2, "0")}`;
	const displayName = `${MONTH_NAMES_ES[month - 1]} ${year}`;

	return {
		periodStart,
		periodEnd,
		reportedMonth,
		displayName,
		submissionDeadline,
	};
}

/**
 * Get status badge color
 */
export function getNoticeStatusColor(status: NoticeStatus): string {
	const colors: Record<NoticeStatus, string> = {
		DRAFT: "bg-gray-100 text-gray-800",
		GENERATED: "bg-blue-100 text-blue-800",
		SUBMITTED: "bg-yellow-100 text-yellow-800",
		ACKNOWLEDGED: "bg-green-100 text-green-800",
	};
	return colors[status] || "bg-gray-100 text-gray-800";
}

/**
 * Get status label in Spanish
 */
export function getNoticeStatusLabel(status: NoticeStatus): string {
	const labels: Record<NoticeStatus, string> = {
		DRAFT: "Borrador",
		GENERATED: "Generado",
		SUBMITTED: "Enviado",
		ACKNOWLEDGED: "Acusado",
	};
	return labels[status] || status;
}
