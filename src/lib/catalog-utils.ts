import type { CatalogItem } from "@/types/catalog";

/**
 * Helper function to extract the code value from a catalog item.
 * This is used with CatalogSelector's getOptionValue prop to ensure
 * that catalog codes (from metadata.code) are used instead of UUIDs.
 *
 * @param option - The catalog item
 * @returns The code from metadata.code, or the item's id as fallback
 */
export function getCatalogCode(option: CatalogItem): string {
	const metadata = option.metadata as { code?: string } | undefined;
	return metadata?.code || option.id;
}

/**
 * Helper function to extract the currency short name (ISO code) from a catalog item.
 * This is used with CatalogSelector's getOptionValue prop for currencies to ensure
 * that ISO currency codes (from metadata.shortName) are used instead of UUIDs.
 *
 * @param option - The catalog item
 * @returns The shortName from metadata.shortName (e.g., "MXN", "USD"), or the item's id as fallback
 */
export function getCurrencyCode(option: CatalogItem): string {
	const metadata = option.metadata as { shortName?: string } | undefined;
	return metadata?.shortName || option.id;
}

/**
 * Helper function to extract the name from a catalog item.
 * This is used with CatalogSelector's getOptionValue prop for catalogs that allow
 * custom values (like banks) to ensure that names are stored instead of UUIDs.
 * This makes the stored value human-readable and consistent with custom entries.
 *
 * @param option - The catalog item
 * @returns The name of the catalog item
 */
export function getCatalogName(option: CatalogItem): string {
	return option.name;
}
