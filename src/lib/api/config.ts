// Fallback example URL - will fail if NEXT_PUBLIC_AML_CORE_URL is not set
// This helps detect missing environment variable configuration
const DEFAULT_AML_CORE_URL = "https://aml-svc.janovix.workers.dev";
const DEFAULT_WATCHLIST_API_BASE_URL =
	"https://watchlist-svc.janovix.workers.dev";
export const DEFAULT_API_BASE_URL =
	"https://backend-template.algtools.workers.dev";

/**
 * Base URL for the AML Core API.
 *
 * Uses NEXT_PUBLIC_AML_CORE_URL environment variable, which is available during build.
 * In Next.js, NEXT_PUBLIC_* variables are replaced at build time.
 * Falls back to an example URL that will fail if the environment variable is missing.
 */
export function getAmlCoreBaseUrl(): string {
	// In Next.js, NEXT_PUBLIC_* variables are replaced at build time
	// Access it directly - Next.js will replace it with the actual value or undefined
	const envValue = process.env.NEXT_PUBLIC_AML_CORE_URL;
	if (envValue && typeof envValue === "string" && envValue.trim().length > 0) {
		return envValue.trim().replace(/\/$/, "");
	}
	return DEFAULT_AML_CORE_URL;
}

/**
 * Base URL for the Watchlist Service API.
 *
 * Uses NEXT_PUBLIC_WATCHLIST_API_BASE_URL environment variable.
 * Falls back to production URL if not set.
 */
export function getWatchlistBaseUrl(): string {
	const envValue = process.env.NEXT_PUBLIC_WATCHLIST_API_BASE_URL;
	if (envValue && typeof envValue === "string" && envValue.trim().length > 0) {
		return envValue.trim().replace(/\/$/, "");
	}
	return DEFAULT_WATCHLIST_API_BASE_URL;
}
