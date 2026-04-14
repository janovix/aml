import { getAmlCoreBaseUrl } from "./config";
import { fetchJson } from "./http";

export type SelfServiceMode = "disabled" | "manual" | "automatic";

export interface OrganizationSettingsEntity {
	id: string;
	organizationId: string;
	obligatedSubjectKey: string; // RFC (clave_sujeto_obligado)
	activityKey: string; // Vulnerable activity code (e.g., "VEH")
	// KYC Self-Service settings
	selfServiceMode: SelfServiceMode;
	selfServiceExpiryHours: number;
	selfServiceRequiredSections: string[] | null;
	selfServiceSendEmail?: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface OrganizationSettingsUpdateInput {
	obligatedSubjectKey: string;
	activityKey: string;
	selfServiceMode?: SelfServiceMode;
	selfServiceExpiryHours?: number;
	selfServiceRequiredSections?: string[] | null;
}

export interface SelfServiceSettingsUpdateInput {
	selfServiceMode?: SelfServiceMode;
	selfServiceExpiryHours?: number;
	selfServiceRequiredSections?: string[] | null;
	selfServiceSendEmail?: boolean;
}

/**
 * Response shape from the organization-settings API
 * GET returns { configured: boolean, settings: entity | null }
 * PUT/PATCH returns { configured: true, settings: entity }
 */
interface OrganizationSettingsResponse {
	configured: boolean;
	settings: OrganizationSettingsEntity | null;
}

export async function getOrganizationSettings(opts?: {
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<OrganizationSettingsEntity | null> {
	const baseUrl = opts?.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL("/api/v1/organization-settings", baseUrl);

	try {
		const { json } = await fetchJson<OrganizationSettingsResponse>(
			url.toString(),
			{
				method: "GET",
				cache: "no-store",
				signal: opts?.signal,
				jwt: opts?.jwt,
			},
		);

		// New response shape: { configured: boolean, settings: entity | null }
		if (json && "configured" in json) {
			return json.configured ? json.settings : null;
		}

		// Fallback for backward compatibility: raw entity response
		return json as unknown as OrganizationSettingsEntity | null;
	} catch (error) {
		// Return null if not found (404) -- org settings not yet configured
		if (
			error instanceof Error &&
			"status" in error &&
			(error as { status: number }).status === 404
		) {
			return null;
		}
		throw error;
	}
}

export async function updateOrganizationSettings(opts: {
	input: OrganizationSettingsUpdateInput;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<OrganizationSettingsEntity> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL("/api/v1/organization-settings", baseUrl);

	const { json } = await fetchJson<OrganizationSettingsResponse>(
		url.toString(),
		{
			method: "PUT",
			cache: "no-store",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(opts.input),
			signal: opts.signal,
			jwt: opts.jwt,
		},
	);

	// New response shape: { configured: true, settings: entity }
	if (json && "configured" in json && json.settings) {
		return json.settings;
	}

	// Fallback for backward compatibility
	return json as unknown as OrganizationSettingsEntity;
}

export async function updateSelfServiceSettings(opts: {
	input: SelfServiceSettingsUpdateInput;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<OrganizationSettingsEntity> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL("/api/v1/organization-settings/self-service", baseUrl);

	const { json } = await fetchJson<OrganizationSettingsResponse>(
		url.toString(),
		{
			method: "PATCH",
			cache: "no-store",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(opts.input),
			signal: opts.signal,
			jwt: opts.jwt,
		},
	);

	if (json && "configured" in json && json.settings) {
		return json.settings;
	}

	return json as unknown as OrganizationSettingsEntity;
}
