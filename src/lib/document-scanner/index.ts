/**
 * Document Scanner facade for AML.
 *
 * The heavy implementations (OpenCV/jscanify scanner primitives, MRZ parser,
 * document validator, PDF loader/rasterizer) live in `@janovix/document-scanner`
 * and are re-exported from here so existing AML imports keep working.
 *
 * What stays local in `@/lib/document-scanner`:
 *   - `OpenCVProvider` / `useOpenCV`            — React Context wrapper
 *   - `TesseractProvider` / `useTesseract`      — React Context wrapper + AML's
 *                                                 stateful `performOCR` pipeline
 *   - `types.ts` (`ScannerStage`, `DocumentPage`) — diverges from the package's
 *                                                 multi-page API and is consumed
 *                                                 by AML scanner UI components
 *   - `compareDocumentWithPersonalData` /
 *     `getDocumentAuthenticityScore`            — AML-specific business logic
 */

// Local types — diverge from the package and are owned by AML's scanner UI.
export type {
	Point,
	CornerPoints,
	ScannerStage,
	DetectionResult,
	ExtractionResult,
	QualityResult,
	ScannerConfig,
	PDFConfig,
	PDFRasterResult,
	DocumentPage,
	ScannerSession,
} from "./types";

export { DEFAULT_SCANNER_CONFIG, DEFAULT_PDF_CONFIG } from "./types";

// Scanner primitives — package (gives AML the aspect-ratio prior, soft
// rejection reasons, and updated quality utilities).
export {
	isOpenCVLoaded,
	loadImageToCanvas,
	detectCorners,
	highlightDocument,
	extractDocument,
	validateQuality,
	getDefaultCorners,
} from "@janovix/document-scanner";

// Custom React Providers — local.
export {
	useOpenCV,
	OpenCVProvider,
	isOpenCVReady,
	loadOpenCVScript,
} from "./OpenCVProvider";

// Custom Tesseract Provider + AML's stateful OCR pipeline — local.
// `OCRResult`, `PersonalData`, `FieldComparison`, `OCRProgressCallback`
// are re-exported from the local TesseractLoader (they carry AML-specific
// fields beyond the package's `OCRResult`).
export {
	useTesseract,
	TesseractProvider,
	performOCR,
	type OCRResult,
	type PersonalData,
	type FieldComparison,
	type OCRProgressCallback,
} from "./TesseractLoader";

// Tesseract loader low-level helpers — package.
export {
	isTesseractLoaded,
	loadTesseractScript,
} from "@janovix/document-scanner";

// PDF.js loader — package.
export {
	loadPdfJs,
	isPdfJsLoaded,
	getPdfJsInstance,
} from "@janovix/document-scanner";

// MRZ parser — package (ICAO 9303 position-aware <KZX confusion fixes).
export {
	parseMRZ,
	parsePassportMRZ,
	parseAnyMRZ,
	detectMRZType,
	extractCURP,
	calculateMRZCheckDigit,
	validateCheckDigit,
	type MRZResult,
	type MRZDocumentType,
} from "@janovix/document-scanner";

// Document validator — package.
export {
	validateDocument,
	hasMRZ,
	detectDocumentType,
	type DocumentValidationResult,
	type ValidationChecks,
	type ValidatableDocumentType,
} from "@janovix/document-scanner";

// Legacy export for backward compatibility.
export function preloadOpenCV(): void {
	// No-op
}

// =============================================================================
// DOCUMENT COMPARISON UTILITIES
// AML-specific business logic for highlighting form/document mismatches.
// =============================================================================

export interface DocumentComparisonResult {
	/** Field name */
	field: string;
	/** Label for display */
	label: string;
	/** Value from document (OCR/MRZ) */
	documentValue: string | null;
	/** Value from user-supplied personal info */
	personalValue: string | null;
	/** Whether the values match */
	matches: boolean;
	/** Source of the document value */
	source: "MRZ" | "OCR" | "NONE";
	/** Confidence of the extracted value (0-1) */
	confidence: number;
}

/**
 * Compare document extraction results with personal data
 * Returns a list of field comparisons with match status
 *
 * Used by AML forms to render per-field match status
 * (green = match, yellow = low confidence, red = mismatch).
 */
export function compareDocumentWithPersonalData(
	ocrResult: import("./TesseractLoader").OCRResult,
	personalData: import("./TesseractLoader").PersonalData,
): DocumentComparisonResult[] {
	const results: DocumentComparisonResult[] = [];

	const normalize = (s?: string | null): string =>
		(s || "")
			.toUpperCase()
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.trim();

	const fuzzyMatch = (a?: string | null, b?: string | null): boolean => {
		if (!a || !b) return false;
		const na = normalize(a);
		const nb = normalize(b);
		return na === nb || na.includes(nb) || nb.includes(na);
	};

	const hasMRZ = !!ocrResult.mrzData?.success;
	const mrzConfidence = ocrResult.mrzData?.confidence ?? 0;

	const docName =
		ocrResult.detectedFields?.fullName || ocrResult.mrzData?.fullName;
	const expectedName = [personalData.firstName, personalData.lastName]
		.filter(Boolean)
		.join(" ");
	results.push({
		field: "fullName",
		label: "Nombre Completo",
		documentValue: docName || null,
		personalValue: expectedName || null,
		matches: fuzzyMatch(docName, expectedName),
		source:
			hasMRZ && ocrResult.mrzData?.fullName ? "MRZ" : docName ? "OCR" : "NONE",
		confidence: hasMRZ ? mrzConfidence : ocrResult.confidence / 100,
	});

	if (personalData.curp || ocrResult.detectedFields?.curp) {
		results.push({
			field: "curp",
			label: "CURP",
			documentValue: ocrResult.detectedFields?.curp || null,
			personalValue: personalData.curp || null,
			matches: fuzzyMatch(ocrResult.detectedFields?.curp, personalData.curp),
			source: ocrResult.detectedFields?.curp ? "OCR" : "NONE",
			confidence: ocrResult.confidence / 100,
		});
	}

	if (
		personalData.birthDate ||
		ocrResult.detectedFields?.birthDate ||
		ocrResult.mrzData?.birthDate
	) {
		const docBirthDate =
			ocrResult.mrzData?.birthDate || ocrResult.detectedFields?.birthDate;
		results.push({
			field: "birthDate",
			label: "Fecha de Nacimiento",
			documentValue: docBirthDate || null,
			personalValue: personalData.birthDate || null,
			matches: docBirthDate === personalData.birthDate,
			source:
				hasMRZ && ocrResult.mrzData?.birthDate
					? "MRZ"
					: docBirthDate
						? "OCR"
						: "NONE",
			confidence: hasMRZ ? mrzConfidence : ocrResult.confidence / 100,
		});
	}

	const isPassport = ocrResult.documentType === "PASSPORT";
	const docNumber = isPassport
		? ocrResult.detectedFields?.passportNumber
		: ocrResult.detectedFields?.ineDocumentNumber;
	const expectedDocNumber = isPassport
		? undefined
		: personalData.ineDocumentNumber;

	if (docNumber || expectedDocNumber) {
		results.push({
			field: isPassport ? "passportNumber" : "ineDocumentNumber",
			label: isPassport ? "Número de Pasaporte" : "Número de Documento INE",
			documentValue: docNumber || null,
			personalValue: expectedDocNumber || null,
			matches: expectedDocNumber
				? fuzzyMatch(docNumber, expectedDocNumber)
				: true,
			source: hasMRZ ? "MRZ" : docNumber ? "OCR" : "NONE",
			confidence: hasMRZ ? mrzConfidence : ocrResult.confidence / 100,
		});
	}

	if (ocrResult.detectedFields?.gender || ocrResult.mrzData?.sex) {
		const docGender =
			ocrResult.mrzData?.sex || ocrResult.detectedFields?.gender;
		results.push({
			field: "gender",
			label: "Sexo",
			documentValue: docGender || null,
			personalValue: null,
			matches: true,
			source:
				hasMRZ && ocrResult.mrzData?.sex ? "MRZ" : docGender ? "OCR" : "NONE",
			confidence: hasMRZ ? mrzConfidence : ocrResult.confidence / 100,
		});
	}

	const docExpiry =
		ocrResult.mrzData?.expiryDate ||
		ocrResult.detectedFields?.expiryDate ||
		ocrResult.detectedFields?.validity;
	if (docExpiry) {
		results.push({
			field: "expiryDate",
			label: "Fecha de Vencimiento",
			documentValue: docExpiry,
			personalValue: personalData.expiryDate || null,
			matches: personalData.expiryDate
				? docExpiry === personalData.expiryDate
				: true,
			source: hasMRZ && ocrResult.mrzData?.expiryDate ? "MRZ" : "OCR",
			confidence: hasMRZ ? mrzConfidence : ocrResult.confidence / 100,
		});
	}

	return results;
}

/**
 * Check if a document is likely authentic based on MRZ check digits.
 * Returns a confidence score in [0, 1].
 */
export function getDocumentAuthenticityScore(
	ocrResult: import("./TesseractLoader").OCRResult,
): number {
	const mrzData = ocrResult.mrzData;

	if (!mrzData?.success) {
		return 0.3;
	}

	let score = mrzData.confidence;

	if (mrzData.checkDigits) {
		const checks = Object.values(mrzData.checkDigits);
		const validChecks = checks.filter(Boolean).length;
		const checkBoost = (validChecks / checks.length) * 0.2;
		score = Math.min(1, score + checkBoost);
	}

	if (ocrResult.documentTypeConfidence > 0.8) {
		score = Math.min(1, score + 0.1);
	}

	return score;
}
