export type ClientDocumentType =
	| "PASSPORT"
	| "NATIONAL_ID"
	| "DRIVERS_LICENSE"
	| "TAX_ID"
	| "PROOF_OF_ADDRESS"
	| "OTHER";

export type ClientDocumentStatus =
	| "PENDING"
	| "VERIFIED"
	| "REJECTED"
	| "EXPIRED";

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
}

export interface ClientDocumentsListResponse {
	data: ClientDocument[];
}
