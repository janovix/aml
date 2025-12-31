/**
 * Organization URL utilities
 *
 * Provides environment-aware URL generation for org-scoped routes.
 * Handles both vanity subdomain mode (production) and path-based mode (dev).
 */

/**
 * Reserved subdomains that use path-based org routing.
 * Any subdomain NOT in this list is treated as an org slug (vanity mode).
 */
const RESERVED_SUBDOMAINS = [
	"app",
	"aml",
	"aml-local",
	"auth",
	"api",
	"www",
	"docs",
	"localhost",
];

/**
 * Production domain for vanity URLs
 */
const VANITY_DOMAIN = "janovix.ai";

/**
 * Check if the current environment supports vanity subdomain URLs.
 * Returns false for local dev, workers.dev, and reserved subdomains.
 *
 * Path-based mode is used for:
 * - All workers.dev domains (dev/preview deployments like rs-improvements-aml.janovix.workers.dev)
 * - localhost and 127.0.0.1
 * - Reserved subdomains (app, aml, aml-local, etc.)
 */
export function isVanityModeAvailable(): boolean {
	if (typeof window === "undefined") {
		// Server-side - check environment variable
		return process.env.NODE_ENV === "production";
	}

	const hostname = window.location.hostname;

	// workers.dev domains ALWAYS use path-based mode (dev/preview environments)
	// This includes any subdomain pattern: aml.janovix.workers.dev, rs-improvements-aml.janovix.workers.dev, etc.
	if (hostname.endsWith(".workers.dev")) {
		return false;
	}

	// localhost uses path-based mode
	if (hostname.includes("localhost") || hostname.startsWith("127.0.0.1")) {
		return false;
	}

	const subdomain = hostname.split(".")[0].toLowerCase();

	// Reserved subdomains use path-based mode
	if (RESERVED_SUBDOMAINS.includes(subdomain)) {
		return false;
	}

	// Must be on the vanity domain
	return hostname.endsWith(VANITY_DOMAIN);
}

/**
 * Get the current org slug from the URL.
 * Works in both vanity mode (subdomain) and path mode (path segment).
 */
export function getCurrentOrgSlug(): string | null {
	if (typeof window === "undefined") {
		return null;
	}

	const hostname = window.location.hostname;
	const pathname = window.location.pathname;

	// workers.dev domains ALWAYS use path-based mode
	// This includes any subdomain: aml.janovix.workers.dev, rs-improvements-aml.janovix.workers.dev, etc.
	if (hostname.endsWith(".workers.dev")) {
		const pathSegments = pathname.split("/").filter(Boolean);
		return pathSegments[0] || null;
	}

	// localhost uses path-based mode
	if (hostname.includes("localhost") || hostname.startsWith("127.0.0.1")) {
		const pathSegments = pathname.split("/").filter(Boolean);
		return pathSegments[0] || null;
	}

	const subdomain = hostname.split(".")[0].toLowerCase();

	// Reserved subdomains use path-based mode
	if (RESERVED_SUBDOMAINS.includes(subdomain)) {
		const pathSegments = pathname.split("/").filter(Boolean);
		return pathSegments[0] || null;
	}

	// Vanity mode - subdomain is the org slug
	return subdomain;
}

/**
 * Generate an org-scoped URL.
 * In vanity mode: returns subdomain URL (https://acme.janovix.ai/clients)
 * In path mode: returns path-based URL (/acme/clients)
 *
 * @param orgSlug - The organization slug
 * @param path - The path within the org (e.g., "/clients", "/settings")
 * @param options - Optional configuration
 * @returns The generated URL
 */
export function getOrgUrl(
	orgSlug: string,
	path: string = "",
	options: {
		/**
		 * Force absolute URL with protocol
		 */
		absolute?: boolean;
		/**
		 * Force vanity mode (for sharing URLs)
		 */
		forceVanity?: boolean;
	} = {},
): string {
	// Ensure path starts with /
	const normalizedPath = path.startsWith("/") ? path : `/${path}`;

	// Check if we should use vanity mode
	const useVanity = options.forceVanity || isVanityModeAvailable();

	if (useVanity) {
		// Vanity URL: https://acme.janovix.ai/clients
		const protocol = typeof window !== "undefined" ? "https:" : "https:";
		return `${protocol}//${orgSlug}.${VANITY_DOMAIN}${normalizedPath}`;
	}

	// Path-based URL
	const pathUrl = `/${orgSlug}${normalizedPath}`;

	if (options.absolute && typeof window !== "undefined") {
		return `${window.location.origin}${pathUrl}`;
	}

	return pathUrl;
}

/**
 * Generate a shareable org URL.
 * Always returns the vanity format for production, path format for dev.
 */
export function getShareableOrgUrl(orgSlug: string, path: string = ""): string {
	return getOrgUrl(orgSlug, path, { absolute: true, forceVanity: true });
}

/**
 * Parse an org URL and extract the org slug and path.
 */
export function parseOrgUrl(url: string): {
	orgSlug: string | null;
	path: string;
} {
	try {
		const parsed = new URL(url, "https://example.com");
		const hostname = parsed.hostname;
		const pathname = parsed.pathname;
		const subdomain = hostname.split(".")[0].toLowerCase();

		// Check if vanity URL
		if (
			hostname.endsWith(VANITY_DOMAIN) &&
			!RESERVED_SUBDOMAINS.includes(subdomain)
		) {
			return {
				orgSlug: subdomain,
				path: pathname,
			};
		}

		// Path-based URL
		const pathSegments = pathname.split("/").filter(Boolean);
		const orgSlug = pathSegments[0] || null;
		const remainingPath = "/" + pathSegments.slice(1).join("/");

		return {
			orgSlug,
			path: remainingPath,
		};
	} catch {
		return { orgSlug: null, path: "/" };
	}
}
