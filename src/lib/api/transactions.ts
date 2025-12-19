import { getAmlCoreBaseUrl } from "./config";
import { fetchJson } from "./http";
import type {
	Transaction,
	TransactionCreateRequest,
	TransactionListResponse,
	TransactionUpdateRequest,
} from "@/types/transaction";

export interface ListTransactionsOptions {
	page?: number;
	limit?: number;
	clientId?: string;
	operationType?: "purchase" | "sale";
	vehicleType?: "land" | "marine" | "air";
	branchPostalCode?: string;
	startDate?: string; // date-time format
	endDate?: string; // date-time format
	baseUrl?: string;
	signal?: AbortSignal;
	/** JWT token for authentication */
	jwt?: string;
}

export async function listTransactions(
	opts?: ListTransactionsOptions,
): Promise<TransactionListResponse> {
	const baseUrl = opts?.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL("/api/v1/transactions", baseUrl);

	if (opts?.page) url.searchParams.set("page", String(opts.page));
	if (opts?.limit) url.searchParams.set("limit", String(opts.limit));
	if (opts?.clientId) url.searchParams.set("clientId", opts.clientId);
	if (opts?.operationType)
		url.searchParams.set("operationType", opts.operationType);
	if (opts?.vehicleType) url.searchParams.set("vehicleType", opts.vehicleType);
	if (opts?.branchPostalCode)
		url.searchParams.set("branchPostalCode", opts.branchPostalCode);
	if (opts?.startDate) url.searchParams.set("startDate", opts.startDate);
	if (opts?.endDate) url.searchParams.set("endDate", opts.endDate);

	const { json } = await fetchJson<TransactionListResponse>(url.toString(), {
		method: "GET",
		cache: "no-store",
		signal: opts?.signal,
		jwt: opts?.jwt,
	});
	return json;
}

export async function getTransactionById(opts: {
	id: string;
	baseUrl?: string;
	signal?: AbortSignal;
	/** JWT token for authentication */
	jwt?: string;
}): Promise<Transaction> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/transactions/${opts.id}`, baseUrl);

	const { json } = await fetchJson<Transaction>(url.toString(), {
		method: "GET",
		cache: "no-store",
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

export async function createTransaction(opts: {
	input: TransactionCreateRequest;
	baseUrl?: string;
	signal?: AbortSignal;
	/** JWT token for authentication */
	jwt?: string;
}): Promise<Transaction> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL("/api/v1/transactions", baseUrl);

	const { json } = await fetchJson<Transaction>(url.toString(), {
		method: "POST",
		cache: "no-store",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(opts.input),
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

export async function updateTransaction(opts: {
	id: string;
	input: TransactionUpdateRequest;
	baseUrl?: string;
	signal?: AbortSignal;
	/** JWT token for authentication */
	jwt?: string;
}): Promise<Transaction> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/transactions/${opts.id}`, baseUrl);

	const { json } = await fetchJson<Transaction>(url.toString(), {
		method: "PUT",
		cache: "no-store",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(opts.input),
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

export async function deleteTransaction(opts: {
	id: string;
	baseUrl?: string;
	signal?: AbortSignal;
	/** JWT token for authentication */
	jwt?: string;
}): Promise<void> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/transactions/${opts.id}`, baseUrl);

	await fetchJson(url.toString(), {
		method: "DELETE",
		cache: "no-store",
		signal: opts.signal,
		jwt: opts.jwt,
	});
}
