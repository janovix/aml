import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const getAuthAppUrl = () => {
	return (
		process.env.NEXT_PUBLIC_AUTH_APP_URL || "https://auth.example.workers.dev"
	);
};

const getAuthServiceUrl = () => {
	return (
		process.env.NEXT_PUBLIC_AUTH_SERVICE_URL ||
		"https://auth-svc.example.workers.dev"
	);
};

function redirectToLogin(request: NextRequest): NextResponse {
	const authAppUrl = getAuthAppUrl();
	const returnUrl = encodeURIComponent(request.url);
	return NextResponse.redirect(`${authAppUrl}/login?redirect_to=${returnUrl}`);
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
 * Default page to redirect to when accessing an org root
 */
const DEFAULT_PAGE = "clients";

/**
 * Known app routes (non-org-slug path segments)
 * These help disambiguate between org slugs and regular routes
 */
const KNOWN_ROUTES = [
	"clients",
	"transactions",
	"alerts",
	"reports",
	"team",
	"settings",
	"invitations",
	"forbidden",
	"not-found",
];

/**
 * Check if a path segment looks like a valid org slug (alphanumeric + hyphens)
 */
function isValidOrgSlug(segment: string): boolean {
	return /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(segment);
}

/**
 * Determine if the request is in vanity subdomain mode.
 * Vanity mode: subdomain IS the org slug (e.g., acme.janovix.ai)
 * Path mode: org slug is in the path (e.g., app.janovix.ai/acme/...)
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
}

interface OrgsResponse {
	organizations?: Organization[];
	activeOrganizationId?: string | null;
}

/**
 * Fetch user's organizations from auth service
 */
async function fetchUserOrganizations(
	cookieHeader: string,
): Promise<OrgsResponse | null> {
	try {
		const response = await fetch(
			`${getAuthServiceUrl()}/api/auth/organization/list`,
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

		const data = await response.json();

		// Handle both array and object response formats
		if (Array.isArray(data)) {
			return { organizations: data, activeOrganizationId: null };
		}

		return data as OrgsResponse;
	} catch {
		return null;
	}
}

/**
 * Check if user has access to a specific organization
 */
function hasAccessToOrg(orgs: Organization[], orgSlug: string): boolean {
	return orgs.some((org) => org.slug === orgSlug);
}

/**
 * Find org by slug
 */
function findOrgBySlug(
	orgs: Organization[],
	orgSlug: string,
): Organization | undefined {
	return orgs.find((org) => org.slug === orgSlug);
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
	const sessionCookie = getSessionCookie(request);

	// No session cookie → redirect to auth app
	if (!sessionCookie) {
		return redirectToLogin(request);
	}

	// Validate session with auth service
	const cookieHeader = request.headers.get("cookie") || "";

	interface SessionData {
		session?: { activeOrganizationId?: string };
		user?: unknown;
	}

	let sessionData: SessionData | null = null;

	try {
		const response = await fetch(
			`${getAuthServiceUrl()}/api/auth/get-session`,
			{
				headers: {
					Cookie: cookieHeader,
					Origin: getAuthAppUrl(),
				},
				cache: "no-store",
			},
		);

		if (!response.ok) {
			return redirectToLogin(request);
		}

		sessionData = (await response.json()) as SessionData;

		if (!sessionData?.session || !sessionData?.user) {
			return redirectToLogin(request);
		}
	} catch {
		return redirectToLogin(request);
	}

	const hostname = request.headers.get("host") || "localhost";
	const pathname = request.nextUrl.pathname;
	const vanityMode = isVanityMode(hostname);

	// In vanity mode, rewrite URL to include org slug in path
	if (vanityMode) {
		const orgSlug = getOrgSlugFromSubdomain(hostname);

		// Rewrite: /clients → /acme/clients (internal, browser URL unchanged)
		const internalPath = `/${orgSlug}${pathname}`;
		const rewriteUrl = new URL(internalPath, request.url);
		rewriteUrl.search = request.nextUrl.search;

		// Continue processing with the rewritten URL
		// We need to validate the org, so we'll fetch orgs and check access
		const orgsData = await fetchUserOrganizations(cookieHeader);
		const organizations = orgsData?.organizations ?? [];

		if (organizations.length === 0) {
			// User has no orgs - redirect to index to create one
			// In vanity mode, we need to redirect to a path-based URL
			return NextResponse.redirect(new URL("/", request.url));
		}

		if (!hasAccessToOrg(organizations, orgSlug)) {
			// Org doesn't exist or user doesn't have access
			// Check if org exists at all (for proper error message)
			// For now, we'll show forbidden - the page will display appropriate message
			return NextResponse.rewrite(
				new URL(`/${orgSlug}/forbidden`, request.url),
			);
		}

		// Valid org access - rewrite to include org in path
		return NextResponse.rewrite(rewriteUrl);
	}

	// Path-based mode: org slug should be in the path

	// Check if this is an org-free route
	for (const route of ORG_FREE_ROUTES) {
		if (pathname.startsWith(route)) {
			return NextResponse.next();
		}
	}

	const pathSegments = pathname.split("/").filter(Boolean);

	// Root path "/" - redirect to index page for org selection
	if (pathSegments.length === 0) {
		// Let the index page handle org selection
		return NextResponse.next();
	}

	const firstSegment = pathSegments[0];

	// Check if first segment is a known route (not an org slug)
	// This means URL is missing org slug: /clients → need to prefix with org
	if (KNOWN_ROUTES.includes(firstSegment)) {
		const orgsData = await fetchUserOrganizations(cookieHeader);
		const organizations = orgsData?.organizations ?? [];

		if (organizations.length === 0) {
			// No orgs - redirect to index to create one
			return NextResponse.redirect(new URL("/", request.url));
		}

		// Find target org (active or first)
		const targetOrg = getTargetOrg(
			organizations,
			orgsData?.activeOrganizationId,
		);

		if (targetOrg) {
			// Redirect to /{orgSlug}/original-path
			return NextResponse.redirect(
				new URL(`/${targetOrg.slug}${pathname}`, request.url),
			);
		}

		// Fallback - shouldn't reach here
		return NextResponse.redirect(new URL("/", request.url));
	}

	// First segment might be an org slug - validate it
	if (isValidOrgSlug(firstSegment)) {
		const orgSlug = firstSegment;

		// Fetch orgs to validate access
		const orgsData = await fetchUserOrganizations(cookieHeader);
		const organizations = orgsData?.organizations ?? [];

		if (organizations.length === 0) {
			// User has no orgs - redirect to index to create one
			return NextResponse.redirect(new URL("/", request.url));
		}

		// Check if user has access to this org
		if (!hasAccessToOrg(organizations, orgSlug)) {
			// No access - show forbidden page
			return NextResponse.rewrite(
				new URL(`/${orgSlug}/forbidden`, request.url),
			);
		}

		// If path is just /{orgSlug}, redirect to default page
		if (pathSegments.length === 1) {
			return NextResponse.redirect(
				new URL(`/${orgSlug}/${DEFAULT_PAGE}`, request.url),
			);
		}

		// Valid org with path - proceed
		return NextResponse.next();
	}

	// Unknown first segment - treat as potential org slug that doesn't exist
	// Show not-found page
	return NextResponse.rewrite(
		new URL(`/${firstSegment}/not-found`, request.url),
	);
}

export const config = {
	matcher: [
		"/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
