import { describe, expect, it } from "vitest";
import {
	getBCDisplayName,
	getBCTypeLabel,
	getIdentificationCriteriaLabel,
	getIdDocumentTypeLabel,
	type BeneficialController,
	type BCType,
	type IdentificationCriteria,
	type IdDocumentType,
} from "./beneficial-controller";

const baseBc = (over: Partial<BeneficialController>): BeneficialController => ({
	id: "bc-1",
	clientId: "c-1",
	bcType: "SHAREHOLDER",
	identificationCriteria: "BENEFIT",
	isLegalRepresentative: false,
	firstName: "Juan",
	lastName: "Pérez",
	secondLastName: null,
	createdAt: "2024-01-01T00:00:00Z",
	updatedAt: "2024-01-01T00:00:00Z",
	...over,
});

describe("getBCDisplayName", () => {
	it("joins first, last, and second last name when present", () => {
		expect(
			getBCDisplayName(
				baseBc({
					firstName: "María",
					lastName: "García",
					secondLastName: "López",
				}),
			),
		).toBe("María García López");
	});

	it("omits second last name when null or empty string (falsy)", () => {
		expect(getBCDisplayName(baseBc({ secondLastName: null }))).toBe(
			"Juan Pérez",
		);
		// Empty string is falsy, so same branch as null; .trim() removes trailing space
		expect(getBCDisplayName(baseBc({ secondLastName: "" }))).toBe("Juan Pérez");
	});

	it("trims only leading/trailing of full string (inner spaces preserved)", () => {
		expect(
			getBCDisplayName(
				baseBc({
					firstName: " Ana ",
					lastName: " Ruiz ",
					secondLastName: " Sol ",
				}),
			),
		).toBe("Ana   Ruiz   Sol");
	});
});

describe("getBCTypeLabel", () => {
	it.each<[BCType, string]>([
		["SHAREHOLDER", "Accionista Beneficiario"],
		["LEGAL_REP", "Representante Legal"],
		["TRUSTEE", "Fiduciario"],
		["SETTLOR", "Fideicomitente"],
		["TRUST_BENEFICIARY", "Beneficiario del Fideicomiso"],
		["DIRECTOR", "Director"],
	])("maps %s to Spanish label", (type, expected) => {
		expect(getBCTypeLabel(type)).toBe(expected);
	});
});

describe("getIdentificationCriteriaLabel", () => {
	it.each<[IdentificationCriteria, string]>([
		["BENEFIT", "Obtiene el Beneficio (1er Criterio)"],
		["CONTROL", "Ejerce el Control (2do Criterio)"],
		["FALLBACK", "Administrador/Consejo (3er Criterio)"],
	])("maps %s", (criteria, expected) => {
		expect(getIdentificationCriteriaLabel(criteria)).toBe(expected);
	});
});

describe("getIdDocumentTypeLabel", () => {
	it.each<[IdDocumentType, string]>([
		["INE", "INE/IFE"],
		["PASSPORT", "Pasaporte"],
		["OTHER", "Otro Documento"],
	])("maps %s", (docType, expected) => {
		expect(getIdDocumentTypeLabel(docType)).toBe(expected);
	});
});
