import { cookies } from "next/headers";
import { getAuthServiceUrl, getAuthAppUrl } from "./config";
import type { Session } from "./types";

export async function getServerSession(): Promise<Session> {
	const cookieStore = await cookies();
	const cookieHeader = cookieStore.toString();

	// Check for session cookie existence
	if (!cookieHeader.includes("better-auth.session_token")) {
		return null;
	}

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

		if (!response.ok) return null;

		const data = (await response.json()) as {
			session?: NonNullable<Session>["session"];
			user?: NonNullable<Session>["user"];
		};
		return data.session && data.user
			? ({ user: data.user, session: data.session } as Session)
			: null;
	} catch {
		return null;
	}
}
