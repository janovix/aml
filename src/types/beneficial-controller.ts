/**
 * Beneficial Controller (Beneficiario Controlador) Types
 * Per Mexican law (LFPIORPI/CFF Article 32-B): natural persons who ultimately
 * benefit from or control the client entity.
 */

import type { ScreeningResult } from "./client";

// BC classification types
export type BCType =
	| "SHAREHOLDER" // Beneficial shareholder (25%+ ownership)
	| "LEGAL_REP" // Legal representative
	| "TRUSTEE" // Trustee (for trusts)
	| "SETTLOR" // Settlor/Grantor (for trusts)
	| "TRUST_BENEFICIARY" // Trust beneficiary
	| "DIRECTOR"; // Board member/director

// Identification criteria per CFF 32-B
export type IdentificationCriteria =
	| "BENEFIT" // Obtains the benefit (first criterion)
	| "CONTROL" // Exercises control (second criterion)
	| "FALLBACK"; // Administrator/board member (third criterion, when others fail)

// ID document types per Anexo 3
export type IdDocumentType = "INE" | "PASSPORT" | "OTHER";

export interface BeneficialController {
	id: string;
	clientId: string;
	shareholderId?: string | null;

	// BC classification
	bcType: BCType;
	identificationCriteria: IdentificationCriteria;
	controlMechanism?: string | null;
	isLegalRepresentative: boolean;

	// Anexo 3: personal data (all BCs are natural persons)
	firstName: string;
	lastName: string;
	secondLastName?: string | null;
	birthDate?: string | null;
	birthCountry?: string | null;
	nationality?: string | null;
	occupation?: string | null;
	curp?: string | null;
	rfc?: string | null;

	// Anexo 3: identification document details
	idDocumentType?: IdDocumentType | null;
	idDocumentNumber?: string | null;
	idDocumentAuthority?: string | null;

	// Anexo 3: document copy references (uploaded to R2)
	idCopyDocId?: string | null;
	curpCopyDocId?: string | null;
	cedulaFiscalDocId?: string | null;
	addressProofDocId?: string | null;
	constanciaBcDocId?: string | null; // Constancia de Beneficiario Controlador
	powerOfAttorneyDocId?: string | null;

	// Contact
	email?: string | null;
	phone?: string | null;

	// Address
	country?: string | null;
	stateCode?: string | null;
	city?: string | null;
	street?: string | null;
	postalCode?: string | null;

	// Watchlist screening status
	isPEP?: boolean;
	watchlistQueryId?: string | null;
	ofacSanctioned?: boolean;
	unscSanctioned?: boolean;
	sat69bListed?: boolean;
	adverseMediaFlagged?: boolean;
	screeningResult?: ScreeningResult;
	screenedAt?: string | null;

	// Verification
	verifiedAt?: string | null;
	verifiedBy?: string | null;
	notes?: string | null;

	// Timestamps
	createdAt: string;
	updatedAt: string;
}

export interface BeneficialControllerCreateRequest {
	shareholderId?: string | null;
	bcType: BCType;
	identificationCriteria: IdentificationCriteria;
	controlMechanism?: string | null;
	isLegalRepresentative: boolean;

	// Anexo 3: personal data
	firstName: string;
	lastName: string;
	secondLastName?: string | null;
	birthDate?: string | null;
	birthCountry?: string | null;
	nationality?: string | null;
	occupation?: string | null;
	curp?: string | null;
	rfc?: string | null;

	// Anexo 3: identification
	idDocumentType?: IdDocumentType | null;
	idDocumentNumber?: string | null;
	idDocumentAuthority?: string | null;
	idCopyDocId?: string | null;
	curpCopyDocId?: string | null;
	cedulaFiscalDocId?: string | null;
	addressProofDocId?: string | null;
	constanciaBcDocId?: string | null;
	powerOfAttorneyDocId?: string | null;

	// Contact
	email?: string | null;
	phone?: string | null;

	// Address
	country?: string | null;
	stateCode?: string | null;
	city?: string | null;
	street?: string | null;
	postalCode?: string | null;

	// Notes
	notes?: string | null;
}

export interface BeneficialControllerPatchRequest {
	shareholderId?: string | null;
	bcType?: BCType;
	identificationCriteria?: IdentificationCriteria;
	controlMechanism?: string | null;
	isLegalRepresentative?: boolean;
	firstName?: string;
	lastName?: string;
	secondLastName?: string | null;
	birthDate?: string | null;
	birthCountry?: string | null;
	nationality?: string | null;
	occupation?: string | null;
	curp?: string | null;
	rfc?: string | null;
	idDocumentType?: IdDocumentType | null;
	idDocumentNumber?: string | null;
	idDocumentAuthority?: string | null;
	idCopyDocId?: string | null;
	curpCopyDocId?: string | null;
	cedulaFiscalDocId?: string | null;
	addressProofDocId?: string | null;
	constanciaBcDocId?: string | null;
	powerOfAttorneyDocId?: string | null;
	email?: string | null;
	phone?: string | null;
	country?: string | null;
	stateCode?: string | null;
	city?: string | null;
	street?: string | null;
	postalCode?: string | null;
	notes?: string | null;
}

export interface BeneficialControllerListResponse {
	data: BeneficialController[];
	total: number;
}

/**
 * Get display name for a BC
 */
export function getBCDisplayName(bc: BeneficialController): string {
	return `${bc.firstName} ${bc.lastName} ${bc.secondLastName || ""}`.trim();
}

/**
 * Get BC type label for display
 */
export function getBCTypeLabel(type: BCType): string {
	const labels: Record<BCType, string> = {
		SHAREHOLDER: "Accionista Beneficiario",
		LEGAL_REP: "Representante Legal",
		TRUSTEE: "Fiduciario",
		SETTLOR: "Fideicomitente",
		TRUST_BENEFICIARY: "Beneficiario del Fideicomiso",
		DIRECTOR: "Director",
	};
	return labels[type];
}

/**
 * Get identification criteria label for display
 */
export function getIdentificationCriteriaLabel(
	criteria: IdentificationCriteria,
): string {
	const labels: Record<IdentificationCriteria, string> = {
		BENEFIT: "Obtiene el Beneficio (1er Criterio)",
		CONTROL: "Ejerce el Control (2do Criterio)",
		FALLBACK: "Administrador/Consejo (3er Criterio)",
	};
	return labels[criteria];
}

/**
 * Get ID document type label for display
 */
export function getIdDocumentTypeLabel(type: IdDocumentType): string {
	const labels: Record<IdDocumentType, string> = {
		INE: "INE/IFE",
		PASSPORT: "Pasaporte",
		OTHER: "Otro Documento",
	};
	return labels[type];
}
