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

export async function middleware(request: NextRequest) {
	const sessionCookie = getSessionCookie(request);

	// No session cookie → redirect to auth app
	if (!sessionCookie) {
		return redirectToLogin(request);
	}

	// Validate session with auth service
	try {
		const cookieHeader = request.headers.get("cookie") || "";
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

		const data = (await response.json()) as {
			session?: unknown;
			user?: unknown;
		};

		// No valid session data → redirect to auth app
		if (!data?.session || !data?.user) {
			return redirectToLogin(request);
		}
	} catch {
		// Auth service error → redirect to auth app
		return redirectToLogin(request);
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		"/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
