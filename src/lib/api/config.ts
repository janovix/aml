const DEFAULT_AML_CORE_URL = "https://aml-bff.janovix.algenium.dev";
export const DEFAULT_API_BASE_URL =
	"https://backend-template.algtools.workers.dev";

/**
 * Base URL for the AML Core API.
 *
 * Uses NEXT_PUBLIC_AML_CORE_URL environment variable, which is available during build.
 * In Next.js, NEXT_PUBLIC_* variables are replaced at build time.
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
 * Base URL for the upstream API (backward compatibility).
 *
 * - Server: prefer `ALGTOOLS_API_BASE_URL`
 * - Client (if you ever call upstream directly): `NEXT_PUBLIC_ALGTOOLS_API_BASE_URL`
 *
 * In this repo we mainly call upstream from Next Route Handlers, so CORS/auth stay server-side.
 */
export function getUpstreamApiBaseUrl() {
	return (
		process.env.ALGTOOLS_API_BASE_URL ??
		process.env.NEXT_PUBLIC_ALGTOOLS_API_BASE_URL ??
		DEFAULT_API_BASE_URL
	);
}
