"use client";

import type { Organization, OrganizationMember } from "../org-store";
import { getAuthAppUrl, getAuthServiceUrl } from "./config";
import { authClient } from "./authClient";
import {
	normalizeOrganization,
	normalizeMember,
} from "./organizationNormalizers";

export { normalizeOrganization } from "./organizationNormalizers";

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
	ORGANIZATION_NOT_FOUND: "Organization not found.",
	UNAUTHORIZED: "You don't have permission to perform this action.",
	INVALID_INVITATION: "The invitation is invalid or has expired.",
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

	if (body.code && ERROR_MESSAGES[body.code]) {
		return ERROR_MESSAGES[body.code];
	}

	const message = body.message || body.error;
	if (message && MESSAGE_TRANSLATIONS[message]) {
		return MESSAGE_TRANSLATIONS[message];
	}

	return body.message || body.error || statusText || "Request failed";
}

/**
 * Extract a user-friendly error message from a Better Auth client error.
 * The error.body may contain a structured { code, message } object from
 * the Better Auth server response.
 */
function extractBetterAuthError(
	err: { message?: string; body?: unknown } | null | undefined,
): string {
	if (!err) return "Request failed";
	const body = err.body as ErrorResponse | null;
	if (body?.code && ERROR_MESSAGES[body.code]) return ERROR_MESSAGES[body.code];
	const message = body?.message || body?.error || err.message;
	if (message && MESSAGE_TRANSLATIONS[message])
		return MESSAGE_TRANSLATIONS[message];
	return message || "Request failed";
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

export async function listOrganizations(): Promise<
	ApiResult<{
		organizations: Organization[];
		activeOrganizationId: string | null;
	}>
> {
	const result = await http<unknown>("/api/organization/list-with-role");
	if (result.error) {
		return { data: null, error: result.error };
	}

	// New endpoint returns { success: true, data: [...] } — unwrapped by http()
	const organizationsRaw = Array.isArray(result.data) ? result.data : [];

	return {
		data: {
			organizations: (organizationsRaw as unknown[]).map(normalizeOrganization),
			// list-with-role doesn't track active org; resolved from URL / stored state
			activeOrganizationId: null,
		},
		error: null,
	};
}

export async function setActiveOrganization(
	organizationId: string,
): Promise<ApiResult<{ activeOrganizationId: string }>> {
	const result = await authClient.organization.setActive({ organizationId });

	if (result.error) {
		return { data: null, error: extractBetterAuthError(result.error) };
	}

	return { data: { activeOrganizationId: organizationId }, error: null };
}

export async function listMembers(
	organizationId: string,
): Promise<ApiResult<OrganizationMember[]>> {
	const result = await authClient.organization.listMembers({
		query: { organizationId },
	});

	if (result.error) {
		return { data: null, error: extractBetterAuthError(result.error) };
	}

	const membersRaw =
		result.data?.members ?? (Array.isArray(result.data) ? result.data : []);

	return {
		data: (membersRaw as unknown[]).map(normalizeMember),
		error: null,
	};
}

export async function acceptInvitation(
	invitationId: string,
): Promise<ApiResult<unknown>> {
	const result = await authClient.organization.acceptInvitation({
		invitationId,
	});

	if (result.error) {
		return { data: null, error: extractBetterAuthError(result.error) };
	}

	return { data: result.data, error: null };
}
