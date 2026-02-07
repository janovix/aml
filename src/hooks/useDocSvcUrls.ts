/**
 * Hook for fetching document URLs from doc-svc
 *
 * Used to display document images stored in doc-svc's R2 bucket
 */

import { useState, useEffect, useCallback } from "react";
import { getDocumentUrls, type DocumentUrlsResponse } from "@/lib/api/doc-svc";

interface UseDocSvcUrlsOptions {
	/** Organization ID */
	organizationId: string;
	/** doc-svc document ID */
	documentId: string | null | undefined;
	/** Type of URLs to fetch */
	type?: "pdf" | "images" | "all";
	/** Auto-refresh interval in ms (default: 50 minutes = 3,000,000ms) */
	refreshInterval?: number;
	/** Enable auto-refresh */
	autoRefresh?: boolean;
}

interface UseDocSvcUrlsResult {
	/** PDF presigned URL (if available) */
	pdfUrl: string | null;
	/** Image presigned URLs */
	imageUrls: string[];
	/** Expiration time of the URLs */
	expiresAt: string | null;
	/** Loading state */
	isLoading: boolean;
	/** Error state */
	error: Error | null;
	/** Manually refresh URLs */
	refresh: () => Promise<void>;
}

/**
 * Hook to fetch presigned URLs from doc-svc for displaying documents
 *
 * @example
 * ```tsx
 * function DocumentViewer({ docSvcDocumentId }: { docSvcDocumentId: string }) {
 *   const { currentOrg } = useOrgStore();
 *   const { imageUrls, pdfUrl, isLoading, error } = useDocSvcUrls({
 *     organizationId: currentOrg?.id || "",
 *     documentId: docSvcDocumentId,
 *   });
 *
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <div>Error loading document</div>;
 *
 *   return (
 *     <div>
 *       {imageUrls.map((url, i) => (
 *         <img key={i} src={url} alt={`Page ${i + 1}`} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useDocSvcUrls(
	options: UseDocSvcUrlsOptions,
): UseDocSvcUrlsResult {
	const {
		organizationId,
		documentId,
		type = "all",
		refreshInterval = 50 * 60 * 1000, // 50 minutes (presigned URLs last 1 hour)
		autoRefresh = true,
	} = options;

	const [pdfUrl, setPdfUrl] = useState<string | null>(null);
	const [imageUrls, setImageUrls] = useState<string[]>([]);
	const [expiresAt, setExpiresAt] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	const fetchUrls = useCallback(async () => {
		if (!documentId || !organizationId) {
			setPdfUrl(null);
			setImageUrls([]);
			setExpiresAt(null);
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			const result: DocumentUrlsResponse = await getDocumentUrls(
				organizationId,
				documentId,
				type,
			);

			setPdfUrl(result.pdfUrl ?? null);
			setImageUrls(result.imageUrls);
			setExpiresAt(result.expiresAt);
		} catch (err) {
			setError(err instanceof Error ? err : new Error("Failed to fetch URLs"));
			setPdfUrl(null);
			setImageUrls([]);
		} finally {
			setIsLoading(false);
		}
	}, [documentId, organizationId, type]);

	// Initial fetch
	useEffect(() => {
		fetchUrls();
	}, [fetchUrls]);

	// Auto-refresh
	useEffect(() => {
		if (!autoRefresh || !documentId || !organizationId) {
			return;
		}

		const intervalId = setInterval(fetchUrls, refreshInterval);
		return () => clearInterval(intervalId);
	}, [autoRefresh, documentId, organizationId, refreshInterval, fetchUrls]);

	return {
		pdfUrl,
		imageUrls,
		expiresAt,
		isLoading,
		error,
		refresh: fetchUrls,
	};
}

/**
 * Hook to get a single document image URL from doc-svc
 *
 * Convenience wrapper around useDocSvcUrls for single image use cases
 */
export function useDocSvcImageUrl(options: {
	organizationId: string;
	documentId: string | null | undefined;
	imageIndex?: number;
}): {
	url: string | null;
	isLoading: boolean;
	error: Error | null;
} {
	const { organizationId, documentId, imageIndex = 0 } = options;
	const { imageUrls, isLoading, error } = useDocSvcUrls({
		organizationId,
		documentId,
		type: "images",
	});

	return {
		url: imageUrls[imageIndex] ?? null,
		isLoading,
		error,
	};
}
