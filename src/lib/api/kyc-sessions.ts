import { getAmlCoreBaseUrl } from "./config";
import { fetchJson } from "./http";

// ─── Types ────────────────────────────────────────────────────────────────────

export type KycSessionStatus =
	| "ACTIVE"
	| "IN_PROGRESS"
	| "SUBMITTED"
	| "PENDING_REVIEW"
	| "APPROVED"
	| "REJECTED"
	| "EXPIRED"
	| "REVOKED";

export type KycIdentificationTier =
	| "ALWAYS"
	| "ABOVE_THRESHOLD"
	| "BELOW_THRESHOLD";

export type KycSessionEventType =
	| "session_created"
	| "session_accessed"
	| "personal_info_updated"
	| "document_uploaded"
	| "shareholder_added"
	| "shareholder_updated"
	| "beneficial_controller_added"
	| "beneficial_controller_updated"
	| "address_added"
	| "session_submitted"
	| "session_approved"
	| "session_rejected"
	| "session_revoked"
	| "email_sent";

export interface KycSessionEntity {
	id: string;
	organizationId: string;
	clientId: string;
	token: string;
	status: KycSessionStatus;
	expiresAt: string;
	createdBy: string;
	emailSentAt: string | null;
	startedAt: string | null;
	submittedAt: string | null;
	reviewedAt: string | null;
	reviewedBy: string | null;
	rejectionReason: string | null;
	editableSections: string[] | null;
	uploadLinkId: string | null;
	identificationTier: KycIdentificationTier;
	thresholdAmountMxn: number | null;
	clientCumulativeMxn: number | null;
	completedSections: string[] | null;
	lastActivityAt: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface KycSessionEventEntity {
	id: string;
	sessionId: string;
	eventType: KycSessionEventType;
	actorIp: string | null;
	actorType: "client" | "admin" | "system";
	actorId: string | null;
	payload: string | null;
	createdAt: string;
}

export interface KycSessionCreateInput {
	clientId: string;
	editableSections?: string[];
}

export interface KycSessionRejectInput {
	reason: string;
	reopenForCorrections?: boolean;
}

export interface KycSessionListOptions {
	clientId?: string;
	status?: KycSessionStatus | KycSessionStatus[];
	page?: number;
	limit?: number;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}

interface KycSessionListResponse {
	data: KycSessionEntity[];
	total: number;
	page: number;
	limit: number;
}

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * Create a new KYC session for a client.
 */
export async function createKycSession(opts: {
	input: KycSessionCreateInput;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<KycSessionEntity> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL("/api/v1/kyc-sessions", baseUrl);

	const { json } = await fetchJson<{ session: KycSessionEntity }>(
		url.toString(),
		{
			method: "POST",
			cache: "no-store",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(opts.input),
			signal: opts.signal,
			jwt: opts.jwt,
		},
	);
	return json.session;
}

/**
 * List KYC sessions with optional filters.
 */
export async function listKycSessions(
	opts?: KycSessionListOptions,
): Promise<KycSessionListResponse> {
	const baseUrl = opts?.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL("/api/v1/kyc-sessions", baseUrl);

	if (opts?.clientId) url.searchParams.set("clientId", opts.clientId);
	if (opts?.status) {
		const statuses = Array.isArray(opts.status) ? opts.status : [opts.status];
		statuses.forEach((s) => url.searchParams.append("status", s));
	}
	if (opts?.page) url.searchParams.set("page", String(opts.page));
	if (opts?.limit) url.searchParams.set("limit", String(opts.limit));

	const { json } = await fetchJson<KycSessionListResponse>(url.toString(), {
		method: "GET",
		cache: "no-store",
		signal: opts?.signal,
		jwt: opts?.jwt,
	});
	return json;
}

/**
 * Get a single KYC session by ID.
 */
export async function getKycSession(opts: {
	id: string;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<KycSessionEntity> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/kyc-sessions/${opts.id}`, baseUrl);

	const { json } = await fetchJson<{ session: KycSessionEntity }>(
		url.toString(),
		{
			method: "GET",
			cache: "no-store",
			signal: opts.signal,
			jwt: opts.jwt,
		},
	);
	return json.session;
}

/**
 * Get the audit trail events for a KYC session.
 */
export async function getKycSessionEvents(opts: {
	id: string;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<KycSessionEventEntity[]> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/kyc-sessions/${opts.id}/events`, baseUrl);

	const { json } = await fetchJson<{ events: KycSessionEventEntity[] }>(
		url.toString(),
		{
			method: "GET",
			cache: "no-store",
			signal: opts.signal,
			jwt: opts.jwt,
		},
	);
	return json.events;
}

/**
 * Resend the KYC invite email for a session.
 */
export async function resendKycEmail(opts: {
	id: string;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<void> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/kyc-sessions/${opts.id}/resend-email`, baseUrl);

	await fetchJson<{ ok: boolean }>(url.toString(), {
		method: "POST",
		cache: "no-store",
		signal: opts.signal,
		jwt: opts.jwt,
	});
}

/**
 * Approve a submitted KYC session (Art. 18-I compliance – "de manera directa").
 */
export async function approveKycSession(opts: {
	id: string;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<KycSessionEntity> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/kyc-sessions/${opts.id}/approve`, baseUrl);

	const { json } = await fetchJson<{ session: KycSessionEntity }>(
		url.toString(),
		{
			method: "POST",
			cache: "no-store",
			signal: opts.signal,
			jwt: opts.jwt,
		},
	);
	return json.session;
}

/**
 * Reject a submitted KYC session.
 * If reopenForCorrections is true, the session transitions back to ACTIVE
 * so the client can make corrections and resubmit.
 */
export async function rejectKycSession(opts: {
	id: string;
	input: KycSessionRejectInput;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<KycSessionEntity> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/kyc-sessions/${opts.id}/reject`, baseUrl);

	const { json } = await fetchJson<{ session: KycSessionEntity }>(
		url.toString(),
		{
			method: "POST",
			cache: "no-store",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(opts.input),
			signal: opts.signal,
			jwt: opts.jwt,
		},
	);
	return json.session;
}

/**
 * Revoke a KYC session (cancels it permanently).
 */
export async function revokeKycSession(opts: {
	id: string;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<void> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/kyc-sessions/${opts.id}/revoke`, baseUrl);

	await fetchJson<{ ok: boolean }>(url.toString(), {
		method: "POST",
		cache: "no-store",
		signal: opts.signal,
		jwt: opts.jwt,
	});
}
