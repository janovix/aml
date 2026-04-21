import { describe, expect, it } from "vitest";
import {
	ACTIVITY_CODES,
	ENABLED_ACTIVITY_CODES,
	getExtensionData,
	type ActivityCode,
	type OperationEntity,
} from "./operation";

describe("ENABLED_ACTIVITY_CODES", () => {
	it("excludes activities disabled for selection", () => {
		for (const code of [
			"FES",
			"AVI",
			"TPP",
			"TDR",
			"CHV",
		] as const satisfies readonly ActivityCode[]) {
			expect(ACTIVITY_CODES).toContain(code);
			expect(ENABLED_ACTIVITY_CODES).not.toContain(code);
		}
		expect(ENABLED_ACTIVITY_CODES.length).toBe(
			ACTIVITY_CODES.length - /* FES, AVI, TPP, TDR, CHV */ 5,
		);
	});
});

describe("getExtensionData", () => {
	const minimal = (over: Partial<OperationEntity>): OperationEntity =>
		({
			id: "op1",
			organizationId: "o1",
			clientId: "c1",
			invoiceId: null,
			activityCode: "VEH",
			operationTypeCode: null,
			operationDate: "2024-01-01",
			branchPostalCode: "01000",
			amount: "1",
			currencyCode: "MXN",
			exchangeRate: null,
			amountMxn: null,
			umaValue: null,
			umaDailyValue: null,
			alertTypeCode: "X",
			alertDescription: null,
			watchlistStatus: null,
			watchlistCheckedAt: null,
			watchlistResult: null,
			watchlistFlags: null,
			priorityCode: null,
			dataSource: "MANUAL",
			completenessStatus: "COMPLETE",
			missingFields: null,
			referenceNumber: null,
			notes: null,
			createdAt: "",
			updatedAt: "",
			deletedAt: null,
			payments: [],
			vehicle: { ext: true } as unknown as OperationEntity["vehicle"],
			...over,
		}) as OperationEntity;

	it("returns extension object for activity code", () => {
		const op = minimal({});
		expect(getExtensionData(op)).toEqual({ ext: true });
	});

	it("returns null when activity maps to missing extension key at runtime", () => {
		const op = minimal({
			activityCode: "NOT_A_CODE" as ActivityCode,
		});
		expect(getExtensionData(op)).toBeNull();
	});

	it("returns undefined when extension field is unset", () => {
		const op = minimal({ vehicle: undefined });
		expect(getExtensionData(op)).toBeUndefined();
	});
});
