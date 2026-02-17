/**
 * Shareholder Types
 * Represents persons or companies that own shares in the client entity.
 * Supports 2-level ownership hierarchy per Mexican law.
 */

// Shareholder entity types
export type ShareholderEntityType = "PERSON" | "COMPANY";

export interface Shareholder {
	id: string;
	clientId: string;
	parentShareholderId?: string | null;
	entityType: ShareholderEntityType;

	// PERSON fields
	firstName?: string | null;
	lastName?: string | null;
	secondLastName?: string | null;
	rfc?: string | null;

	// COMPANY fields
	businessName?: string | null;
	taxId?: string | null;
	incorporationDate?: string | null;
	nationality?: string | null;

	// COMPANY Anexo 4: representative of the moral entity
	representativeName?: string | null;
	representativeCurp?: string | null;
	representativeRfc?: string | null;

	// COMPANY Anexo 4: document references
	actaConstitutivaDocId?: string | null;
	cedulaFiscalDocId?: string | null;
	addressProofDocId?: string | null;
	powerOfAttorneyDocId?: string | null;

	// Ownership (required)
	ownershipPercentage: number;

	// Contact
	email?: string | null;
	phone?: string | null;

	// Timestamps
	createdAt: string;
	updatedAt: string;
}

export interface ShareholderCreateRequest {
	parentShareholderId?: string | null;
	entityType: ShareholderEntityType;

	// PERSON fields
	firstName?: string | null;
	lastName?: string | null;
	secondLastName?: string | null;
	rfc?: string | null;

	// COMPANY fields
	businessName?: string | null;
	taxId?: string | null;
	incorporationDate?: string | null;
	nationality?: string | null;
	representativeName?: string | null;
	representativeCurp?: string | null;
	representativeRfc?: string | null;
	actaConstitutivaDocId?: string | null;
	cedulaFiscalDocId?: string | null;
	addressProofDocId?: string | null;
	powerOfAttorneyDocId?: string | null;

	// Ownership (required)
	ownershipPercentage: number;

	// Contact
	email?: string | null;
	phone?: string | null;
}

export interface ShareholderPatchRequest {
	parentShareholderId?: string | null;
	firstName?: string | null;
	lastName?: string | null;
	secondLastName?: string | null;
	rfc?: string | null;
	businessName?: string | null;
	taxId?: string | null;
	incorporationDate?: string | null;
	nationality?: string | null;
	representativeName?: string | null;
	representativeCurp?: string | null;
	representativeRfc?: string | null;
	actaConstitutivaDocId?: string | null;
	cedulaFiscalDocId?: string | null;
	addressProofDocId?: string | null;
	powerOfAttorneyDocId?: string | null;
	ownershipPercentage?: number;
	email?: string | null;
	phone?: string | null;
}

export interface ShareholderListResponse {
	data: Shareholder[];
	total: number;
}

/**
 * Get display name for a shareholder
 */
export function getShareholderDisplayName(shareholder: Shareholder): string {
	if (shareholder.entityType === "COMPANY") {
		return shareholder.businessName || "Empresa sin nombre";
	}
	return `${shareholder.firstName} ${shareholder.lastName} ${shareholder.secondLastName || ""}`.trim();
}

/**
 * Get entity type label for display
 */
export function getEntityTypeLabel(type: ShareholderEntityType): string {
	const labels: Record<ShareholderEntityType, string> = {
		PERSON: "Persona Física",
		COMPANY: "Persona Moral",
	};
	return labels[type];
}
