import { createAuthClient } from "better-auth/client";
import { jwtClient } from "better-auth/client/plugins";
import { getAuthServiceUrl } from "./config";

export const authClient = createAuthClient({
	baseURL: getAuthServiceUrl(),
	fetchOptions: {
		credentials: "include", // CRITICAL: Required for cookies
	},
	plugins: [jwtClient()],
});

/**
 * Get a JWT token for API authentication (client-side).
 * Uses the better-auth JWT plugin to exchange session for a JWT.
 *
 * @returns The JWT token string if successful, null otherwise
 */
export async function getClientJwt(): Promise<string | null> {
	try {
		const result = await authClient.token();
		if (result.error || !result.data?.token) {
			console.error("Failed to get JWT:", result.error);
			return null;
		}
		return result.data.token;
	} catch (error) {
		console.error("Error fetching JWT:", error);
		return null;
	}
}
