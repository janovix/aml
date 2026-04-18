/**
 * Janbot tools that read organization / subscription context from auth-svc.
 */

import { z } from "zod";
import { getAuthServiceUrl } from "@/lib/auth/config";

async function fetchAuthJson<T>(
	jwt: string,
	path: string,
	init?: RequestInit,
): Promise<T> {
	const base = getAuthServiceUrl().replace(/\/$/, "");
	const res = await fetch(
		`${base}${path.startsWith("/") ? path : `/${path}`}`,
		{
			...init,
			headers: {
				Authorization: `Bearer ${jwt}`,
				Accept: "application/json",
				...(init?.headers ?? {}),
			},
		},
	);
	if (!res.ok) {
		const t = await res.text();
		throw new Error(`Auth API ${res.status}: ${t}`);
	}
	return res.json() as Promise<T>;
}

const emptySchema = z.object({});

const orgIdSchema = z.object({
	organizationId: z
		.string()
		.describe("Organization id (UUID) to inspect membership for"),
});

/**
 * Tools backed by auth-svc session (Bearer JWT).
 */
export function createAuthJanbotTools(jwt: string) {
	return {
		listOrganizationsWithRole: {
			description:
				"List every organization the signed-in user belongs to, with their role in each (owner/admin/member).",
			inputSchema: emptySchema,
			execute: async () => {
				const r = await fetchAuthJson<{
					success: boolean;
					data?: Array<{
						id: string;
						name: string;
						slug: string;
						role: string;
						status: string;
					}>;
				}>(jwt, "/api/organization/list-with-role");
				const rows = r.data ?? [];
				return {
					kind: "janbot.table" as const,
					title: "Organizations",
					columns: ["id", "name", "slug", "role", "status"],
					rows: rows.map((o) => ({
						id: o.id,
						name: o.name,
						slug: o.slug,
						role: o.role,
						status: o.status,
					})),
				};
			},
		},

		getSubscriptionStatusForJanbot: {
			description:
				"High-level subscription status for the active organization (plan tier, trial, limits flags). Uses resolveFromOrg=true.",
			inputSchema: emptySchema,
			execute: async () => {
				const r = await fetchAuthJson<{
					success: boolean;
					data?: Record<string, unknown>;
				}>(jwt, "/api/subscription/status?resolveFromOrg=true");
				return {
					kind: "janbot.api" as const,
					title: "Subscription status",
					endpoint: "/api/subscription/status",
					data: r.data ?? r,
				};
			},
		},

		getOrgMembershipForJanbot: {
			description:
				"Return the current user's role in a specific organization (by organization id).",
			inputSchema: orgIdSchema,
			execute: async ({ organizationId }: z.infer<typeof orgIdSchema>) => {
				const r = await fetchAuthJson<{
					success: boolean;
					data?: { role: string; organizationId: string } | null;
				}>(
					jwt,
					`/api/settings/organization/${encodeURIComponent(organizationId)}/membership`,
				);
				return {
					kind: "janbot.api" as const,
					title: "Membership",
					endpoint: "/api/settings/organization/:orgId/membership",
					data: r.data ?? r,
				};
			},
		},
	};
}

export type AuthJanbotTools = ReturnType<typeof createAuthJanbotTools>;

const AUTH_TOOL_JWT_PLACEHOLDER = "auth-tool-inventory-placeholder";

export function getAuthToolInventoryMarkdown(): string {
	const tools = createAuthJanbotTools(AUTH_TOOL_JWT_PLACEHOLDER);
	const lines: string[] = [];
	for (const [name, def] of Object.entries(tools)) {
		const description =
			def && typeof (def as { description?: string }).description === "string"
				? (def as { description: string }).description
				: "";
		lines.push(`- **${name}**: ${description}`);
	}
	return ["### Auth & organization tools", "", lines.join("\n\n")].join("\n");
}
