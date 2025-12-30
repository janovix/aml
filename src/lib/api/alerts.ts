import { getAmlCoreBaseUrl } from "./config";
import { fetchJson } from "./http";

/**
 * Alert status enum matching backend
 */
export type AlertStatus =
	| "DETECTED"
	| "FILE_GENERATED"
	| "SUBMITTED"
	| "OVERDUE"
	| "CANCELLED";

/**
 * Alert severity enum matching backend
 */
export type AlertSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

/**
 * Alert rule entity from backend
 */
export interface AlertRule {
	id: string;
	name: string;
	description?: string;
	active: boolean;
	severity: AlertSeverity;
	ruleConfig: string;
	metadata?: string;
	createdAt: string;
	updatedAt: string;
}

/**
 * Alert entity from backend
 */
export interface Alert {
	id: string;
	alertRuleId: string;
	clientId: string;
	status: AlertStatus;
	severity: AlertSeverity;
	idempotencyKey: string;
	contextHash: string;
	alertData: string;
	triggerTransactionId?: string;
	submissionDeadline?: string;
	fileGeneratedAt?: string;
	satFileUrl?: string;
	submittedAt?: string;
	satAcknowledgmentReceipt?: string;
	satFolioNumber?: string;
	isOverdue: boolean;
	notes?: string;
	reviewedAt?: string;
	reviewedBy?: string;
	cancelledAt?: string;
	cancelledBy?: string;
	cancellationReason?: string;
	createdAt: string;
	updatedAt: string;
	alertRule?: AlertRule;
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
 * Alert list response from backend
 */
export interface AlertsListResponse {
	data: Alert[];
	pagination: Pagination;
}

/**
 * Options for listing alerts
 */
export interface ListAlertsOptions {
	page?: number;
	limit?: number;
	alertRuleId?: string;
	clientId?: string;
	status?: AlertStatus;
	severity?: AlertSeverity;
	baseUrl?: string;
	signal?: AbortSignal;
	/** JWT token for authentication */
	jwt?: string;
}

/**
 * List alerts with optional filters and pagination
 */
export async function listAlerts(
	opts?: ListAlertsOptions,
): Promise<AlertsListResponse> {
	const baseUrl = opts?.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL("/api/v1/alerts", baseUrl);

	if (opts?.page) url.searchParams.set("page", String(opts.page));
	if (opts?.limit) url.searchParams.set("limit", String(opts.limit));
	if (opts?.alertRuleId) url.searchParams.set("alertRuleId", opts.alertRuleId);
	if (opts?.clientId) url.searchParams.set("clientId", opts.clientId);
	if (opts?.status) url.searchParams.set("status", opts.status);
	if (opts?.severity) url.searchParams.set("severity", opts.severity);

	const { json } = await fetchJson<AlertsListResponse>(url.toString(), {
		method: "GET",
		cache: "no-store",
		signal: opts?.signal,
		jwt: opts?.jwt,
	});
	return json;
}

/**
 * Get a single alert by ID
 */
export async function getAlertById(opts: {
	id: string;
	baseUrl?: string;
	signal?: AbortSignal;
	/** JWT token for authentication */
	jwt?: string;
}): Promise<Alert> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/alerts/${opts.id}`, baseUrl);

	const { json } = await fetchJson<Alert>(url.toString(), {
		method: "GET",
		cache: "no-store",
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

/**
 * Update alert status
 */
export async function updateAlertStatus(opts: {
	id: string;
	status: AlertStatus;
	notes?: string;
	baseUrl?: string;
	signal?: AbortSignal;
	/** JWT token for authentication */
	jwt?: string;
}): Promise<Alert> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/alerts/${opts.id}`, baseUrl);

	const { json } = await fetchJson<Alert>(url.toString(), {
		method: "PATCH",
		cache: "no-store",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ status: opts.status, notes: opts.notes }),
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

/**
 * Cancel an alert
 */
export async function cancelAlert(opts: {
	id: string;
	reason: string;
	baseUrl?: string;
	signal?: AbortSignal;
	/** JWT token for authentication */
	jwt?: string;
}): Promise<Alert> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/alerts/${opts.id}/cancel`, baseUrl);

	const { json } = await fetchJson<Alert>(url.toString(), {
		method: "POST",
		cache: "no-store",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ reason: opts.reason }),
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

/**
 * Generate SAT file for an alert
 */
export async function generateAlertSatFile(opts: {
	id: string;
	baseUrl?: string;
	signal?: AbortSignal;
	/** JWT token for authentication */
	jwt?: string;
}): Promise<{ fileUrl: string }> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/alerts/${opts.id}/generate-file`, baseUrl);

	const { json } = await fetchJson<{ fileUrl: string }>(url.toString(), {
		method: "POST",
		cache: "no-store",
		headers: { "content-type": "application/json" },
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}
