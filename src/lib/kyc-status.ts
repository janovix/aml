import type { Client } from "@/types/client";

export interface KYCSection {
	id: string;
	label: string;
	fields: string[];
	weight: number;
}

export interface KYCSectionStatus {
	section: KYCSection;
	completedFields: number;
	totalFields: number;
	percentage: number;
	isComplete: boolean;
	missingFields: string[];
}

export interface KYCOverallStatus {
	overallPercentage: number;
	isComplete: boolean;
	sections: KYCSectionStatus[];
	totalCompleted: number;
	totalRequired: number;
}

/**
 * Define KYC sections with their required fields and weights
 */
export const KYC_SECTIONS: Record<string, KYCSection> = {
	personalInfo: {
		id: "personalInfo",
		label: "Información Personal",
		fields: [
			"firstName",
			"lastName",
			"birthDate",
			"curp",
			"rfc",
			"nationality",
		],
		weight: 1,
	},
	companyInfo: {
		id: "companyInfo",
		label: "Información de la Empresa",
		fields: ["businessName", "incorporationDate", "rfc"],
		weight: 1,
	},
	contactInfo: {
		id: "contactInfo",
		label: "Información de Contacto",
		fields: ["email", "phone"],
		weight: 1,
	},
	addressInfo: {
		id: "addressInfo",
		label: "Información de Domicilio",
		fields: [
			"country",
			"stateCode",
			"city",
			"municipality",
			"neighborhood",
			"street",
			"externalNumber",
			"postalCode",
		],
		weight: 1,
	},
	kycInfo: {
		id: "kycInfo",
		label: "Información KYC",
		fields: ["gender", "occupation", "maritalStatus", "sourceOfFunds"],
		weight: 1.5, // Higher weight for KYC-specific fields
	},
	pepInfo: {
		id: "pepInfo",
		label: "Verificación PEP",
		fields: ["pepStatus", "pepCheckedAt"],
		weight: 1.5, // Higher weight for compliance
	},
};

/**
 * Get applicable KYC sections based on person type
 */
export function getApplicableSections(
	personType: Client["personType"],
): KYCSection[] {
	if (personType === "physical") {
		return [
			KYC_SECTIONS.personalInfo,
			KYC_SECTIONS.contactInfo,
			KYC_SECTIONS.addressInfo,
			KYC_SECTIONS.kycInfo,
			KYC_SECTIONS.pepInfo,
		];
	} else {
		// moral or trust
		return [
			KYC_SECTIONS.companyInfo,
			KYC_SECTIONS.contactInfo,
			KYC_SECTIONS.addressInfo,
			KYC_SECTIONS.pepInfo, // Companies can also be subject to PEP checks
		];
	}
}

/**
 * Check if a field is completed (has a value)
 */
function isFieldComplete(client: Client, fieldName: string): boolean {
	const value = client[fieldName as keyof Client];

	// Special handling for specific fields
	if (fieldName === "pepStatus") {
		return value === "NOT_PEP" || value === "CONFIRMED";
	}

	if (fieldName === "pepCheckedAt") {
		return !!value;
	}

	// General check: field has a truthy value
	return value !== null && value !== undefined && value !== "";
}

/**
 * Calculate KYC status for a specific section
 */
export function calculateSectionStatus(
	client: Client,
	section: KYCSection,
): KYCSectionStatus {
	const completedFields: string[] = [];
	const missingFields: string[] = [];

	section.fields.forEach((field) => {
		if (isFieldComplete(client, field)) {
			completedFields.push(field);
		} else {
			missingFields.push(field);
		}
	});

	const totalFields = section.fields.length;
	const completed = completedFields.length;
	const percentage =
		totalFields > 0 ? Math.round((completed / totalFields) * 100) : 0;

	return {
		section,
		completedFields: completed,
		totalFields,
		percentage,
		isComplete: completed === totalFields,
		missingFields,
	};
}

/**
 * Calculate overall KYC status for a client
 */
export function calculateKYCStatus(client: Client): KYCOverallStatus {
	const applicableSections = getApplicableSections(client.personType);
	const sectionStatuses = applicableSections.map((section) =>
		calculateSectionStatus(client, section),
	);

	// Calculate weighted overall percentage
	let totalWeight = 0;
	let weightedSum = 0;
	let totalCompleted = 0;
	let totalRequired = 0;

	sectionStatuses.forEach((status) => {
		const weight = status.section.weight;
		totalWeight += weight;
		weightedSum += (status.percentage / 100) * weight;
		totalCompleted += status.completedFields;
		totalRequired += status.totalFields;
	});

	const overallPercentage =
		totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) : 0;

	return {
		overallPercentage,
		isComplete: overallPercentage === 100,
		sections: sectionStatuses,
		totalCompleted,
		totalRequired,
	};
}

/**
 * Get field label in Spanish
 */
export function getFieldLabel(fieldName: string): string {
	const labels: Record<string, string> = {
		firstName: "Nombre",
		lastName: "Apellido Paterno",
		secondLastName: "Apellido Materno",
		birthDate: "Fecha de Nacimiento",
		curp: "CURP",
		rfc: "RFC",
		nationality: "Nacionalidad",
		businessName: "Razón Social",
		incorporationDate: "Fecha de Constitución",
		email: "Correo Electrónico",
		phone: "Teléfono",
		country: "País",
		stateCode: "Estado",
		city: "Ciudad",
		municipality: "Municipio",
		neighborhood: "Colonia",
		street: "Calle",
		externalNumber: "Número Exterior",
		internalNumber: "Número Interior",
		postalCode: "Código Postal",
		reference: "Referencia",
		gender: "Género",
		occupation: "Ocupación",
		maritalStatus: "Estado Civil",
		sourceOfFunds: "Fuente de Fondos",
		sourceOfWealth: "Fuente de Riqueza",
		pepStatus: "Estado PEP",
		pepCheckedAt: "Fecha de Verificación PEP",
	};

	return labels[fieldName] || fieldName;
}
