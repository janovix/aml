import { getAmlCoreBaseUrl } from "./config";
import { fetchJson } from "./http";
import type {
	ClientAddress,
	ClientAddressCreateRequest,
	ClientAddressPatchRequest,
	ClientAddressesListResponse,
} from "@/types/client-address";

export async function listClientAddresses(opts: {
	clientId: string;
	baseUrl?: string;
	signal?: AbortSignal;
	/** JWT token for authentication */
	jwt?: string;
}): Promise<ClientAddressesListResponse> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/clients/${opts.clientId}/addresses`, baseUrl);

	const { json } = await fetchJson<ClientAddressesListResponse>(
		url.toString(),
		{
			method: "GET",
			cache: "no-store",
			signal: opts.signal,
			jwt: opts.jwt,
		},
	);
	return json;
}

export async function createClientAddress(opts: {
	clientId: string;
	input: ClientAddressCreateRequest;
	baseUrl?: string;
	signal?: AbortSignal;
	/** JWT token for authentication */
	jwt?: string;
}): Promise<ClientAddress> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/clients/${opts.clientId}/addresses`, baseUrl);

	const { json } = await fetchJson<ClientAddress>(url.toString(), {
		method: "POST",
		cache: "no-store",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(opts.input),
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

export async function updateClientAddress(opts: {
	clientId: string;
	addressId: string;
	input: ClientAddressCreateRequest;
	baseUrl?: string;
	signal?: AbortSignal;
	/** JWT token for authentication */
	jwt?: string;
}): Promise<ClientAddress> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(
		`/api/v1/clients/${opts.clientId}/addresses/${opts.addressId}`,
		baseUrl,
	);

	const { json } = await fetchJson<ClientAddress>(url.toString(), {
		method: "PUT",
		cache: "no-store",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(opts.input),
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

export async function patchClientAddress(opts: {
	clientId: string;
	addressId: string;
	input: ClientAddressPatchRequest;
	baseUrl?: string;
	signal?: AbortSignal;
	/** JWT token for authentication */
	jwt?: string;
}): Promise<ClientAddress> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(
		`/api/v1/clients/${opts.clientId}/addresses/${opts.addressId}`,
		baseUrl,
	);

	const { json } = await fetchJson<ClientAddress>(url.toString(), {
		method: "PATCH",
		cache: "no-store",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(opts.input),
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

export async function deleteClientAddress(opts: {
	clientId: string;
	addressId: string;
	baseUrl?: string;
	signal?: AbortSignal;
	/** JWT token for authentication */
	jwt?: string;
}): Promise<void> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(
		`/api/v1/clients/${opts.clientId}/addresses/${opts.addressId}`,
		baseUrl,
	);

	await fetchJson(url.toString(), {
		method: "DELETE",
		cache: "no-store",
		signal: opts.signal,
		jwt: opts.jwt,
	});
}
