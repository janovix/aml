import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
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

	// RFC format: Letters + 6 digits (YYMMDD) + 3 alphanumeric characters
	// Physical: 4 letters + 6 digits + 3 alphanumeric (13 total)
	// Moral/Trust: 3 letters + 6 digits + 3 alphanumeric (12 total)
	const letterCount = personType === "physical" ? 4 : 3;
	const lettersPattern = `^[A-ZÑ&]{${letterCount}}`;
	const digitsPattern = `\\d{6}`;
	const alphanumericPattern = `[A-Z0-9Ñ]{3}$`;
	const rfcPattern = new RegExp(
		`${lettersPattern}${digitsPattern}${alphanumericPattern}`,
	);

	if (!rfcPattern.test(trimmedRfc)) {
		return {
			isValid: false,
			error: `RFC no tiene el formato correcto. Debe comenzar con ${letterCount} letras, seguido de 6 dígitos (fecha) y 3 caracteres alfanuméricos`,
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
		const lastNameErrors: string[] = [];

		if (curpLastLetter !== expectedLastLetter) {
			lastNameErrors.push(
				`La inicial del apellido paterno en el CURP (${curpLastLetter}) no coincide con el apellido proporcionado (${expectedLastLetter})`,
			);
		}

		if (curpLastVowel !== expectedLastVowel) {
			lastNameErrors.push(
				`La vocal interna del apellido paterno en el CURP (${curpLastVowel}) no coincide con el apellido proporcionado (${expectedLastVowel})`,
			);
		}

		if (curpLastConsonant !== expectedLastConsonant) {
			lastNameErrors.push(
				`La consonante interna del apellido paterno en el CURP (${curpLastConsonant}) no coincide con el apellido proporcionado (${expectedLastConsonant})`,
			);
		}

		if (lastNameErrors.length > 0) {
			errors.lastName = lastNameErrors.join(". ");
		}
	}

	// Validate second last name (apellido materno)
	if (secondLastName && secondLastName.trim().length > 0) {
		const expectedSecondLastLetter = getFirstLetter(secondLastName);
		const expectedSecondLastConsonant =
			getFirstInternalConsonant(secondLastName);
		const secondLastNameErrors: string[] = [];

		if (curpSecondLastLetter !== expectedSecondLastLetter) {
			secondLastNameErrors.push(
				`La inicial del apellido materno en el CURP (${curpSecondLastLetter}) no coincide con el apellido proporcionado (${expectedSecondLastLetter})`,
			);
		}

		if (curpSecondLastConsonant !== expectedSecondLastConsonant) {
			secondLastNameErrors.push(
				`La consonante interna del apellido materno en el CURP (${curpSecondLastConsonant}) no coincide con el apellido proporcionado (${expectedSecondLastConsonant})`,
			);
		}

		if (secondLastNameErrors.length > 0) {
			errors.secondLastName = secondLastNameErrors.join(". ");
		}
	} else {
		// If no second last name is provided, CURP should have X in position 2
		if (curpSecondLastLetter !== "X") {
			errors.secondLastName = `El CURP indica un apellido materno (${curpSecondLastLetter}), pero no se proporcionó uno`;
		}
	}

	// Validate first name (nombre)
	if (firstName && firstName.trim().length > 0) {
		const expectedFirstNameLetter = getFirstLetter(firstName);
		const expectedFirstNameConsonant = getFirstInternalConsonant(firstName);
		const firstNameErrors: string[] = [];

		if (curpFirstNameLetter !== expectedFirstNameLetter) {
			firstNameErrors.push(
				`La inicial del nombre en el CURP (${curpFirstNameLetter}) no coincide con el nombre proporcionado (${expectedFirstNameLetter})`,
			);
		}

		if (curpFirstNameConsonant !== expectedFirstNameConsonant) {
			firstNameErrors.push(
				`La consonante interna del nombre en el CURP (${curpFirstNameConsonant}) no coincide con el nombre proporcionado (${expectedFirstNameConsonant})`,
			);
		}

		if (firstNameErrors.length > 0) {
			errors.firstName = firstNameErrors.join(". ");
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
		const formattedCurpDate = `${curpDay.toString().padStart(2, "0")}/${curpMonth.toString().padStart(2, "0")}/${curpDate.getFullYear()}`;
		const formattedProvidedDate = `${providedDay.toString().padStart(2, "0")}/${providedMonth.toString().padStart(2, "0")}/${providedDate.getFullYear()}`;
		return {
			isValid: false,
			error: `La fecha de nacimiento en el CURP (${formattedCurpDate}) no coincide con la fecha proporcionada (${formattedProvidedDate})`,
		};
	}

	return { isValid: true };
}
