import { fetchJson } from "./http";
import { getAmlCoreBaseUrl } from "./config";

export interface ExchangeRate {
	from: string;
	to: string;
	rate: number;
	timestamp: number;
}

export interface ExchangeRateOptions {
	baseUrl?: string;
	signal?: AbortSignal;
	/** JWT token for authentication */
	jwt?: string;
}

/**
 * Fetch exchange rate between two currencies.
 * Returns null if the service is unavailable (e.g., no API key, rate limit exceeded).
 */
export async function fetchExchangeRate(
	from: string,
	to: string,
	opts?: ExchangeRateOptions,
): Promise<ExchangeRate | null> {
	const baseUrl = opts?.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(
		`/api/v1/exchange-rates?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
		baseUrl,
	);

	try {
		const { json } = await fetchJson<ExchangeRate>(url.toString(), {
			method: "GET",
			cache: "no-store",
			signal: opts?.signal,
			jwt: opts?.jwt,
		});
		return json;
	} catch (error) {
		// 503 = service unavailable, user must enter rate manually
		console.error("Failed to fetch exchange rate:", error);
		return null;
	}
}
