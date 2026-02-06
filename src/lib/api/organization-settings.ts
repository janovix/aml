import { getAmlCoreBaseUrl } from "./config";
import { fetchJson } from "./http";

export interface OrganizationSettingsEntity {
	id: string;
	organizationId: string;
	obligatedSubjectKey: string; // RFC (clave_sujeto_obligado)
	activityKey: string; // Vulnerable activity code (e.g., "VEH")
	createdAt: string;
	updatedAt: string;
}

export interface OrganizationSettingsUpdateInput {
	obligatedSubjectKey: string;
	activityKey: string;
}

export async function getOrganizationSettings(opts?: {
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<OrganizationSettingsEntity | null> {
	const baseUrl = opts?.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL("/api/v1/organization-settings", baseUrl);

	try {
		const { json } = await fetchJson<OrganizationSettingsEntity>(
			url.toString(),
			{
				method: "GET",
				cache: "no-store",
				signal: opts?.signal,
				jwt: opts?.jwt,
			},
		);
		return json;
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

	const { json } = await fetchJson<OrganizationSettingsEntity>(url.toString(), {
		method: "PUT",
		cache: "no-store",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(opts.input),
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}
