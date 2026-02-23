/**
 * API functions for Shareholder management
 */

import { getAmlCoreBaseUrl } from "./config";
import { fetchJson } from "./http";
import type {
	Shareholder,
	ShareholderCreateRequest,
	ShareholderPatchRequest,
	ShareholderListResponse,
} from "@/types/shareholder";

export async function listClientShareholders(opts: {
	clientId: string;
	parentShareholderId?: string;
	baseUrl?: string;
	signal?: AbortSignal;
	/** JWT token for authentication */
	jwt?: string;
}): Promise<ShareholderListResponse> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();

	// If parentShareholderId is provided, use sub-shareholders endpoint
	const url = opts.parentShareholderId
		? new URL(
				`/api/v1/clients/${opts.clientId}/shareholders/${opts.parentShareholderId}/sub-shareholders`,
				baseUrl,
			)
		: new URL(`/api/v1/clients/${opts.clientId}/shareholders`, baseUrl);

	const { json } = await fetchJson<ShareholderListResponse>(url.toString(), {
		method: "GET",
		cache: "no-store",
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

export async function getShareholderById(opts: {
	clientId: string;
	shareholderId: string;
	baseUrl?: string;
	signal?: AbortSignal;
	/** JWT token for authentication */
	jwt?: string;
}): Promise<Shareholder> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(
		`/api/v1/clients/${opts.clientId}/shareholders/${opts.shareholderId}`,
		baseUrl,
	);

	const { json } = await fetchJson<Shareholder>(url.toString(), {
		method: "GET",
		cache: "no-store",
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

export async function createShareholder(opts: {
	clientId: string;
	input: ShareholderCreateRequest;
	baseUrl?: string;
	signal?: AbortSignal;
	/** JWT token for authentication */
	jwt?: string;
}): Promise<Shareholder> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/clients/${opts.clientId}/shareholders`, baseUrl);

	const { json } = await fetchJson<Shareholder>(url.toString(), {
		method: "POST",
		cache: "no-store",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(opts.input),
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

export async function updateShareholder(opts: {
	clientId: string;
	shareholderId: string;
	input: ShareholderCreateRequest;
	baseUrl?: string;
	signal?: AbortSignal;
	/** JWT token for authentication */
	jwt?: string;
}): Promise<Shareholder> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(
		`/api/v1/clients/${opts.clientId}/shareholders/${opts.shareholderId}`,
		baseUrl,
	);

	const { json } = await fetchJson<Shareholder>(url.toString(), {
		method: "PUT",
		cache: "no-store",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(opts.input),
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

export async function patchShareholder(opts: {
	clientId: string;
	shareholderId: string;
	input: ShareholderPatchRequest;
	baseUrl?: string;
	signal?: AbortSignal;
	/** JWT token for authentication */
	jwt?: string;
}): Promise<Shareholder> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(
		`/api/v1/clients/${opts.clientId}/shareholders/${opts.shareholderId}`,
		baseUrl,
	);

	const { json } = await fetchJson<Shareholder>(url.toString(), {
		method: "PATCH",
		cache: "no-store",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(opts.input),
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

export async function deleteShareholder(opts: {
	clientId: string;
	shareholderId: string;
	baseUrl?: string;
	signal?: AbortSignal;
	/** JWT token for authentication */
	jwt?: string;
}): Promise<void> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(
		`/api/v1/clients/${opts.clientId}/shareholders/${opts.shareholderId}`,
		baseUrl,
	);

	await fetchJson(url.toString(), {
		method: "DELETE",
		cache: "no-store",
		signal: opts.signal,
		jwt: opts.jwt,
	});
}
