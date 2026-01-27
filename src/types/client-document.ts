export type ClientDocumentType =
	// ID Documents
	| "PASSPORT"
	| "NATIONAL_ID" // INE
	| "DRIVERS_LICENSE"
	| "CEDULA_PROFESIONAL"
	| "CARTILLA_MILITAR"
	// Tax Documents
	| "TAX_ID" // RFC / Constancia de Situación Fiscal
	// Address Proof
	| "PROOF_OF_ADDRESS"
	| "UTILITY_BILL"
	| "BANK_STATEMENT"
	// Corporate Documents
	| "ACTA_CONSTITUTIVA"
	| "PODER_NOTARIAL"
	| "TRUST_AGREEMENT"
	| "CORPORATE_BYLAWS"
	// Other
	| "OTHER";

export type ClientDocumentStatus =
	| "PENDING"
	| "VERIFIED"
	| "REJECTED"
	| "EXPIRED";

// Verification status from doc-svc
export type VerificationStatus = "APPROVED" | "REVIEW" | "REJECTED";

export interface ClientDocument {
	id: string;
	clientId: string;
	documentType: ClientDocumentType;
	documentNumber: string;
	issuingCountry?: string | null;
	issueDate?: string | null; // date-time format
	expiryDate?: string | null; // date-time format
	status: ClientDocumentStatus;
	fileUrl?: string | null;
	metadata?: Record<string, unknown> | null;
	// doc-svc integration fields
	docSvcDocumentId?: string | null;
	docSvcJobId?: string | null;
	verificationStatus?: VerificationStatus | null;
	verificationScore?: number | null;
	extractedData?: Record<string, unknown> | null;
	verifiedAt?: string | null;
	// Timestamps
	createdAt: string; // date-time format
	updatedAt: string; // date-time format
}

export interface ClientDocumentCreateRequest {
	documentType: ClientDocumentType;
	documentNumber: string;
	issuingCountry?: string;
	issueDate?: string; // date-time format
	expiryDate?: string; // date-time format
	status?: ClientDocumentStatus;
	fileUrl?: string;
	metadata?: Record<string, unknown>;
	// doc-svc integration fields
	docSvcDocumentId?: string;
	docSvcJobId?: string;
	verificationStatus?: VerificationStatus;
	verificationScore?: number;
	extractedData?: Record<string, unknown>;
	verifiedAt?: string;
}

export interface ClientDocumentPatchRequest {
	documentType?: ClientDocumentType;
	documentNumber?: string;
	issuingCountry?: string;
	issueDate?: string; // date-time format
	expiryDate?: string; // date-time format
	status?: ClientDocumentStatus;
	fileUrl?: string;
	metadata?: Record<string, unknown>;
	// doc-svc integration fields
	docSvcDocumentId?: string;
	docSvcJobId?: string;
	verificationStatus?: VerificationStatus;
	verificationScore?: number;
	extractedData?: Record<string, unknown>;
	verifiedAt?: string;
}

export interface ClientDocumentsListResponse {
	data: ClientDocument[];
}

/**
 * Standard metadata structure for documents with multiple files
 * Stored in the metadata JSON field
 */
export interface DocumentFileMetadata {
	/** Primary/processed file URL (main document image) */
	primaryFileUrl?: string;
	/** Original source file URL (e.g., original PDF before rasterization) */
	originalFileUrl?: string;
	/** Additional related file URLs */
	relatedFiles?: Array<{
		url: string;
		type: string; // e.g., "rasterized_page_1", "ine_front", "ine_back"
		name?: string;
	}>;
	/** For INE documents: front and back image URLs */
	ineFrontUrl?: string;
	ineBackUrl?: string;
	/** For PDFs: rasterized page URLs */
	rasterizedPageUrls?: string[];
}
