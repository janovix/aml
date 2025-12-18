export type ClientAddressType =
	| "RESIDENTIAL"
	| "BUSINESS"
	| "MAILING"
	| "OTHER";

export interface ClientAddress {
	id: string;
	clientId: string;
	addressType: ClientAddressType;
	street1: string;
	street2?: string | null;
	city: string;
	state?: string | null;
	postalCode?: string | null;
	country: string;
	isPrimary: boolean;
	verifiedAt?: string | null; // date-time format
	reference?: string | null;
	createdAt: string; // date-time format
	updatedAt: string; // date-time format
}

export interface ClientAddressCreateRequest {
	addressType?: ClientAddressType;
	street1: string;
	street2?: string | null;
	city: string;
	state?: string | null;
	postalCode?: string | null;
	country: string;
	isPrimary?: boolean;
	verifiedAt?: string | null; // date-time format
	reference?: string | null;
}

export interface ClientAddressPatchRequest {
	addressType?: ClientAddressType;
	street1?: string;
	street2?: string | null;
	city?: string;
	state?: string | null;
	postalCode?: string | null;
	country?: string;
	isPrimary?: boolean;
	verifiedAt?: string | null; // date-time format
	reference?: string | null;
}

export interface ClientAddressesListResponse {
	data: ClientAddress[];
}
