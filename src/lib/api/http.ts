export class ApiError extends Error {
	name = "ApiError" as const;
	status: number;
	body: unknown;

	constructor(message: string, opts: { status: number; body: unknown }) {
		super(message);
		this.status = opts.status;
		this.body = opts.body;
	}
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

	// Dynamically import to avoid server-side bundling issues
	try {
		const { getClientJwt } = await import("@/lib/auth/authClient");
		return await getClientJwt();
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
	let body: unknown;

	if (isJson) {
		// Clone the response so we can read it as text if JSON parsing fails
		const clonedRes = res.clone();
		try {
			body = await res.json();
		} catch (parseError) {
			// If JSON parsing fails, read as text for better error reporting
			const textBody = await clonedRes.text();
			// If response is not OK, include the text body in the error
			if (!res.ok) {
				throw new ApiError(
					`Request failed: ${res.status} ${res.statusText}. Invalid JSON response.`,
					{
						status: res.status,
						body: textBody,
					},
				);
			}
			// If response is OK but JSON is invalid, throw a more descriptive error
			throw new ApiError(
				`Invalid JSON response from server: ${parseError instanceof Error ? parseError.message : "Unknown parsing error"}`,
				{
					status: res.status,
					body: textBody,
				},
			);
		}
	} else {
		body = await res.text();
	}

	if (!res.ok) {
		throw new ApiError(`Request failed: ${res.status} ${res.statusText}`, {
			status: res.status,
			body,
		});
	}

	return { status: res.status, json: body as T };
}
