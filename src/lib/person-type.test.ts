import { describe, expect, it } from "vitest";
import { getPersonTypeDisplay, getPersonTypeLabel } from "./person-type";

describe("person-type helpers", () => {
	it("returns the proper label and helper for a known type", () => {
		expect(getPersonTypeDisplay("physical")).toEqual({
			label: "Persona Física",
			helper:
				"Este valor se define al dar de alta al cliente y no se puede modificar desde esta vista.",
		});
		expect(getPersonTypeLabel("moral")).toBe("Persona Moral");
	});

	it("returns proper label for trust type", () => {
		expect(getPersonTypeDisplay("trust")).toEqual({
			label: "Fideicomiso",
			helper:
				"Este valor se define al dar de alta al cliente y no se puede modificar desde esta vista.",
		});
		expect(getPersonTypeLabel("trust")).toBe("Fideicomiso");
	});

	it("returns proper label for moral type", () => {
		expect(getPersonTypeDisplay("moral")).toEqual({
			label: "Persona Moral",
			helper:
				"Este valor se define al dar de alta al cliente y no se puede modificar desde esta vista.",
		});
		expect(getPersonTypeLabel("moral")).toBe("Persona Moral");
	});

	it("falls back to the unavailable copy when no type is provided", () => {
		expect(getPersonTypeDisplay(undefined)).toEqual({
			label: "Tipo no disponible",
			helper:
				"No se pudo determinar el tipo de persona del cliente. Vuelve a cargar la página o contacta a soporte.",
		});
		expect(getPersonTypeLabel(null)).toBe("Tipo no disponible");
		expect(getPersonTypeLabel(undefined)).toBe("Tipo no disponible");
	});
});
