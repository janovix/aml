import { requireEnv } from "@/lib/env";

export function getAmlCoreBaseUrl(): string {
	return requireEnv(
		"NEXT_PUBLIC_AML_CORE_URL",
		process.env.NEXT_PUBLIC_AML_CORE_URL,
	);
}

export function getWatchlistBaseUrl(): string {
	return requireEnv(
		"NEXT_PUBLIC_WATCHLIST_API_BASE_URL",
		process.env.NEXT_PUBLIC_WATCHLIST_API_BASE_URL,
	);
}
