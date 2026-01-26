/**
 * API functions for Ultimate Beneficial Owner (UBO) management
 */

import { getAmlCoreBaseUrl } from "./config";
import { fetchJson } from "./http";
import type {
	UBO,
	UBOCreateRequest,
	UBOPatchRequest,
	UBOListResponse,
} from "@/types/ubo";

export async function listClientUBOs(opts: {
	clientId: string;
	baseUrl?: string;
	signal?: AbortSignal;
	/** JWT token for authentication */
	jwt?: string;
}): Promise<UBOListResponse> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/clients/${opts.clientId}/ubos`, baseUrl);

	const { json } = await fetchJson<UBOListResponse>(url.toString(), {
		method: "GET",
		cache: "no-store",
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

export async function getUBOById(opts: {
	clientId: string;
	uboId: string;
	baseUrl?: string;
	signal?: AbortSignal;
	/** JWT token for authentication */
	jwt?: string;
}): Promise<UBO> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(
		`/api/v1/clients/${opts.clientId}/ubos/${opts.uboId}`,
		baseUrl,
	);

	const { json } = await fetchJson<UBO>(url.toString(), {
		method: "GET",
		cache: "no-store",
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

export async function createUBO(opts: {
	clientId: string;
	input: UBOCreateRequest;
	baseUrl?: string;
	signal?: AbortSignal;
	/** JWT token for authentication */
	jwt?: string;
}): Promise<UBO> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/clients/${opts.clientId}/ubos`, baseUrl);

	const { json } = await fetchJson<UBO>(url.toString(), {
		method: "POST",
		cache: "no-store",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(opts.input),
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

export async function updateUBO(opts: {
	clientId: string;
	uboId: string;
	input: UBOCreateRequest;
	baseUrl?: string;
	signal?: AbortSignal;
	/** JWT token for authentication */
	jwt?: string;
}): Promise<UBO> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(
		`/api/v1/clients/${opts.clientId}/ubos/${opts.uboId}`,
		baseUrl,
	);

	const { json } = await fetchJson<UBO>(url.toString(), {
		method: "PUT",
		cache: "no-store",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(opts.input),
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

export async function patchUBO(opts: {
	clientId: string;
	uboId: string;
	input: UBOPatchRequest;
	baseUrl?: string;
	signal?: AbortSignal;
	/** JWT token for authentication */
	jwt?: string;
}): Promise<UBO> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(
		`/api/v1/clients/${opts.clientId}/ubos/${opts.uboId}`,
		baseUrl,
	);

	const { json } = await fetchJson<UBO>(url.toString(), {
		method: "PATCH",
		cache: "no-store",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(opts.input),
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

export async function deleteUBO(opts: {
	clientId: string;
	uboId: string;
	baseUrl?: string;
	signal?: AbortSignal;
	/** JWT token for authentication */
	jwt?: string;
}): Promise<void> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(
		`/api/v1/clients/${opts.clientId}/ubos/${opts.uboId}`,
		baseUrl,
	);

	await fetchJson(url.toString(), {
		method: "DELETE",
		cache: "no-store",
		signal: opts.signal,
		jwt: opts.jwt,
	});
}
