import { describe, expect, it } from "vitest";
import { getPersonTypeIcon, getPersonTypeStyle } from "./person-type-icon";
import { User, Building2, Landmark } from "lucide-react";
import type { PersonType } from "@/types/client";
import { translations } from "./translations";

describe("getPersonTypeIcon", () => {
	it("returns User icon for physical person type", () => {
		const Icon = getPersonTypeIcon("physical");
		expect(Icon).toBe(User);
	});

	it("returns Building2 icon for moral person type", () => {
		const Icon = getPersonTypeIcon("moral");
		expect(Icon).toBe(Building2);
	});

	it("returns Landmark icon for trust person type", () => {
		const Icon = getPersonTypeIcon("trust");
		expect(Icon).toBe(Landmark);
	});

	it("returns User icon as default for unknown type", () => {
		// TypeScript will prevent invalid types, but we test the default case
		// by using type assertion to simulate an invalid value
		const Icon = getPersonTypeIcon("unknown" as PersonType);
		expect(Icon).toBe(User);
	});
});

describe("getPersonTypeStyle", () => {
	// Translation helper for Spanish
	const t = (key: string) =>
		translations.es[key as keyof typeof translations.es];

	it("returns correct style for physical person type", () => {
		const style = getPersonTypeStyle("physical", t);
		expect(style.label).toBe("Persona Física");
		expect(style.icon).toBe(User);
		expect(style.iconColor).toContain("sky");
	});

	it("returns correct style for moral person type", () => {
		const style = getPersonTypeStyle("moral", t);
		expect(style.label).toBe("Persona Moral");
		expect(style.icon).toBe(Building2);
		expect(style.iconColor).toContain("violet");
	});

	it("returns correct style for trust person type", () => {
		const style = getPersonTypeStyle("trust", t);
		expect(style.label).toBe("Fideicomiso");
		expect(style.icon).toBe(Landmark);
		expect(style.iconColor).toContain("amber");
	});

	it("returns fallback style for unknown type", () => {
		const style = getPersonTypeStyle("unknown" as PersonType, t);
		expect(style.label).toBe("Unknown");
		expect(style.icon).toBe(User);
	});

	it("returns correct style without translation function (default)", () => {
		const style = getPersonTypeStyle("physical");
		expect(style.icon).toBe(User);
		expect(style.iconColor).toContain("sky");
	});
});
