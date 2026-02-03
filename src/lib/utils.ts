import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Sanitize a string value by trimming, limiting length, and removing control characters
 * Used by URL filters and other input sanitization
 */
export function sanitizeString(value: string, maxLength: number): string {
	return String(value)
		.trim()
		.slice(0, maxLength)
		.replace(/[\x00-\x1F\x7F]/g, "");
}

/**
 * Format a date for display using Mexican locale
 * Provides consistent date formatting across the application
 */
export function formatClientDate(date: Date | string): string {
	const d = typeof date === "string" ? new Date(date) : date;
	return d.toLocaleDateString("es-MX");
}

/**
 * Validates RFC (Registro Federal de Contribuyentes) format
 * @param rfc - The RFC string to validate
 * @param personType - Type of person: "physical" (13 chars) or "moral"/"trust" (12 chars)
 * @returns Object with isValid boolean and error message
 */
export function validateRFC(
	rfc: string,
	personType: "physical" | "moral" | "trust" = "moral",
): { isValid: boolean; error?: string } {
	if (!rfc || rfc.trim().length === 0) {
		return { isValid: false, error: "RFC es requerido" };
	}

	const trimmedRfc = rfc.trim().toUpperCase();
	const expectedLength = personType === "physical" ? 13 : 12;

	if (trimmedRfc.length !== expectedLength) {
		return {
			isValid: false,
			error: `RFC debe tener ${expectedLength} caracteres`,
		};
	}

	// For physical persons: strict validation of format
	// Physical: 4 letters + 6 digits + 3 alphanumeric (13 total)
	if (personType === "physical") {
		const rfcPattern = /^[A-ZÑ&]{4}\d{6}[A-Z0-9Ñ]{3}$/;
		if (!rfcPattern.test(trimmedRfc)) {
			return {
				isValid: false,
				error:
					"RFC no tiene el formato correcto. Debe comenzar con 4 letras, seguido de 6 dígitos (fecha) y 3 caracteres alfanuméricos",
			};
		}
	} else {
		// For moral/trust persons: only validate length (already done above)
		// The 3 initial characters don't always match the business name pattern
		// so we skip that validation
	}

	return { isValid: true };
}

function formatDateToYYMMDD(dateValue?: string): string | null {
	if (!dateValue) {
		return null;
	}
	const normalized = dateValue.trim();
	const isoMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})/);
	if (isoMatch) {
		const [, yearFull, month, day] = isoMatch;
		return `${yearFull.slice(-2)}${month}${day}`;
	}
	const date = new Date(normalized);
	if (Number.isNaN(date.getTime())) {
		return null;
	}
	const year = (date.getFullYear() % 100).toString().padStart(2, "0");
	const month = (date.getMonth() + 1).toString().padStart(2, "0");
	const day = date.getDate().toString().padStart(2, "0");
	return `${year}${month}${day}`;
}

function getRfcPrefixPhysical(
	firstName: string,
	lastName: string,
	secondLastName?: string,
): string {
	const lastLetter = getFirstLetter(lastName);
	const lastVowel = getFirstInternalVowel(lastName);
	const secondLastLetter = secondLastName?.trim()
		? getFirstLetter(secondLastName)
		: "X";
	const normalizedFirstName = firstName.trim().toUpperCase();
	const nameParts = normalizedFirstName.split(/\s+/).filter(Boolean);
	const ignoredNames = new Set(["JOSE", "MARIA", "MA", "JO"]);
	const firstNameToken =
		nameParts.length > 1 && ignoredNames.has(nameParts[0])
			? nameParts[1]
			: (nameParts[0] ?? "");
	const firstNameLetter = firstNameToken ? firstNameToken[0] : "";
	return `${lastLetter}${lastVowel}${secondLastLetter}${firstNameLetter}`;
}

function getRfcPrefixMoral(businessName: string): string {
	const normalized = businessName
		.toUpperCase()
		.replace(/[^A-Z0-9\s]/g, " ")
		.trim();
	const tokens = normalized.split(/\s+/).filter(Boolean);
	const ignored = new Set([
		"DE",
		"DEL",
		"LA",
		"LAS",
		"LOS",
		"Y",
		"SA",
		"S",
		"A",
		"CV",
	]);
	const cleaned = tokens
		.filter((token) => !ignored.has(token))
		.join("")
		.replace(/[^A-Z0-9]/g, "");
	return cleaned.padEnd(3, "X").slice(0, 3);
}

export function validateRFCMatch(
	rfc: string,
	personType: "physical" | "moral" | "trust",
	data: {
		firstName?: string;
		lastName?: string;
		secondLastName?: string;
		birthDate?: string;
		businessName?: string;
		incorporationDate?: string;
	},
): { isValid: boolean; error?: string } {
	const trimmedRfc = rfc.trim().toUpperCase();
	if (!trimmedRfc) {
		return { isValid: true };
	}

	if (personType === "physical") {
		const { firstName, lastName, secondLastName, birthDate } = data;
		if (!firstName || !lastName || !birthDate) {
			return { isValid: true };
		}
		const expectedPrefix = getRfcPrefixPhysical(
			firstName,
			lastName,
			secondLastName,
		);
		const expectedDate = formatDateToYYMMDD(birthDate);
		if (!expectedDate) {
			return { isValid: true };
		}
		const rfcPrefix = trimmedRfc.slice(0, 4);
		const rfcDate = trimmedRfc.slice(4, 10);
		if (!/^[A-ZÑ&]{4}$/.test(rfcPrefix)) {
			return {
				isValid: false,
				error: "El RFC no coincide con los datos proporcionados",
			};
		}
		if (rfcPrefix !== expectedPrefix || rfcDate !== expectedDate) {
			return {
				isValid: false,
				error: "El RFC no coincide con los datos proporcionados",
			};
		}
		return { isValid: true };
	}

	// For moral/trust person types: only validate incorporation date
	// The 3 initial characters don't always match the business name pattern
	const { incorporationDate } = data;
	if (!incorporationDate) {
		return { isValid: true };
	}

	const rfcDate = trimmedRfc.slice(3, 9);

	// Validate date matches incorporation date
	const expectedDate = formatDateToYYMMDD(incorporationDate);
	if (!expectedDate) {
		return { isValid: true };
	}

	if (rfcDate !== expectedDate) {
		return {
			isValid: false,
			error: "La fecha en el RFC no coincide con la fecha de constitución",
		};
	}

	return { isValid: true };
}

/**
 * Validates CURP (Clave Única de Registro de Población) format
 * @param curp - The CURP string to validate
 * @returns Object with isValid boolean and error message
 */
export function validateCURP(curp: string): {
	isValid: boolean;
	error?: string;
} {
	if (!curp || curp.trim().length === 0) {
		return { isValid: false, error: "CURP es requerido" };
	}

	const trimmedCurp = curp.trim().toUpperCase();

	if (trimmedCurp.length !== 18) {
		return {
			isValid: false,
			error: "CURP debe tener exactamente 18 caracteres",
		};
	}

	// CURP format: 4 letters + 6 digits (YYMMDD) + 1 letter (gender) + 2 letters (state) + 3 letters (consonants) + 1 letter (homoclave) + 1 digit (verification)
	// Pattern: [A-Z]{4}\d{6}[HM][A-Z]{2}[A-Z0-9]{3}[0-9A-Z]\d
	const curpPattern = /^[A-ZÑ]{4}\d{6}[HM][A-Z]{2}[A-Z0-9Ñ]{3}[0-9A-ZÑ]\d$/;

	if (!curpPattern.test(trimmedCurp)) {
		return {
			isValid: false,
			error:
				"CURP no tiene el formato correcto. Debe seguir el formato estándar mexicano",
		};
	}

	// Validate gender character (position 11, index 10)
	const genderChar = trimmedCurp[10];
	if (genderChar !== "H" && genderChar !== "M") {
		return {
			isValid: false,
			error: "CURP debe contener 'H' o 'M' en la posición de género",
		};
	}

	return { isValid: true };
}

/**
 * Validates VIN (Vehicle Identification Number) format
 * @param vin - The VIN string to validate
 * @returns Object with isValid boolean and error message
 */
export function validateVIN(vin: string): { isValid: boolean; error?: string } {
	if (!vin || vin.trim().length === 0) {
		// VIN is optional, so empty is valid
		return { isValid: true };
	}

	const trimmedVin = vin.trim().toUpperCase();

	if (trimmedVin.length !== 17) {
		return {
			isValid: false,
			error: "VIN debe tener exactamente 17 caracteres",
		};
	}

	// VIN format: 17 alphanumeric characters, excluding I, O, Q to avoid confusion with 1, 0
	// Pattern: [A-HJ-NPR-Z0-9]{17}
	const vinPattern = /^[A-HJ-NPR-Z0-9]{17}$/;

	if (!vinPattern.test(trimmedVin)) {
		return {
			isValid: false,
			error:
				"VIN no tiene el formato correcto. Debe contener 17 caracteres alfanuméricos (excluyendo I, O, Q)",
		};
	}

	return { isValid: true };
}

/**
 * Formats proper nouns (names, company names, business names, brands, models) as all-uppercase
 * @param text - The text to format
 * @returns The text formatted as uppercase, or empty string if input is null/undefined/empty
 */
export function formatProperNoun(text: string | null | undefined): string {
	if (!text || text.trim().length === 0) {
		return "";
	}
	return text.trim().toUpperCase();
}

/**
 * Extracts birthdate from CURP
 * CURP positions 4-9 contain the birthdate in YYMMDD format
 * @param curp - The CURP string
 * @returns Birthdate in YYYY-MM-DD format, or null if CURP is invalid
 */
export function extractBirthdateFromCURP(curp: string): string | null {
	if (!curp || curp.trim().length < 10) {
		return null;
	}

	const trimmedCurp = curp.trim().toUpperCase();
	if (trimmedCurp.length < 10) {
		return null;
	}

	// Extract YYMMDD from positions 4-9 (indices 4-9)
	// Position 4-5: Year (YY)
	const yearStr = trimmedCurp.substring(4, 6);
	// Position 6-7: Month (MM)
	const monthStr = trimmedCurp.substring(6, 8);
	// Position 8-9: Day (DD)
	const dayStr = trimmedCurp.substring(8, 10);

	// Validate that these are digits
	if (
		!/^\d{2}$/.test(yearStr) ||
		!/^\d{2}$/.test(monthStr) ||
		!/^\d{2}$/.test(dayStr)
	) {
		return null;
	}

	const year = parseInt(yearStr, 10);
	const month = parseInt(monthStr, 10);
	const day = parseInt(dayStr, 10);

	// Validate month and day ranges
	if (month < 1 || month > 12 || day < 1 || day > 31) {
		return null;
	}

	// Convert 2-digit year to 4-digit year
	// Heuristic: years 00-23 are likely 2000-2023, years 24-99 are likely 1924-1999
	// This is a reasonable assumption for most cases, but not perfect
	const currentYear = new Date().getFullYear();
	const currentCenturyYear = currentYear % 100;
	const fullYear = year <= currentCenturyYear ? 2000 + year : 1900 + year;

	// Format as YYYY-MM-DD
	const monthPadded = month.toString().padStart(2, "0");
	const dayPadded = day.toString().padStart(2, "0");

	return `${fullYear}-${monthPadded}-${dayPadded}`;
}

/**
 * Gets the first letter of a name, handling special characters
 * @param name - The name string
 * @returns The first letter in uppercase, or empty string if name is empty
 */
function getFirstLetter(name: string): string {
	if (!name || name.trim().length === 0) {
		return "";
	}
	const normalized = name.trim().toUpperCase();
	// Handle special characters like Ñ, accented letters
	return normalized.charAt(0);
}

/**
 * Gets the first internal vowel of a name (first vowel after the first letter)
 * @param name - The name string
 * @returns The first internal vowel, or X if none found
 */
function getFirstInternalVowel(name: string): string {
	if (!name || name.trim().length < 2) {
		return "X";
	}
	const normalized = name.trim().toUpperCase();
	const vowels = /[AEIOU]/;

	// Start from position 1 (after first letter)
	for (let i = 1; i < normalized.length; i++) {
		if (vowels.test(normalized[i])) {
			return normalized[i];
		}
	}
	return "X";
}

/**
 * Gets the first internal consonant of a name (first consonant after the first letter)
 * @param name - The name string
 * @returns The first internal consonant, or X if none found
 */
function getFirstInternalConsonant(name: string): string {
	if (!name || name.trim().length < 2) {
		return "X";
	}
	const normalized = name.trim().toUpperCase();
	const consonants = /[BCDFGHJKLMNÑPQRSTVWXYZ]/;

	// Start from position 1 (after first letter)
	for (let i = 1; i < normalized.length; i++) {
		if (consonants.test(normalized[i])) {
			return normalized[i];
		}
	}
	return "X";
}

/**
 * Validates that name initials in CURP match the provided names
 * CURP structure:
 * Position 0: First letter of first last name (apellido paterno)
 * Position 1: First internal vowel of first last name
 * Position 2: First letter of second last name (apellido materno) or 'X'
 * Position 3: First letter of first name (nombre)
 * Position 13: First internal consonant of first last name
 * Position 14: First internal consonant of second last name
 * Position 15: First internal consonant of first name
 * @param curp - The CURP string
 * @param firstName - First name
 * @param lastName - Last name (paterno)
 * @param secondLastName - Second last name (materno), optional
 * @returns Object with isValid boolean and specific error messages
 */
export function validateCURPNameMatch(
	curp: string,
	firstName: string,
	lastName: string,
	secondLastName?: string,
): {
	isValid: boolean;
	errors: {
		firstName?: string;
		lastName?: string;
		secondLastName?: string;
	};
} {
	const errors: {
		firstName?: string;
		lastName?: string;
		secondLastName?: string;
	} = {};

	if (!curp || curp.trim().length < 16) {
		return { isValid: false, errors };
	}

	const trimmedCurp = curp.trim().toUpperCase();
	// Position 0: First letter of first last name
	const curpLastLetter = trimmedCurp[0];
	// Position 1: First internal vowel of first last name
	const curpLastVowel = trimmedCurp[1];
	// Position 2: First letter of second last name or 'X'
	const curpSecondLastLetter = trimmedCurp[2];
	// Position 3: First letter of first name
	const curpFirstNameLetter = trimmedCurp[3];
	// Position 13: First internal consonant of first last name
	const curpLastConsonant = trimmedCurp[13];
	// Position 14: First internal consonant of second last name
	const curpSecondLastConsonant = trimmedCurp[14];
	// Position 15: First internal consonant of first name
	const curpFirstNameConsonant = trimmedCurp[15];

	// Validate first last name (apellido paterno)
	if (lastName && lastName.trim().length > 0) {
		const expectedLastLetter = getFirstLetter(lastName);
		const expectedLastVowel = getFirstInternalVowel(lastName);
		const expectedLastConsonant = getFirstInternalConsonant(lastName);

		if (
			curpLastLetter !== expectedLastLetter ||
			curpLastVowel !== expectedLastVowel ||
			curpLastConsonant !== expectedLastConsonant
		) {
			errors.lastName =
				"El apellido paterno no coincide con el CURP proporcionado";
		}
	}

	// Validate second last name (apellido materno)
	if (secondLastName && secondLastName.trim().length > 0) {
		const expectedSecondLastLetter = getFirstLetter(secondLastName);
		const expectedSecondLastConsonant =
			getFirstInternalConsonant(secondLastName);

		if (
			curpSecondLastLetter !== expectedSecondLastLetter ||
			curpSecondLastConsonant !== expectedSecondLastConsonant
		) {
			errors.secondLastName =
				"El apellido materno no coincide con el CURP proporcionado";
		}
	} else {
		// If no second last name is provided, CURP should have X in position 2
		if (curpSecondLastLetter !== "X") {
			errors.secondLastName =
				"El apellido materno no coincide con el CURP proporcionado";
		}
	}

	// Validate first name (nombre)
	if (firstName && firstName.trim().length > 0) {
		const expectedFirstNameLetter = getFirstLetter(firstName);
		const expectedFirstNameConsonant = getFirstInternalConsonant(firstName);

		if (
			curpFirstNameLetter !== expectedFirstNameLetter ||
			curpFirstNameConsonant !== expectedFirstNameConsonant
		) {
			errors.firstName = "El nombre no coincide con el CURP proporcionado";
		}
	}

	return {
		isValid: Object.keys(errors).length === 0,
		errors,
	};
}

/**
 * Validates that birthdate matches the date in CURP
 * @param curp - The CURP string
 * @param birthDate - Birthdate in YYYY-MM-DD format
 * @returns Object with isValid boolean and error message
 */
export function validateCURPBirthdateMatch(
	curp: string,
	birthDate: string,
): { isValid: boolean; error?: string } {
	if (!curp || curp.trim().length < 10) {
		return { isValid: false, error: "CURP inválido" };
	}

	if (!birthDate || birthDate.trim().length === 0) {
		return { isValid: false, error: "Fecha de nacimiento requerida" };
	}

	const curpBirthdate = extractBirthdateFromCURP(curp);
	if (!curpBirthdate) {
		return { isValid: false, error: "No se pudo extraer la fecha del CURP" };
	}

	// Compare dates (ignore century if CURP uses 2-digit year)
	const curpDate = new Date(curpBirthdate);
	const providedDate = new Date(birthDate);

	// Extract YYMMDD from both dates
	const curpYear = curpDate.getFullYear() % 100;
	const curpMonth = curpDate.getMonth() + 1;
	const curpDay = curpDate.getDate();

	const providedYear = providedDate.getFullYear() % 100;
	const providedMonth = providedDate.getMonth() + 1;
	const providedDay = providedDate.getDate();

	// Compare YY, MM, DD (using 2-digit years for comparison)
	const curpYear2Digit = curpDate.getFullYear() % 100;
	const providedYear2Digit = providedDate.getFullYear() % 100;

	if (
		curpYear2Digit !== providedYear2Digit ||
		curpMonth !== providedMonth ||
		curpDay !== providedDay
	) {
		return {
			isValid: false,
			error: "La fecha de nacimiento no coincide con el CURP proporcionado",
		};
	}

	return { isValid: true };
}
