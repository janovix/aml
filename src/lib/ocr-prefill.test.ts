import { describe, it, expect } from "vitest";
import type { OCRResult } from "@/lib/document-scanner";
import {
	EMPTY_OCR_PREFILL,
	hasAnyPrefilledField,
	ocrResultToPrefill,
} from "./ocr-prefill";

function baseResult(overrides: Partial<OCRResult> = {}): OCRResult {
	return {
		success: true,
		text: "",
		confidence: 0.9,
		documentType: "PASSPORT",
		documentTypeConfidence: 0.95,
		detectedFields: {},
		comparisons: [],
		foundFields: [],
		missingFields: [],
		isValid: true,
		isExpired: false,
		message: "",
		...overrides,
	};
}

describe("ocrResultToPrefill", () => {
	it("returns an empty payload when no fields were extracted", () => {
		const out = ocrResultToPrefill(baseResult({ confidence: 0.4 }));

		expect(out.documentType).toBe("PASSPORT");
		expect(out.overallConfidence).toBe(0.4);
		expect(out.confidenceByField).toEqual({});
		expect(out.firstName).toBeUndefined();
		expect(hasAnyPrefilledField(out)).toBe(false);
	});

	it("prefers MRZ values over free-form OCR fields", () => {
		const out = ocrResultToPrefill(
			baseResult({
				detectedFields: {
					firstName: "MARIA",
					lastName: "PEREZ",
					gender: "F",
				},
				mrzData: {
					success: true,
					documentType: "PASSPORT",
					confidence: 0.97,
					firstName: "MARIA JOSE",
					lastName: "RAMIREZ",
					sex: "F",
					birthDate: "1990-05-15",
					curp: "RAMM900515MDFXXX01",
					nationality: "MEX",
				},
			}),
		);

		expect(out.firstName).toBe("MARIA JOSE");
		expect(out.lastName).toBe("RAMIREZ");
		expect(out.gender).toBe("F");
		expect(out.birthDate).toBe("1990-05-15");
		expect(out.curp).toBe("RAMM900515MDFXXX01");
		expect(out.nationality).toBe("MEX");
		expect(out.confidenceByField.firstName).toBe(0.97);
		expect(out.confidenceByField.lastName).toBe(0.97);
		expect(hasAnyPrefilledField(out)).toBe(true);
	});

	it("falls back to detectedFields when MRZ is absent", () => {
		const out = ocrResultToPrefill(
			baseResult({
				confidence: 0.82,
				detectedFields: {
					firstName: "JUAN",
					lastName: "GARCIA",
					curp: "GACJ800101HDFXXX02",
				},
			}),
		);

		expect(out.firstName).toBe("JUAN");
		expect(out.lastName).toBe("GARCIA");
		expect(out.curp).toBe("GACJ800101HDFXXX02");
		expect(out.confidenceByField.firstName).toBe(0.82);
	});

	it("ignores empty / whitespace-only fields", () => {
		const out = ocrResultToPrefill(
			baseResult({
				detectedFields: {
					firstName: "   ",
					lastName: "",
					curp: "TEST123",
				},
			}),
		);

		expect(out.firstName).toBeUndefined();
		expect(out.lastName).toBeUndefined();
		expect(out.curp).toBe("TEST123");
		expect(out.confidenceByField).toEqual({ curp: 0.9 });
	});

	it("normalizes MRZ sex codes and skips unknown markers", () => {
		const fOnly = ocrResultToPrefill(
			baseResult({
				mrzData: {
					success: true,
					documentType: "PASSPORT",
					confidence: 0.9,
					sex: "F",
				},
			}),
		);
		expect(fOnly.gender).toBe("F");

		const unknown = ocrResultToPrefill(
			baseResult({
				mrzData: {
					success: true,
					documentType: "PASSPORT",
					confidence: 0.9,
					sex: "<",
				},
			}),
		);
		expect(unknown.gender).toBeUndefined();
	});

	it("clamps non-finite or out-of-range confidences into [0,1]", () => {
		const out = ocrResultToPrefill(
			baseResult({
				confidence: Number.POSITIVE_INFINITY,
				detectedFields: { firstName: "ANA" },
			}),
		);
		expect(out.overallConfidence).toBe(0);
		expect(out.confidenceByField.firstName).toBe(0);
	});
});

describe("EMPTY_OCR_PREFILL", () => {
	it("reports as having no prefilled fields", () => {
		expect(hasAnyPrefilledField(EMPTY_OCR_PREFILL)).toBe(false);
	});
});
