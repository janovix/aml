import { cookies } from "next/headers";
import type { Organization } from "@/lib/org-store";
import { normalizeOrganization } from "./organizations";
import { getAuthAppUrl, getAuthServiceUrl } from "./config";

export interface OrganizationsData {
	organizations: Organization[];
	activeOrganizationId: string | null;
}

/**
 * Server-side function to list organizations using session cookies.
 *
 * Note: Better Auth endpoints use cookie-based session auth, not JWT.
 * This matches how the middleware fetches organizations.
 */
export async function listOrganizationsServer(): Promise<OrganizationsData | null> {
	try {
		const cookieStore = await cookies();
		const cookieHeader = cookieStore.toString();

		// Check for session cookie existence
		if (
			!cookieHeader.includes("better-auth.session_token") &&
			!cookieHeader.includes("__Secure-better-auth.session_token")
		) {
			return null;
		}

		const authServiceUrl = getAuthServiceUrl();
		const response = await fetch(
			`${authServiceUrl}/api/auth/organization/list`,
			{
				headers: {
					Cookie: cookieHeader,
					Origin: getAuthAppUrl(),
					Accept: "application/json",
				},
				cache: "no-store",
			},
		);

		if (!response.ok) {
			console.error(
				`Failed to fetch organizations: ${response.status} ${response.statusText}`,
			);
			return null;
		}

		const payload = (await response.json()) as
			| Record<string, unknown>
			| unknown[]
			| null;

		const organizationsRaw = Array.isArray(payload)
			? payload
			: ((payload as Record<string, unknown>)?.organizations ?? []);
		const activeOrganizationId =
			((payload as Record<string, unknown>)?.activeOrganizationId as
				| string
				| null) ??
			((payload as Record<string, unknown>)?.activeOrgId as string | null) ??
			null;

		return {
			organizations: (organizationsRaw as unknown[]).map(normalizeOrganization),
			activeOrganizationId,
		};
	} catch (error) {
		console.error("Failed to load organizations server-side:", error);
		return null;
	}
}
