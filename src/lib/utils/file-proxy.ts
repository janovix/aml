/**
 * File Proxy Utilities
 * Handles file URLs from aml-svc, supporting both presigned URLs and proxy fallback
 */

import { getAmlCoreBaseUrl } from "@/lib/api/config";

/**
 * Converts a direct aml-svc file URL to a usable URL
 *
 * Strategy:
 * 1. If URL already has a token query param (presigned URL), use it directly
 * 2. Otherwise, proxy through Next.js API route for authentication
 *
 * @param fileUrl - The URL from aml-svc (e.g., https://aml-svc.../api/v1/files/...)
 * @returns Usable URL (either presigned or proxied)
 */
export function getProxiedFileUrl(
	fileUrl: string | undefined | null,
): string | undefined {
	if (!fileUrl) {
		return undefined;
	}

	// Check if this is an aml-svc file URL
	// Handle both http and https protocols for local development
	const amlCoreBaseUrl = getAmlCoreBaseUrl();
	const amlCoreHost = new URL(amlCoreBaseUrl).hostname;

	try {
		const fileUrlObj = new URL(fileUrl);

		if (fileUrlObj.hostname !== amlCoreHost) {
			// Not an aml-svc URL, return as-is
			return fileUrl;
		}

		// Check if URL already has a presigned token
		if (fileUrlObj.searchParams.has("token")) {
			// Already a presigned URL, use it directly
			return fileUrl;
		}
	} catch {
		// Invalid URL, return as-is
		return fileUrl;
	}

	// No presigned token, create proxied URL
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
