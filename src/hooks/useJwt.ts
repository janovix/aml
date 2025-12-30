"use client";

import { useState, useEffect, useCallback } from "react";
import { getClientJwt } from "@/lib/auth/authClient";

interface UseJwtResult {
	jwt: string | null;
	isLoading: boolean;
	error: Error | null;
	refetch: () => Promise<void>;
}

/**
 * Hook to get a JWT token for API authentication.
 * Fetches the JWT on mount and provides a refetch function.
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

	useEffect(() => {
		fetchJwt();
	}, [fetchJwt]);

	return { jwt, isLoading, error, refetch: fetchJwt };
}
