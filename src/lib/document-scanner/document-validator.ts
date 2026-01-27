/**
 * Document Validator
 *
 * Validates that a scanned document is a genuine INE or Passport
 * using MRZ structure and ICAO 9303 compliance checks.
 *
 * No AI required - uses deterministic validation rules.
 */

import { calculateMRZCheckDigit, validateCheckDigit } from "./mrz-parser";

/** Document types we can validate */
export type ValidatableDocumentType = "INE" | "PASSPORT" | "UNKNOWN";

/** Results of individual validation checks */
export interface ValidationChecks {
	/** MRZ was found in the document */
	hasMRZ: boolean;
	/** MRZ has correct line count (2 for passport, 3 for INE) */
	correctLineCount: boolean;
	/** MRZ lines have approximately correct length */
	correctLineLength: boolean;
	/** MRZ contains only valid characters (A-Z, 0-9, <) */
	validCharacters: boolean;
	/** Document has correct aspect ratio */
	correctAspectRatio: boolean;
	/** Check digits are valid per ICAO 9303 */
	checkDigitsValid: boolean;
	/** Number of valid check digits */
	validCheckDigitCount: number;
	/** Total check digits expected */
	totalCheckDigits: number;
}

/** Full document validation result */
export interface DocumentValidationResult {
	/** Document passed all critical validations */
	isValid: boolean;
	/** Detected document type */
	documentType: ValidatableDocumentType;
	/** Confidence score 0-1 based on check results */
	confidence: number;
	/** Individual check results */
	checks: ValidationChecks;
	/** Human-readable validation message */
	message: string;
	/** Raw MRZ lines found (for debugging) */
	mrzLines?: string[];
}

/**
 * ICAO 9303 Standard Constants
 */
const ICAO = {
	/** Passport (TD3) format */
	TD3: {
		lineCount: 2,
		lineLength: 44,
		minLineLength: 40, // Allow some OCR tolerance
		maxLineLength: 48,
		firstLinePrefix: /^P[<A-Z]/,
	},
	/** ID Card (TD1) format - used by INE */
	TD1: {
		lineCount: 3,
		lineLength: 30,
		minLineLength: 26, // Allow some OCR tolerance
		maxLineLength: 34,
		firstLinePrefix: /^I[D]?MEX/,
	},
	/** Valid MRZ characters */
	validChars: /^[A-Z0-9<]+$/,
};

/**
 * Aspect ratio ranges for document types
 * Based on physical card dimensions
 */
const ASPECT_RATIOS = {
	/** INE: 85.6mm × 54mm = 1.585 */
	INE: { min: 1.45, max: 1.75 },
	/** Passport data page: 125mm × 88mm = 1.42 */
	PASSPORT: { min: 1.3, max: 1.55 },
};

/**
 * Extract potential MRZ lines from OCR text
 * MRZ lines are characterized by:
 * - All uppercase letters, digits, and < filler
 * - Fixed length (30 or 44 chars depending on format)
 * - Located at bottom of document
 */
function extractMRZCandidates(text: string): string[] {
	const lines = text
		.split("\n")
		.map((line) => line.trim().toUpperCase().replace(/\s/g, ""))
		.filter((line) => line.length >= 20); // MRZ lines are at least 20 chars

	// Filter lines that look like MRZ (only valid chars, reasonable length)
	const mrzCandidates = lines.filter((line) => {
		// Must be only valid MRZ characters
		if (!ICAO.validChars.test(line)) return false;
		// Must have some < fillers (characteristic of MRZ)
		if (!line.includes("<")) return false;
		// Reasonable length for MRZ
		if (line.length < 20 || line.length > 50) return false;
		return true;
	});

	return mrzCandidates;
}

/**
 * Detect if lines match TD3 (Passport) format
 */
function matchesTD3Format(lines: string[]): boolean {
	if (lines.length < 2) return false;

	// Find consecutive lines that look like TD3
	for (let i = 0; i < lines.length - 1; i++) {
		const line1 = lines[i];
		const line2 = lines[i + 1];

		// Check line 1 starts with P
		if (!ICAO.TD3.firstLinePrefix.test(line1)) continue;

		// Check both lines are approximately correct length
		if (
			line1.length >= ICAO.TD3.minLineLength &&
			line1.length <= ICAO.TD3.maxLineLength &&
			line2.length >= ICAO.TD3.minLineLength &&
			line2.length <= ICAO.TD3.maxLineLength
		) {
			return true;
		}
	}

	return false;
}

/**
 * Detect if lines match TD1 (INE) format
 */
function matchesTD1Format(lines: string[]): boolean {
	if (lines.length < 3) return false;

	// Find consecutive lines that look like TD1
	for (let i = 0; i < lines.length - 2; i++) {
		const line1 = lines[i];
		const line2 = lines[i + 1];
		const line3 = lines[i + 2];

		// Check line 1 starts with IDMEX
		if (!ICAO.TD1.firstLinePrefix.test(line1)) continue;

		// Check all three lines are approximately correct length
		const allCorrectLength =
			line1.length >= ICAO.TD1.minLineLength &&
			line1.length <= ICAO.TD1.maxLineLength &&
			line2.length >= ICAO.TD1.minLineLength &&
			line2.length <= ICAO.TD1.maxLineLength &&
			line3.length >= ICAO.TD1.minLineLength &&
			line3.length <= ICAO.TD1.maxLineLength;

		if (allCorrectLength) {
			return true;
		}
	}

	return false;
}

/**
 * Extract TD3 (Passport) MRZ lines
 */
function extractTD3Lines(lines: string[]): string[] | null {
	for (let i = 0; i < lines.length - 1; i++) {
		const line1 = lines[i];
		const line2 = lines[i + 1];

		if (
			ICAO.TD3.firstLinePrefix.test(line1) &&
			line1.length >= ICAO.TD3.minLineLength &&
			line2.length >= ICAO.TD3.minLineLength
		) {
			// Normalize to exactly 44 chars (pad with < if needed)
			return [
				line1.substring(0, 44).padEnd(44, "<"),
				line2.substring(0, 44).padEnd(44, "<"),
			];
		}
	}
	return null;
}

/**
 * Extract TD1 (INE) MRZ lines
 */
function extractTD1Lines(lines: string[]): string[] | null {
	for (let i = 0; i < lines.length - 2; i++) {
		const line1 = lines[i];
		const line2 = lines[i + 1];
		const line3 = lines[i + 2];

		if (
			ICAO.TD1.firstLinePrefix.test(line1) &&
			line1.length >= ICAO.TD1.minLineLength &&
			line2.length >= ICAO.TD1.minLineLength &&
			line3.length >= ICAO.TD1.minLineLength
		) {
			// Normalize to exactly 30 chars (pad with < if needed)
			return [
				line1.substring(0, 30).padEnd(30, "<"),
				line2.substring(0, 30).padEnd(30, "<"),
				line3.substring(0, 30).padEnd(30, "<"),
			];
		}
	}
	return null;
}

/**
 * Validate TD3 (Passport) check digits per ICAO 9303
 *
 * Line 2 positions:
 * [1-9]   Passport number
 * [10]    Check digit for passport number
 * [11-13] Nationality
 * [14-19] Date of birth (YYMMDD)
 * [20]    Check digit for DOB
 * [21]    Sex
 * [22-27] Expiration date (YYMMDD)
 * [28]    Check digit for expiration
 * [29-42] Personal number
 * [43]    Check digit for personal number
 * [44]    Overall check digit
 */
function validateTD3CheckDigits(line2: string): {
	valid: number;
	total: number;
} {
	let valid = 0;
	const total = 4; // 4 main check digits to validate

	// Document number check (positions 1-9, check at 10)
	const docNum = line2.substring(0, 9);
	const docNumCheck = line2.charAt(9);
	if (validateCheckDigit(docNum, docNumCheck)) valid++;

	// Birth date check (positions 14-19, check at 20)
	const birthDate = line2.substring(13, 19);
	const birthCheck = line2.charAt(19);
	if (validateCheckDigit(birthDate, birthCheck)) valid++;

	// Expiry date check (positions 22-27, check at 28)
	const expiryDate = line2.substring(21, 27);
	const expiryCheck = line2.charAt(27);
	if (validateCheckDigit(expiryDate, expiryCheck)) valid++;

	// Overall check digit (position 44)
	// Composite of: doc number + check + birth + check + expiry + check + personal number + check
	const composite =
		line2.substring(0, 10) + line2.substring(13, 20) + line2.substring(21, 43);
	const overallCheck = line2.charAt(43);
	if (validateCheckDigit(composite, overallCheck)) valid++;

	return { valid, total };
}

/**
 * Validate TD1 (INE) check digits per ICAO 9303
 *
 * Line 2 positions:
 * [1-6]   Date of birth (YYMMDD)
 * [7]     Check digit for DOB
 * [8]     Sex
 * [9-14]  Expiration date (YYMMDD)
 * [15]    Check digit for expiration
 * [16-18] Nationality
 * [19-29] Optional data
 * [30]    Overall check digit
 */
function validateTD1CheckDigits(
	line1: string,
	line2: string,
): { valid: number; total: number } {
	let valid = 0;
	const total = 3; // 3 main check digits in TD1

	// Birth date check (positions 1-6 of line 2, check at 7)
	const birthDate = line2.substring(0, 6);
	const birthCheck = line2.charAt(6);
	if (validateCheckDigit(birthDate, birthCheck)) valid++;

	// Expiry date check (positions 9-14 of line 2, check at 15)
	const expiryDate = line2.substring(8, 14);
	const expiryCheck = line2.charAt(14);
	if (validateCheckDigit(expiryDate, expiryCheck)) valid++;

	// Overall check digit (position 30 of line 2)
	// For TD1: composite of line 1 positions 6-30 + line 2 positions 1-7 + line 2 positions 9-15 + line 2 positions 19-29
	const docNumber = line1.substring(5, 30);
	const compositeParts =
		docNumber +
		line2.substring(0, 7) +
		line2.substring(8, 15) +
		line2.substring(18, 29);
	const overallCheck = line2.charAt(29);
	if (validateCheckDigit(compositeParts, overallCheck)) valid++;

	return { valid, total };
}

/**
 * Check if all characters in MRZ lines are valid
 */
function validateMRZCharacters(lines: string[]): boolean {
	return lines.every((line) => ICAO.validChars.test(line));
}

/**
 * Check aspect ratio of document image
 */
function validateAspectRatio(
	width: number,
	height: number,
	documentType: ValidatableDocumentType,
): boolean {
	const aspectRatio = width / height;

	if (documentType === "INE") {
		return (
			aspectRatio >= ASPECT_RATIOS.INE.min &&
			aspectRatio <= ASPECT_RATIOS.INE.max
		);
	} else if (documentType === "PASSPORT") {
		return (
			aspectRatio >= ASPECT_RATIOS.PASSPORT.min &&
			aspectRatio <= ASPECT_RATIOS.PASSPORT.max
		);
	}

	// For unknown, check if it fits either
	return (
		(aspectRatio >= ASPECT_RATIOS.INE.min &&
			aspectRatio <= ASPECT_RATIOS.INE.max) ||
		(aspectRatio >= ASPECT_RATIOS.PASSPORT.min &&
			aspectRatio <= ASPECT_RATIOS.PASSPORT.max)
	);
}

/**
 * Validate a document based on OCR text and image dimensions
 *
 * @param ocrText - Full OCR text from the document
 * @param imageWidth - Width of the document image in pixels
 * @param imageHeight - Height of the document image in pixels
 * @returns Validation result with confidence and detailed checks
 */
export function validateDocument(
	ocrText: string,
	imageWidth: number,
	imageHeight: number,
): DocumentValidationResult {
	// Extract MRZ candidates from OCR text
	const candidates = extractMRZCandidates(ocrText);

	// Initialize checks
	const checks: ValidationChecks = {
		hasMRZ: false,
		correctLineCount: false,
		correctLineLength: false,
		validCharacters: false,
		correctAspectRatio: false,
		checkDigitsValid: false,
		validCheckDigitCount: 0,
		totalCheckDigits: 0,
	};

	// No MRZ found
	if (candidates.length === 0) {
		return {
			isValid: false,
			documentType: "UNKNOWN",
			confidence: 0,
			checks,
			message: "No se encontró zona MRZ en el documento",
		};
	}

	// Detect document type by MRZ format
	let documentType: ValidatableDocumentType = "UNKNOWN";
	let mrzLines: string[] | null = null;

	if (matchesTD3Format(candidates)) {
		documentType = "PASSPORT";
		mrzLines = extractTD3Lines(candidates);
		checks.correctLineCount = mrzLines !== null && mrzLines.length === 2;
	} else if (matchesTD1Format(candidates)) {
		documentType = "INE";
		mrzLines = extractTD1Lines(candidates);
		checks.correctLineCount = mrzLines !== null && mrzLines.length === 3;
	}

	// No valid MRZ structure found
	if (!mrzLines) {
		return {
			isValid: false,
			documentType: "UNKNOWN",
			confidence: 0.1,
			checks,
			message: "El formato MRZ no coincide con INE ni Pasaporte",
			mrzLines: candidates,
		};
	}

	// MRZ found
	checks.hasMRZ = true;

	// Validate line lengths
	if (documentType === "PASSPORT") {
		checks.correctLineLength = mrzLines.every(
			(line) =>
				line.length >= ICAO.TD3.minLineLength &&
				line.length <= ICAO.TD3.maxLineLength,
		);
	} else if (documentType === "INE") {
		checks.correctLineLength = mrzLines.every(
			(line) =>
				line.length >= ICAO.TD1.minLineLength &&
				line.length <= ICAO.TD1.maxLineLength,
		);
	}

	// Validate characters
	checks.validCharacters = validateMRZCharacters(mrzLines);

	// Validate aspect ratio
	checks.correctAspectRatio = validateAspectRatio(
		imageWidth,
		imageHeight,
		documentType,
	);

	// Validate check digits
	let checkDigitResult: { valid: number; total: number };
	if (documentType === "PASSPORT" && mrzLines.length >= 2) {
		checkDigitResult = validateTD3CheckDigits(mrzLines[1]);
	} else if (documentType === "INE" && mrzLines.length >= 2) {
		checkDigitResult = validateTD1CheckDigits(mrzLines[0], mrzLines[1]);
	} else {
		checkDigitResult = { valid: 0, total: 1 };
	}

	checks.validCheckDigitCount = checkDigitResult.valid;
	checks.totalCheckDigits = checkDigitResult.total;
	checks.checkDigitsValid =
		checkDigitResult.valid >= Math.ceil(checkDigitResult.total * 0.5);

	// Calculate confidence score
	let confidence = 0;
	if (checks.hasMRZ) confidence += 0.25;
	if (checks.correctLineCount) confidence += 0.15;
	if (checks.correctLineLength) confidence += 0.1;
	if (checks.validCharacters) confidence += 0.15;
	if (checks.correctAspectRatio) confidence += 0.1;
	if (checks.checkDigitsValid) confidence += 0.25;

	// Document is valid if:
	// 1. Has MRZ
	// 2. Correct line count
	// 3. At least half of check digits are valid
	const isValid =
		checks.hasMRZ && checks.correctLineCount && checks.checkDigitsValid;

	// Build message
	let message: string;
	if (isValid) {
		const docTypeName = documentType === "INE" ? "INE" : "Pasaporte";
		message = `${docTypeName} validado correctamente. ${checkDigitResult.valid}/${checkDigitResult.total} dígitos verificadores correctos.`;
	} else if (!checks.hasMRZ) {
		message = "No se detectó zona MRZ válida en el documento.";
	} else if (!checks.correctLineCount) {
		message = `El MRZ no tiene el número correcto de líneas para ${documentType === "PASSPORT" ? "un Pasaporte (2)" : "una INE (3)"}.`;
	} else if (!checks.checkDigitsValid) {
		message = `Los dígitos verificadores del MRZ no son válidos (${checkDigitResult.valid}/${checkDigitResult.total}). El documento puede estar dañado o ser inválido.`;
	} else {
		message = "El documento no pudo ser validado.";
	}

	return {
		isValid,
		documentType,
		confidence,
		checks,
		message,
		mrzLines,
	};
}

/**
 * Quick check if OCR text contains a valid MRZ
 * Use this for fast rejection of non-document images
 */
export function hasMRZ(ocrText: string): boolean {
	const candidates = extractMRZCandidates(ocrText);
	return matchesTD3Format(candidates) || matchesTD1Format(candidates);
}

/**
 * Detect document type from OCR text
 */
export function detectDocumentType(ocrText: string): ValidatableDocumentType {
	const candidates = extractMRZCandidates(ocrText);

	if (matchesTD3Format(candidates)) {
		return "PASSPORT";
	} else if (matchesTD1Format(candidates)) {
		return "INE";
	}

	return "UNKNOWN";
}
