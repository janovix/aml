/**
 * Currency Formatting Utilities
 *
 * Provides functions for formatting currency amounts based on their decimal places.
 */

import type { CatalogItem } from "@/types/catalog";

/**
 * Get the number of decimal places for a currency
 * @param currencyCode - ISO 4217 currency code (e.g., "USD", "JPY", "KWD")
 * @param catalogItem - Optional catalog item with metadata
 * @returns Number of decimal places (0, 2, or 3)
 */
export function getDecimalPlaces(
	currencyCode: string,
	catalogItem?: CatalogItem | null,
): number {
	// Try to get from catalog metadata first
	if (catalogItem?.metadata) {
		const metadata = catalogItem.metadata as {
			decimalPlaces?: number;
		};
		if (typeof metadata.decimalPlaces === "number") {
			return metadata.decimalPlaces;
		}
	}

	// Fallback to hardcoded map for common currencies
	const zeroDecimalCurrencies = [
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

	const threeDecimalCurrencies = [
		"BHD",
		"IQD",
		"JOD",
		"KWD",
		"LYD",
		"OMR",
		"TND",
	];

	if (zeroDecimalCurrencies.includes(currencyCode)) {
		return 0;
	}

	if (threeDecimalCurrencies.includes(currencyCode)) {
		return 3;
	}

	// Default: 2 decimal places (most currencies)
	return 2;
}

/**
 * Format a currency amount with proper decimal places
 * @param amount - The amount to format (as string or number)
 * @param decimalPlaces - Number of decimal places
 * @returns Formatted amount string
 */
export function formatCurrencyAmount(
	amount: string | number,
	decimalPlaces: number,
): string {
	const num = typeof amount === "string" ? parseFloat(amount) : amount;

	if (isNaN(num)) {
		return "";
	}

	return num.toLocaleString("en-US", {
		minimumFractionDigits: decimalPlaces,
		maximumFractionDigits: decimalPlaces,
		useGrouping: true,
	});
}

/**
 * Parse a formatted currency string back to a plain number string
 * @param formattedAmount - The formatted amount (e.g., "1,234.56")
 * @returns Plain number string (e.g., "1234.56")
 */
export function parseCurrencyAmount(formattedAmount: string): string {
	// Remove all commas and spaces
	const cleaned = formattedAmount.replace(/[,\s]/g, "");

	// Validate it's a valid number
	if (cleaned === "" || cleaned === "-") {
		return "";
	}

	const num = parseFloat(cleaned);
	if (isNaN(num)) {
		return "";
	}

	return cleaned;
}

/**
 * Validate if a string is a valid currency amount
 * @param value - The value to validate
 * @param decimalPlaces - Number of decimal places allowed
 * @returns True if valid
 */
export function isValidCurrencyAmount(
	value: string,
	decimalPlaces: number,
): boolean {
	if (value === "" || value === "-") {
		return true; // Allow empty or negative sign
	}

	// Remove commas for validation
	const cleaned = value.replace(/,/g, "");

	// Check if it matches a valid number pattern
	const pattern =
		decimalPlaces === 0
			? /^-?\d+$/
			: new RegExp(`^-?\\d+(\\.\\d{0,${decimalPlaces}})?$`);

	return pattern.test(cleaned);
}
