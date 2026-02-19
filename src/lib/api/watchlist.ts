/**
 * API client for watchlist-svc
 * Used to fetch watchlist screening results directly from watchlist-svc
 */

import { tokenCache } from "@/lib/auth/tokenCache";
import { getWatchlistBaseUrl } from "./config";

/**
 * Search query result from watchlist-svc
 */
export interface WatchlistQueryResult {
	id: string;
	organizationId: string;
	userId: string;
	query: string;
	source: string;
	entityType: string;
	birthDate: string | null;
	countries: string | null;
	status: string;
	ofacStatus: string;
	ofacResult: unknown;
	ofacCount: number;
	sat69bStatus: string;
	sat69bResult: unknown;
	sat69bCount: number;
	unStatus: string;
	unResult: unknown;
	unCount: number;
	pepOfficialStatus: string;
	pepOfficialResult: unknown;
	pepOfficialCount: number;
	pepAiStatus: string;
	pepAiResult: unknown;
	adverseMediaStatus: string;
	adverseMediaResult: unknown;
	createdAt: string;
	updatedAt: string;
}

/**
 * Fetch watchlist query results by queryId
 */
export async function getQueryResults(
	queryId: string,
): Promise<WatchlistQueryResult | null> {
	const baseUrl = getWatchlistBaseUrl();
	const url = `${baseUrl}/queries/${queryId}`;

	try {
		const token = await tokenCache.getCachedToken();
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
		};

		if (token) {
			headers.Authorization = `Bearer ${token}`;
		}

		const response = await fetch(url, {
			method: "GET",
			headers,
		});

		if (!response.ok) {
			console.error(
				`[WatchlistAPI] Failed to fetch query ${queryId}: ${response.status}`,
			);
			return null;
		}

		const result = (await response.json()) as {
			success: boolean;
			result?: WatchlistQueryResult;
		};

		if (result.success && result.result) {
			return result.result;
		}

		return null;
	} catch (error) {
		console.error("[WatchlistAPI] Error fetching query results:", error);
		return null;
	}
}
