import { getAmlCoreBaseUrl } from "./config";
import { fetchJson } from "./http";

export interface ClientStats {
	totalClients: number;
	physicalClients: number;
	moralClients: number;
	trustClients: number;
}

export interface OperationStats {
	operationsToday: number;
	suspiciousOperations: number;
	totalVolume: string;
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

export async function getOperationStats(
	opts?: StatsOptions,
): Promise<OperationStats> {
	const baseUrl = opts?.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL("/api/v1/operations/stats", baseUrl);

	const { json } = await fetchJson<OperationStats>(url.toString(), {
		method: "GET",
		cache: "no-store",
		signal: opts?.signal,
		jwt: opts?.jwt,
	});
	return json;
}
