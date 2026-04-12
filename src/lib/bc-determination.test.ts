import { describe, expect, it } from "vitest";
import {
	getSuggestedBCsFromShareholders,
	isPossibleBC,
	SUGGESTED_BC_RULE_LABEL,
} from "./bc-determination";
import type { BeneficialController } from "@/types/beneficial-controller";
import type { Shareholder } from "@/types/shareholder";

const baseSh = (over: Partial<Shareholder>): Shareholder => ({
	id: "sh-1",
	clientId: "c1",
	entityType: "PERSON",
	firstName: "Ana",
	lastName: "López",
	secondLastName: "García",
	ownershipPercentage: 30,
	createdAt: "2024-01-01",
	updatedAt: "2024-01-01",
	...over,
});

const baseBc = (over: Partial<BeneficialController>): BeneficialController => ({
	id: "bc-1",
	clientId: "c1",
	bcType: "SHAREHOLDER",
	identificationCriteria: "BENEFIT",
	isLegalRepresentative: false,
	firstName: "Ana",
	lastName: "López",
	secondLastName: "García",
	createdAt: "2024-01-01",
	updatedAt: "2024-01-01",
	...over,
});

describe("isPossibleBC", () => {
	it("is true for PERSON with >=25%", () => {
		expect(
			isPossibleBC({ entityType: "PERSON", ownershipPercentage: 25 }),
		).toBe(true);
		expect(
			isPossibleBC({ entityType: "PERSON", ownershipPercentage: 26 }),
		).toBe(true);
	});
	it("is false for COMPANY or low ownership", () => {
		expect(
			isPossibleBC({ entityType: "COMPANY", ownershipPercentage: 100 }),
		).toBe(false);
		expect(
			isPossibleBC({ entityType: "PERSON", ownershipPercentage: 24 }),
		).toBe(false);
	});
});

describe("getSuggestedBCsFromShareholders", () => {
	it("suggests person shareholders >=25% not linked by id or RFC", () => {
		const sh = baseSh({ id: "s1", rfc: "LOGA800101ABC" });
		const out = getSuggestedBCsFromShareholders([sh], []);
		expect(out).toHaveLength(1);
		expect(out[0].shareholder).toBe(sh);
		expect(out[0].ruleLabel).toBe(SUGGESTED_BC_RULE_LABEL);
		expect(out[0].potentialDuplicate).toBeUndefined();
	});

	it("excludes when shareholderId matches existing BC", () => {
		const sh = baseSh({ id: "s1" });
		const bcs = [baseBc({ shareholderId: "s1" })];
		expect(getSuggestedBCsFromShareholders([sh], bcs)).toHaveLength(0);
	});

	it("excludes when RFC matches existing BC (trimmed)", () => {
		const sh = baseSh({ id: "s1", rfc: "  ABC123  " });
		const bcs = [baseBc({ rfc: "ABC123" })];
		expect(getSuggestedBCsFromShareholders([sh], bcs)).toHaveLength(0);
	});

	it("flags potentialDuplicate when full name matches existing BC name", () => {
		const sh = baseSh({
			id: "s-new",
			firstName: "Ana",
			lastName: "López",
			secondLastName: "García",
		});
		const bcs = [
			baseBc({
				shareholderId: "other",
				firstName: "Ana",
				lastName: "López",
				secondLastName: "García",
			}),
		];
		const out = getSuggestedBCsFromShareholders([sh], bcs);
		expect(out).toHaveLength(1);
		expect(out[0].potentialDuplicate).toBe(true);
	});

	it("ignores COMPANY shareholders", () => {
		const company = baseSh({
			id: "c1",
			entityType: "COMPANY",
			businessName: "ACME",
			ownershipPercentage: 50,
		});
		expect(getSuggestedBCsFromShareholders([company], [])).toHaveLength(0);
	});

	it("ignores PERSON below 25%", () => {
		const sh = baseSh({ ownershipPercentage: 24 });
		expect(getSuggestedBCsFromShareholders([sh], [])).toHaveLength(0);
	});
});
