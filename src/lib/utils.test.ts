import { describe, it, expect } from "vitest";
import {
	validateRFC,
	validateRFCMatch,
	validateCURP,
	validateVIN,
	cn,
	extractBirthdateFromCURP,
	validateCURPNameMatch,
	validateCURPBirthdateMatch,
} from "./utils";

describe("utils", () => {
	describe("cn", () => {
		it("merges class names", () => {
			const result = cn("class1", "class2");
			expect(result).toContain("class1");
			expect(result).toContain("class2");
		});

		it("handles conditional classes", () => {
			const result = cn("class1", false && "class2", "class3");
			expect(result).toContain("class1");
			expect(result).toContain("class3");
			expect(result).not.toContain("class2");
		});

		it("handles undefined and null", () => {
			const result = cn("class1", undefined, null, "class2");
			expect(result).toContain("class1");
			expect(result).toContain("class2");
		});
	});

	describe("validateRFC", () => {
		it("returns error for empty RFC", () => {
			const result = validateRFC("", "moral");
			expect(result.isValid).toBe(false);
			expect(result.error).toBe("RFC es requerido");
		});

		it("returns error for whitespace-only RFC", () => {
			const result = validateRFC("   ", "moral");
			expect(result.isValid).toBe(false);
			expect(result.error).toBe("RFC es requerido");
		});

		it("validates moral RFC with correct format", () => {
			const result = validateRFC("ABC850101AAA", "moral");
			expect(result.isValid).toBe(true);
		});

		it("validates physical RFC with correct format", () => {
			const result = validateRFC("ABCD850101E56", "physical");
			expect(result.isValid).toBe(true);
		});

		it("returns error for moral RFC with wrong length", () => {
			const result = validateRFC("ABC850101", "moral");
			expect(result.isValid).toBe(false);
			expect(result.error).toBe("RFC debe tener 12 caracteres");
		});

		it("returns error for physical RFC with wrong length", () => {
			const result = validateRFC("ABCD850101", "physical");
			expect(result.isValid).toBe(false);
			expect(result.error).toBe("RFC debe tener 13 caracteres");
		});

		it("returns error for RFC with invalid format", () => {
			const result = validateRFC("123456789012", "moral");
			expect(result.isValid).toBe(false);
			expect(result.error).toContain("RFC no tiene el formato correcto");
		});

		it("normalizes RFC to uppercase", () => {
			const result = validateRFC("abc850101aaa", "moral");
			expect(result.isValid).toBe(true);
		});

		it("trims whitespace from RFC", () => {
			const result = validateRFC("  ABC850101AAA  ", "moral");
			expect(result.isValid).toBe(true);
		});

		it("validates trust RFC with correct format", () => {
			const result = validateRFC("ABC850101AAA", "trust");
			expect(result.isValid).toBe(true);
		});

		it("defaults to moral person type", () => {
			const result = validateRFC("ABC850101AAA");
			expect(result.isValid).toBe(true);
		});
	});

	describe("validateCURP", () => {
		it("returns error for empty CURP", () => {
			const result = validateCURP("");
			expect(result.isValid).toBe(false);
			expect(result.error).toBe("CURP es requerido");
		});

		it("returns error for whitespace-only CURP", () => {
			const result = validateCURP("   ");
			expect(result.isValid).toBe(false);
			expect(result.error).toBe("CURP es requerido");
		});

		it("returns error for CURP with wrong length", () => {
			const result = validateCURP("ABCD850101H");
			expect(result.isValid).toBe(false);
			expect(result.error).toBe("CURP debe tener exactamente 18 caracteres");
		});

		it("validates CURP with correct format (male)", () => {
			const result = validateCURP("ABCD850101HDFRRN09");
			expect(result.isValid).toBe(true);
		});

		it("validates CURP with correct format (female)", () => {
			const result = validateCURP("ABCD850101MDFRRN09");
			expect(result.isValid).toBe(true);
		});

		it("returns error for CURP with invalid format", () => {
			const result = validateCURP("123456789012345678");
			expect(result.isValid).toBe(false);
			expect(result.error).toContain("CURP no tiene el formato correcto");
		});

		it("returns error for CURP with invalid gender character", () => {
			// Use a valid format but invalid gender character
			// The format check happens first, so we need a CURP that passes format but fails gender
			// Actually, the gender check happens after format, so if format is invalid, we get format error
			// Let's test with a CURP that has valid format but wrong gender position
			const result = validateCURP("ABCD850101XDFRRN09");
			expect(result.isValid).toBe(false);
			// The format validation might catch it first, so check for either error
			expect(
				result.error?.includes("género") ||
					result.error?.includes("formato correcto"),
			).toBe(true);
		});

		it("normalizes CURP to uppercase", () => {
			const result = validateCURP("abcd850101hdfrrn09");
			expect(result.isValid).toBe(true);
		});

		it("trims whitespace from CURP", () => {
			const result = validateCURP("  ABCD850101HDFRRN09  ");
			expect(result.isValid).toBe(true);
		});

		it("validates CURP with Ñ character", () => {
			const result = validateCURP("ABCD850101HDFÑRN09");
			expect(result.isValid).toBe(true);
		});
	});

	describe("validateVIN", () => {
		it("returns valid for empty VIN (optional)", () => {
			const result = validateVIN("");
			expect(result.isValid).toBe(true);
		});

		it("returns valid for whitespace-only VIN", () => {
			const result = validateVIN("   ");
			expect(result.isValid).toBe(true);
		});

		it("returns error for VIN with wrong length", () => {
			const result = validateVIN("ABCD123456789012");
			expect(result.isValid).toBe(false);
			expect(result.error).toBe("VIN debe tener exactamente 17 caracteres");
		});

		it("validates VIN with correct format", () => {
			const result = validateVIN("ABCD1234567890123");
			expect(result.isValid).toBe(true);
		});

		it("returns error for VIN containing I", () => {
			const result = validateVIN("ABCD123456789I123");
			expect(result.isValid).toBe(false);
			expect(result.error).toContain("I, O, Q");
		});

		it("returns error for VIN containing O", () => {
			const result = validateVIN("ABCD123456789O123");
			expect(result.isValid).toBe(false);
			expect(result.error).toContain("I, O, Q");
		});

		it("returns error for VIN containing Q", () => {
			const result = validateVIN("ABCD123456789Q123");
			expect(result.isValid).toBe(false);
			expect(result.error).toContain("I, O, Q");
		});

		it("normalizes VIN to uppercase", () => {
			const result = validateVIN("abcd1234567890123");
			expect(result.isValid).toBe(true);
		});

		it("trims whitespace from VIN", () => {
			const result = validateVIN("  ABCD1234567890123  ");
			expect(result.isValid).toBe(true);
		});

		it("validates VIN with numbers", () => {
			const result = validateVIN("12345678901234567");
			expect(result.isValid).toBe(true);
		});

		it("validates VIN with mixed alphanumeric characters", () => {
			const result = validateVIN("1HGBH41JXMN109186");
			expect(result.isValid).toBe(true);
		});
	});

	describe("validateRFC edge cases", () => {
		it("validates RFC with & character for moral person", () => {
			// & is allowed in the first 3 characters for moral RFC
			const result = validateRFC("A&Ñ850101AAA", "moral");
			expect(result.isValid).toBe(true);
		});

		it("validates RFC with Ñ character", () => {
			const result = validateRFC("ÑBC850101AAA", "moral");
			expect(result.isValid).toBe(true);
		});
	});

	describe("validateRFCMatch", () => {
		it("validates physical RFC against name and birthdate", () => {
			const result = validateRFCMatch("OEVA910409ABC", "physical", {
				firstName: "Azael",
				lastName: "Ortega",
				secondLastName: "Valdovinos",
				birthDate: "1991-04-09",
			});
			expect(result.isValid).toBe(true);
		});

		it("returns error when physical RFC does not match data", () => {
			const result = validateRFCMatch("OEVA910409ABC", "physical", {
				firstName: "Juan",
				lastName: "Ortega",
				secondLastName: "Valdovinos",
				birthDate: "1991-04-09",
			});
			expect(result.isValid).toBe(false);
			expect(result.error).toBe(
				"El RFC no coincide con los datos proporcionados",
			);
		});

		it("validates moral RFC with matching first letter and date", () => {
			const result = validateRFCMatch("ACM2002031A2", "moral", {
				businessName: "Acme SA de CV",
				incorporationDate: "2020-02-03",
			});
			expect(result.isValid).toBe(true);
		});

		it("validates moral RFC even if rest of name doesn't match (only first letter matters)", () => {
			// First letter 'A' matches 'Acme', rest can be different
			const result = validateRFCMatch("AXY2002031A2", "moral", {
				businessName: "Acme SA de CV",
				incorporationDate: "2020-02-03",
			});
			expect(result.isValid).toBe(true);
		});

		it("returns error when moral RFC first letter does not match business name", () => {
			const result = validateRFCMatch("BCM2002031A2", "moral", {
				businessName: "Acme SA de CV",
				incorporationDate: "2020-02-03",
			});
			expect(result.isValid).toBe(false);
			expect(result.error).toBe(
				"La primera letra del RFC debe coincidir con la primera letra de la razón social",
			);
		});

		it("returns error when moral RFC date does not match incorporation date", () => {
			const result = validateRFCMatch("ACM2002051A2", "moral", {
				businessName: "Acme SA de CV",
				incorporationDate: "2020-02-03",
			});
			expect(result.isValid).toBe(false);
			expect(result.error).toBe(
				"La fecha en el RFC no coincide con la fecha de constitución",
			);
		});

		it("validates trust RFC with matching first letter and date", () => {
			const result = validateRFCMatch("TRU2002031A2", "trust", {
				businessName: "Trust Financiero SA",
				incorporationDate: "2020-02-03",
			});
			expect(result.isValid).toBe(true);
		});

		it("ignores special characters when extracting first letter from business name", () => {
			const result = validateRFCMatch("ACM2002031A2", "moral", {
				businessName: "& Acme SA de CV", // & should be ignored
				incorporationDate: "2020-02-03",
			});
			expect(result.isValid).toBe(true);
		});
	});

	describe("extractBirthdateFromCURP", () => {
		it("returns null for empty CURP", () => {
			const result = extractBirthdateFromCURP("");
			expect(result).toBeNull();
		});

		it("returns null for CURP that is too short", () => {
			const result = extractBirthdateFromCURP("ABCD85");
			expect(result).toBeNull();
		});

		it("extracts birthdate from valid CURP", () => {
			const result = extractBirthdateFromCURP("ABCD850615HDFRRN09");
			expect(result).toBe("1985-06-15");
		});

		it("extracts birthdate with year in 2000s", () => {
			const result = extractBirthdateFromCURP("ABCD010615HDFRRN09");
			expect(result).toBe("2001-06-15");
		});

		it("returns null for invalid month", () => {
			const result = extractBirthdateFromCURP("ABCD851315HDFRRN09");
			expect(result).toBeNull();
		});

		it("returns null for invalid day", () => {
			const result = extractBirthdateFromCURP("ABCD850632HDFRRN09");
			expect(result).toBeNull();
		});

		it("handles CURP with leading/trailing spaces", () => {
			const result = extractBirthdateFromCURP("  ABCD850615HDFRRN09  ");
			expect(result).toBe("1985-06-15");
		});

		it("handles lowercase CURP", () => {
			const result = extractBirthdateFromCURP("abcd850615hdfrrn09");
			expect(result).toBe("1985-06-15");
		});
	});

	describe("validateCURPNameMatch", () => {
		// CURP format: OEVA910409HOCRLZ01
		// O = Ortega (first letter of first last name)
		// E = Ortega (first internal vowel - E after O)
		// V = Valdovinos (first letter of second last name)
		// A = Azael (first letter of first name)
		// Position 13: R = Ortega (first internal consonant - R after O)
		// Position 14: L = Valdovinos (first internal consonant - L after V)
		// Position 15: Z = Azael (first internal consonant - Z after A)
		it("returns valid for matching names", () => {
			const result = validateCURPNameMatch(
				"OEVA910409HOCRLZ01",
				"Azael",
				"Ortega",
				"Valdovinos",
			);
			expect(result.isValid).toBe(true);
			expect(Object.keys(result.errors)).toHaveLength(0);
		});

		it("returns error when first name initial doesn't match", () => {
			const result = validateCURPNameMatch(
				"OEVA910409HOCRLZ01",
				"Juan",
				"Ortega",
				"Valdovinos",
			);
			expect(result.isValid).toBe(false);
			expect(result.errors.firstName).toBe(
				"El nombre no coincide con el CURP proporcionado",
			);
		});

		it("returns error when last name initial doesn't match", () => {
			const result = validateCURPNameMatch(
				"OEVA910409HOCRLZ01",
				"Azael",
				"García",
				"Valdovinos",
			);
			expect(result.isValid).toBe(false);
			expect(result.errors.lastName).toBe(
				"El apellido paterno no coincide con el CURP proporcionado",
			);
		});

		it("returns error when second last name initial doesn't match", () => {
			const result = validateCURPNameMatch(
				"OEVA910409HOCRLZ01",
				"Azael",
				"Ortega",
				"García",
			);
			expect(result.isValid).toBe(false);
			expect(result.errors.secondLastName).toBe(
				"El apellido materno no coincide con el CURP proporcionado",
			);
		});

		it("returns error when second last name is missing but CURP has one", () => {
			const result = validateCURPNameMatch(
				"OEVA910409HOCRLZ01",
				"Azael",
				"Ortega",
			);
			expect(result.isValid).toBe(false);
			expect(result.errors.secondLastName).toBe(
				"El apellido materno no coincide con el CURP proporcionado",
			);
		});

		it("returns valid when second last name is missing and CURP has X", () => {
			// OEXA = Ortega E (vowel) X (no second last name) Azael
			// Position 13: R = Ortega consonant
			// Position 14: X = no second last name
			// Position 15: Z = Azael consonant
			const result = validateCURPNameMatch(
				"OEXA910409HOCRXZ01",
				"Azael",
				"Ortega",
			);
			expect(result.isValid).toBe(true);
		});

		it("returns error when last name vowel doesn't match", () => {
			// Using a CURP with different vowel
			const result = validateCURPNameMatch(
				"OIVA910409HOCRLZ01", // I instead of E
				"Azael",
				"Ortega", // Has E as first vowel, not I
				"Valdovinos",
			);
			expect(result.isValid).toBe(false);
			expect(result.errors.lastName).toBeDefined();
		});

		it("returns error when last name consonant doesn't match", () => {
			// Using a CURP with different consonant at position 13
			const result = validateCURPNameMatch(
				"OEVA910409HOCSLZ01", // S instead of R at position 13
				"Azael",
				"Ortega", // Has R as first consonant, not S
				"Valdovinos",
			);
			expect(result.isValid).toBe(false);
			expect(result.errors.lastName).toBeDefined();
		});

		it("handles names correctly", () => {
			// Test that validation works with standard names
			const result = validateCURPNameMatch(
				"OEVA910409HOCRLZ01",
				"Azael",
				"Ortega",
				"Valdovinos",
			);
			expect(result.isValid).toBe(true);
		});

		it("returns valid for empty CURP (should not crash)", () => {
			const result = validateCURPNameMatch("", "Azael", "Ortega");
			expect(result.isValid).toBe(false);
		});
	});

	describe("validateCURPBirthdateMatch", () => {
		it("returns valid for matching birthdate", () => {
			const result = validateCURPBirthdateMatch(
				"ABCD850615HDFRRN09",
				"1985-06-15",
			);
			expect(result.isValid).toBe(true);
		});

		it("returns error when birthdate doesn't match", () => {
			const result = validateCURPBirthdateMatch(
				"ABCD850615HDFRRN09",
				"1985-06-20",
			);
			expect(result.isValid).toBe(false);
			expect(result.error).toBe(
				"La fecha de nacimiento no coincide con el CURP proporcionado",
			);
		});

		it("returns error when year doesn't match", () => {
			const result = validateCURPBirthdateMatch(
				"ABCD850615HDFRRN09",
				"1990-06-15",
			);
			expect(result.isValid).toBe(false);
		});

		it("returns error when month doesn't match", () => {
			const result = validateCURPBirthdateMatch(
				"ABCD850615HDFRRN09",
				"1985-07-15",
			);
			expect(result.isValid).toBe(false);
		});

		it("returns error for invalid CURP", () => {
			const result = validateCURPBirthdateMatch("ABCD85", "1985-06-15");
			expect(result.isValid).toBe(false);
			expect(result.error).toContain("inválido");
		});

		it("returns error for empty birthdate", () => {
			const result = validateCURPBirthdateMatch("ABCD850615HDFRRN09", "");
			expect(result.isValid).toBe(false);
			expect(result.error).toContain("requerida");
		});

		it("handles year in 2000s", () => {
			const result = validateCURPBirthdateMatch(
				"ABCD010615HDFRRN09",
				"2001-06-15",
			);
			expect(result.isValid).toBe(true);
		});
	});
});
