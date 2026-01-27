/**
 * MRZ (Machine Readable Zone) Parser for Mexican INE and Passports
 *
 * Reference: https://en.wikipedia.org/wiki/Machine-readable_passport
 *
 * **INE uses TD1 format (3 lines, 30 characters each):**
 * Line 1: IDMEX[document_number]<<[optional_data]
 * Line 2: [YYMMDD_birth][check][sex][YYMMDD_expiry][check][nationality][optional]
 * Line 3: [surname]<<[given_names]<<
 *
 * **Passport uses TD3 format (2 lines, 44 characters each):**
 * Line 1: P[type][issuer_country][surname]<<[given_names]
 * Line 2: [passport_no][check][nationality][YYMMDD_birth][check][sex][YYMMDD_expiry][check][personal_no][check][overall_check]
 *
 * Example Passport MRZ:
 * P<MEXGARCIA<HERNANDEZ<<JUAN<PABLO<<<<<<<<<<<<
 * G123456787MEX9001011M3012317<<<<<<<<<<<<<<04
 */

/** Document type detected from MRZ */
export type MRZDocumentType = "INE" | "PASSPORT" | "UNKNOWN";

export interface MRZResult {
	success: boolean;
	/** Type of document detected from MRZ */
	documentType: MRZDocumentType;
	/** Document number (INE: IDMEX number, Passport: passport number) */
	documentNumber?: string;
	/** Full name */
	fullName?: string;
	/** First name(s) */
	firstName?: string;
	/** Paternal surname */
	lastName?: string;
	/** Maternal surname */
	secondLastName?: string;
	/** Birth date in YYYY-MM-DD format */
	birthDate?: string;
	/** Sex: M (male) or F (female) */
	sex?: string;
	/** Expiry date in YYYY-MM-DD format */
	expiryDate?: string;
	/** Nationality code (e.g., MEX) */
	nationality?: string;
	/** Issuing country code (e.g., MEX) */
	issuingCountry?: string;
	/** CURP (extracted from front side, not MRZ) */
	curp?: string;
	/** Personal number field (TD3 positions 29-42) */
	personalNumber?: string;
	/** Raw MRZ lines for debugging */
	rawLines?: string[];
	/** Confidence score 0-1 based on check digit validation and format */
	confidence: number;
	/** Check digit validation results */
	checkDigits?: {
		documentNumber: boolean;
		birthDate: boolean;
		expiryDate: boolean;
		personalNumber: boolean;
		overall: boolean;
	};
	/** Error message if parsing failed */
	error?: string;
}

/**
 * Extract CURP from OCR text (front side of INE)
 * CURP format: 4 letters + 6 digits + 1 letter + 5 letters + 2 alphanumeric
 * Example: SERR900601HPLPZD04
 */
export function extractCURP(text: string): string | undefined {
	const normalizedText = text.toUpperCase().replace(/\s/g, "");

	// CURP pattern: 4 letters, 6 digits, 1 letter (sex), 2 letters (state), 3 letters (consonants), 2 alphanumeric
	// More flexible pattern to handle OCR errors (O/0 confusion)
	const curpPattern = /[A-Z]{4}[O0-9]{6}[HM][A-Z]{5}[A-Z0-9][O0-9]/g;
	const matches = normalizedText.match(curpPattern);

	if (matches && matches.length > 0) {
		// Take the first match and correct O->0 in digit positions
		let curp = matches[0];
		const chars = curp.split("");
		// Positions 4-9 should be digits (birth date YYMMDD)
		for (let i = 4; i <= 9; i++) {
			if (chars[i] === "O") chars[i] = "0";
		}
		// Position 17 should be a digit (check digit)
		if (chars[17] === "O") chars[17] = "0";
		return chars.join("");
	}

	return undefined;
}

/**
 * Parse YYMMDD date format to YYYY-MM-DD
 * Assumes dates are in 1900s for years > 50, 2000s for years <= 50
 */
function parseMRZDate(yymmdd: string): string | undefined {
	if (!yymmdd || yymmdd.length !== 6) return undefined;

	const yy = parseInt(yymmdd.substring(0, 2), 10);
	const mm = yymmdd.substring(2, 4);
	const dd = yymmdd.substring(4, 6);

	// For birth dates: assume 1900s if > 50, 2000s if <= 50
	// For expiry dates: assume 2000s for most cases
	const year = yy > 50 ? 1900 + yy : 2000 + yy;

	return `${year}-${mm}-${dd}`;
}

/**
 * Parse expiry date - always assume 2000s for INE expiry
 */
function parseExpiryDate(yymmdd: string): string | undefined {
	if (!yymmdd || yymmdd.length !== 6) return undefined;

	const yy = parseInt(yymmdd.substring(0, 2), 10);
	const mm = yymmdd.substring(2, 4);
	const dd = yymmdd.substring(4, 6);

	// Expiry dates are always in 2000s for INE
	const year = 2000 + yy;

	return `${year}-${mm}-${dd}`;
}

/**
 * Parse name from MRZ line 3
 * Format: SURNAME<SECOND_SURNAME<<GIVEN<NAMES<<
 */
function parseMRZName(line3: string): {
	fullName: string;
	firstName: string;
	lastName: string;
	secondLastName?: string;
} {
	// Remove trailing < characters
	const cleaned = line3.replace(/<+$/, "");

	// Split by << to separate surnames from given names
	const parts = cleaned.split("<<");

	let surnames = "";
	let givenNames = "";

	if (parts.length >= 2) {
		surnames = parts[0].replace(/</g, " ").trim();
		givenNames = parts[1].replace(/</g, " ").trim();
	} else if (parts.length === 1) {
		// Fallback: try to split by single <
		const allParts = cleaned.split("<").filter(Boolean);
		if (allParts.length >= 2) {
			// Assume first two are surnames, rest are given names
			surnames = allParts.slice(0, 2).join(" ");
			givenNames = allParts.slice(2).join(" ");
		} else {
			surnames = allParts.join(" ");
		}
	}

	// Split surnames into paterno and materno
	const surnamesParts = surnames.split(" ").filter(Boolean);
	const lastName = surnamesParts[0] || "";
	const secondLastName = surnamesParts[1] || undefined;

	// Build full name: Given Names + Surnames
	const fullName = `${givenNames} ${surnames}`.trim();

	return {
		fullName,
		firstName: givenNames,
		lastName,
		secondLastName,
	};
}

/**
 * ICAO 9303 TD1 (INE) Constants
 */
const TD1_LINE_COUNT = 3;
const TD1_LINE_LENGTH = 30;
const TD1_MIN_LINE_LENGTH = 26; // Allow some OCR tolerance
const TD1_MAX_LINE_LENGTH = 34;

/**
 * ICAO 9303 TD3 (Passport) Constants
 */
const TD3_LINE_COUNT = 2;
const TD3_LINE_LENGTH = 44;
const TD3_MIN_LINE_LENGTH = 40; // Allow some OCR tolerance
const TD3_MAX_LINE_LENGTH = 48;

/**
 * Clean up common OCR errors in MRZ text
 * MRZ uses only A-Z, 0-9, and < characters
 */
function cleanMRZOCRErrors(line: string): string {
	let cleaned = line
		.toUpperCase()
		.replace(/\s/g, "") // Remove spaces
		// Common filler confusions
		.replace(/[.\-–—_'"`,;:!]/g, "<") // Various punctuation → filler
		// Common letter/digit confusions in MRZ
		.replace(/\$/g, "S")
		.replace(/\|/g, "I")
		.replace(/\\/g, "<")
		.replace(/\//g, "<")
		// Remove any remaining invalid characters
		.replace(/[^A-Z0-9<]/g, "");

	return cleaned;
}

/**
 * Fix position-specific OCR errors in MRZ line 2 (dates and check digits)
 * Line 2 format: [YYMMDD_birth][check][sex][YYMMDD_expiry][check][nationality][optional]
 * Positions 0-5: birth date (digits only)
 * Position 6: check digit (digit only)
 * Position 7: sex (H, M, F, or <)
 * Positions 8-13: expiry date (digits only)
 * Position 14: check digit (digit only)
 * Positions 15-17: nationality (letters only)
 */
function fixMRZLine2OCRErrors(line: string): string {
	if (line.length < 15) return line;

	const chars = line.split("");

	// Fix digit positions (0-6, 8-14) - common letter→digit confusions
	const digitPositions = [0, 1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14];
	for (const pos of digitPositions) {
		if (pos < chars.length) {
			const char = chars[pos];
			// Common OCR confusions: letter → digit
			if (char === "O" || char === "D" || char === "Q") chars[pos] = "0";
			else if (char === "I" || char === "L" || char === "|") chars[pos] = "1";
			else if (char === "Z") chars[pos] = "2";
			else if (char === "A")
				chars[pos] = "4"; // Often at end of line
			else if (char === "S") chars[pos] = "5";
			else if (char === "G") chars[pos] = "6";
			else if (char === "T") chars[pos] = "7";
			else if (char === "B") chars[pos] = "8";
		}
	}

	// Fix sex position (7) - should be H, M, F, or <
	if (chars.length > 7) {
		const sex = chars[7];
		if (sex === "4")
			chars[7] = "H"; // 4 often confused with H
		else if (sex === "0" || sex === "O") chars[7] = "<";
	}

	return chars.join("");
}

/**
 * Fix position-specific OCR errors in MRZ line 3 (name line)
 * Should only contain letters and < fillers
 * Common issues:
 * - Digits where letters should be
 * - Merged characters where << should be (e.g., "LS" or "L5" instead of "<<")
 */
function fixMRZLine3OCRErrors(line: string): string {
	let result = line;

	// First pass: fix merged << patterns
	// OCR often reads << as LS, L5, LS, K<, etc.
	result = result
		.replace(/LS(?=[A-Z])/g, "<<") // LS before a letter → <<
		.replace(/L5(?=[A-Z])/g, "<<") // L5 before a letter → <<
		.replace(/K</g, "<<") // K< → <<
		.replace(/LC/g, "<<") // LC → <<
		.replace(/LZ/g, "<<") // LZ → <<
		.replace(/L(?=<)/g, "<"); // L before < → <

	// Second pass: fix individual character errors
	const chars = result.split("");
	for (let i = 0; i < chars.length; i++) {
		const char = chars[i];
		// In name line, digits are likely OCR errors for letters
		if (char === "0") chars[i] = "O";
		else if (char === "1") chars[i] = "I";
		else if (char === "5") chars[i] = "S";
		else if (char === "8") chars[i] = "B";
		else if (char === "7") chars[i] = "T";
	}

	return chars.join("");
}

/**
 * Normalize MRZ line to exact ICAO length
 * Pads with '<' if too short, truncates if too long
 */
function normalizeMRZLine(line: string, targetLength: number): string {
	const cleaned = cleanMRZOCRErrors(line);
	if (cleaned.length < targetLength) {
		return cleaned.padEnd(targetLength, "<");
	}
	return cleaned.substring(0, targetLength);
}

/**
 * Extract TD1 (INE) MRZ lines from OCR text
 * Per ICAO 9303: 3 lines × 30 characters each
 */
function extractMRZLines(text: string): string[] | null {
	const lines = text.split("\n").map((l) => l.trim().toUpperCase());

	// Find line starting with IDMEX (or I with OCR error)
	const idmexIndex = lines.findIndex((l) => {
		const cleaned = cleanMRZOCRErrors(l);
		return cleaned.startsWith("IDMEX") || cleaned.match(/^I[D]?MEX/);
	});

	if (idmexIndex >= 0 && idmexIndex + 2 < lines.length) {
		// Found IDMEX line, get all 3 MRZ lines
		const rawLines = [
			lines[idmexIndex],
			lines[idmexIndex + 1],
			lines[idmexIndex + 2],
		];

		// Clean OCR errors first
		let cleanedLines = rawLines.map((l) => cleanMRZOCRErrors(l));

		// Check if they look like MRZ (after cleaning)
		const isMRZ = cleanedLines.every(
			(l) =>
				/^[A-Z0-9<]+$/.test(l) &&
				l.length >= TD1_MIN_LINE_LENGTH &&
				l.length <= TD1_MAX_LINE_LENGTH,
		);

		if (isMRZ) {
			// Apply position-specific OCR fixes
			cleanedLines[1] = fixMRZLine2OCRErrors(cleanedLines[1]);
			cleanedLines[2] = fixMRZLine3OCRErrors(cleanedLines[2]);

			// Normalize to exactly 30 characters per ICAO TD1
			const normalized = cleanedLines.map((l) =>
				normalizeMRZLine(l, TD1_LINE_LENGTH),
			);

			console.log("[MRZ-INE] Raw OCR lines:", rawLines);
			console.log("[MRZ-INE] Cleaned lines:", normalized);

			return normalized;
		}
	}

	// Alternative: look for any 3 consecutive lines that look like TD1 MRZ
	for (let i = 0; i < lines.length - 2; i++) {
		const candidate = [lines[i], lines[i + 1], lines[i + 2]];
		let cleanedCandidate = candidate.map((l) => cleanMRZOCRErrors(l));

		const allMRZ = cleanedCandidate.every((l) => {
			return (
				/^[A-Z0-9<]+$/.test(l) &&
				l.length >= TD1_MIN_LINE_LENGTH &&
				l.length <= TD1_MAX_LINE_LENGTH
			);
		});

		if (allMRZ && cleanedCandidate[0].includes("MEX")) {
			// Apply position-specific OCR fixes
			cleanedCandidate[1] = fixMRZLine2OCRErrors(cleanedCandidate[1]);
			cleanedCandidate[2] = fixMRZLine3OCRErrors(cleanedCandidate[2]);

			// Normalize to exactly 30 characters per ICAO TD1
			const normalized = cleanedCandidate.map((l) =>
				normalizeMRZLine(l, TD1_LINE_LENGTH),
			);

			console.log("[MRZ-INE] Raw OCR lines (alt):", candidate);
			console.log("[MRZ-INE] Cleaned lines (alt):", normalized);

			return normalized;
		}
	}

	return null;
}

/**
 * Parse INE MRZ from OCR text (TD1 format per ICAO 9303)
 *
 * TD1 Format: 3 lines × 30 characters each
 * Line 1: IDMEX[document_number]<<[optional_data]
 * Line 2: [YYMMDD_birth][check][sex][YYMMDD_expiry][check][nationality][optional]
 * Line 3: [surname]<<[given_names]<<
 */
export function parseMRZ(text: string): MRZResult {
	try {
		const mrzLines = extractMRZLines(text);

		// Strict ICAO validation: must have exactly 3 lines
		if (!mrzLines || mrzLines.length !== TD1_LINE_COUNT) {
			return {
				success: false,
				documentType: "UNKNOWN",
				confidence: 0,
				error: `MRZ de INE requiere ${TD1_LINE_COUNT} líneas (ICAO TD1), encontradas: ${mrzLines?.length || 0}`,
			};
		}

		const [line1, line2, line3] = mrzLines;

		// Validate line lengths per ICAO
		const linesValid = mrzLines.every((l) => l.length === TD1_LINE_LENGTH);
		if (!linesValid) {
			console.warn(
				"[MRZ-INE] Line lengths not exactly 30:",
				mrzLines.map((l) => l.length),
			);
		}

		console.log(
			`[MRZ-INE] Parsing TD1 format (${TD1_LINE_COUNT}×${TD1_LINE_LENGTH}):`,
			mrzLines,
		);

		// Parse Line 1: IDMEX[document_number]<<[optional]
		let documentNumber: string | undefined;
		const idmexMatch = line1.match(/IDMEX([A-Z0-9]+)/);
		if (idmexMatch) {
			// Document number is digits after IDMEX, before any <
			const afterIdmex = idmexMatch[1];
			const numMatch = afterIdmex.match(/^(\d+)/);
			if (numMatch) {
				documentNumber = numMatch[1];
			}
		}

		// Parse Line 2: [YYMMDD_birth][check][sex][YYMMDD_expiry][check][nationality][optional]
		// Format: 9006016H3212312MEX<04<<02687<4
		//         |birth||sex|expiry||nat|optional
		let birthDate: string | undefined;
		let sex: string | undefined;
		let expiryDate: string | undefined;
		let nationality: string | undefined;

		// Basic check digit validation for INE
		let birthCheckValid = false;
		let expiryCheckValid = false;

		if (line2.length >= 15) {
			// Birth date: positions 0-5 (YYMMDD)
			const birthYYMMDD = line2.substring(0, 6);
			const birthCheck = line2.charAt(6);
			birthDate = parseMRZDate(birthYYMMDD);
			birthCheckValid = validateCheckDigit(birthYYMMDD, birthCheck);

			// Sex: position 7 (after check digit at position 6)
			const sexChar = line2.charAt(7);
			if (sexChar === "H" || sexChar === "M") {
				// H = Hombre (Male), M = Mujer (Female) in Mexican documents
				sex = sexChar === "H" ? "M" : "F"; // Convert to standard M/F
			} else if (sexChar === "F") {
				sex = "F";
			}

			// Expiry date: positions 8-13 (YYMMDD)
			const expiryYYMMDD = line2.substring(8, 14);
			const expiryCheck = line2.charAt(14);
			expiryDate = parseExpiryDate(expiryYYMMDD);
			expiryCheckValid = validateCheckDigit(expiryYYMMDD, expiryCheck);

			// Nationality: positions 15-17 (after check digit at 14)
			const natMatch = line2.match(/MEX/);
			if (natMatch) {
				nationality = "MEX";
			}
		}

		// Parse Line 3: Name
		const nameInfo = parseMRZName(line3);

		// Calculate confidence
		const hasDocNumber = !!documentNumber;
		const hasBirthDate = !!birthDate;
		const hasExpiryDate = !!expiryDate;
		const hasName = !!nameInfo.fullName;
		const validFields = [
			hasDocNumber,
			hasBirthDate,
			hasExpiryDate,
			hasName,
			birthCheckValid,
			expiryCheckValid,
		];
		const confidence = validFields.filter(Boolean).length / validFields.length;

		console.log("[MRZ-INE] Parsed result:", {
			documentNumber,
			birthDate,
			sex,
			expiryDate,
			nationality,
			confidence,
			...nameInfo,
		});

		return {
			success: true,
			documentType: "INE",
			documentNumber,
			...nameInfo,
			birthDate,
			sex,
			expiryDate,
			nationality,
			issuingCountry: "MEX",
			rawLines: mrzLines,
			confidence,
			checkDigits: {
				documentNumber: true, // INE doesn't have doc number check digit
				birthDate: birthCheckValid,
				expiryDate: expiryCheckValid,
				personalNumber: true,
				overall: true,
			},
		};
	} catch (error) {
		console.error("[MRZ-INE] Parse error:", error);
		return {
			success: false,
			documentType: "UNKNOWN",
			confidence: 0,
			error: error instanceof Error ? error.message : "Error parsing MRZ",
		};
	}
}

/**
 * Calculate MRZ check digit using ICAO 9303 algorithm
 * Characters: 0-9 = 0-9, A-Z = 10-35, < = 0
 * Weights: 7, 3, 1, 7, 3, 1, ...
 * Result: sum mod 10
 */
export function calculateMRZCheckDigit(data: string): number {
	const weights = [7, 3, 1];
	let sum = 0;

	for (let i = 0; i < data.length; i++) {
		const char = data.charAt(i);
		let value: number;

		if (char >= "0" && char <= "9") {
			value = parseInt(char, 10);
		} else if (char >= "A" && char <= "Z") {
			value = char.charCodeAt(0) - "A".charCodeAt(0) + 10;
		} else {
			value = 0; // < and any other character
		}

		sum += value * weights[i % 3];
	}

	return sum % 10;
}

/**
 * Validate a field against its check digit
 */
export function validateCheckDigit(data: string, checkDigit: string): boolean {
	const calculated = calculateMRZCheckDigit(data);
	const expected = parseInt(checkDigit, 10);
	return calculated === expected;
}

// =============================================================================
// PASSPORT MRZ PARSING (TD3 Format - 2 lines × 44 characters)
// =============================================================================

/**
 * Fix position-specific OCR errors in Passport MRZ line 2
 * Line 2 positions with expected types:
 * 0-8: passport number (alphanumeric)
 * 9: check digit (digit)
 * 10-12: nationality (letters)
 * 13-18: birth date (digits)
 * 19: check digit (digit)
 * 20: sex (M, F, <)
 * 21-26: expiry date (digits)
 * 27: check digit (digit)
 * 28-41: personal number (alphanumeric)
 * 42: check digit (digit)
 * 43: overall check digit (digit)
 */
function fixPassportLine2OCRErrors(line: string): string {
	if (line.length < 44) return line;

	const chars = line.split("");

	// Fix digit-only positions: 9, 13-19, 21-27, 42, 43
	const digitPositions = [
		9, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 24, 25, 26, 27, 42, 43,
	];
	for (const pos of digitPositions) {
		if (pos < chars.length) {
			const char = chars[pos];
			if (char === "O" || char === "D" || char === "Q") chars[pos] = "0";
			else if (char === "I" || char === "L" || char === "|") chars[pos] = "1";
			else if (char === "Z") chars[pos] = "2";
			else if (char === "A") chars[pos] = "4";
			else if (char === "S") chars[pos] = "5";
			else if (char === "G") chars[pos] = "6";
			else if (char === "T") chars[pos] = "7";
			else if (char === "B") chars[pos] = "8";
		}
	}

	// Fix sex position (20)
	if (chars.length > 20) {
		const sex = chars[20];
		if (sex === "0" || sex === "O") chars[20] = "<";
	}

	return chars.join("");
}

/**
 * Extract Passport MRZ lines from OCR text
 * Passport MRZ is always at the bottom, 2 lines of 44 characters each
 * Line 1 starts with P
 */
function extractPassportMRZLines(text: string): string[] | null {
	const lines = text.split("\n").map((l) => l.trim().toUpperCase());

	// Look for passport MRZ pattern: line starting with P< or P[A-Z]
	for (let i = 0; i < lines.length - 1; i++) {
		const line1 = cleanMRZOCRErrors(lines[i]);
		const line2 = cleanMRZOCRErrors(lines[i + 1] || "");

		// Line 1 must start with P and be ~44 chars
		// Line 2 must be ~44 chars and have passport structure
		if (
			line1.match(/^P[<A-Z]/) &&
			line1.length >= 40 &&
			line1.length <= 48 &&
			line2 &&
			line2.length >= 40 &&
			line2.length <= 48 &&
			/^[A-Z0-9<]+$/.test(line1) &&
			/^[A-Z0-9<]+$/.test(line2)
		) {
			// Additional validation: line 2 should have nationality at positions 10-12
			const possibleNat = line2.substring(10, 13);
			if (/^[A-Z]{3}$/.test(possibleNat) || /^[A-Z]{2}<$/.test(possibleNat)) {
				// Apply position-specific fixes to line 2
				const fixedLine2 = fixPassportLine2OCRErrors(line2);

				console.log("[MRZ-Passport] Raw lines:", [lines[i], lines[i + 1]]);
				console.log("[MRZ-Passport] Cleaned lines:", [line1, fixedLine2]);

				return [
					line1.substring(0, 44).padEnd(44, "<"),
					fixedLine2.substring(0, 44).padEnd(44, "<"),
				];
			}
		}
	}

	// Alternative: look for OCR-B style lines (all caps, specific length)
	// Sometimes OCR reads MRZ with minor errors
	for (let i = lines.length - 1; i >= 1; i--) {
		const line2 = cleanMRZOCRErrors(lines[i]);
		const line1 = cleanMRZOCRErrors(lines[i - 1] || "");

		if (
			line1 &&
			line1.length >= 38 &&
			line1.match(/^P/) &&
			line2 &&
			line2.length >= 38 &&
			/^[0-9]/.test(line2.charAt(9))
		) {
			// Apply position-specific fixes to line 2
			const fixedLine2 = fixPassportLine2OCRErrors(line2);

			return [
				line1.substring(0, 44).padEnd(44, "<"),
				fixedLine2.substring(0, 44).padEnd(44, "<"),
			];
		}
	}

	return null;
}

/**
 * Parse name from Passport MRZ line 1 (positions 6-44)
 * Format: SURNAME<<GIVEN<NAMES<<<<
 */
function parsePassportMRZName(nameField: string): {
	fullName: string;
	firstName: string;
	lastName: string;
	secondLastName?: string;
} {
	// Remove trailing < characters
	const cleaned = nameField.replace(/<+$/, "");

	// Split by << to separate surnames from given names
	const parts = cleaned.split("<<");

	let surnames = "";
	let givenNames = "";

	if (parts.length >= 2) {
		surnames = parts[0].replace(/</g, " ").trim();
		givenNames = parts.slice(1).join(" ").replace(/</g, " ").trim();
	} else if (parts.length === 1) {
		// Only surname, no given names
		surnames = cleaned.replace(/</g, " ").trim();
	}

	// Split surnames (some countries use SURNAME<SECONDSURNAME)
	const surnamesParts = surnames.split(" ").filter(Boolean);
	const lastName = surnamesParts[0] || "";
	const secondLastName =
		surnamesParts.length > 1 ? surnamesParts.slice(1).join(" ") : undefined;

	// Build full name: Given Names + Surnames
	const fullName = [givenNames, surnames].filter(Boolean).join(" ").trim();

	return {
		fullName,
		firstName: givenNames,
		lastName,
		secondLastName,
	};
}

/**
 * Parse Passport MRZ (TD3 format per ICAO 9303)
 *
 * TD3 Format: 2 lines × 44 characters each
 *
 * Line 1 (44 chars):
 *   [1]     P - Passport
 *   [2]     Type (<, or specific type letter)
 *   [3-5]   Issuing country (ISO 3166-1 alpha-3)
 *   [6-44]  Name (39 chars): SURNAME<<GIVEN<NAMES
 *
 * Line 2 (44 chars):
 *   [1-9]   Passport number
 *   [10]    Check digit for passport number
 *   [11-13] Nationality
 *   [14-19] Date of birth (YYMMDD)
 *   [20]    Check digit for DOB
 *   [21]    Sex (M, F, or <)
 *   [22-27] Expiration date (YYMMDD)
 *   [28]    Check digit for expiration
 *   [29-42] Personal number (optional, country-specific)
 *   [43]    Check digit for personal number (< if all <)
 *   [44]    Overall check digit
 */
export function parsePassportMRZ(text: string): MRZResult {
	try {
		const mrzLines = extractPassportMRZLines(text);

		// Strict ICAO validation: must have exactly 2 lines
		if (!mrzLines || mrzLines.length !== TD3_LINE_COUNT) {
			return {
				success: false,
				documentType: "UNKNOWN",
				confidence: 0,
				error: `MRZ de Pasaporte requiere ${TD3_LINE_COUNT} líneas (ICAO TD3), encontradas: ${mrzLines?.length || 0}`,
			};
		}

		const [line1, line2] = mrzLines;

		// Validate line lengths per ICAO
		const linesValid = mrzLines.every((l) => l.length === TD3_LINE_LENGTH);
		if (!linesValid) {
			console.warn(
				"[MRZ-Passport] Line lengths not exactly 44:",
				mrzLines.map((l) => l.length),
			);
		}

		console.log(
			`[MRZ-Passport] Parsing TD3 format (${TD3_LINE_COUNT}×${TD3_LINE_LENGTH}):`,
			mrzLines,
		);

		// Parse Line 1
		const documentType = line1.charAt(0); // Should be 'P'
		const documentSubtype = line1.charAt(1); // Type or <
		const issuingCountry = line1.substring(2, 5).replace(/</g, "");
		const nameField = line1.substring(5, 44);
		const nameInfo = parsePassportMRZName(nameField);

		// Parse Line 2
		const passportNumber = line2.substring(0, 9).replace(/<+$/, "");
		const passportCheckDigit = line2.charAt(9);
		const nationality = line2.substring(10, 13).replace(/</g, "");
		const birthDateRaw = line2.substring(13, 19);
		const birthCheckDigit = line2.charAt(19);
		const sex = line2.charAt(20);
		const expiryDateRaw = line2.substring(21, 27);
		const expiryCheckDigit = line2.charAt(27);
		const personalNumber =
			line2.substring(28, 42).replace(/<+$/, "") || undefined;
		const personalCheckDigit = line2.charAt(42);
		const overallCheckDigit = line2.charAt(43);

		// Validate check digits
		const checkDigits = {
			documentNumber: validateCheckDigit(
				line2.substring(0, 9),
				passportCheckDigit,
			),
			birthDate: validateCheckDigit(birthDateRaw, birthCheckDigit),
			expiryDate: validateCheckDigit(expiryDateRaw, expiryCheckDigit),
			personalNumber: personalNumber
				? validateCheckDigit(line2.substring(28, 42), personalCheckDigit)
				: personalCheckDigit === "<", // Empty personal number has < as check
			overall: validateCheckDigit(
				line2.substring(0, 10) +
					line2.substring(13, 20) +
					line2.substring(21, 43),
				overallCheckDigit,
			),
		};

		// Calculate confidence based on check digits
		const validChecks = Object.values(checkDigits).filter(Boolean).length;
		const confidence = validChecks / 5;

		// Parse dates
		const birthDate = parseMRZDate(birthDateRaw);
		const expiryDate = parsePassportExpiryDate(expiryDateRaw);

		// Normalize sex
		let normalizedSex: string | undefined;
		if (sex === "M") normalizedSex = "M";
		else if (sex === "F") normalizedSex = "F";
		else normalizedSex = undefined;

		console.log("[MRZ-Passport] Parsed result:", {
			passportNumber,
			issuingCountry,
			nationality,
			birthDate,
			sex: normalizedSex,
			expiryDate,
			checkDigits,
			confidence,
			...nameInfo,
		});

		return {
			success: true,
			documentType: "PASSPORT",
			documentNumber: passportNumber,
			...nameInfo,
			birthDate,
			sex: normalizedSex,
			expiryDate,
			nationality,
			issuingCountry,
			personalNumber,
			rawLines: mrzLines,
			checkDigits,
			confidence,
		};
	} catch (error) {
		console.error("[MRZ-Passport] Parse error:", error);
		return {
			success: false,
			documentType: "UNKNOWN",
			confidence: 0,
			error:
				error instanceof Error ? error.message : "Error parsing passport MRZ",
		};
	}
}

/**
 * Parse passport expiry date - typically in 2000s
 */
function parsePassportExpiryDate(yymmdd: string): string | undefined {
	if (!yymmdd || yymmdd.length !== 6) return undefined;

	const yy = parseInt(yymmdd.substring(0, 2), 10);
	const mm = yymmdd.substring(2, 4);
	const dd = yymmdd.substring(4, 6);

	// Passport expiry dates: 00-50 = 2000-2050, 51-99 = 2051-2099
	// Most passports don't expire beyond 10 years, so 2000s is safe
	const year = 2000 + yy;

	return `${year}-${mm}-${dd}`;
}

// =============================================================================
// UNIFIED MRZ DETECTION AND PARSING
// =============================================================================

/**
 * Detect MRZ type from OCR text
 */
export function detectMRZType(text: string): MRZDocumentType {
	const upperText = text.toUpperCase();

	// Check for INE (TD1 - IDMEX)
	if (upperText.includes("IDMEX")) {
		return "INE";
	}

	// Check for Passport (TD3 - starts with P)
	const lines = upperText.split("\n").map((l) => l.trim());
	for (const line of lines) {
		const cleaned = line.replace(/\s/g, "");
		if (cleaned.match(/^P[<A-Z][A-Z]{3}/) && cleaned.length >= 30) {
			return "PASSPORT";
		}
	}

	return "UNKNOWN";
}

/**
 * Parse MRZ from OCR text - auto-detects document type
 */
export function parseAnyMRZ(text: string): MRZResult {
	const mrzType = detectMRZType(text);

	console.log("[MRZ] Detected type:", mrzType);

	switch (mrzType) {
		case "INE":
			return parseMRZ(text);
		case "PASSPORT":
			return parsePassportMRZ(text);
		default:
			// Try both and see which one succeeds
			const ineResult = parseMRZ(text);
			if (ineResult.success) return ineResult;

			const passportResult = parsePassportMRZ(text);
			if (passportResult.success) return passportResult;

			return {
				success: false,
				documentType: "UNKNOWN",
				confidence: 0,
				error: "No se detectó zona MRZ válida",
			};
	}
}

/**
 * Validate MRZ check digits for INE (legacy function, updated)
 */
export function validateMRZCheckDigits(mrzLines: string[]): boolean {
	// MRZ uses a specific check digit algorithm
	// For now, we just check basic format validity
	if (mrzLines.length < 2) return false;

	// Check if INE (3 lines) or Passport (2 lines)
	if (mrzLines.length >= 3) {
		const [line1, line2, line3] = mrzLines;
		return (
			line1.startsWith("IDMEX") && line2.length >= 20 && line3.includes("<<")
		);
	} else {
		const [line1, line2] = mrzLines;
		return line1.startsWith("P") && line1.length >= 40 && line2.length >= 40;
	}
}
