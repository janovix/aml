import { getJwt } from "@/lib/auth/getJwt";
import { fetchJson } from "@/lib/api/http";
import type { Organization } from "@/lib/org-store";
import { normalizeOrganization } from "./organizations";

export interface OrganizationsData {
	organizations: Organization[];
	activeOrganizationId: string | null;
}

/**
 * Server-side function to list organizations
 */
export async function listOrganizationsServer(): Promise<OrganizationsData | null> {
	try {
		const jwt = await getJwt();
		if (!jwt) {
			return null;
		}

		const authAppUrl =
			process.env.AUTH_APP_URL || "https://auth-svc.example.workers.dev";
		const result = await fetchJson<unknown>(
			`${authAppUrl}/api/auth/organization/list`,
			{
				jwt,
			},
		);

		const payload = result.json as Record<string, unknown> | unknown[] | null;
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
