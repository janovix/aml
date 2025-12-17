export type PersonType = "physical" | "moral" | "trust";

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

export function getClientDisplayName(client: Client): string {
	if (client.personType === "physical") {
		return `${client.firstName || ""} ${client.lastName || ""} ${client.secondLastName || ""}`.trim();
	}
	return client.businessName || "";
}
