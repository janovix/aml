import { describe, it, expect } from "vitest";
import { validatePhone } from "./validate-phone";

describe("validatePhone", () => {
	it("fails when phone is empty", () => {
		const result = validatePhone("");
		expect(result.isValid).toBe(false);
		expect(result.error).toBe("El teléfono es obligatorio");
	});

	it("fails when phone is undefined", () => {
		const result = validatePhone(undefined);
		expect(result.isValid).toBe(false);
		expect(result.error).toBe("El teléfono es obligatorio");
	});

	it("fails for an invalid phone number", () => {
		const result = validatePhone("+52 55555555555555555555");
		expect(result.isValid).toBe(false);
		expect(result.error).toBe("Número de teléfono inválido");
	});

	it("fails for repeated digits pattern", () => {
		const result = validatePhone("+52 5555555555");
		expect(result.isValid).toBe(false);
		expect(result.error).toBe("Número de teléfono no válido");
	});

	it("passes for a valid Mexican phone number", () => {
		const result = validatePhone("+52 5512345678");
		expect(result.isValid).toBe(true);
		expect(result.error).toBeUndefined();
	});

	it("passes for a valid US phone number", () => {
		const result = validatePhone("+1 4155552671");
		expect(result.isValid).toBe(true);
		expect(result.error).toBeUndefined();
	});

	it("passes for a valid phone without spaces (E.164)", () => {
		const result = validatePhone("+525512345678");
		expect(result.isValid).toBe(true);
		expect(result.error).toBeUndefined();
	});
});
