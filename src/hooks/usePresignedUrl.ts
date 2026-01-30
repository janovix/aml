/**
 * Hook for managing presigned URLs with automatic refresh
 */

import { useEffect, useState, useCallback } from "react";
import { generatePresignedUrl } from "@/lib/api/file-upload";

interface UsePresignedUrlOptions {
	/** The authenticated file URL from aml-svc */
	url: string | undefined | null;
	/** How long the URL should be valid (in minutes, default: 60) */
	expiresInMinutes?: number;
	/** Whether to automatically refresh before expiration (default: true) */
	autoRefresh?: boolean;
	/** How many minutes before expiration to refresh (default: 5) */
	refreshBeforeMinutes?: number;
}

interface UsePresignedUrlResult {
	/** The presigned URL (or original if already presigned) */
	presignedUrl: string | undefined;
	/** Whether the URL is being generated */
	isLoading: boolean;
	/** Error if URL generation failed */
	error: Error | null;
	/** Manually refresh the URL */
	refresh: () => Promise<void>;
}

/**
 * Hook to manage presigned URLs with automatic refresh
 *
 * @example
 * ```tsx
 * const { presignedUrl, isLoading } = usePresignedUrl({
 *   url: fileUrl,
 *   expiresInMinutes: 60,
 * });
 *
 * return <img src={presignedUrl} alt="Document" />;
 * ```
 */
export function usePresignedUrl(
	options: UsePresignedUrlOptions,
): UsePresignedUrlResult {
	const {
		url,
		expiresInMinutes = 60,
		autoRefresh = true,
		refreshBeforeMinutes = 5,
	} = options;

	const [presignedUrl, setPresignedUrl] = useState<string | undefined>(
		undefined,
	);
	const [expiresAt, setExpiresAt] = useState<Date | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	const generateUrl = useCallback(async () => {
		if (!url) {
			setPresignedUrl(undefined);
			return;
		}

		// Check if URL already has a presigned token
		try {
			const urlObj = new URL(url);
			if (urlObj.searchParams.has("token")) {
				// Already presigned, use it directly
				setPresignedUrl(url);
				return;
			}
		} catch {
			// Invalid URL
			setError(new Error("Invalid URL"));
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			const result = await generatePresignedUrl({
				url,
				expiresInMinutes,
			});

			setPresignedUrl(result.presignedUrl);
			setExpiresAt(new Date(result.expiresAt));
		} catch (err) {
			setError(
				err instanceof Error
					? err
					: new Error("Failed to generate presigned URL"),
			);
		} finally {
			setIsLoading(false);
		}
	}, [url, expiresInMinutes]);

	// Generate URL on mount and when dependencies change
	useEffect(() => {
		void generateUrl();
	}, [generateUrl]);

	// Auto-refresh before expiration
	useEffect(() => {
		if (!autoRefresh || !expiresAt) {
			return;
		}

		const refreshTime = expiresAt.getTime() - refreshBeforeMinutes * 60 * 1000;
		const now = Date.now();
		const timeUntilRefresh = refreshTime - now;

		if (timeUntilRefresh <= 0) {
			// Already expired or about to expire, refresh immediately
			void generateUrl();
			return;
		}

		// Schedule refresh
		const timeoutId = setTimeout(() => {
			void generateUrl();
		}, timeUntilRefresh);

		return () => clearTimeout(timeoutId);
	}, [autoRefresh, expiresAt, refreshBeforeMinutes, generateUrl]);

	return {
		presignedUrl,
		isLoading,
		error,
		refresh: generateUrl,
	};
}

/**
 * Hook to manage multiple presigned URLs
 */
export function usePresignedUrls(
	urls: (string | undefined | null)[],
	options?: Omit<UsePresignedUrlOptions, "url">,
): {
	presignedUrls: (string | undefined)[];
	isLoading: boolean;
	errors: (Error | null)[];
} {
	const results = urls.map((url) =>
		// eslint-disable-next-line react-hooks/rules-of-hooks
		usePresignedUrl({
			...options,
			url,
		}),
	);

	return {
		presignedUrls: results.map((r) => r.presignedUrl),
		isLoading: results.some((r) => r.isLoading),
		errors: results.map((r) => r.error),
	};
}
