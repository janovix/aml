import { getAmlCoreBaseUrl } from "./config";
import { fetchJson } from "./http";
import type {
	OperationEntity,
	OperationCreateRequest,
	OperationUpdateRequest,
	OperationListResponse,
	ActivityCode,
} from "@/types/operation";

export interface ListOperationsOptions {
	page?: number;
	limit?: number;
	clientId?: string;
	invoiceId?: string;
	activityCode?: ActivityCode;
	operationTypeCode?: string;
	branchPostalCode?: string;
	alertTypeCode?: string;
	watchlistStatus?: string;
	startDate?: string;
	endDate?: string;
	minAmount?: string;
	maxAmount?: string;
	baseUrl?: string;
	signal?: AbortSignal;
	/** JWT token for authentication */
	jwt?: string;
}

export async function listOperations(
	opts?: ListOperationsOptions,
): Promise<OperationListResponse> {
	const baseUrl = opts?.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL("/api/v1/operations", baseUrl);

	if (opts?.page) url.searchParams.set("page", String(opts.page));
	if (opts?.limit) url.searchParams.set("limit", String(opts.limit));
	if (opts?.clientId) url.searchParams.set("clientId", opts.clientId);
	if (opts?.invoiceId) url.searchParams.set("invoiceId", opts.invoiceId);
	if (opts?.activityCode)
		url.searchParams.set("activityCode", opts.activityCode);
	if (opts?.operationTypeCode)
		url.searchParams.set("operationTypeCode", opts.operationTypeCode);
	if (opts?.branchPostalCode)
		url.searchParams.set("branchPostalCode", opts.branchPostalCode);
	if (opts?.alertTypeCode)
		url.searchParams.set("alertTypeCode", opts.alertTypeCode);
	if (opts?.watchlistStatus)
		url.searchParams.set("watchlistStatus", opts.watchlistStatus);
	if (opts?.startDate) url.searchParams.set("startDate", opts.startDate);
	if (opts?.endDate) url.searchParams.set("endDate", opts.endDate);
	if (opts?.minAmount) url.searchParams.set("minAmount", opts.minAmount);
	if (opts?.maxAmount) url.searchParams.set("maxAmount", opts.maxAmount);

	const { json } = await fetchJson<OperationListResponse>(url.toString(), {
		method: "GET",
		cache: "no-store",
		signal: opts?.signal,
		jwt: opts?.jwt,
	});
	return json;
}

export async function getOperationById(opts: {
	id: string;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<OperationEntity> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/operations/${opts.id}`, baseUrl);

	const { json } = await fetchJson<OperationEntity>(url.toString(), {
		method: "GET",
		cache: "no-store",
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

export async function createOperation(opts: {
	input: OperationCreateRequest;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<OperationEntity> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL("/api/v1/operations", baseUrl);

	const { json } = await fetchJson<OperationEntity>(url.toString(), {
		method: "POST",
		cache: "no-store",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(opts.input),
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

export async function updateOperation(opts: {
	id: string;
	input: OperationUpdateRequest;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<OperationEntity> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/operations/${opts.id}`, baseUrl);

	const { json } = await fetchJson<OperationEntity>(url.toString(), {
		method: "PUT",
		cache: "no-store",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(opts.input),
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

export async function deleteOperation(opts: {
	id: string;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<void> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/operations/${opts.id}`, baseUrl);

	await fetchJson(url.toString(), {
		method: "DELETE",
		cache: "no-store",
		signal: opts.signal,
		jwt: opts.jwt,
	});
}

// --- Activity metadata endpoints ---

export interface ActivityInfo {
	code: ActivityCode;
	name: string;
	description?: string;
}

export interface ActivityFieldInfo {
	field: string;
	type: string;
	required: boolean;
	description?: string;
}

export async function getActivities(opts?: {
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<ActivityInfo[]> {
	const baseUrl = opts?.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL("/api/v1/operations/activities", baseUrl);

	const { json } = await fetchJson<ActivityInfo[]>(url.toString(), {
		method: "GET",
		cache: "no-store",
		signal: opts?.signal,
		jwt: opts?.jwt,
	});
	return json;
}

export async function getActivityFields(opts: {
	code: ActivityCode;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<ActivityFieldInfo[]> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(
		`/api/v1/operations/activities/${opts.code}/fields`,
		baseUrl,
	);

	const { json } = await fetchJson<ActivityFieldInfo[]>(url.toString(), {
		method: "GET",
		cache: "no-store",
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}
