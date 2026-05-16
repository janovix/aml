import { getAmlCoreBaseUrl } from "./config";
import { fetchJson } from "./http";

export interface ScreeningHistoryItem {
	id: string;
	watchlistQueryId: string | null;
	screenedAt: string;
	triggeredBy: string;
	screeningResult: string;
	ofacSanctioned: number;
	unscSanctioned: number;
	sat69bListed: number;
	isPEP: number;
	adverseMediaFlagged: number;
	changeFlags: Record<string, "new"> | null;
	errorMessage: string | null;
	createdAt: string;
}

export interface ScreeningHistoryResponse {
	items: ScreeningHistoryItem[];
	pagination: {
		limit: number;
		offset: number;
		total: number;
		hasMore: boolean;
	};
}

export type ScreeningHistoryListOptions = {
	limit?: number;
	offset?: number;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
};

export async function getClientScreeningHistory(
	clientId: string,
	opts?: ScreeningHistoryListOptions,
): Promise<ScreeningHistoryResponse> {
	const baseUrl = opts?.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(
		`/api/v1/clients/${encodeURIComponent(clientId)}/screening-history`,
		baseUrl,
	);
	if (opts?.limit != null) {
		url.searchParams.set("limit", String(opts.limit));
	}
	if (opts?.offset != null) {
		url.searchParams.set("offset", String(opts.offset));
	}
	const { json } = await fetchJson<ScreeningHistoryResponse>(url.toString(), {
		method: "GET",
		cache: "no-store",
		signal: opts?.signal,
		jwt: opts?.jwt,
	});
	return json;
}

export async function getBeneficialControllerScreeningHistory(
	clientId: string,
	bcId: string,
	opts?: ScreeningHistoryListOptions,
): Promise<ScreeningHistoryResponse> {
	const baseUrl = opts?.baseUrl ?? getAmlCoreBaseUrl();
	const path = `/api/v1/clients/${encodeURIComponent(clientId)}/beneficial-controllers/${encodeURIComponent(bcId)}/screening-history`;
	const url = new URL(path, baseUrl);
	if (opts?.limit != null) {
		url.searchParams.set("limit", String(opts.limit));
	}
	if (opts?.offset != null) {
		url.searchParams.set("offset", String(opts.offset));
	}
	const { json } = await fetchJson<ScreeningHistoryResponse>(url.toString(), {
		method: "GET",
		cache: "no-store",
		signal: opts?.signal,
		jwt: opts?.jwt,
	});
	return json;
}
