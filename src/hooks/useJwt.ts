"use client";

import { useState, useEffect, useCallback } from "react";
import { getClientJwt } from "@/lib/auth/authClient";
import { useOrgStore } from "@/lib/org-store";

interface UseJwtResult {
	jwt: string | null;
	isLoading: boolean;
	error: Error | null;
	refetch: () => Promise<void>;
}

/**
 * Hook to get a JWT token for API authentication.
 * Fetches the JWT on mount and refetches when the active organization changes.
 * The JWT includes the organizationId claim, so it must be refreshed when switching orgs.
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

	const fetchJwt = useCallback(async () => {
		try {
			setIsLoading(true);
			setError(null);
			const token = await getClientJwt();
			setJwt(token);
		} catch (err) {
			setError(err instanceof Error ? err : new Error("Failed to fetch JWT"));
			setJwt(null);
		} finally {
			setIsLoading(false);
		}
	}, []);

	// Refetch JWT when organization changes - the token includes organizationId claim
	useEffect(() => {
		fetchJwt();
	}, [fetchJwt, currentOrg?.id]);

	return { jwt, isLoading, error, refetch: fetchJwt };
}
