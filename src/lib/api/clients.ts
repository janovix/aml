import { getAmlCoreBaseUrl } from "./config";
import { fetchJson } from "./http";
import type {
	Client,
	ClientCreateRequest,
	ClientsListResponse,
	Pagination,
} from "@/types/client";

export interface ListClientsOptions {
	page?: number;
	limit?: number;
	search?: string;
	rfc?: string;
	personType?: "physical" | "moral" | "trust";
	baseUrl?: string;
	signal?: AbortSignal;
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
	});
	return json;
}

export async function getClientByRfc(opts: {
	rfc: string;
	baseUrl?: string;
	signal?: AbortSignal;
}): Promise<Client> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/clients/${opts.rfc}`, baseUrl);

	const { json } = await fetchJson<Client>(url.toString(), {
		method: "GET",
		cache: "no-store",
		signal: opts.signal,
	});
	return json;
}

export async function createClient(opts: {
	input: ClientCreateRequest;
	baseUrl?: string;
	signal?: AbortSignal;
}): Promise<Client> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL("/api/v1/clients", baseUrl);

	const { json } = await fetchJson<Client>(url.toString(), {
		method: "POST",
		cache: "no-store",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(opts.input),
		signal: opts.signal,
	});
	return json;
}

export async function updateClient(opts: {
	rfc: string;
	input: ClientCreateRequest;
	baseUrl?: string;
	signal?: AbortSignal;
}): Promise<Client> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/clients/${opts.rfc}`, baseUrl);

	const { json } = await fetchJson<Client>(url.toString(), {
		method: "PUT",
		cache: "no-store",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(opts.input),
		signal: opts.signal,
	});
	return json;
}

export async function patchClient(opts: {
	rfc: string;
	input: Partial<ClientCreateRequest>;
	baseUrl?: string;
	signal?: AbortSignal;
}): Promise<Client> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/clients/${opts.rfc}`, baseUrl);

	const { json } = await fetchJson<Client>(url.toString(), {
		method: "PATCH",
		cache: "no-store",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(opts.input),
		signal: opts.signal,
	});
	return json;
}

export async function deleteClient(opts: {
	rfc: string;
	baseUrl?: string;
	signal?: AbortSignal;
}): Promise<void> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/clients/${opts.rfc}`, baseUrl);

	await fetchJson(url.toString(), {
		method: "DELETE",
		cache: "no-store",
		signal: opts.signal,
	});
}
