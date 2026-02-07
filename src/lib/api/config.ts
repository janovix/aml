// Fallback example URL - will fail if NEXT_PUBLIC_AML_CORE_URL is not set
// This helps detect missing environment variable configuration
const DEFAULT_AML_CORE_URL = "https://aml-svc.janovix.workers.dev";
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
