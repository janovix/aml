/**
 * Unified document configuration constants
 *
 * This file consolidates document-related constants that were previously
 * duplicated across multiple components:
 * - DocumentUploadSection.tsx
 * - EditDocumentsSection.tsx
 * - wizard/DocumentsStep.tsx
 * - ClientDetailsView.tsx
 * - KYCProgressIndicator.tsx
 */

import type { ClientDocumentType } from "@/types/client-document";
import type { PersonType } from "@/types/client";

/**
 * Configuration for each document type including display labels,
 * descriptions, file type restrictions, and metadata requirements.
 */
export interface DocumentTypeConfig {
	/** Display label (Spanish) */
	label: string;
	/** Description text (Spanish) */
	description: string;
	/** Whether this document type allows image files */
	allowImages: boolean;
	/** Whether this document type allows PDF files */
	allowPdf: boolean;
	/** Whether to show expiry date field in forms */
	showExpiryDate: boolean;
}

/**
 * Complete configuration for all document types
 */
export const DOCUMENT_TYPE_CONFIG: Record<
	ClientDocumentType,
	DocumentTypeConfig
> = {
	NATIONAL_ID: {
		label: "INE/IFE",
		description: "Credencial para Votar del INE",
		allowImages: true,
		allowPdf: true,
		showExpiryDate: true,
	},
	PASSPORT: {
		label: "Pasaporte",
		description: "Pasaporte mexicano vigente",
		allowImages: true,
		allowPdf: true,
		showExpiryDate: true,
	},
	DRIVERS_LICENSE: {
		label: "Licencia de Conducir",
		description: "Licencia de conducir vigente",
		allowImages: true,
		allowPdf: true,
		showExpiryDate: true,
	},
	CEDULA_PROFESIONAL: {
		label: "Cédula Profesional",
		description: "Cédula profesional expedida por SEP",
		allowImages: true,
		allowPdf: true,
		showExpiryDate: false,
	},
	CARTILLA_MILITAR: {
		label: "Cartilla Militar",
		description: "Cartilla del servicio militar nacional",
		allowImages: true,
		allowPdf: true,
		showExpiryDate: false,
	},
	TAX_ID: {
		label: "Constancia de Situación Fiscal",
		description: "Constancia de situación fiscal emitida por el SAT (RFC)",
		allowImages: false,
		allowPdf: true,
		showExpiryDate: false,
	},
	PROOF_OF_ADDRESS: {
		label: "Comprobante de Domicilio",
		description: "Recibo de servicios con antigüedad no mayor a 3 meses",
		allowImages: true,
		allowPdf: true,
		showExpiryDate: false,
	},
	UTILITY_BILL: {
		label: "Recibo de Servicios",
		description: "Recibo de luz, agua, gas o teléfono",
		allowImages: true,
		allowPdf: true,
		showExpiryDate: false,
	},
	BANK_STATEMENT: {
		label: "Estado de Cuenta Bancario",
		description: "Estado de cuenta bancario reciente",
		allowImages: false,
		allowPdf: true,
		showExpiryDate: false,
	},
	ACTA_CONSTITUTIVA: {
		label: "Acta Constitutiva",
		description: "Escritura pública de constitución de la empresa",
		allowImages: false,
		allowPdf: true,
		showExpiryDate: false,
	},
	PODER_NOTARIAL: {
		label: "Poder Notarial",
		description: "Poder otorgado ante notario público al representante legal",
		allowImages: false,
		allowPdf: true,
		showExpiryDate: false,
	},
	TRUST_AGREEMENT: {
		label: "Contrato de Fideicomiso",
		description: "Contrato del fideicomiso debidamente protocolizado",
		allowImages: false,
		allowPdf: true,
		showExpiryDate: false,
	},
	CORPORATE_BYLAWS: {
		label: "Estatutos Sociales",
		description: "Estatutos de la sociedad",
		allowImages: false,
		allowPdf: true,
		showExpiryDate: false,
	},
	OTHER: {
		label: "Otro Documento",
		description: "Otro tipo de documento",
		allowImages: true,
		allowPdf: true,
		showExpiryDate: false,
	},
};

/**
 * Get the display label for a document type
 */
export function getDocumentLabel(type: ClientDocumentType | string): string {
	return DOCUMENT_TYPE_CONFIG[type as ClientDocumentType]?.label ?? type;
}

/**
 * Get the description for a document type
 */
export function getDocumentDescription(type: ClientDocumentType): string {
	return DOCUMENT_TYPE_CONFIG[type]?.description ?? "";
}

/**
 * ID document types that can be used for identification
 */
export const ID_DOCUMENT_TYPES: ClientDocumentType[] = [
	"NATIONAL_ID",
	"PASSPORT",
];

/**
 * Required documents per person type (excluding ID which is handled separately for physical persons)
 */
export const REQUIRED_DOCUMENTS: Record<PersonType, ClientDocumentType[]> = {
	physical: ["PROOF_OF_ADDRESS", "TAX_ID"],
	moral: ["ACTA_CONSTITUTIVA", "PODER_NOTARIAL", "TAX_ID", "PROOF_OF_ADDRESS"],
	trust: ["TRUST_AGREEMENT", "TAX_ID", "PROOF_OF_ADDRESS"],
};

/**
 * All required documents including ID for each person type
 * Used when calculating KYC completeness
 */
export const ALL_REQUIRED_DOCUMENTS: Record<PersonType, ClientDocumentType[]> =
	{
		physical: ["NATIONAL_ID", "PROOF_OF_ADDRESS", "TAX_ID"],
		moral: [
			"ACTA_CONSTITUTIVA",
			"PODER_NOTARIAL",
			"TAX_ID",
			"PROOF_OF_ADDRESS",
		],
		trust: ["TRUST_AGREEMENT", "TAX_ID", "PROOF_OF_ADDRESS"],
	};

/**
 * Available document types per person type (for document upload forms)
 */
export const AVAILABLE_DOCUMENTS: Record<PersonType, ClientDocumentType[]> = {
	physical: [
		"NATIONAL_ID",
		"PASSPORT",
		"DRIVERS_LICENSE",
		"CEDULA_PROFESIONAL",
		"CARTILLA_MILITAR",
		"TAX_ID",
		"PROOF_OF_ADDRESS",
		"UTILITY_BILL",
		"BANK_STATEMENT",
		"OTHER",
	],
	moral: [
		"ACTA_CONSTITUTIVA",
		"PODER_NOTARIAL",
		"CORPORATE_BYLAWS",
		"TAX_ID",
		"PROOF_OF_ADDRESS",
		"UTILITY_BILL",
		"BANK_STATEMENT",
		"OTHER",
	],
	trust: [
		"TRUST_AGREEMENT",
		"TAX_ID",
		"PROOF_OF_ADDRESS",
		"UTILITY_BILL",
		"BANK_STATEMENT",
		"OTHER",
	],
};

/**
 * Check if person type requires UBOs (Ultimate Beneficial Owners)
 */
export function requiresUBOs(personType: PersonType): boolean {
	return personType === "moral" || personType === "trust";
}

/**
 * Check if a list of documents contains a valid ID document
 */
export function hasIdDocument(
	documents: Array<{ documentType: ClientDocumentType | string }>,
): boolean {
	return documents.some((doc) =>
		ID_DOCUMENT_TYPES.includes(doc.documentType as ClientDocumentType),
	);
}

/**
 * Document status display configuration
 */
export const DOCUMENT_STATUS_CONFIG = {
	PENDING: {
		label: "Pendiente",
		color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
	},
	VERIFIED: {
		label: "Verificado",
		color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
	},
	REJECTED: {
		label: "Rechazado",
		color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
	},
	EXPIRED: {
		label: "Expirado",
		color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
	},
} as const;

/**
 * File upload validation constants
 */
export const FILE_UPLOAD = {
	/** Maximum file size for document uploads (10MB) */
	MAX_SIZE: 10 * 1024 * 1024,
	/** Accepted file types for documents */
	ACCEPT: "application/pdf,image/*",
	/** Accepted MIME types as array */
	MIME_TYPES: [
		"application/pdf",
		"image/jpeg",
		"image/jpg",
		"image/png",
		"image/gif",
		"image/webp",
	],
} as const;

/**
 * Validate a file for document upload
 * @returns Error message if invalid, null if valid
 */
export function validateDocumentFile(file: File): string | null {
	if (file.size > FILE_UPLOAD.MAX_SIZE) {
		return `El archivo excede el tamaño máximo de ${FILE_UPLOAD.MAX_SIZE / (1024 * 1024)}MB`;
	}

	const isValidType =
		file.type.startsWith("image/") || file.type === "application/pdf";
	if (!isValidType) {
		return "Solo se permiten archivos PDF o imágenes";
	}

	return null;
}
