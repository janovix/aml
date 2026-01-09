export class ApiError extends Error {
	name = "ApiError" as const;
	status: number;
	body: unknown;
	/**
	 * Error code from the API response (e.g., "ORGANIZATION_REQUIRED")
	 * Used for more specific error handling in the frontend
	 */
	code?: string;

	constructor(
		message: string,
		opts: { status: number; body: unknown; code?: string },
	) {
		super(message);
		this.status = opts.status;
		this.body = opts.body;
		this.code = opts.code;
	}
}

/**
 * Check if an error is an organization required error (409)
 * This happens when the JWT doesn't have an organizationId
 */
export function isOrganizationRequiredError(error: unknown): boolean {
	if (error instanceof ApiError) {
		return (
			error.status === 409 ||
			error.code === "ORGANIZATION_REQUIRED" ||
			(typeof error.body === "object" &&
				error.body !== null &&
				"code" in error.body &&
				(error.body as Record<string, unknown>).code ===
					"ORGANIZATION_REQUIRED")
		);
	}
	return false;
}

export interface FetchJsonOptions extends RequestInit {
	/**
	 * JWT token to include in Authorization header.
	 * When provided, adds `Authorization: Bearer <jwt>` header.
	 * If not provided and running in browser (client-side), automatically fetches JWT.
	 */
	jwt?: string | null;
}

/**
 * Check if we're running in a browser environment (client-side)
 */
function isClientSide(): boolean {
	return typeof window !== "undefined";
}

/**
 * Check if we're running in a test environment
 */
function isTestEnvironment(): boolean {
	return (
		typeof process !== "undefined" &&
		(process.env.NODE_ENV === "test" ||
			process.env.VITEST === "true" ||
			process.env.JEST_WORKER_ID !== undefined)
	);
}

/**
 * Automatically get JWT token for client-side requests when not provided.
 * Uses the shared token cache to prevent duplicate token requests.
 * Returns null if not in client-side context or if JWT cannot be retrieved.
 */
async function getJwtIfNeeded(
	jwt: string | null | undefined,
): Promise<string | null> {
	// If JWT is explicitly provided, use it
	if (jwt !== undefined && jwt !== null) {
		return jwt;
	}

	// Don't auto-fetch JWT in test environments or server-side
	// Check test environment first to avoid issues in test environments where window might be defined
	if (isTestEnvironment() || !isClientSide()) {
		return null;
	}

	// Use the shared token cache to prevent duplicate token requests
	// The cache handles deduplication of concurrent requests and caching for 5 minutes
	try {
		const { tokenCache } = await import("@/lib/auth/tokenCache");
		// Use getCachedToken() which doesn't require organization ID
		// This respects the token cache set by useJwt (which handles org switching)
		return await tokenCache.getCachedToken();
	} catch (error) {
		// Silently fail if JWT cannot be retrieved (e.g., user not logged in)
		// This allows the request to proceed without auth if needed
		console.warn("Failed to auto-fetch JWT:", error);
		return null;
	}
}

export async function fetchJson<T>(
	url: string,
	init?: FetchJsonOptions,
): Promise<{ status: number; json: T }> {
	const { jwt: providedJwt, ...fetchInit } = init ?? {};

	// Automatically get JWT if not provided (client-side only)
	const jwt = await getJwtIfNeeded(providedJwt);

	const headers: Record<string, string> = {
		accept: "application/json",
		...(fetchInit?.headers as Record<string, string> | undefined),
	};

	if (jwt) {
		headers.Authorization = `Bearer ${jwt}`;
	}

	const res = await fetch(url, {
		...fetchInit,
		headers,
	});

	const contentType = res.headers.get("content-type") ?? "";
	const isJson = contentType.includes("application/json");
	const body = isJson ? await res.json().catch(() => null) : await res.text();

	if (!res.ok) {
		// Extract error code from response body if available
		const errorCode =
			typeof body === "object" &&
			body !== null &&
			"code" in body &&
			typeof (body as Record<string, unknown>).code === "string"
				? ((body as Record<string, unknown>).code as string)
				: undefined;

		throw new ApiError(`Request failed: ${res.status} ${res.statusText}`, {
			status: res.status,
			body,
			code: errorCode,
		});
	}

	return { status: res.status, json: body as T };
}
