import { getAmlCoreBaseUrl } from "./config";
import { fetchJson } from "./http";

export interface ClientStats {
	totalClients: number;
	openAlerts: number;
	urgentReviews: number;
}

export interface TransactionStats {
	transactionsToday: number;
	suspiciousTransactions: number;
	totalVolume: string;
	totalVehicles: number;
}

export interface StatsOptions {
	baseUrl?: string;
	signal?: AbortSignal;
	/** JWT token for authentication */
	jwt?: string;
}

export async function getClientStats(
	opts?: StatsOptions,
): Promise<ClientStats> {
	const baseUrl = opts?.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL("/api/v1/clients/stats", baseUrl);

	const { json } = await fetchJson<ClientStats>(url.toString(), {
		method: "GET",
		cache: "no-store",
		signal: opts?.signal,
		jwt: opts?.jwt,
	});
	return json;
}

export async function getTransactionStats(
	opts?: StatsOptions,
): Promise<TransactionStats> {
	const baseUrl = opts?.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL("/api/v1/transactions/stats", baseUrl);

	const { json } = await fetchJson<TransactionStats>(url.toString(), {
		method: "GET",
		cache: "no-store",
		signal: opts?.signal,
		jwt: opts?.jwt,
	});
	return json;
}
