import { serverAuthClient } from "./serverAuthClient";

/**
 * Retrieves a JWT token from the auth service using session cookies.
 *
 * Uses the server-side Better Auth client with the JWT plugin to exchange
 * session cookies for a JWT token that can be used to authenticate with
 * external services (like aml-svc).
 *
 * @returns The JWT token string if successful, null otherwise
 *
 * @example
 * // Server-side usage in a Next.js Server Component or API route
 * const jwt = await getJwt();
 * if (jwt) {
 *   const response = await fetch('https://api.example.com/data', {
 *     headers: { Authorization: `Bearer ${jwt}` }
 *   });
 * }
 */
export async function getJwt(): Promise<string | null> {
	try {
		const result = await serverAuthClient.token();
		if (result.error || !result.data?.token) {
			return null;
		}
		return result.data.token;
	} catch {
		return null;
	}
}
