import { getAmlCoreBaseUrl } from "./config";
import { fetchJson } from "./http";
import { downloadFile } from "./download";

export type NoticeStatus =
	| "DRAFT"
	| "GENERATED"
	| "SUBMITTED"
	| "ACKNOWLEDGED"
	| "REBUKED";

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
	amendmentCycle: number;
	createdBy?: string | null;
	notes?: string | null;
	createdAt: string;
	updatedAt: string;
}

export type NoticeEventType =
	| "CREATED"
	| "GENERATED"
	| "SUBMITTED"
	| "ACKNOWLEDGED"
	| "REBUKED"
	| "REVERTED"
	| "ALERTS_MODIFIED";

export interface NoticeEvent {
	id: string;
	noticeId: string;
	organizationId: string;
	eventType: NoticeEventType;
	fromStatus?: string | null;
	toStatus: string;
	cycle: number;
	pdfDocumentId?: string | null;
	xmlFileUrl?: string | null;
	fileSize?: number | null;
	notes?: string | null;
	createdBy?: string | null;
	createdAt: string;
}

export interface NoticeAlertDetail {
	id: string;
	clientId: string;
	clientName: string;
	operationId?: string | null;
	alertRuleName: string;
	severity: string;
	status: string;
	createdAt: string;
	activityCode?: string | null;
}

export interface NoticeWithAlertSummary extends Notice {
	alertSummary: {
		total: number;
		bySeverity: Record<string, number>;
		byStatus: Record<string, number>;
		byRule: Array<{ ruleId: string; ruleName: string; count: number }>;
	};
	events: NoticeEvent[];
	alerts: NoticeAlertDetail[];
}

import type { Pagination, ListResult } from "@/types/list-result";

export type { Pagination };

export type NoticesListResponse = ListResult<Notice>;

export interface PreviewAlert {
	id: string;
	clientId: string;
	clientName: string;
	operationId?: string | null;
	alertRuleName: string;
	severity: string;
	status: string;
	createdAt: string;
	activityCode?: string | null;
}

export interface NoticePreviewResponse {
	total: number;
	bySeverity: Record<string, number>;
	byStatus: Record<string, number>;
	alerts: PreviewAlert[];
	periodStart: string;
	periodEnd: string;
	reportedMonth: string;
	displayName: string;
	submissionDeadline: string;
}

export interface AvailableMonth {
	year: number;
	month: number;
	displayName: string;
	hasNotice: boolean;
	hasPendingNotice: boolean;
	hasSubmittedNotice: boolean;
	noticeCount: number;
}

export interface ListNoticesOptions {
	page?: number;
	limit?: number;
	status?: NoticeStatus;
	year?: number;
	filters?: Record<string, string | string[]>;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}

export async function listNotices(
	opts?: ListNoticesOptions,
): Promise<NoticesListResponse> {
	const baseUrl = opts?.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL("/api/v1/notices", baseUrl);

	if (opts?.page) url.searchParams.set("page", String(opts.page));
	if (opts?.limit) url.searchParams.set("limit", String(opts.limit));
	if (opts?.status) url.searchParams.set("status", opts.status);
	if (opts?.year) url.searchParams.set("year", String(opts.year));

	if (opts?.filters) {
		for (const [key, value] of Object.entries(opts.filters)) {
			if (Array.isArray(value)) {
				value.forEach((v) => url.searchParams.append(key, v));
			} else {
				url.searchParams.set(key, value);
			}
		}
	}

	const { json } = await fetchJson<NoticesListResponse>(url.toString(), {
		method: "GET",
		cache: "no-store",
		signal: opts?.signal,
		jwt: opts?.jwt,
	});
	return json;
}

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

export async function createNotice(opts: {
	name: string;
	year: number;
	month: number;
	notes?: string | null;
	alertIds?: string[];
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<Notice> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL("/api/v1/notices", baseUrl);

	const body: Record<string, unknown> = {
		name: opts.name,
		year: opts.year,
		month: opts.month,
		notes: opts.notes,
	};
	if (opts.alertIds !== undefined) body.alertIds = opts.alertIds;

	const { json } = await fetchJson<Notice>(url.toString(), {
		method: "POST",
		cache: "no-store",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(body),
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

export async function updateNotice(opts: {
	id: string;
	name?: string;
	notes?: string | null;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<Notice> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/notices/${opts.id}`, baseUrl);

	const body: Record<string, unknown> = {};
	if (opts.name !== undefined) body.name = opts.name;
	if (opts.notes !== undefined) body.notes = opts.notes;

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

export async function downloadNoticeXml(opts: {
	id: string;
	fileName?: string;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<void> {
	return downloadFile({
		url: `/api/v1/notices/${opts.id}/download`,
		defaultFileName: opts.fileName || `aviso_${opts.id}.xml`,
		baseUrl: opts.baseUrl,
		signal: opts.signal,
		jwt: opts.jwt,
	});
}

export async function submitNoticeToSat(opts: {
	id: string;
	docSvcDocumentId: string;
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
			docSvcDocumentId: opts.docSvcDocumentId,
		}),
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

export async function acknowledgeNotice(opts: {
	id: string;
	docSvcDocumentId: string;
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
			docSvcDocumentId: opts.docSvcDocumentId,
		}),
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

export async function rebukeNotice(opts: {
	id: string;
	docSvcDocumentId: string;
	notes?: string | null;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<Notice> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/notices/${opts.id}/rebuke`, baseUrl);

	const { json } = await fetchJson<Notice>(url.toString(), {
		method: "POST",
		cache: "no-store",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({
			docSvcDocumentId: opts.docSvcDocumentId,
			notes: opts.notes,
		}),
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

export async function revertNoticeToDraft(opts: {
	id: string;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<Notice> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/notices/${opts.id}/revert`, baseUrl);

	const { json } = await fetchJson<Notice>(url.toString(), {
		method: "POST",
		cache: "no-store",
		headers: { "content-type": "application/json" },
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

export async function addAlertsToNotice(opts: {
	id: string;
	alertIds: string[];
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<{ added: number }> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/notices/${opts.id}/alerts/add`, baseUrl);

	const { json } = await fetchJson<{ added: number }>(url.toString(), {
		method: "POST",
		cache: "no-store",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ alertIds: opts.alertIds }),
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

export async function removeAlertsFromNotice(opts: {
	id: string;
	alertIds: string[];
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<{ removed: number }> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/notices/${opts.id}/alerts/remove`, baseUrl);

	const { json } = await fetchJson<{ removed: number }>(url.toString(), {
		method: "POST",
		cache: "no-store",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ alertIds: opts.alertIds }),
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

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

export function getNoticeStatusColor(status: NoticeStatus): string {
	const colors: Record<NoticeStatus, string> = {
		DRAFT: "bg-gray-100 text-gray-800",
		GENERATED: "bg-blue-100 text-blue-800",
		SUBMITTED: "bg-yellow-100 text-yellow-800",
		ACKNOWLEDGED: "bg-green-100 text-green-800",
		REBUKED: "bg-red-100 text-red-800",
	};
	return colors[status] || "bg-gray-100 text-gray-800";
}

export function getNoticeStatusLabel(status: NoticeStatus): string {
	const labels: Record<NoticeStatus, string> = {
		DRAFT: "Borrador",
		GENERATED: "Generado",
		SUBMITTED: "Enviado",
		ACKNOWLEDGED: "Acusado",
		REBUKED: "Rechazado",
	};
	return labels[status] || status;
}
