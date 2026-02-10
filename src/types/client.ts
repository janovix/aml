export type PersonType = "physical" | "moral" | "trust";

// KYC completion status
export type KYCStatus =
	| "INCOMPLETE"
	| "PENDING_VERIFICATION"
	| "COMPLETE"
	| "EXPIRED";

// PEP check status
export type PEPStatus = "PENDING" | "CONFIRMED" | "NOT_PEP" | "ERROR";

// Gender values
export type Gender = "M" | "F" | "OTHER";

// Marital status values
export type MaritalStatus =
	| "SINGLE"
	| "MARRIED"
	| "DIVORCED"
	| "WIDOWED"
	| "OTHER";

export interface Client {
	id: string; // UUID or deterministic ID from API
	personType: PersonType;
	firstName?: string | null; // For physical
	lastName?: string | null; // For physical
	secondLastName?: string | null; // For physical
	birthDate?: string | null; // date-time format
	curp?: string | null; // For physical
	businessName?: string | null; // For moral/trust
	incorporationDate?: string | null; // date-time format for moral/trust
	rfc: string; // Primary key - RFC (Registro Federal de Contribuyentes)
	nationality?: string | null;
	countryCode?: string | null; // Reference to countries catalog (metadata.code)
	economicActivityCode?: string | null; // Reference to economic-activities catalog (7-digit code)
	email: string;
	phone: string;
	country: string;
	stateCode: string;
	city: string;
	municipality: string;
	neighborhood: string;
	street: string;
	externalNumber: string;
	internalNumber?: string | null;
	postalCode: string;
	reference?: string | null;
	notes?: string | null;
	// Enhanced KYC fields
	gender?: Gender | null;
	occupation?: string | null;
	maritalStatus?: MaritalStatus | null;
	sourceOfFunds?: string | null;
	sourceOfWealth?: string | null;
	// KYC status tracking
	kycStatus?: KYCStatus;
	kycCompletedAt?: string | null;
	// PEP status tracking
	isPEP?: boolean;
	pepStatus?: PEPStatus;
	pepDetails?: string | null;
	pepMatchConfidence?: string | null;
	pepCheckedAt?: string | null;
	pepCheckSource?: string | null;
	// Resolved catalog names for *Code fields
	resolvedNames?: Record<string, string> | null;
	// Timestamps
	createdAt: string; // date-time format
	updatedAt: string; // date-time format
	deletedAt?: string | null; // date-time format
}

export interface ClientCreateRequest {
	personType: PersonType;
	// Physical person fields
	firstName?: string;
	lastName?: string;
	secondLastName?: string | null;
	birthDate?: string; // date format
	curp?: string;
	// Moral/Trust fields
	businessName?: string;
	incorporationDate?: string; // date-time format
	// Common fields
	rfc: string;
	nationality?: string | null;
	countryCode?: string | null;
	economicActivityCode?: string | null;
	email: string;
	phone: string;
	country: string;
	stateCode: string;
	city: string;
	municipality: string;
	neighborhood: string;
	street: string;
	externalNumber: string;
	internalNumber?: string | null;
	postalCode: string;
	reference?: string | null;
	notes?: string | null;
	// Enhanced KYC fields
	gender?: Gender | null;
	occupation?: string | null;
	maritalStatus?: MaritalStatus | null;
	sourceOfFunds?: string | null;
	sourceOfWealth?: string | null;
}

export interface Pagination {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

export interface ClientsListResponse {
	data: Client[];
	pagination: Pagination;
}

import { formatProperNoun } from "@/lib/utils";

export function getClientDisplayName(client: Client): string {
	if (client.personType === "physical") {
		const firstName = formatProperNoun(client.firstName);
		const lastName = formatProperNoun(client.lastName);
		const secondLastName = formatProperNoun(client.secondLastName);
		return `${firstName} ${lastName} ${secondLastName}`.trim();
	}
	return formatProperNoun(client.businessName);
}
