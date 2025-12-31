"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { tokenCache } from "@/lib/auth/tokenCache";
import { useOrgStore } from "@/lib/org-store";

interface UseJwtResult {
	jwt: string | null;
	isLoading: boolean;
	error: Error | null;
	refetch: () => Promise<void>;
}

/**
 * Hook to get a JWT token for API authentication.
 * Uses a shared token cache to prevent duplicate requests.
 * Automatically refetches when the active organization changes.
 * The JWT includes the organizationId claim, so it must be refreshed when switching orgs.
 *
 * Token cache has a stale timeout (default: 5 minutes) to avoid excessive requests.
 *
 * @example
 * const { jwt, isLoading, error } = useJwt();
 *
 * useEffect(() => {
 *   if (jwt) {
 *     listClients({ jwt }).then(setClients);
 *   }
 * }, [jwt]);
 */
export function useJwt(): UseJwtResult {
	const { currentOrg } = useOrgStore();
	const [jwt, setJwt] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);
	const organizationIdRef = useRef<string | null>(currentOrg?.id ?? null);

	const fetchJwt = useCallback(
		async (forceRefresh: boolean = false) => {
			// Don't fetch JWT if no organization is selected
			// The JWT includes organizationId claim, so it would be invalid without one
			const organizationId = currentOrg?.id ?? null;
			if (!organizationId) {
				setJwt(null);
				setIsLoading(false);
				setError(null);
				organizationIdRef.current = null;
				return;
			}

			try {
				setIsLoading(true);
				setError(null);
				const token = await tokenCache.getToken(organizationId, forceRefresh);
				setJwt(token);
				organizationIdRef.current = organizationId;
			} catch (err) {
				setError(err instanceof Error ? err : new Error("Failed to fetch JWT"));
				setJwt(null);
			} finally {
				setIsLoading(false);
			}
		},
		[currentOrg?.id],
	);

	// Refetch JWT when organization changes - the token includes organizationId claim
	useEffect(() => {
		const organizationId = currentOrg?.id ?? null;

		// If no organization, clear JWT and stop loading
		if (!organizationId) {
			tokenCache.clear();
			setJwt(null);
			setIsLoading(false);
			setError(null);
			organizationIdRef.current = null;
			return;
		}

		// If organization changed, clear cache and force refresh
		if (organizationIdRef.current !== organizationId) {
			tokenCache.clear();
			fetchJwt(true);
		} else {
			// Otherwise, fetch normally (will use cache if valid)
			fetchJwt(false);
		}
	}, [fetchJwt, currentOrg?.id]);

	return {
		jwt,
		isLoading,
		error,
		refetch: () => fetchJwt(true),
	};
}
