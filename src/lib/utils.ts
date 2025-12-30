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
