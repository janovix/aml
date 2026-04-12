import { describe, expect, it } from "vitest";
import {
	getEntityTypeLabel,
	getShareholderDisplayName,
	type Shareholder,
} from "./shareholder";

const base = (over: Partial<Shareholder>): Shareholder => ({
	id: "1",
	clientId: "c",
	entityType: "PERSON",
	ownershipPercentage: 10,
	createdAt: "",
	updatedAt: "",
	...over,
});

describe("getShareholderDisplayName", () => {
	it("uses businessName for COMPANY", () => {
		expect(
			getShareholderDisplayName(
				base({
					entityType: "COMPANY",
					businessName: "ACME SA",
				}),
			),
		).toBe("ACME SA");
	});
	it("falls back for COMPANY without name", () => {
		expect(
			getShareholderDisplayName(
				base({ entityType: "COMPANY", businessName: null }),
			),
		).toBe("Empresa sin nombre");
	});
	it("joins person name parts", () => {
		expect(
			getShareholderDisplayName(
				base({
					firstName: "Juan",
					lastName: "Pérez",
					secondLastName: "Ruiz",
				}),
			),
		).toBe("Juan Pérez Ruiz");
	});
	it("omits missing second last name", () => {
		expect(
			getShareholderDisplayName(
				base({ firstName: "Juan", lastName: "Pérez", secondLastName: null }),
			),
		).toBe("Juan Pérez");
	});
});

describe("getEntityTypeLabel", () => {
	it("returns Spanish labels", () => {
		expect(getEntityTypeLabel("PERSON")).toBe("Persona Física");
		expect(getEntityTypeLabel("COMPANY")).toBe("Persona Moral");
	});
});
