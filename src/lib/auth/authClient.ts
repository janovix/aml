import { createAuthClient } from "better-auth/client";
import { jwtClient, organizationClient } from "better-auth/client/plugins";
import { getAuthServiceUrl } from "./config";

/**
 * Custom event detail for rate limit events.
 * Dispatched when the server returns HTTP 429 (Too Many Requests).
 */
export interface RateLimitEventDetail {
	/** Number of seconds until the user can retry, from X-Retry-After header */
	retryAfter: number;
	/** The URL that was rate limited */
	url?: string;
}

/**
 * Custom event name for rate limit notifications.
 * Components can listen for this event to show appropriate UI feedback.
 */
export const AUTH_RATE_LIMIT_EVENT = "auth:rate-limited";

export const authClient = createAuthClient({
	baseURL: getAuthServiceUrl(),
	fetchOptions: {
		credentials: "include", // CRITICAL: Required for cookies
		onError: async (context) => {
			const { response } = context;

			if (response.status === 429) {
				const retryAfterHeader = response.headers.get("X-Retry-After");

				if (!retryAfterHeader) {
					return;
				}

				const retryAfter = parseInt(retryAfterHeader, 10);

				if (isNaN(retryAfter) || retryAfter <= 0) {
					return;
				}

				if (typeof window !== "undefined") {
					const detail: RateLimitEventDetail = {
						retryAfter,
						url: response.url,
					};
					window.dispatchEvent(
						new CustomEvent(AUTH_RATE_LIMIT_EVENT, { detail }),
					);
				}
			}
		},
	},
	plugins: [jwtClient(), organizationClient()],
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
