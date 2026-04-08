"use server";

import { getFlagsServiceUrl } from "@/lib/auth/config";
import { getJwt } from "@/lib/auth/getJwt";
import { getServerSession } from "@/lib/auth/getServerSession";

export type FlagValue = boolean | string | number | Record<string, unknown>;

/**
 * Evaluate feature flags for the current session via flags-svc (Bearer JWT).
 */
export async function evaluateFlagsForSession(keys: string[]): Promise<{
	flags: Record<string, FlagValue>;
	error: string | null;
}> {
	if (keys.length === 0) {
		return { flags: {}, error: null };
	}

	const jwt = await getJwt();
	if (!jwt) {
		return { flags: {}, error: "Not authenticated" };
	}

	const session = await getServerSession();
	const activeOrg = (
		session?.session as { activeOrganizationId?: string | null } | undefined
	)?.activeOrganizationId;
	const orgId = activeOrg ? String(activeOrg) : undefined;
	const userId = session?.user.id;

	const base = getFlagsServiceUrl().replace(/\/$/, "");
	const res = await fetch(`${base}/api/flags/evaluate`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${jwt}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			context: {
				organizationId: orgId,
				userId,
				environment: process.env.NEXT_PUBLIC_ENVIRONMENT ?? "development",
			},
			keys,
		}),
		cache: "no-store",
	});

	const body = await res.json().catch(() => null);
	if (!res.ok) {
		return {
			flags: {},
			error: `Flags evaluate failed (${res.status})`,
		};
	}

	const data = body as {
		success?: boolean;
		result?: Record<string, FlagValue>;
	};
	return { flags: data.result ?? {}, error: null };
}
