/**
 * Shared file download utilities
 *
 * Consolidates download logic from reports.ts and notices.ts
 */

import { getAmlCoreBaseUrl } from "./config";

export interface DownloadFileOptions {
	/** The URL to download from (either full URL or path) */
	url: string;
	/** Default filename if Content-Disposition header is not present */
	defaultFileName: string;
	/** Base URL (optional if url is absolute) */
	baseUrl?: string;
	/** Abort signal for the request */
	signal?: AbortSignal;
	/** JWT token for authentication */
	jwt?: string;
}

/**
 * Download a file from the API and trigger a browser download
 *
 * Handles:
 * - Authentication via JWT
 * - Error response parsing
 * - Content-Disposition header parsing for filename
 * - Blob download and cleanup
 */
export async function downloadFile(opts: DownloadFileOptions): Promise<void> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();

	// Build full URL if path is relative
	const fullUrl = opts.url.startsWith("http")
		? opts.url
		: new URL(opts.url, baseUrl).toString();

	const headers: HeadersInit = {};
	if (opts.jwt) {
		headers["Authorization"] = `Bearer ${opts.jwt}`;
	}

	const response = await fetch(fullUrl, {
		method: "GET",
		headers,
		signal: opts.signal,
	});

	if (!response.ok) {
		// Try to parse error message from JSON response
		const contentType = response.headers.get("content-type");
		if (contentType?.includes("application/json")) {
			const errorData = (await response.json()) as { message?: string };
			throw new Error(
				errorData.message || `Download failed: ${response.status}`,
			);
		}
		throw new Error(
			`Download failed: ${response.status} ${response.statusText}`,
		);
	}

	// Get filename from Content-Disposition header or use default
	const contentDisposition = response.headers.get("Content-Disposition");
	let fileName = opts.defaultFileName;
	if (contentDisposition) {
		const match = contentDisposition.match(/filename="?([^";\n]+)"?/);
		if (match?.[1]) {
			fileName = match[1];
		}
	}

	// Download the file as a blob
	const blob = await response.blob();

	// Create a download link and trigger it
	const downloadUrl = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = downloadUrl;
	link.download = fileName;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);

	// Clean up the object URL
	URL.revokeObjectURL(downloadUrl);
}
