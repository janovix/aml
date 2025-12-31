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
 * Routes that don't require org context in URL
 * These are handled separately (e.g., invitation acceptance)
 */
const ORG_FREE_ROUTES = ["/invitations"];

/**
 * Default page to redirect to when no path specified
 */
const DEFAULT_PAGE = "clients";

/**
 * Check if a path segment looks like an org slug (alphanumeric + hyphens)
 */
function isValidOrgSlug(segment: string): boolean {
	return /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(segment);
}

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
];

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

		// Invalid/expired session → redirect to auth app
		if (!response.ok) {
			return redirectToLogin(request);
		}

		sessionData = (await response.json()) as SessionData;

		// No valid session data → redirect to auth app
		if (!sessionData?.session || !sessionData?.user) {
			return redirectToLogin(request);
		}
	} catch {
		// Auth service error → redirect to auth app
		return redirectToLogin(request);
	}

	const pathname = request.nextUrl.pathname;

	// Check if this is an org-free route
	for (const route of ORG_FREE_ROUTES) {
		if (pathname.startsWith(route)) {
			return NextResponse.next();
		}
	}

	// Parse the URL to check for org slug
	const pathSegments = pathname.split("/").filter(Boolean);

	if (pathSegments.length === 0) {
		// Root path "/" - need to redirect to org-scoped path
		// We need to fetch the user's active org or first org
		try {
			const orgsResponse = await fetch(
				`${getAuthServiceUrl()}/api/auth/organization/list`,
				{
					headers: {
						Cookie: cookieHeader,
						Origin: getAuthAppUrl(),
					},
					cache: "no-store",
				},
			);

			if (orgsResponse.ok) {
				const orgsData = (await orgsResponse.json()) as {
					organizations?: Array<{ slug: string }>;
					activeOrganizationId?: string;
				};

				const organizations = Array.isArray(orgsData)
					? orgsData
					: (orgsData?.organizations ?? []);

				if (organizations.length > 0) {
					// Find active org or use first one
					const activeOrg = organizations.find(
						(org: { id?: string }) => org.id === orgsData?.activeOrganizationId,
					);
					const targetOrg = activeOrg || organizations[0];
					const orgSlug = (targetOrg as { slug: string }).slug;

					return NextResponse.redirect(
						new URL(`/${orgSlug}/${DEFAULT_PAGE}`, request.url),
					);
				}
			}
		} catch {
			// If we can't fetch orgs, continue to let OrgBootstrapper handle it
		}

		// No orgs found - continue to OrgBootstrapper which will show create org UI
		return NextResponse.next();
	}

	const firstSegment = pathSegments[0];

	// Check if first segment is a known route (not an org slug)
	if (KNOWN_ROUTES.includes(firstSegment)) {
		// URL like /clients - needs org slug prefix
		// Fetch user's active org and redirect
		try {
			const orgsResponse = await fetch(
				`${getAuthServiceUrl()}/api/auth/organization/list`,
				{
					headers: {
						Cookie: cookieHeader,
						Origin: getAuthAppUrl(),
					},
					cache: "no-store",
				},
			);

			if (orgsResponse.ok) {
				const orgsData = (await orgsResponse.json()) as {
					organizations?: Array<{ slug: string; id?: string }>;
					activeOrganizationId?: string;
				};

				const organizations = Array.isArray(orgsData)
					? orgsData
					: (orgsData?.organizations ?? []);

				if (organizations.length > 0) {
					const activeOrg = organizations.find(
						(org: { id?: string }) => org.id === orgsData?.activeOrganizationId,
					);
					const targetOrg = activeOrg || organizations[0];
					const orgSlug = (targetOrg as { slug: string }).slug;

					// Redirect to /{orgSlug}/original-path
					return NextResponse.redirect(
						new URL(`/${orgSlug}${pathname}`, request.url),
					);
				}
			}
		} catch {
			// Continue to let client-side handle it
		}

		return NextResponse.next();
	}

	// First segment might be an org slug - validate it
	if (isValidOrgSlug(firstSegment)) {
		// Looks like an org slug - pass through, OrgBootstrapper will validate access
		return NextResponse.next();
	}

	// Unknown first segment - continue without redirect
	return NextResponse.next();
}

export const config = {
	matcher: [
		"/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
