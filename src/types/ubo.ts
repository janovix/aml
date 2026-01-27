/**
 * Ultimate Beneficial Owner (UBO) Types
 * For MORAL and TRUST entities, representing individuals with significant ownership
 */

import type { PEPStatus } from "./client";

// UBO relationship types
export type UBORelationshipType =
	| "SHAREHOLDER" // Direct shareholder with 25%+ ownership
	| "DIRECTOR" // Board member or director
	| "LEGAL_REP" // Legal representative
	| "TRUSTEE" // Trustee (for trusts)
	| "SETTLOR" // Settlor/Grantor (for trusts)
	| "BENEFICIARY" // Beneficiary (for trusts)
	| "CONTROLLER"; // Person with effective control

export interface UBO {
	id: string;
	clientId: string;
	// Personal information
	firstName: string;
	lastName: string;
	secondLastName?: string | null;
	birthDate?: string | null;
	nationality?: string | null;
	curp?: string | null;
	rfc?: string | null;
	// Ownership/relationship
	ownershipPercentage?: number | null;
	relationshipType: UBORelationshipType;
	position?: string | null;
	// Contact
	email?: string | null;
	phone?: string | null;
	// Address
	country?: string | null;
	stateCode?: string | null;
	city?: string | null;
	street?: string | null;
	postalCode?: string | null;
	// Document references
	idDocumentId?: string | null;
	addressProofId?: string | null;
	// PEP status tracking
	isPEP: boolean;
	pepStatus: PEPStatus;
	pepDetails?: string | null;
	pepMatchConfidence?: string | null;
	pepCheckedAt?: string | null;
	// Verification
	verifiedAt?: string | null;
	verifiedBy?: string | null;
	notes?: string | null;
	// Timestamps
	createdAt: string;
	updatedAt: string;
}

export interface UBOCreateRequest {
	// Personal information
	firstName: string;
	lastName: string;
	secondLastName?: string | null;
	birthDate?: string | null;
	nationality?: string | null;
	curp?: string | null;
	rfc?: string | null;
	// Ownership/relationship
	ownershipPercentage?: number | null;
	relationshipType: UBORelationshipType;
	position?: string | null;
	// Contact
	email?: string | null;
	phone?: string | null;
	// Address
	country?: string | null;
	stateCode?: string | null;
	city?: string | null;
	street?: string | null;
	postalCode?: string | null;
	// Document references
	idDocumentId?: string | null;
	addressProofId?: string | null;
	// Notes
	notes?: string | null;
}

export interface UBOPatchRequest {
	firstName?: string;
	lastName?: string;
	secondLastName?: string | null;
	birthDate?: string | null;
	nationality?: string | null;
	curp?: string | null;
	rfc?: string | null;
	ownershipPercentage?: number | null;
	relationshipType?: UBORelationshipType;
	position?: string | null;
	email?: string | null;
	phone?: string | null;
	country?: string | null;
	stateCode?: string | null;
	city?: string | null;
	street?: string | null;
	postalCode?: string | null;
	idDocumentId?: string | null;
	addressProofId?: string | null;
	notes?: string | null;
}

export interface UBOListResponse {
	data: UBO[];
	total: number;
}

/**
 * Get display name for a UBO
 */
export function getUBODisplayName(ubo: UBO): string {
	return `${ubo.firstName} ${ubo.lastName} ${ubo.secondLastName || ""}`.trim();
}

/**
 * Get relationship type label for display
 */
export function getRelationshipTypeLabel(type: UBORelationshipType): string {
	const labels: Record<UBORelationshipType, string> = {
		SHAREHOLDER: "Accionista",
		DIRECTOR: "Director",
		LEGAL_REP: "Representante Legal",
		TRUSTEE: "Fiduciario",
		SETTLOR: "Fideicomitente",
		BENEFICIARY: "Beneficiario",
		CONTROLLER: "Controlador",
	};
	return labels[type];
}
