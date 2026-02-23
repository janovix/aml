/**
 * API functions for Beneficial Controller (Beneficiario Controlador) management
 */

import { getAmlCoreBaseUrl } from "./config";
import { fetchJson } from "./http";
import type {
	BeneficialController,
	BeneficialControllerCreateRequest,
	BeneficialControllerPatchRequest,
	BeneficialControllerListResponse,
} from "@/types/beneficial-controller";

export async function listClientBeneficialControllers(opts: {
	clientId: string;
	bcType?: string;
	identificationCriteria?: string;
	shareholderId?: string;
	baseUrl?: string;
	signal?: AbortSignal;
	/** JWT token for authentication */
	jwt?: string;
}): Promise<BeneficialControllerListResponse> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(
		`/api/v1/clients/${opts.clientId}/beneficial-controllers`,
		baseUrl,
	);

	// Add query params
	if (opts.bcType) {
		url.searchParams.set("bcType", opts.bcType);
	}
	if (opts.identificationCriteria) {
		url.searchParams.set("identificationCriteria", opts.identificationCriteria);
	}
	if (opts.shareholderId) {
		url.searchParams.set("shareholderId", opts.shareholderId);
	}

	const { json } = await fetchJson<BeneficialControllerListResponse>(
		url.toString(),
		{
			method: "GET",
			cache: "no-store",
			signal: opts.signal,
			jwt: opts.jwt,
		},
	);
	return json;
}

export async function getBeneficialControllerById(opts: {
	clientId: string;
	bcId: string;
	baseUrl?: string;
	signal?: AbortSignal;
	/** JWT token for authentication */
	jwt?: string;
}): Promise<BeneficialController> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(
		`/api/v1/clients/${opts.clientId}/beneficial-controllers/${opts.bcId}`,
		baseUrl,
	);

	const { json } = await fetchJson<BeneficialController>(url.toString(), {
		method: "GET",
		cache: "no-store",
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

export async function createBeneficialController(opts: {
	clientId: string;
	input: BeneficialControllerCreateRequest;
	baseUrl?: string;
	signal?: AbortSignal;
	/** JWT token for authentication */
	jwt?: string;
}): Promise<BeneficialController> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(
		`/api/v1/clients/${opts.clientId}/beneficial-controllers`,
		baseUrl,
	);

	const { json } = await fetchJson<BeneficialController>(url.toString(), {
		method: "POST",
		cache: "no-store",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(opts.input),
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

export async function updateBeneficialController(opts: {
	clientId: string;
	bcId: string;
	input: BeneficialControllerCreateRequest;
	baseUrl?: string;
	signal?: AbortSignal;
	/** JWT token for authentication */
	jwt?: string;
}): Promise<BeneficialController> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(
		`/api/v1/clients/${opts.clientId}/beneficial-controllers/${opts.bcId}`,
		baseUrl,
	);

	const { json } = await fetchJson<BeneficialController>(url.toString(), {
		method: "PUT",
		cache: "no-store",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(opts.input),
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

export async function patchBeneficialController(opts: {
	clientId: string;
	bcId: string;
	input: BeneficialControllerPatchRequest;
	baseUrl?: string;
	signal?: AbortSignal;
	/** JWT token for authentication */
	jwt?: string;
}): Promise<BeneficialController> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(
		`/api/v1/clients/${opts.clientId}/beneficial-controllers/${opts.bcId}`,
		baseUrl,
	);

	const { json } = await fetchJson<BeneficialController>(url.toString(), {
		method: "PATCH",
		cache: "no-store",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(opts.input),
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

export async function deleteBeneficialController(opts: {
	clientId: string;
	bcId: string;
	baseUrl?: string;
	signal?: AbortSignal;
	/** JWT token for authentication */
	jwt?: string;
}): Promise<void> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(
		`/api/v1/clients/${opts.clientId}/beneficial-controllers/${opts.bcId}`,
		baseUrl,
	);

	await fetchJson(url.toString(), {
		method: "DELETE",
		cache: "no-store",
		signal: opts.signal,
		jwt: opts.jwt,
	});
}
