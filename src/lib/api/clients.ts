import { getAmlCoreBaseUrl } from "./config";
import { fetchJson } from "./http";
import type {
	Client,
	ClientCreateRequest,
	ClientsListResponse,
} from "@/types/client";

export interface ListClientsOptions {
	page?: number;
	limit?: number;
	search?: string;
	rfc?: string;
	personType?: "physical" | "moral" | "trust";
	baseUrl?: string;
	signal?: AbortSignal;
	/** JWT token for authentication */
	jwt?: string;
}

export async function listClients(
	opts?: ListClientsOptions,
): Promise<ClientsListResponse> {
	const baseUrl = opts?.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL("/api/v1/clients", baseUrl);

	if (opts?.page) url.searchParams.set("page", String(opts.page));
	if (opts?.limit) url.searchParams.set("limit", String(opts.limit));
	if (opts?.search) url.searchParams.set("search", opts.search);
	if (opts?.rfc) url.searchParams.set("rfc", opts.rfc);
	if (opts?.personType) url.searchParams.set("personType", opts.personType);

	const { json } = await fetchJson<ClientsListResponse>(url.toString(), {
		method: "GET",
		cache: "no-store",
		signal: opts?.signal,
		jwt: opts?.jwt,
	});
	return json;
}

export async function getClientById(opts: {
	id: string;
	baseUrl?: string;
	signal?: AbortSignal;
	/** JWT token for authentication */
	jwt?: string;
}): Promise<Client> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/clients/${opts.id}`, baseUrl);

	const { json } = await fetchJson<Client>(url.toString(), {
		method: "GET",
		cache: "no-store",
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

/**
 * @deprecated Use getClientById instead. This function is kept for backward compatibility.
 */
export async function getClientByRfc(opts: {
	rfc: string;
	baseUrl?: string;
	signal?: AbortSignal;
	/** JWT token for authentication */
	jwt?: string;
}): Promise<Client> {
	// RFC is no longer the primary key, so we need to search by RFC
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL("/api/v1/clients", baseUrl);
	url.searchParams.set("rfc", opts.rfc);
	url.searchParams.set("limit", "1");

	const { json } = await fetchJson<ClientsListResponse>(url.toString(), {
		method: "GET",
		cache: "no-store",
		signal: opts.signal,
		jwt: opts.jwt,
	});

	if (json.data.length === 0) {
		throw new Error("Client not found");
	}

	return json.data[0];
}

export async function createClient(opts: {
	input: ClientCreateRequest;
	baseUrl?: string;
	signal?: AbortSignal;
	/** JWT token for authentication */
	jwt?: string;
}): Promise<Client> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL("/api/v1/clients", baseUrl);

	const { json } = await fetchJson<Client>(url.toString(), {
		method: "POST",
		cache: "no-store",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(opts.input),
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

export async function updateClient(opts: {
	id: string;
	input: ClientCreateRequest;
	baseUrl?: string;
	signal?: AbortSignal;
	/** JWT token for authentication */
	jwt?: string;
}): Promise<Client> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/clients/${opts.id}`, baseUrl);

	const { json } = await fetchJson<Client>(url.toString(), {
		method: "PUT",
		cache: "no-store",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(opts.input),
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

export async function patchClient(opts: {
	id: string;
	input: Partial<ClientCreateRequest>;
	baseUrl?: string;
	signal?: AbortSignal;
	/** JWT token for authentication */
	jwt?: string;
}): Promise<Client> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/clients/${opts.id}`, baseUrl);

	const { json } = await fetchJson<Client>(url.toString(), {
		method: "PATCH",
		cache: "no-store",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(opts.input),
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

export async function deleteClient(opts: {
	id: string;
	baseUrl?: string;
	signal?: AbortSignal;
	/** JWT token for authentication */
	jwt?: string;
}): Promise<void> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/clients/${opts.id}`, baseUrl);

	await fetchJson(url.toString(), {
		method: "DELETE",
		cache: "no-store",
		signal: opts.signal,
		jwt: opts.jwt,
	});
}

// KYC Status types
export interface KYCStatusDocuments {
	required: string[];
	uploaded: string[];
	missing: string[];
	verified: number;
	pending: number;
	total: number;
}

export interface KYCStatusUBOs {
	required: boolean;
	hasUBO?: boolean;
	count?: number;
	allHaveDocuments?: boolean;
}

export interface KYCStatusPEP {
	status: string;
	isPEP: boolean;
	checkedAt: string | null;
}

export interface KYCStatusResponse {
	clientId: string;
	personType: string;
	kycStatus: string;
	completionPercentage: number;
	documents: KYCStatusDocuments;
	ubos: KYCStatusUBOs;
	pep: KYCStatusPEP;
}

/**
 * Get KYC completion status for a client
 */
export async function getClientKYCStatus(opts: {
	id: string;
	baseUrl?: string;
	signal?: AbortSignal;
	/** JWT token for authentication */
	jwt?: string;
}): Promise<KYCStatusResponse> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/clients/${opts.id}/kyc-status`, baseUrl);

	const { json } = await fetchJson<KYCStatusResponse>(url.toString(), {
		method: "GET",
		cache: "no-store",
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}
