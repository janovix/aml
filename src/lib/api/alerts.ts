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
 * Alert rule entity from backend (global - no organizationId)
 */
export interface AlertRule {
	id: string; // Alert code (e.g., "2501", "AUTO_UMA")
	name: string;
	description?: string | null;
	active: boolean;
	severity: AlertSeverity;
	ruleType?: string | null; // Matches seeker's ruleType (null for manual-only)
	isManualOnly: boolean; // True if only manual triggers
	activityCode: string; // VEH, JYS, INM, JOY, ART
	metadata?: Record<string, unknown> | null;
	createdAt: string;
	updatedAt: string;
}

/**
 * Alert rule config entity from backend
 */
export interface AlertRuleConfig {
	id: string;
	alertRuleId: string;
	key: string;
	value: string; // JSON string
	isHardcoded: boolean;
	description?: string | null;
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
	metadata: Record<string, unknown>; // Renamed from alertData
	transactionId?: string | null; // Renamed from triggerTransactionId
	isManual: boolean; // True if manually created
	submissionDeadline?: string;
	fileGeneratedAt?: string;
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
	isManual?: boolean;
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
	if (opts?.isManual !== undefined)
		url.searchParams.set("isManual", String(opts.isManual));

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
 * Create a manual alert
 */
export async function createManualAlert(opts: {
	alertRuleId: string;
	clientId: string;
	severity: AlertSeverity;
	idempotencyKey: string;
	contextHash: string;
	metadata: Record<string, unknown>;
	transactionId?: string;
	notes?: string;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<Alert> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL("/api/v1/alerts", baseUrl);

	const { json } = await fetchJson<Alert>(url.toString(), {
		method: "POST",
		cache: "no-store",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({
			alertRuleId: opts.alertRuleId,
			clientId: opts.clientId,
			severity: opts.severity,
			idempotencyKey: opts.idempotencyKey,
			contextHash: opts.contextHash,
			metadata: opts.metadata,
			transactionId: opts.transactionId,
			isManual: true,
			notes: opts.notes,
		}),
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

/**
 * Alert rules list response from backend
 */
export interface AlertRulesListResponse {
	data: AlertRule[];
	pagination: Pagination;
}

/**
 * Options for listing alert rules
 */
export interface ListAlertRulesOptions {
	page?: number;
	limit?: number;
	search?: string;
	active?: boolean;
	severity?: AlertSeverity;
	activityCode?: string;
	isManualOnly?: boolean;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}

/**
 * List alert rules with optional filters and pagination
 * Note: Alert rules are global (not organization-specific)
 */
export async function listAlertRules(
	opts?: ListAlertRulesOptions,
): Promise<AlertRulesListResponse> {
	const baseUrl = opts?.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL("/api/v1/alert-rules", baseUrl);

	if (opts?.page) url.searchParams.set("page", String(opts.page));
	if (opts?.limit) url.searchParams.set("limit", String(opts.limit));
	if (opts?.search) url.searchParams.set("search", opts.search);
	if (opts?.active !== undefined)
		url.searchParams.set("active", String(opts.active));
	if (opts?.severity) url.searchParams.set("severity", opts.severity);
	if (opts?.activityCode)
		url.searchParams.set("activityCode", opts.activityCode);
	if (opts?.isManualOnly !== undefined)
		url.searchParams.set("isManualOnly", String(opts.isManualOnly));

	const { json } = await fetchJson<AlertRulesListResponse>(url.toString(), {
		method: "GET",
		cache: "no-store",
		signal: opts?.signal,
		jwt: opts?.jwt,
	});
	return json;
}

/**
 * Get a single alert rule by ID
 */
export async function getAlertRuleById(opts: {
	id: string;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<AlertRule> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/alert-rules/${opts.id}`, baseUrl);

	const { json } = await fetchJson<AlertRule>(url.toString(), {
		method: "GET",
		cache: "no-store",
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}
