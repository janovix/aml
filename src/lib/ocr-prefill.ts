/**
 * Shared shape for OCR-extracted personal data that the upfront ID scan
 * produces and the client wizard form consumes.
 *
 * Kept deliberately lean (string fields only, no computed locale or
 * cross-validation flags) so it serializes cleanly into wizard state and
 * is trivial to test the mapper against fixture `OCRResult`s.
 *
 * `confidenceByField` carries a 0..1 confidence per field so the form can
 * decorate low-confidence prefilled inputs with a "verify me" badge. We
 * use `Partial<Record<...>>` to keep it sparse — fields that weren't
 * extracted at all don't appear in the map.
 */
import type { MRZResult } from "@janovix/document-scanner";
import type { OCRResult } from "@/lib/document-scanner";
import type { Gender } from "@/types/client";

export type OcrPrefillField =
	| "firstName"
	| "lastName"
	| "secondLastName"
	| "birthDate"
	| "curp"
	| "nationality"
	| "gender";

export interface OcrPrefillData {
	firstName?: string;
	lastName?: string;
	secondLastName?: string;
	/** ISO-8601 (YYYY-MM-DD) — matches the form's birthDate input contract. */
	birthDate?: string;
	curp?: string;
	/** ISO-3166 alpha-3 country code (e.g. MEX) — matches CatalogSelector. */
	nationality?: string;
	/** Constrained to AML's `Gender` enum so the form Select can consume it. */
	gender?: Gender;
	/** Source document type — useful for downstream dedupe / telemetry. */
	documentType: "INE" | "PASSPORT" | "UNKNOWN";
	/** 0..1 — overall confidence in the extraction, surface to the user. */
	overallConfidence: number;
	confidenceByField: Partial<Record<OcrPrefillField, number>>;
}

/** Empty prefill payload — used when the user skips the scan. */
export const EMPTY_OCR_PREFILL: OcrPrefillData = {
	documentType: "UNKNOWN",
	overallConfidence: 0,
	confidenceByField: {},
};

/**
 * Per-field confidence threshold below which the form should flag the
 * prefilled value as needing user verification. Tuned conservatively:
 * Tesseract typically reports 0.7+ on clean MRZ lines, and ICAO check
 * digits give us additional ground truth for MRZ-derived fields.
 */
export const LOW_CONFIDENCE_THRESHOLD = 0.7;

/**
 * Maps mexican MRZ "M"/"F" sex codes (and the equivalent free-form OCR
 * gender field) to AML's `Gender` enum. Returns undefined for "<" or
 * anything else so the form doesn't pre-select a wrong value — leaving
 * the Select empty is strictly better than silently picking "OTHER".
 */
function mapSex(sex?: string): Gender | undefined {
	if (sex === "M" || sex === "F") return sex;
	return undefined;
}

/**
 * Project an `OCRResult` (the AML facade's full extraction output) down
 * to the lean prefill payload the client wizard consumes.
 *
 * Field selection priority is MRZ > detectedFields. MRZ data is more
 * reliable (check-digit validated) and we only fall back to free-form OCR
 * fields when MRZ didn't yield a value.
 */
export function ocrResultToPrefill(result: OCRResult): OcrPrefillData {
	const mrz: MRZResult | undefined = result.mrzData;
	const fields = result.detectedFields ?? {};

	const out: OcrPrefillData = {
		documentType: result.documentType,
		overallConfidence: clamp01(result.confidence),
		confidenceByField: {},
	};

	const mrzConfidence = mrz?.confidence ?? 0;
	const ocrConfidence = clamp01(result.confidence);

	const setField = <K extends OcrPrefillField>(
		key: K,
		value: OcrPrefillData[K] | undefined,
		confidence: number,
	) => {
		if (typeof value === "string") {
			const trimmed = value.trim();
			if (!trimmed) return;
			out[key] = trimmed as OcrPrefillData[K];
		} else if (value === undefined) {
			return;
		} else {
			out[key] = value;
		}
		out.confidenceByField[key] = clamp01(confidence);
	};

	setField(
		"firstName",
		mrz?.firstName ?? fields.firstName,
		mrz?.firstName ? mrzConfidence : ocrConfidence,
	);
	setField(
		"lastName",
		mrz?.lastName ?? fields.lastName,
		mrz?.lastName ? mrzConfidence : ocrConfidence,
	);
	setField(
		"secondLastName",
		mrz?.secondLastName ?? fields.secondLastName,
		mrz?.secondLastName ? mrzConfidence : ocrConfidence,
	);
	setField(
		"birthDate",
		mrz?.birthDate ?? fields.birthDate,
		mrz?.birthDate ? mrzConfidence : ocrConfidence,
	);
	setField(
		"curp",
		mrz?.curp ?? fields.curp,
		mrz?.curp ? mrzConfidence : ocrConfidence,
	);
	setField(
		"nationality",
		mrz?.nationality ?? fields.nationality,
		mrz?.nationality ? mrzConfidence : ocrConfidence,
	);
	setField(
		"gender",
		mapSex(mrz?.sex) ?? mapSex(fields.gender),
		mrz?.sex ? mrzConfidence : ocrConfidence,
	);

	return out;
}

/**
 * True when the prefill payload contains at least one usable field. Used
 * to decide whether to show the prefill banner / badges vs. silently
 * leaving the form unchanged.
 */
export function hasAnyPrefilledField(prefill: OcrPrefillData): boolean {
	return Object.keys(prefill.confidenceByField).length > 0;
}

function clamp01(n: number): number {
	if (!Number.isFinite(n)) return 0;
	if (n < 0) return 0;
	if (n > 1) return 1;
	return n;
}
