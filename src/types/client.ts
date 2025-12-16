export type PersonType = "FISICA" | "MORAL";
export type RiskLevel = "BAJO" | "MEDIO" | "ALTO";
export type ClientStatus = "ACTIVO" | "INACTIVO" | "SUSPENDIDO" | "BLOQUEADO";
export type ReviewStatus =
	| "PENDIENTE"
	| "EN_REVISION"
	| "APROBADO"
	| "RECHAZADO";

export interface Client {
	id: string;
	rfc: string;
	personType: PersonType;
	firstName?: string; // For FISICA
	lastName?: string; // For FISICA
	secondLastName?: string; // For FISICA
	businessName?: string; // For MORAL
	email: string;
	phone: string;
	riskLevel: RiskLevel;
	status: ClientStatus;
	reviewStatus: ReviewStatus;
	street?: string;
	extNumber?: string;
	intNumber?: string;
	neighborhood?: string;
	city?: string;
	state?: string;
	zipCode?: string;
	country?: string;
	lastReview: string;
	alertCount: number;
}

export function getClientDisplayName(client: Client): string {
	if (client.personType === "FISICA") {
		return `${client.firstName} ${client.lastName} ${client.secondLastName || ""}`.trim();
	}
	return client.businessName || "";
}
