/**
 * File Proxy Utilities
 * Converts direct aml-svc file URLs to proxied URLs that work with authentication
 */

import { getAmlCoreBaseUrl } from "@/lib/api/config";

/**
 * Converts a direct aml-svc file URL to a proxied URL
 * This allows images to be displayed in <img> tags with authentication
 *
 * @param fileUrl - The direct URL from aml-svc (e.g., https://aml-svc.../api/v1/files/...)
 * @returns Proxied URL through the Next.js API route
 */
export function getProxiedFileUrl(
	fileUrl: string | undefined | null,
): string | undefined {
	if (!fileUrl) {
		return undefined;
	}

	// Check if this is an aml-svc file URL
	const amlCoreBaseUrl = getAmlCoreBaseUrl();
	if (!fileUrl.startsWith(amlCoreBaseUrl)) {
		// Not an aml-svc URL, return as-is
		return fileUrl;
	}

	// Create proxied URL
	const proxiedUrl = `/api/proxy-file?url=${encodeURIComponent(fileUrl)}`;
	return proxiedUrl;
}

/**
 * Converts multiple file URLs to proxied URLs
 */
export function getProxiedFileUrls(
	fileUrls: (string | undefined | null)[],
): (string | undefined)[] {
	return fileUrls.map(getProxiedFileUrl);
}
