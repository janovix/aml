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
 *
 * This hook properly manages multiple URLs without violating React's hooks rules.
 * It uses a single useEffect to fetch all URLs in parallel.
 */
export function usePresignedUrls(
	urls: (string | undefined | null)[],
	options?: Omit<UsePresignedUrlOptions, "url">,
): {
	presignedUrls: (string | undefined)[];
	isLoading: boolean;
	errors: (Error | null)[];
	refresh: () => Promise<void>;
} {
	const {
		expiresInMinutes = 60,
		autoRefresh = true,
		refreshBeforeMinutes = 5,
	} = options ?? {};

	const [state, setState] = useState<{
		presignedUrls: (string | undefined)[];
		errors: (Error | null)[];
	}>({
		presignedUrls: urls.map(() => undefined),
		errors: urls.map(() => null),
	});
	const [isLoading, setIsLoading] = useState(urls.some((url) => !!url));
	const [expiresAt, setExpiresAt] = useState<Date | null>(null);

	// Serialize URLs for dependency comparison
	const urlsKey = JSON.stringify(urls);

	const generateUrls = useCallback(async () => {
		const urlsToProcess = JSON.parse(urlsKey) as (string | undefined | null)[];

		// Check if any URLs need processing
		const hasUrlsToProcess = urlsToProcess.some((url) => !!url);
		if (!hasUrlsToProcess) {
			setState({
				presignedUrls: urlsToProcess.map(() => undefined),
				errors: urlsToProcess.map(() => null),
			});
			setIsLoading(false);
			return;
		}

		setIsLoading(true);

		const results = await Promise.all(
			urlsToProcess.map(async (url) => {
				if (!url) {
					return { presignedUrl: undefined, error: null, expiresAt: null };
				}

				// Check if URL already has a presigned token
				try {
					const urlObj = new URL(url);
					if (urlObj.searchParams.has("token")) {
						// Already presigned, use it directly
						return { presignedUrl: url, error: null, expiresAt: null };
					}
				} catch {
					return {
						presignedUrl: undefined,
						error: new Error("Invalid URL"),
						expiresAt: null,
					};
				}

				try {
					const result = await generatePresignedUrl({
						url,
						expiresInMinutes,
					});
					return {
						presignedUrl: result.presignedUrl,
						error: null,
						expiresAt: new Date(result.expiresAt),
					};
				} catch (err) {
					return {
						presignedUrl: undefined,
						error:
							err instanceof Error
								? err
								: new Error("Failed to generate presigned URL"),
						expiresAt: null,
					};
				}
			}),
		);

		setState({
			presignedUrls: results.map((r) => r.presignedUrl),
			errors: results.map((r) => r.error),
		});

		// Set expiration to the earliest expiring URL
		const expirations = results
			.map((r) => r.expiresAt)
			.filter((d): d is Date => d !== null);
		if (expirations.length > 0) {
			setExpiresAt(new Date(Math.min(...expirations.map((d) => d.getTime()))));
		}

		setIsLoading(false);
	}, [urlsKey, expiresInMinutes]);

	// Generate URLs on mount and when dependencies change
	useEffect(() => {
		void generateUrls();
	}, [generateUrls]);

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
			void generateUrls();
			return;
		}

		// Schedule refresh
		const timeoutId = setTimeout(() => {
			void generateUrls();
		}, timeUntilRefresh);

		return () => clearTimeout(timeoutId);
	}, [autoRefresh, expiresAt, refreshBeforeMinutes, generateUrls]);

	return {
		presignedUrls: state.presignedUrls,
		isLoading,
		errors: state.errors,
		refresh: generateUrls,
	};
}
