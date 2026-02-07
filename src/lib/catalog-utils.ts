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
