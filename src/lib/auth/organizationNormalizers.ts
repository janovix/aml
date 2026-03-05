/**
 * Pure normalizer functions for organization data.
 *
 * Kept in a server-safe module (no "use client", no browser imports) so that
 * Server Components and server utilities can import these without pulling in
 * any client-only dependencies.
 */
import type {
	Organization,
	OrganizationMember,
	OrganizationSettings,
} from "../org-store";
import { DEFAULT_ORG_SETTINGS } from "../org-store";

export type { Organization, OrganizationMember };

function generateId(prefix: string) {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
		return `${prefix}-${crypto.randomUUID()}`;
	}
	return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeSettings(
	metadata?: Record<string, unknown> | null,
): OrganizationSettings {
	const maybeSettings = metadata?.settings as
		| Partial<OrganizationSettings>
		| undefined;
	return {
		...DEFAULT_ORG_SETTINGS,
		...maybeSettings,
		notificationPreferences: {
			...DEFAULT_ORG_SETTINGS.notificationPreferences,
			...(maybeSettings?.notificationPreferences ?? {}),
		},
	};
}

export function normalizeOrganization(raw: unknown): Organization {
	if (!raw || typeof raw !== "object") {
		return {
			id: generateId("org"),
			name: "Unknown",
			slug: "",
			status: "active",
			plan: "starter",
			settings: DEFAULT_ORG_SETTINGS,
			metadata: null,
		};
	}

	const rawObj = raw as Record<string, unknown>;
	const metadata = (rawObj.metadata as Record<string, unknown> | null) ?? null;

	return {
		id:
			(rawObj.id as string) ??
			(rawObj.organizationId as string) ??
			generateId("org"),
		name: (rawObj.name as string) ?? (rawObj.title as string) ?? "Unknown",
		slug: (rawObj.slug as string) ?? "",
		logo: (rawObj.logo as string | null) ?? null,
		description: (rawObj.description as string | null) ?? null,
		website: (rawObj.website as string | null) ?? null,
		email: (rawObj.email as string | null) ?? null,
		phone: (rawObj.phone as string | null) ?? null,
		address: (rawObj.address as Organization["address"]) ?? null,
		taxId: (rawObj.taxId as string | null) ?? null,
		status: (metadata?.status as Organization["status"]) ?? "active",
		plan: (metadata?.plan as Organization["plan"]) ?? "starter",
		settings: normalizeSettings(metadata),
		metadata,
		createdAt:
			(rawObj.createdAt as string) ??
			(rawObj.created_at as string) ??
			undefined,
		updatedAt:
			(rawObj.updatedAt as string) ??
			(rawObj.updated_at as string) ??
			undefined,
		userRole:
			(rawObj.userRole as Organization["userRole"]) ??
			(rawObj.role as Organization["userRole"]) ??
			undefined,
	};
}

export function normalizeMember(raw: unknown): OrganizationMember {
	const rawObj = (raw && typeof raw === "object" ? raw : {}) as Record<
		string,
		unknown
	>;
	const user = ((rawObj.user as Record<string, unknown>) ?? {}) as Record<
		string,
		unknown
	>;
	const rawPermissions = rawObj.permissions as string[] | string | undefined;
	const permissions = Array.isArray(rawPermissions)
		? rawPermissions
		: rawPermissions
			? [rawPermissions]
			: [];

	return {
		id:
			(rawObj.id as string) ??
			`${(rawObj.userId as string) ?? "user"}-${(rawObj.organizationId as string) ?? "org"}`,
		userId: (rawObj.userId as string) ?? (user.id as string) ?? "",
		organizationId:
			(rawObj.organizationId as string) ?? (rawObj.orgId as string) ?? "",
		role: (rawObj.role as OrganizationMember["role"]) ?? "member",
		permissions,
		status:
			(rawObj.status as OrganizationMember["status"]) ??
			(rawObj.membershipStatus as OrganizationMember["status"]) ??
			"active",
		invitedAt:
			(rawObj.invitedAt as string) ?? (rawObj.createdAt as string) ?? undefined,
		joinedAt: (rawObj.joinedAt as string) ?? undefined,
		email: (rawObj.email as string | null) ?? (user.email as string) ?? null,
		name: (rawObj.name as string | null) ?? (user.name as string) ?? null,
		avatar: (rawObj.avatar as string | null) ?? (user.image as string) ?? null,
	};
}
