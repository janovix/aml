import type { Client } from "@/types/client";
import type { ClientDocument } from "@/types/client-document";
import type { BeneficialController } from "@/types/beneficial-controller";
import { ALL_REQUIRED_DOCUMENTS, requiresUBOs } from "@/lib/constants";

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

export const KYC_SECTIONS: Record<string, KYCSection> = {
	personalInfo: {
		id: "personalInfo",
		label: "Información Personal",
		fields: [
			"firstName",
			"lastName",
			"secondLastName",
			"birthDate",
			"curp",
			"rfc",
			"nationality",
			"countryCode",
		],
		weight: 1.5,
	},
	companyInfo: {
		id: "companyInfo",
		label: "Información de la Empresa",
		fields: [
			"businessName",
			"incorporationDate",
			"rfc",
			"countryCode",
			"economicActivityCode",
		],
		weight: 1.5,
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
		fields: [
			"economicActivityCode",
			"gender",
			"occupation",
			"maritalStatus",
			"sourceOfFunds",
		],
		weight: 1,
	},
	pepInfo: {
		id: "pepInfo",
		label: "Verificación PEP",
		// screeningResult and screenedAt are the actual Client fields
		// (previously this incorrectly referenced pepStatus/pepCheckedAt which don't exist)
		fields: ["screeningResult", "screenedAt"],
		weight: 0.5,
	},
};

/**
 * Get applicable KYC sections based on person type.
 * Documents and beneficial controllers are handled separately in calculateKYCStatus.
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
			KYC_SECTIONS.pepInfo,
		];
	}
}

function isFieldComplete(client: Client, fieldName: string): boolean {
	const value = client[fieldName as keyof Client];

	if (fieldName === "screeningResult") {
		// Screening is complete once a result exists and is not the default "pending" state
		return value === "clear" || value === "flagged";
	}

	if (fieldName === "screenedAt") {
		return !!value;
	}

	return value !== null && value !== undefined && value !== "";
}

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
 * Calculate overall KYC status for a client, including documents and beneficial controllers.
 */
export function calculateKYCStatus(
	client: Client,
	options?: {
		documents?: ClientDocument[];
		beneficialControllers?: BeneficialController[];
		identificationTier?: Client["identificationTier"];
	},
): KYCOverallStatus {
	const applicableSections = getApplicableSections(client.personType);
	const sectionStatuses = applicableSections.map((section) =>
		calculateSectionStatus(client, section),
	);

	// Document section: each required document counts as one field
	// (Art. 17 LFPIORPI: below identification threshold, documents are not required for profile completion)
	const documents = options?.documents ?? [];
	const isBelowThreshold = options?.identificationTier === "BELOW_THRESHOLD";
	const requiredDocs = ALL_REQUIRED_DOCUMENTS[client.personType] ?? [];
	const uploadedDocTypes = new Set(documents.map((d) => d.documentType));
	const missingDocs = requiredDocs.filter((d) => !uploadedDocTypes.has(d));
	const docsCompleted = requiredDocs.length - missingDocs.length;
	const docsSection: KYCSectionStatus = isBelowThreshold
		? {
				section: {
					id: "documents",
					label: "Documentos",
					fields: [],
					weight: 2,
				},
				completedFields: 0,
				totalFields: 0,
				percentage: 100,
				isComplete: true,
				missingFields: [],
			}
		: {
				section: {
					id: "documents",
					label: "Documentos",
					fields: requiredDocs as string[],
					weight: 2,
				},
				completedFields: docsCompleted,
				totalFields: requiredDocs.length,
				percentage:
					requiredDocs.length > 0
						? Math.round((docsCompleted / requiredDocs.length) * 100)
						: 100,
				isComplete: missingDocs.length === 0,
				missingFields: missingDocs as string[],
			};
	sectionStatuses.push(docsSection);

	// Beneficial controllers section (MORAL/TRUST only)
	if (requiresUBOs(client.personType)) {
		const beneficialControllers = options?.beneficialControllers ?? [];
		const hasBCs = beneficialControllers.length > 0;
		const bcSection: KYCSectionStatus = {
			section: {
				id: "beneficialControllers",
				label: "Beneficiarios Controladores",
				fields: ["beneficialControllers"],
				weight: 1,
			},
			completedFields: hasBCs ? 1 : 0,
			totalFields: 1,
			percentage: hasBCs ? 100 : 0,
			isComplete: hasBCs,
			missingFields: hasBCs ? [] : ["beneficialControllers"],
		};
		sectionStatuses.push(bcSection);
	}

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

export function getFieldLabel(fieldName: string): string {
	const labels: Record<string, string> = {
		firstName: "Nombre",
		lastName: "Apellido Paterno",
		secondLastName: "Apellido Materno",
		birthDate: "Fecha de Nacimiento",
		curp: "CURP",
		rfc: "RFC",
		nationality: "Nacionalidad",
		countryCode: "País/Nacionalidad",
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
		economicActivityCode: "Actividad Económica",
		gender: "Género",
		occupation: "Ocupación",
		maritalStatus: "Estado Civil",
		sourceOfFunds: "Fuente de Fondos",
		sourceOfWealth: "Fuente de Riqueza",
		screeningResult: "Resultado de Verificación",
		screenedAt: "Fecha de Verificación",
		beneficialControllers: "Beneficiarios Controladores",
	};

	return labels[fieldName] || fieldName;
}
