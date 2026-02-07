import { describe, it, expect } from "vitest";
import {
	getFieldRequirements,
	getFieldRequirementsByTier,
	computeCompleteness,
	getClientFieldTierMap,
} from "./field-requirements";
import type { ActivityCode } from "@/types/operation";

describe("field-requirements", () => {
	describe("getFieldRequirements", () => {
		it("returns empty array for FES (no XSD available)", () => {
			const reqs = getFieldRequirements("FES", "client");
			expect(reqs).toEqual([]);
		});

		it("returns client fields for physical person", () => {
			const reqs = getFieldRequirements("VEH", "client", {
				personType: "physical",
			});
			expect(reqs.length).toBeGreaterThan(0);

			// Physical person should have firstName
			const firstNameReq = reqs.find((r) => r.fieldPath === "client.firstName");
			expect(firstNameReq).toBeDefined();
			expect(firstNameReq?.tier).toBe("sat_required");
		});

		it("returns client fields for moral person", () => {
			const reqs = getFieldRequirements("VEH", "client", {
				personType: "moral",
			});

			// Moral person should have businessName
			const bizNameReq = reqs.find(
				(r) => r.fieldPath === "client.businessName",
			);
			expect(bizNameReq).toBeDefined();

			// Moral person should NOT have firstName
			const firstNameReq = reqs.find((r) => r.fieldPath === "client.firstName");
			expect(firstNameReq).toBeUndefined();
		});

		it("returns both physical and moral fields when personType is unset", () => {
			const reqs = getFieldRequirements("VEH", "client");

			const firstNameReq = reqs.find((r) => r.fieldPath === "client.firstName");
			const bizNameReq = reqs.find(
				(r) => r.fieldPath === "client.businessName",
			);
			expect(firstNameReq).toBeDefined();
			expect(bizNameReq).toBeDefined();
		});

		it("returns payment fields", () => {
			const reqs = getFieldRequirements("VEH", "payment");
			expect(reqs.length).toBeGreaterThan(0);

			const paymentDateReq = reqs.find(
				(r) => r.fieldPath === "payment.paymentDate",
			);
			expect(paymentDateReq).toBeDefined();
			expect(paymentDateReq?.tier).toBe("sat_required");
		});

		it("returns operation fields including extensions", () => {
			const reqs = getFieldRequirements("VEH", "operation");
			expect(reqs.length).toBeGreaterThan(0);

			// Common operation fields
			const dateReq = reqs.find(
				(r) => r.fieldPath === "operation.operationDate",
			);
			expect(dateReq).toBeDefined();

			// VEH-specific extension fields
			const brandReq = reqs.find((r) => r.fieldPath === "extension.brand");
			expect(brandReq).toBeDefined();
			expect(brandReq?.tier).toBe("sat_required");
		});

		it("returns VEH-specific alert-required fields", () => {
			const reqs = getFieldRequirements("VEH", "operation");
			const vinReq = reqs.find((r) => r.fieldPath === "extension.vin");
			expect(vinReq).toBeDefined();
			expect(vinReq?.tier).toBe("alert_required");
		});

		it("returns AVI-specific extension fields", () => {
			const reqs = getFieldRequirements("AVI", "operation");
			const txHashReq = reqs.find(
				(r) => r.fieldPath === "extension.blockchainTxHash",
			);
			expect(txHashReq).toBeDefined();
			expect(txHashReq?.tier).toBe("sat_required");
		});

		it("returns empty for unknown entity type", () => {
			const reqs = getFieldRequirements("VEH", "unknown" as "client");
			expect(reqs).toEqual([]);
		});
	});

	describe("getFieldRequirementsByTier", () => {
		it("filters by sat_required tier", () => {
			const reqs = getFieldRequirementsByTier(
				"VEH",
				"operation",
				"sat_required",
			);
			expect(reqs.length).toBeGreaterThan(0);
			expect(reqs.every((r) => r.tier === "sat_required")).toBe(true);
		});

		it("filters by alert_required tier", () => {
			const reqs = getFieldRequirementsByTier(
				"VEH",
				"operation",
				"alert_required",
			);
			expect(reqs.length).toBeGreaterThan(0);
			expect(reqs.every((r) => r.tier === "alert_required")).toBe(true);
		});

		it("filters by kyc_optional tier", () => {
			const reqs = getFieldRequirementsByTier(
				"VEH",
				"operation",
				"kyc_optional",
			);
			expect(reqs.length).toBeGreaterThan(0);
			expect(reqs.every((r) => r.tier === "kyc_optional")).toBe(true);
		});
	});

	describe("computeCompleteness", () => {
		it("returns satReady true when all RED fields are filled", () => {
			const data = {
				operationDate: "2024-01-15",
				branchPostalCode: "64000",
				amount: 500000,
				vehicleType: "SEDAN",
				brand: "Toyota",
				model: "Corolla",
				year: 2024,
			};

			const result = computeCompleteness("VEH", "operation", data);
			expect(result.satReady).toBe(true);
			expect(result.summary.red.missing).toBe(0);
		});

		it("returns satReady false when RED fields are missing", () => {
			const data = {
				operationDate: "2024-01-15",
				// Missing branchPostalCode, amount, vehicleType, brand, model, year
			};

			const result = computeCompleteness("VEH", "operation", data);
			expect(result.satReady).toBe(false);
			expect(result.summary.red.missing).toBeGreaterThan(0);
		});

		it("reports missing fields with metadata", () => {
			const result = computeCompleteness("VEH", "operation", {});
			expect(result.missing.length).toBeGreaterThan(0);

			const firstMissing = result.missing[0];
			expect(firstMissing.field.fieldPath).toBeDefined();
			expect(firstMissing.field.tier).toBeDefined();
			expect(firstMissing.field.label).toBeDefined();
			expect(firstMissing.value).toBeUndefined();
		});

		it("handles empty string as missing", () => {
			const result = computeCompleteness("VEH", "operation", {
				operationDate: "",
				branchPostalCode: "   ",
			});
			expect(result.satReady).toBe(false);
		});

		it("computes summary counts correctly", () => {
			const data = {
				operationDate: "2024-01-15",
				branchPostalCode: "64000",
				amount: 500000,
			};

			const result = computeCompleteness("VEH", "operation", data);

			// Summary should have consistent counts
			expect(result.summary.total).toBe(
				result.summary.red.total +
					result.summary.yellow.total +
					result.summary.grey.total,
			);
			expect(result.summary.filled).toBe(
				result.summary.red.filled +
					result.summary.yellow.filled +
					result.summary.grey.filled,
			);
		});

		it("works for client entity type", () => {
			const data = {
				firstName: "Juan",
				lastName: "García",
				secondLastName: "López",
				countryCode: "MX",
				economicActivityCode: "6111",
				rfc: "GALO800101XXX",
			};

			const result = computeCompleteness("VEH", "client", data, {
				personType: "physical",
			});
			expect(result.satReady).toBe(true);
		});

		it("works for payment entity type", () => {
			const data = {
				paymentDate: "2024-01-15",
				paymentFormCode: "01",
				currencyCode: "MXN",
				amount: 500000,
			};

			const result = computeCompleteness("VEH", "payment", data);
			expect(result.satReady).toBe(true);
		});

		it("returns fullyEnriched false when grey fields are missing", () => {
			// Only fill RED fields
			const data = {
				operationDate: "2024-01-15",
				branchPostalCode: "64000",
				amount: 500000,
				vehicleType: "SEDAN",
				brand: "Toyota",
				model: "Corolla",
				year: 2024,
			};

			const result = computeCompleteness("VEH", "operation", data);
			expect(result.fullyEnriched).toBe(false);
		});
	});

	describe("getClientFieldTierMap", () => {
		it("returns tier map for physical person", () => {
			const map = getClientFieldTierMap("physical");
			expect(map.firstName).toBe("sat_required");
			expect(map.rfc).toBe("alert_required");
			expect(map.isPEP).toBe("kyc_optional");
		});

		it("returns tier map for moral person", () => {
			const map = getClientFieldTierMap("moral");
			expect(map.businessName).toBe("sat_required");
			expect(map.firstName).toBeUndefined();
		});

		it("includes all three tiers", () => {
			const map = getClientFieldTierMap("physical");
			const tiers = new Set(Object.values(map));
			expect(tiers.has("sat_required")).toBe(true);
			expect(tiers.has("alert_required")).toBe(true);
			expect(tiers.has("kyc_optional")).toBe(true);
		});
	});
});
