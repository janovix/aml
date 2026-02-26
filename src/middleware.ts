import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Helper to add Set-Cookie headers from auth-svc to a Next.js response.
 * This is CRITICAL for cookie cache refresh - without forwarding these headers,
 * the browser never receives refreshed session cookies and sessions expire prematurely.
 */
function addAuthCookies(
	response: NextResponse,
	cookies: string[],
): NextResponse {
	if (!cookies || cookies.length === 0) {
		return response;
	}

	// Add the auth-svc Set-Cookie headers to the response
	for (const cookie of cookies) {
		response.headers.append("Set-Cookie", cookie);
	}

	return response;
}

import { requireEnv } from "@/lib/env";

const getAuthAppUrl = () => {
	return requireEnv(
		"NEXT_PUBLIC_AUTH_APP_URL",
		process.env.NEXT_PUBLIC_AUTH_APP_URL,
	);
};

const AUTH_SVC_TIMEOUT_MS = 8000;

/**
 * Wraps fetch() with an AbortController timeout. If auth-svc does not respond
 * within timeoutMs, the request is aborted and the caller's catch block handles
 * the resulting AbortError. This prevents unbounded hangs that cause Cloudflare
 * to kill the middleware Worker with "Network connection lost."
 */
async function fetchWithTimeout(
	url: string,
	options: RequestInit,
	timeoutMs = AUTH_SVC_TIMEOUT_MS,
): Promise<Response> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), timeoutMs);
	try {
		return await fetch(url, { ...options, signal: controller.signal });
	} finally {
		clearTimeout(timeout);
	}
}

const getAuthServiceUrl = () => {
	// For middleware (Edge Runtime), prefer internal URL that doesn't need DNS resolution
	// This allows local development where hosts file entries aren't available in Edge Runtime
	const internalUrl = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL_INTERNAL;
	if (internalUrl && internalUrl.trim().length > 0) {
		return internalUrl.trim().replace(/\/$/, "");
	}
	return requireEnv(
		"NEXT_PUBLIC_AUTH_SERVICE_URL",
		process.env.NEXT_PUBLIC_AUTH_SERVICE_URL,
	);
};

/**
 * Get the external base URL for the request, using forwarded headers from reverse proxy.
 * Returns the origin (protocol + host) without path.
 */
function getExternalOrigin(request: NextRequest): string {
	// Check for forwarded headers (set by Caddy or other reverse proxies)
	const forwardedHost = request.headers.get("x-forwarded-host");
	const forwardedProto = request.headers.get("x-forwarded-proto");

	if (forwardedHost) {
		const protocol = forwardedProto || "https";
		return `${protocol}://${forwardedHost}`;
	}

	// Fallback to request.url origin (works when not behind a proxy)
	return new URL(request.url).origin;
}

/**
 * Get the full external URL for the request, using forwarded headers from reverse proxy.
 * Falls back to request.url if no forwarded headers are present.
 */
function getExternalUrl(request: NextRequest): string {
	const origin = getExternalOrigin(request);
	const pathname = request.nextUrl.pathname;
	const search = request.nextUrl.search;
	return `${origin}${pathname}${search}`;
}

/**
 * Create a URL using the external origin (respects reverse proxy headers).
 * Use this instead of `new URL(path, request.url)` for redirects.
 */
function createExternalUrl(path: string, request: NextRequest): URL {
	return new URL(path, getExternalOrigin(request));
}

/**
 * Build request headers that carry already-fetched session and org data forward to
 * server components. This lets the root layout skip the duplicate auth-svc API calls
 * it would otherwise make, saving 2 round-trips per page load.
 *
 * We only inject headers when we're doing a NextResponse.next() (or rewrite) after
 * full validation, so the data is guaranteed to be present and correct.
 */
function buildDataHeaders(
	original: Headers,
	sessionData: { session?: unknown; user?: unknown } | null,
	userOrganizations: Array<{ id: string; slug: string; name: string }> | null,
	activeOrganizationId: string | null | undefined,
): Headers {
	const headers = new Headers(original);
	if (sessionData) {
		headers.set("x-aml-session", JSON.stringify(sessionData));
	}
	if (userOrganizations !== null) {
		headers.set(
			"x-aml-organizations",
			JSON.stringify({
				organizations: userOrganizations,
				activeOrganizationId: activeOrganizationId ?? null,
			}),
		);
	}
	return headers;
}

function redirectToLogin(request: NextRequest): NextResponse {
	const authAppUrl = getAuthAppUrl();
	const returnUrl = encodeURIComponent(getExternalUrl(request));
	return NextResponse.redirect(`${authAppUrl}/login?redirect_to=${returnUrl}`);
}

/**
 * Redirect to onboarding if user hasn't completed profile setup or has no organization.
 */
function redirectToOnboarding(request: NextRequest): NextResponse {
	const authAppUrl = getAuthAppUrl();
	const returnUrl = encodeURIComponent(getExternalUrl(request));
	return NextResponse.redirect(
		`${authAppUrl}/onboarding?redirect_to=${returnUrl}`,
	);
}

/**
 * Check if user needs profile onboarding (no name or empty name).
 */
function needsProfileOnboarding(user: { name?: string | null }): boolean {
	const userName = user?.name?.trim();
	return !userName;
}

/**
 * Check if user has any organization membership.
 * This is checked via the organizations list from auth service.
 */
function hasOrganizationMembership(
	organizations: Array<{ id: string }> | null,
): boolean {
	return organizations !== null && organizations.length > 0;
}

/**
 * Reserved subdomains that use path-based org routing.
 * Any subdomain NOT in this list is treated as an org slug (vanity mode).
 */
const RESERVED_SUBDOMAINS = [
	"app",
	"aml",
	"aml-local",
	"auth",
	"api",
	"www",
	"docs",
	"localhost",
];

/**
 * Routes that don't require org context in URL
 */
const ORG_FREE_ROUTES = ["/invitations"];

/**
 * Known app routes (non-org-slug path segments)
 * These help disambiguate between org slugs and regular routes
 */
const KNOWN_ROUTES = [
	"clients",
	"operations",
	"alerts",
	"reports",
	"team",
	"settings",
	"dashboard",
	"invitations",
	"forbidden",
	"not-found",
];

/**
 * Check if a path segment looks like a valid org slug (alphanumeric + hyphens)
 * Case-insensitive to handle URLs that might have mixed case
 */
function isValidOrgSlug(segment: string): boolean {
	return /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/i.test(segment);
}

/**
 * Determine if the request is in vanity subdomain mode.
 * Vanity mode: subdomain IS the org slug (e.g., acme.janovix.com)
 * Path mode: org slug is in the path (e.g., app.janovix.com/acme/...)
 *
 * Path-based mode is used for:
 * - Reserved subdomains (app, aml, aml-local, etc.)
 * - All workers.dev domains (dev/preview deployments like rs-improvements-aml.janovix.workers.dev)
 * - localhost and 127.0.0.1
 */
function isVanityMode(hostname: string): boolean {
	// workers.dev domains ALWAYS use path-based mode (dev/preview environments)
	// This includes any subdomain pattern: aml.janovix.workers.dev, rs-improvements-aml.janovix.workers.dev, etc.
	if (hostname.endsWith(".workers.dev")) {
		return false;
	}

	// localhost uses path-based mode
	if (hostname.includes("localhost") || hostname.startsWith("127.0.0.1")) {
		return false;
	}

	// Extract subdomain (first part before first dot)
	const subdomain = hostname.split(".")[0].toLowerCase();

	// If subdomain is reserved, use path-based mode
	if (RESERVED_SUBDOMAINS.includes(subdomain)) {
		return false;
	}

	// Otherwise, it's vanity mode - subdomain is the org slug
	return true;
}

/**
 * Extract org slug from subdomain for vanity mode
 */
function getOrgSlugFromSubdomain(hostname: string): string {
	return hostname.split(".")[0].toLowerCase();
}

interface Organization {
	id: string;
	slug: string;
	name: string;
	role?: string;
}

interface OrgsResponse {
	organizations?: Organization[];
	activeOrganizationId?: string | null;
}

/**
 * Fetch user's organizations from auth service, each enriched with the
 * current user's membership role in a single query (no N+1 list-members).
 */
async function fetchUserOrganizations(
	cookieHeader: string,
): Promise<OrgsResponse | null> {
	try {
		const response = await fetchWithTimeout(
			`${getAuthServiceUrl()}/api/organization/list-with-role`,
			{
				headers: {
					Cookie: cookieHeader,
					Origin: getAuthAppUrl(),
				},
				cache: "no-store",
			},
		);

		if (!response.ok) {
			return null;
		}

		const data = (await response.json()) as {
			success: boolean;
			data: Organization[];
		} | null;

		return {
			organizations: data?.data ?? [],
			activeOrganizationId: null,
		};
	} catch {
		return null;
	}
}

/**
 * Check if user has access to a specific organization
 * Case-insensitive comparison to handle URL case variations
 */
function hasAccessToOrg(orgs: Organization[], orgSlug: string): boolean {
	const normalizedSlug = orgSlug.toLowerCase();
	return orgs.some((org) => org.slug.toLowerCase() === normalizedSlug);
}

/**
 * Find org by slug
 * Case-insensitive comparison to handle URL case variations
 */
function findOrgBySlug(
	orgs: Organization[],
	orgSlug: string,
): Organization | undefined {
	const normalizedSlug = orgSlug.toLowerCase();
	return orgs.find((org) => org.slug.toLowerCase() === normalizedSlug);
}

/**
 * Get the target org for redirect (active org or first org)
 */
function getTargetOrg(
	orgs: Organization[],
	activeOrgId: string | null | undefined,
): Organization | undefined {
	if (activeOrgId) {
		const activeOrg = orgs.find((org) => org.id === activeOrgId);
		if (activeOrg) return activeOrg;
	}
	return orgs[0];
}

export async function middleware(request: NextRequest) {
	// Next.js prefetch requests don't include credentials (cookies) by default.
	// Detect prefetch and allow them through without auth check to prevent CORS errors.
	// The actual page navigation will be protected.
	const purpose = request.headers.get("purpose");
	const nextRouterPrefetch = request.headers.get("x-nextjs-data");
	const isPrefetch = purpose === "prefetch" || nextRouterPrefetch !== null;

	if (isPrefetch) {
		// Allow prefetch requests through without auth check
		// The actual navigation will be protected when user clicks the link
		return NextResponse.next();
	}

	const sessionCookie = getSessionCookie(request);

	// No session cookie → redirect to auth app
	if (!sessionCookie) {
		return redirectToLogin(request);
	}

	// Validate session with auth service
	const cookieHeader = request.headers.get("cookie") || "";

	interface SessionData {
		session?: { activeOrganizationId?: string };
		user?: { name?: string | null; banned?: boolean };
	}

	let sessionData: SessionData | null = null;

	let userOrganizations: Organization[] | null = null;

	// Track Set-Cookie headers from auth-svc to forward to the browser
	// This is CRITICAL for cookie cache refresh to work properly
	let authServiceSetCookies: string[] = [];

	try {
		const response = await fetchWithTimeout(
			`${getAuthServiceUrl()}/api/auth/get-session`,
			{
				headers: {
					Cookie: cookieHeader,
					Origin: getAuthAppUrl(),
				},
				cache: "no-store",
			},
		);

		// CRITICAL: Capture Set-Cookie headers from auth-svc
		// These headers contain refreshed session cookies that MUST be forwarded to the browser
		// Without this, the cookie cache never refreshes and sessions expire prematurely
		const setCookies = response.headers.getSetCookie?.();
		if (setCookies && setCookies.length > 0) {
			authServiceSetCookies = setCookies;
		}

		if (!response.ok) {
			return redirectToLogin(request);
		}

		sessionData = (await response.json()) as SessionData;

		if (!sessionData?.session || !sessionData?.user) {
			return redirectToLogin(request);
		}

		// Check if user is banned
		if (sessionData.user?.banned) {
			return redirectToLogin(request);
		}

		// Check if user needs profile onboarding (no name set)
		if (needsProfileOnboarding(sessionData.user)) {
			const onboardingResponse = redirectToOnboarding(request);
			return addAuthCookies(onboardingResponse, authServiceSetCookies);
		}

		// Fetch user organizations to check if they have any membership
		const orgsData = await fetchUserOrganizations(cookieHeader);
		userOrganizations = orgsData?.organizations ?? null;

		// Check if user has any organization membership
		if (!hasOrganizationMembership(userOrganizations)) {
			const onboardingResponse = redirectToOnboarding(request);
			return addAuthCookies(onboardingResponse, authServiceSetCookies);
		}
	} catch (error) {
		console.error("[AML Middleware] Error during validation:", error);
		return redirectToLogin(request);
	}

	const hostname = request.headers.get("host") || "localhost";
	const pathname = request.nextUrl.pathname;
	const vanityMode = isVanityMode(hostname);
	const activeOrganizationId = sessionData?.session?.activeOrganizationId;

	// In vanity mode, rewrite URL to include org slug in path
	if (vanityMode) {
		const orgSlug = getOrgSlugFromSubdomain(hostname);

		// Rewrite: /clients → /acme/clients (internal, browser URL unchanged)
		const internalPath = `/${orgSlug}${pathname}`;
		const rewriteUrl = new URL(internalPath, request.url);
		rewriteUrl.search = request.nextUrl.search;

		// Reuse the org list already fetched during session validation above
		const organizations = userOrganizations ?? [];

		if (organizations.length === 0) {
			// User has no orgs - redirect to index to create one
			// In vanity mode, we need to redirect to a path-based URL
			const redirectResponse = NextResponse.redirect(
				createExternalUrl("/", request),
			);
			return addAuthCookies(redirectResponse, authServiceSetCookies);
		}

		if (!hasAccessToOrg(organizations, orgSlug)) {
			// Org doesn't exist or user doesn't have access - show not-found
			const notFoundResponse = NextResponse.rewrite(
				createExternalUrl(`/${orgSlug}/not-found`, request),
			);
			return addAuthCookies(notFoundResponse, authServiceSetCookies);
		}

		// Valid org access - rewrite to include org in path, forwarding pre-fetched data
		const rewriteResponse = NextResponse.rewrite(rewriteUrl, {
			request: {
				headers: buildDataHeaders(
					request.headers,
					sessionData,
					organizations,
					activeOrganizationId,
				),
			},
		});
		return addAuthCookies(rewriteResponse, authServiceSetCookies);
	}

	// Path-based mode: org slug should be in the path

	// Check if this is an org-free route
	for (const route of ORG_FREE_ROUTES) {
		if (pathname.startsWith(route)) {
			const nextResponse = NextResponse.next();
			return addAuthCookies(nextResponse, authServiceSetCookies);
		}
	}

	const pathSegments = pathname.split("/").filter(Boolean);

	// Root path "/" - redirect to active org's dashboard
	if (pathSegments.length === 0) {
		// userOrganizations is already fetched above (line 330)
		// We know the user has orgs (checked at line 334)
		if (userOrganizations && userOrganizations.length > 0) {
			// Find the active org or use the first one
			const targetOrg = getTargetOrg(userOrganizations, activeOrganizationId);

			if (targetOrg) {
				const redirectResponse = NextResponse.redirect(
					createExternalUrl(`/${targetOrg.slug}`, request),
				);
				return addAuthCookies(redirectResponse, authServiceSetCookies);
			}
		}

		// Fallback: let the index page handle it (shouldn't reach here normally)
		const nextResponse = NextResponse.next();
		return addAuthCookies(nextResponse, authServiceSetCookies);
	}

	const firstSegment = pathSegments[0];

	// Check if first segment is a known route (not an org slug)
	// This means URL is missing org slug: /clients → need to prefix with org
	if (KNOWN_ROUTES.includes(firstSegment)) {
		// Reuse the org list already fetched during session validation above
		const organizations = userOrganizations ?? [];

		if (organizations.length === 0) {
			// No orgs - redirect to index to create one
			const redirectResponse = NextResponse.redirect(
				createExternalUrl("/", request),
			);
			return addAuthCookies(redirectResponse, authServiceSetCookies);
		}

		// Find target org (active or first) using activeOrganizationId from session
		const targetOrg = getTargetOrg(organizations, activeOrganizationId ?? null);

		if (targetOrg) {
			// Redirect to /{orgSlug}/original-path
			const redirectResponse = NextResponse.redirect(
				createExternalUrl(`/${targetOrg.slug}${pathname}`, request),
			);
			return addAuthCookies(redirectResponse, authServiceSetCookies);
		}

		// Fallback - shouldn't reach here
		const redirectResponse = NextResponse.redirect(
			createExternalUrl("/", request),
		);
		return addAuthCookies(redirectResponse, authServiceSetCookies);
	}

	// First segment might be an org slug - validate it
	if (isValidOrgSlug(firstSegment)) {
		const orgSlug = firstSegment;

		// Reuse the org list already fetched during session validation above
		const organizations = userOrganizations ?? [];

		if (organizations.length === 0) {
			// User has no orgs - redirect to index to create one
			const redirectResponse = NextResponse.redirect(
				createExternalUrl("/", request),
			);
			return addAuthCookies(redirectResponse, authServiceSetCookies);
		}

		// Check if user has access to this org
		if (!hasAccessToOrg(organizations, orgSlug)) {
			// No access - show not-found page (org doesn't exist for this user)
			const rewriteResponse = NextResponse.rewrite(
				createExternalUrl(`/${orgSlug}/not-found`, request),
			);
			return addAuthCookies(rewriteResponse, authServiceSetCookies);
		}

		// Valid org access - proceed, forwarding pre-fetched session and org data
		const nextResponse = NextResponse.next({
			request: {
				headers: buildDataHeaders(
					request.headers,
					sessionData,
					organizations,
					activeOrganizationId,
				),
			},
		});
		return addAuthCookies(nextResponse, authServiceSetCookies);
	}

	// Unknown first segment - treat as potential org slug that doesn't exist
	// Show not-found page
	const rewriteResponse = NextResponse.rewrite(
		createExternalUrl(`/${firstSegment}/not-found`, request),
	);
	return addAuthCookies(rewriteResponse, authServiceSetCookies);
}

export const config = {
	// Exclude api, monitoring (Sentry tunnel), static files, and images from middleware
	matcher: [
		"/((?!api|monitoring|_next/static|_next/image|favicon.ico|site.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
