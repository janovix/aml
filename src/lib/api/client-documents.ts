import { getAmlCoreBaseUrl } from "./config";
import { fetchJson } from "./http";
import type {
	ClientDocument,
	ClientDocumentCreateRequest,
	ClientDocumentPatchRequest,
	ClientDocumentsListResponse,
} from "@/types/client-document";

export async function listClientDocuments(opts: {
	clientId: string;
	baseUrl?: string;
	signal?: AbortSignal;
	/** JWT token for authentication */
	jwt?: string;
}): Promise<ClientDocumentsListResponse> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/clients/${opts.clientId}/documents`, baseUrl);

	const { json } = await fetchJson<ClientDocumentsListResponse>(
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

export async function createClientDocument(opts: {
	clientId: string;
	input: ClientDocumentCreateRequest;
	baseUrl?: string;
	signal?: AbortSignal;
	/** JWT token for authentication */
	jwt?: string;
}): Promise<ClientDocument> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/clients/${opts.clientId}/documents`, baseUrl);

	const { json } = await fetchJson<ClientDocument>(url.toString(), {
		method: "POST",
		cache: "no-store",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(opts.input),
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

export async function updateClientDocument(opts: {
	clientId: string;
	documentId: string;
	input: ClientDocumentCreateRequest;
	baseUrl?: string;
	signal?: AbortSignal;
	/** JWT token for authentication */
	jwt?: string;
}): Promise<ClientDocument> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(
		`/api/v1/clients/${opts.clientId}/documents/${opts.documentId}`,
		baseUrl,
	);

	const { json } = await fetchJson<ClientDocument>(url.toString(), {
		method: "PUT",
		cache: "no-store",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(opts.input),
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

export async function patchClientDocument(opts: {
	clientId: string;
	documentId: string;
	input: ClientDocumentPatchRequest;
	baseUrl?: string;
	signal?: AbortSignal;
	/** JWT token for authentication */
	jwt?: string;
}): Promise<ClientDocument> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(
		`/api/v1/clients/${opts.clientId}/documents/${opts.documentId}`,
		baseUrl,
	);

	const { json } = await fetchJson<ClientDocument>(url.toString(), {
		method: "PATCH",
		cache: "no-store",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(opts.input),
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

export async function deleteClientDocument(opts: {
	clientId: string;
	documentId: string;
	baseUrl?: string;
	signal?: AbortSignal;
	/** JWT token for authentication */
	jwt?: string;
}): Promise<void> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(
		`/api/v1/clients/${opts.clientId}/documents/${opts.documentId}`,
		baseUrl,
	);

	await fetchJson(url.toString(), {
		method: "DELETE",
		cache: "no-store",
		signal: opts.signal,
		jwt: opts.jwt,
	});
}
