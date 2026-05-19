import { getAmlCoreBaseUrl } from "./config";
import { fetchJson } from "./http";
import type {
	OperationExceptionEntity,
	OperationExceptionEvidenceEntity,
} from "@/types/operation";

export interface ExceptionUpsertInput {
	exceptionType?: string;
	legalReference?: string | null;
	isFirstSale?: boolean | null;
	hasDevelopmentBankFunding?: boolean | null;
	developmentBankCode?: string | null;
	developmentBankName?: string | null;
	paidThroughFinancialSystem?: boolean | null;
	hasDocumentaryEvidence?: boolean | null;
	notes?: string | null;
}

export interface EvidenceCreateInput {
	evidenceType: string;
	description?: string | null;
	docSvcDocumentId?: string | null;
}

export async function getException(
	operationId: string,
): Promise<OperationExceptionEntity | null> {
	const baseUrl = getAmlCoreBaseUrl();
	const url = `${baseUrl}/api/v1/operations/${operationId}/exception`;
	const { json } = await fetchJson<OperationExceptionEntity | null>(url);
	return json;
}

export async function upsertException(
	operationId: string,
	input: ExceptionUpsertInput,
): Promise<OperationExceptionEntity> {
	const baseUrl = getAmlCoreBaseUrl();
	const url = `${baseUrl}/api/v1/operations/${operationId}/exception`;
	const { json } = await fetchJson<OperationExceptionEntity>(url, {
		method: "PUT",
		body: JSON.stringify(input),
	});
	return json;
}

export async function deleteException(
	operationId: string,
): Promise<{ success: boolean }> {
	const baseUrl = getAmlCoreBaseUrl();
	const url = `${baseUrl}/api/v1/operations/${operationId}/exception`;
	const { json } = await fetchJson<{ success: boolean }>(url, {
		method: "DELETE",
	});
	return json;
}

export async function addEvidence(
	operationId: string,
	input: EvidenceCreateInput,
): Promise<OperationExceptionEvidenceEntity> {
	const baseUrl = getAmlCoreBaseUrl();
	const url = `${baseUrl}/api/v1/operations/${operationId}/exception/evidence`;
	const { json } = await fetchJson<OperationExceptionEvidenceEntity>(url, {
		method: "POST",
		body: JSON.stringify(input),
	});
	return json;
}

export async function removeEvidence(
	operationId: string,
	evidenceId: string,
): Promise<{ success: boolean }> {
	const baseUrl = getAmlCoreBaseUrl();
	const url = `${baseUrl}/api/v1/operations/${operationId}/exception/evidence/${evidenceId}`;
	const { json } = await fetchJson<{ success: boolean }>(url, {
		method: "DELETE",
	});
	return json;
}
