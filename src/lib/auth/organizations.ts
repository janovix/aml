import type {
	Organization,
	OrganizationInvitation,
	OrganizationMember,
	OrganizationSettings,
} from "../org-store";
import { DEFAULT_ORG_SETTINGS } from "../org-store";
import { getAuthAppUrl, getAuthServiceUrl } from "./config";

type ApiResult<T> = {
	data: T | null;
	error: string | null;
};

type SuccessEnvelope<T> = {
	success?: boolean;
	data?: T;
	message?: string;
};

const JSON_HEADERS = {
	"Content-Type": "application/json",
	Accept: "application/json",
};

type ErrorResponse = {
	code?: string;
	message?: string;
	error?: string;
};

// Map of error codes to user-friendly messages
const ERROR_MESSAGES: Record<string, string> = {
	ORGANIZATION_ALREADY_EXISTS:
		"An organization with this slug already exists. Please choose another.",
	ORGANIZATION_NOT_FOUND: "Organization not found.",
	UNAUTHORIZED: "You don't have permission to perform this action.",
	INVALID_INVITATION: "The invitation is invalid or has expired.",
	MEMBER_ALREADY_EXISTS: "This user is already a member of the organization.",
};

// Map of known error messages to user-friendly messages
const MESSAGE_TRANSLATIONS: Record<string, string> = {
	"Invitation not found":
		"Invitation expired or revoked. Please contact your administrator.",
};

function extractErrorMessage(
	body: ErrorResponse | null,
	statusText: string,
): string {
	if (!body) return statusText || "Request failed";

	// If we have a known error code, use the friendly message
	if (body.code && ERROR_MESSAGES[body.code]) {
		return ERROR_MESSAGES[body.code];
	}

	// Check for known message translations
	const message = body.message || body.error;
	if (message && MESSAGE_TRANSLATIONS[message]) {
		return MESSAGE_TRANSLATIONS[message];
	}

	// Otherwise use the message from the response
	return body.message || body.error || statusText || "Request failed";
}

async function http<T>(
	path: string,
	init?: RequestInit,
): Promise<ApiResult<T>> {
	try {
		const response = await fetch(`${getAuthServiceUrl()}${path}`, {
			credentials: "include",
			headers: {
				...JSON_HEADERS,
				Origin: getAuthAppUrl(),
				...(init?.headers || {}),
			},
			...init,
		});

		const body = (await response.json().catch(() => null)) as
			| SuccessEnvelope<T>
			| ErrorResponse
			| T
			| null;

		if (!response.ok) {
			const message = extractErrorMessage(
				body as ErrorResponse,
				response.statusText,
			);
			return { data: null, error: message };
		}

		if (body && typeof body === "object" && "data" in body) {
			return { data: (body as SuccessEnvelope<T>).data ?? null, error: null };
		}

		return { data: body as T, error: null };
	} catch (error) {
		return {
			data: null,
			error: error instanceof Error ? error.message : "Unexpected error",
		};
	}
}

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

function normalizeOrganization(raw: unknown): Organization {
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
	};
}

function normalizeMember(raw: unknown): OrganizationMember {
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

export type CreateOrganizationInput = {
	name: string;
	slug: string;
	logo?: string;
	metadata?: Record<string, unknown>;
	keepCurrentActiveOrganization?: boolean;
};

export async function listOrganizations(): Promise<
	ApiResult<{
		organizations: Organization[];
		activeOrganizationId: string | null;
	}>
> {
	const result = await http<unknown>("/api/auth/organization/list");
	if (result.error) {
		return { data: null, error: result.error };
	}

	const payload = result.data as Record<string, unknown> | unknown[] | null;
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
		data: {
			organizations: (organizationsRaw as unknown[]).map(normalizeOrganization),
			activeOrganizationId,
		},
		error: null,
	};
}

export async function createOrganization(
	input: CreateOrganizationInput,
): Promise<ApiResult<Organization>> {
	const result = await http<unknown>("/api/auth/organization/create", {
		method: "POST",
		body: JSON.stringify(input),
	});

	if (result.error) {
		return { data: null, error: result.error };
	}

	const payload = result.data as Record<string, unknown> | null;
	const organization = payload?.organization ?? payload;
	return { data: normalizeOrganization(organization), error: null };
}

export async function setActiveOrganization(
	organizationId: string,
): Promise<ApiResult<{ activeOrganizationId: string }>> {
	const result = await http<unknown>("/api/auth/organization/set-active", {
		method: "POST",
		body: JSON.stringify({ organizationId }),
	});

	if (result.error) {
		return { data: null, error: result.error };
	}

	const payload = result.data as Record<string, unknown> | null;
	const activeOrganizationId =
		(payload?.activeOrganizationId as string) ??
		(payload?.organizationId as string) ??
		organizationId;

	return { data: { activeOrganizationId }, error: null };
}

export async function listMembers(
	organizationId: string,
): Promise<ApiResult<OrganizationMember[]>> {
	const url = new URL(
		`${getAuthServiceUrl()}/api/auth/organization/list-members`,
	);
	url.searchParams.set("organizationId", organizationId);

	const result = await http<unknown>(url.pathname + url.search);
	if (result.error) {
		return { data: null, error: result.error };
	}

	const payload = result.data as Record<string, unknown> | unknown[] | null;
	const membersRaw = Array.isArray(payload)
		? payload
		: ((payload as Record<string, unknown>)?.members ?? []);

	return { data: (membersRaw as unknown[]).map(normalizeMember), error: null };
}

export async function inviteMember(input: {
	email: string;
	role: string | string[];
	organizationId?: string;
	resend?: boolean;
}): Promise<ApiResult<unknown>> {
	const result = await http("/api/auth/organization/invite-member", {
		method: "POST",
		body: JSON.stringify(input),
	});

	if (result.error) {
		return { data: null, error: result.error };
	}

	return { data: result.data, error: null };
}

export async function acceptInvitation(
	invitationId: string,
): Promise<ApiResult<unknown>> {
	const result = await http("/api/auth/organization/accept-invitation", {
		method: "POST",
		body: JSON.stringify({ invitationId }),
	});

	if (result.error) {
		return { data: null, error: result.error };
	}

	return { data: result.data, error: null };
}

function normalizeInvitation(raw: unknown): OrganizationInvitation {
	const rawObj = (raw && typeof raw === "object" ? raw : {}) as Record<
		string,
		unknown
	>;
	const inviter = (rawObj.inviter ?? {}) as Record<string, unknown>;
	return {
		id: (rawObj.id as string) ?? "",
		organizationId: (rawObj.organizationId as string) ?? "",
		email: (rawObj.email as string) ?? "",
		role: (rawObj.role as OrganizationInvitation["role"]) ?? "member",
		status: (rawObj.status as OrganizationInvitation["status"]) ?? "pending",
		expiresAt: (rawObj.expiresAt as string) ?? "",
		createdAt: (rawObj.createdAt as string) ?? "",
		inviterId: (rawObj.inviterId as string) ?? (inviter.id as string) ?? "",
		inviterName: (inviter.name as string | null) ?? null,
		inviterEmail: (inviter.email as string | null) ?? null,
	};
}

export async function listInvitations(
	organizationId: string,
	status?: "pending" | "accepted" | "rejected" | "canceled",
): Promise<ApiResult<OrganizationInvitation[]>> {
	const url = new URL(
		`${getAuthServiceUrl()}/api/auth/organization/list-invitations`,
	);
	url.searchParams.set("organizationId", organizationId);
	if (status) {
		url.searchParams.set("status", status);
	}

	const result = await http<unknown>(url.pathname + url.search);
	if (result.error) {
		return { data: null, error: result.error };
	}

	const payload = result.data as Record<string, unknown> | unknown[] | null;
	const invitationsRaw = Array.isArray(payload)
		? payload
		: ((payload as Record<string, unknown>)?.invitations ?? []);

	return {
		data: (invitationsRaw as unknown[]).map(normalizeInvitation),
		error: null,
	};
}

export async function cancelInvitation(
	invitationId: string,
): Promise<ApiResult<unknown>> {
	const result = await http("/api/auth/organization/cancel-invitation", {
		method: "POST",
		body: JSON.stringify({ invitationId }),
	});

	if (result.error) {
		return { data: null, error: result.error };
	}

	return { data: result.data, error: null };
}

export async function resendInvitation(input: {
	email: string;
	role: string;
	organizationId: string;
}): Promise<ApiResult<unknown>> {
	return inviteMember({ ...input, resend: true });
}
