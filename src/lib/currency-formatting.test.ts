import { describe, it, expect } from "vitest";
import {
	getDecimalPlaces,
	formatCurrencyAmount,
	parseCurrencyAmount,
	isValidCurrencyAmount,
} from "./currency-formatting";
import type { CatalogItem } from "@/types/catalog";

describe("getDecimalPlaces", () => {
	it("returns decimalPlaces from catalog metadata when available", () => {
		const item = {
			metadata: { decimalPlaces: 3 },
		} as unknown as CatalogItem;
		expect(getDecimalPlaces("USD", item)).toBe(3);
	});

	it("returns decimalPlaces 0 from catalog metadata", () => {
		const item = {
			metadata: { decimalPlaces: 0 },
		} as unknown as CatalogItem;
		expect(getDecimalPlaces("USD", item)).toBe(0);
	});

	it("ignores catalog metadata when decimalPlaces is not a number", () => {
		const item = {
			metadata: { decimalPlaces: "two" },
		} as unknown as CatalogItem;
		expect(getDecimalPlaces("USD", item)).toBe(2);
	});

	it("ignores null catalog item", () => {
		expect(getDecimalPlaces("USD", null)).toBe(2);
	});

	it("ignores undefined catalog item", () => {
		expect(getDecimalPlaces("USD", undefined)).toBe(2);
	});

	it("ignores catalog item without metadata", () => {
		const item = {} as CatalogItem;
		expect(getDecimalPlaces("USD", item)).toBe(2);
	});

	it("returns 0 for zero-decimal currencies", () => {
		const zeroCurrencies = [
			"BIF",
			"CLP",
			"DJF",
			"GNF",
			"ISK",
			"JPY",
			"KMF",
			"KRW",
			"PYG",
			"RWF",
			"UGX",
			"VND",
			"VUV",
			"XAF",
			"XOF",
			"XPF",
		];
		for (const code of zeroCurrencies) {
			expect(getDecimalPlaces(code)).toBe(0);
		}
	});

	it("returns 3 for three-decimal currencies", () => {
		const threeCurrencies = ["BHD", "IQD", "JOD", "KWD", "LYD", "OMR", "TND"];
		for (const code of threeCurrencies) {
			expect(getDecimalPlaces(code)).toBe(3);
		}
	});

	it("returns 2 for common currencies (default)", () => {
		expect(getDecimalPlaces("USD")).toBe(2);
		expect(getDecimalPlaces("MXN")).toBe(2);
		expect(getDecimalPlaces("EUR")).toBe(2);
		expect(getDecimalPlaces("GBP")).toBe(2);
	});

	it("returns 2 for unknown currency codes", () => {
		expect(getDecimalPlaces("XYZ")).toBe(2);
		expect(getDecimalPlaces("")).toBe(2);
	});

	it("prioritizes catalog metadata over hardcoded fallback", () => {
		// JPY is hardcoded as 0, but catalog says 2
		const item = {
			metadata: { decimalPlaces: 2 },
		} as unknown as CatalogItem;
		expect(getDecimalPlaces("JPY", item)).toBe(2);
	});
});

describe("formatCurrencyAmount", () => {
	it("formats with 2 decimal places", () => {
		expect(formatCurrencyAmount("1234.5", 2)).toBe("1,234.50");
	});

	it("formats with 0 decimal places", () => {
		expect(formatCurrencyAmount("1234", 0)).toBe("1,234");
	});

	it("formats with 3 decimal places", () => {
		expect(formatCurrencyAmount("1234.5", 3)).toBe("1,234.500");
	});

	it("formats integer amounts with decimal places", () => {
		expect(formatCurrencyAmount("1000", 2)).toBe("1,000.00");
	});

	it("accepts number input", () => {
		expect(formatCurrencyAmount(1234.56, 2)).toBe("1,234.56");
	});

	it("returns empty string for NaN", () => {
		expect(formatCurrencyAmount("abc", 2)).toBe("");
	});

	it("returns empty string for empty string", () => {
		expect(formatCurrencyAmount("", 2)).toBe("");
	});

	it("formats zero correctly", () => {
		expect(formatCurrencyAmount("0", 2)).toBe("0.00");
		expect(formatCurrencyAmount(0, 2)).toBe("0.00");
	});

	it("handles large numbers", () => {
		expect(formatCurrencyAmount("1000000.99", 2)).toBe("1,000,000.99");
	});

	it("truncates extra decimals", () => {
		expect(formatCurrencyAmount("1234.5678", 2)).toBe("1,234.57");
	});
});

describe("parseCurrencyAmount", () => {
	it("removes commas from formatted amount", () => {
		expect(parseCurrencyAmount("1,234.56")).toBe("1234.56");
	});

	it("removes spaces from formatted amount", () => {
		expect(parseCurrencyAmount("1 234.56")).toBe("1234.56");
	});

	it("handles plain number strings", () => {
		expect(parseCurrencyAmount("1234.56")).toBe("1234.56");
	});

	it("returns empty string for empty input", () => {
		expect(parseCurrencyAmount("")).toBe("");
	});

	it("returns empty string for just a minus sign", () => {
		expect(parseCurrencyAmount("-")).toBe("");
	});

	it("returns empty string for NaN input", () => {
		expect(parseCurrencyAmount("abc")).toBe("");
	});

	it("handles integer amounts", () => {
		expect(parseCurrencyAmount("1,000")).toBe("1000");
	});

	it("handles zero", () => {
		expect(parseCurrencyAmount("0")).toBe("0");
	});

	it("preserves decimals", () => {
		expect(parseCurrencyAmount("0.50")).toBe("0.50");
	});
});

describe("isValidCurrencyAmount", () => {
	it("allows empty string", () => {
		expect(isValidCurrencyAmount("", 2)).toBe(true);
	});

	it("allows minus sign only", () => {
		expect(isValidCurrencyAmount("-", 2)).toBe(true);
	});

	it("validates integers for 0 decimal places", () => {
		expect(isValidCurrencyAmount("1234", 0)).toBe(true);
		expect(isValidCurrencyAmount("1234.5", 0)).toBe(false);
	});

	it("validates amounts with 2 decimal places", () => {
		expect(isValidCurrencyAmount("1234", 2)).toBe(true);
		expect(isValidCurrencyAmount("1234.5", 2)).toBe(true);
		expect(isValidCurrencyAmount("1234.56", 2)).toBe(true);
		expect(isValidCurrencyAmount("1234.567", 2)).toBe(false);
	});

	it("validates amounts with 3 decimal places", () => {
		expect(isValidCurrencyAmount("1234.567", 3)).toBe(true);
		expect(isValidCurrencyAmount("1234.5678", 3)).toBe(false);
	});

	it("rejects non-numeric input", () => {
		expect(isValidCurrencyAmount("abc", 2)).toBe(false);
	});

	it("allows negative numbers", () => {
		expect(isValidCurrencyAmount("-1234.56", 2)).toBe(true);
		expect(isValidCurrencyAmount("-1234", 0)).toBe(true);
	});

	it("handles commas in input (strips them)", () => {
		expect(isValidCurrencyAmount("1,234.56", 2)).toBe(true);
		expect(isValidCurrencyAmount("1,234", 0)).toBe(true);
	});

	it("allows amount with no decimal part after dot", () => {
		expect(isValidCurrencyAmount("1234.", 2)).toBe(true);
	});
});
