/**
 * Upload Link Document Configuration
 *
 * Defines the document types available for upload links by client type,
 * including mappings between AML document types and doc-svc API types.
 */

import type { PersonType } from "@/types/client";
import type { ClientDocumentType } from "@/types/client-document";

/**
 * doc-svc API document types
 */
export type DocSvcDocumentType =
	| "mx_ine_front"
	| "mx_ine_back"
	| "passport"
	| "proof_of_address"
	| "proof_of_income"
	| "bank_statement"
	| "utility_bill"
	| "other";

/**
 * Configuration for a document type in the upload link dialog
 */
export interface UploadLinkDocumentConfig {
	/** Unique identifier */
	id: string;
	/** Display label (Spanish) */
	label: string;
	/** Short description */
	description: string;
	/** Whether this is an ID document (mutually exclusive with other IDs) */
	isIdDocument: boolean;
	/** Whether this document is required for KYC */
	isRequired: boolean;
	/** The doc-svc API types this maps to (INE maps to both front and back) */
	apiTypes: DocSvcDocumentType[];
	/** The AML ClientDocumentType this corresponds to */
	amlDocumentType: ClientDocumentType;
}

/**
 * Physical person document configurations
 * Matches REQUIRED_DOCUMENTS.physical + ID from document-config.ts
 */
export const PHYSICAL_PERSON_DOCUMENTS: UploadLinkDocumentConfig[] = [
	{
		id: "official_id",
		label: "Identificación Oficial",
		description: "El usuario elegirá entre INE o Pasaporte",
		isIdDocument: true,
		isRequired: true,
		// Send all ID options - the end user will choose which one to upload
		apiTypes: ["mx_ine_front", "mx_ine_back", "passport"],
		amlDocumentType: "NATIONAL_ID",
	},
	{
		id: "proof_of_address",
		label: "Comprobante de Domicilio",
		description: "Recibo de servicios con antigüedad no mayor a 3 meses",
		isIdDocument: false,
		isRequired: true,
		apiTypes: ["proof_of_address"],
		amlDocumentType: "PROOF_OF_ADDRESS",
	},
	{
		id: "tax_id",
		label: "Constancia de Situación Fiscal",
		description: "Constancia de situación fiscal emitida por el SAT (RFC)",
		isIdDocument: false,
		isRequired: true,
		apiTypes: ["other"],
		amlDocumentType: "TAX_ID",
	},
];

/**
 * Moral entity (company) document configurations
 * Matches REQUIRED_DOCUMENTS.moral from document-config.ts
 */
export const MORAL_ENTITY_DOCUMENTS: UploadLinkDocumentConfig[] = [
	{
		id: "official_id",
		label: "Identificación del Representante Legal",
		description: "INE o Pasaporte del representante legal",
		isIdDocument: true,
		isRequired: true,
		apiTypes: ["mx_ine_front", "mx_ine_back", "passport"],
		amlDocumentType: "NATIONAL_ID",
	},
	{
		id: "acta_constitutiva",
		label: "Acta Constitutiva",
		description: "Escritura pública de constitución de la empresa",
		isIdDocument: false,
		isRequired: true,
		apiTypes: ["other"],
		amlDocumentType: "ACTA_CONSTITUTIVA",
	},
	{
		id: "poder_notarial",
		label: "Poder Notarial",
		description: "Poder otorgado ante notario público",
		isIdDocument: false,
		isRequired: true,
		apiTypes: ["other"],
		amlDocumentType: "PODER_NOTARIAL",
	},
	{
		id: "tax_id",
		label: "Constancia de Situación Fiscal",
		description: "Constancia de situación fiscal emitida por el SAT (RFC)",
		isIdDocument: false,
		isRequired: true,
		apiTypes: ["other"],
		amlDocumentType: "TAX_ID",
	},
	{
		id: "proof_of_address",
		label: "Comprobante de Domicilio",
		description: "Recibo de servicios de la empresa",
		isIdDocument: false,
		isRequired: true,
		apiTypes: ["proof_of_address"],
		amlDocumentType: "PROOF_OF_ADDRESS",
	},
];

/**
 * Trust entity document configurations
 * Matches REQUIRED_DOCUMENTS.trust from document-config.ts
 */
export const TRUST_ENTITY_DOCUMENTS: UploadLinkDocumentConfig[] = [
	{
		id: "official_id",
		label: "Identificación del Representante Legal",
		description: "INE o Pasaporte del representante legal",
		isIdDocument: true,
		isRequired: true,
		apiTypes: ["mx_ine_front", "mx_ine_back", "passport"],
		amlDocumentType: "NATIONAL_ID",
	},
	{
		id: "trust_agreement",
		label: "Contrato de Fideicomiso",
		description: "Contrato del fideicomiso debidamente protocolizado",
		isIdDocument: false,
		isRequired: true,
		apiTypes: ["other"],
		amlDocumentType: "TRUST_AGREEMENT",
	},
	{
		id: "tax_id",
		label: "Constancia de Situación Fiscal",
		description: "Constancia de situación fiscal emitida por el SAT (RFC)",
		isIdDocument: false,
		isRequired: true,
		apiTypes: ["other"],
		amlDocumentType: "TAX_ID",
	},
	{
		id: "proof_of_address",
		label: "Comprobante de Domicilio",
		description: "Recibo de servicios del fideicomiso",
		isIdDocument: false,
		isRequired: true,
		apiTypes: ["proof_of_address"],
		amlDocumentType: "PROOF_OF_ADDRESS",
	},
];

/**
 * Get document configurations for a person type
 */
export function getDocumentsForPersonType(
	personType: PersonType,
): UploadLinkDocumentConfig[] {
	switch (personType) {
		case "physical":
			return PHYSICAL_PERSON_DOCUMENTS;
		case "moral":
			return MORAL_ENTITY_DOCUMENTS;
		case "trust":
			return TRUST_ENTITY_DOCUMENTS;
		default:
			return PHYSICAL_PERSON_DOCUMENTS;
	}
}

/**
 * Convert selected document IDs to doc-svc API types
 * @deprecated Use getApiDocumentsForSelection instead to preserve labels
 */
export function getApiTypesForSelection(
	selectedIds: string[],
	personType: PersonType,
): DocSvcDocumentType[] {
	const documents = getDocumentsForPersonType(personType);
	const apiTypes: DocSvcDocumentType[] = [];

	for (const id of selectedIds) {
		const doc = documents.find((d) => d.id === id);
		if (doc) {
			apiTypes.push(...doc.apiTypes);
		}
	}

	return apiTypes;
}

/**
 * Required document object with type, label, and description
 * Used to preserve custom document names for "other" type documents
 */
export interface RequiredDocument {
	type: DocSvcDocumentType;
	label?: string;
	description?: string;
}

/**
 * Convert selected document IDs to doc-svc API document objects with labels
 * This preserves the document names for display in the scan app
 */
export function getApiDocumentsForSelection(
	selectedIds: string[],
	personType: PersonType,
): RequiredDocument[] {
	const documents = getDocumentsForPersonType(personType);
	const apiDocs: RequiredDocument[] = [];

	for (const id of selectedIds) {
		const doc = documents.find((d) => d.id === id);
		if (doc) {
			// For ID documents (INE/Passport), they have multiple apiTypes
			// We need to send each type separately but they share the same label
			for (const apiType of doc.apiTypes) {
				apiDocs.push({
					type: apiType,
					label: doc.label,
					description: doc.description,
				});
			}
		}
	}

	return apiDocs;
}

/**
 * Get the default selected documents (required ones) for a person type
 */
export function getDefaultSelectedDocuments(personType: PersonType): string[] {
	const documents = getDocumentsForPersonType(personType);
	return documents.filter((d) => d.isRequired).map((d) => d.id);
}

/**
 * Check if a document has been uploaded based on existing client documents
 */
export function isDocumentUploaded(
	docConfig: UploadLinkDocumentConfig,
	uploadedDocTypes: ClientDocumentType[],
): boolean {
	return uploadedDocTypes.includes(docConfig.amlDocumentType);
}
