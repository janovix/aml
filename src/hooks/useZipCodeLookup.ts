import { useState, useEffect, useCallback } from "react";
import { fetchCatalogEntries } from "@/lib/catalogs";
import type { CatalogItem } from "@/types/catalog";

/**
 * Metadata structure for zip code catalog items
 */
export interface ZipCodeMetadata {
	code: string; // Postal code (e.g., "64000")
	settlement: string; // Settlement/neighborhood name
	settlementType: string; // Type of settlement
	municipality: string; // Municipality name
	state: string; // Full state name (e.g., "Nuevo León")
	city: string | null; // City name (may be null)
	stateCode: string | null; // State code (e.g., "NL")
	zone: string | null; // Zone type
}

export interface ZipCodeLookupResult {
	zipCode: string;
	municipality: string;
	state: string;
	city: string;
	stateCode: string;
	settlements: Array<{
		name: string;
		type: string;
	}>;
}

interface UseZipCodeLookupReturn {
	lookup: (zipCode: string) => Promise<ZipCodeLookupResult | null>;
	loading: boolean;
	error: string | null;
}

/**
 * Hook for looking up Mexican postal codes in the zip-codes catalog
 *
 * Returns address information (municipality, state, city) based on postal code.
 * If multiple settlements exist for a zip code, returns all of them.
 */
export function useZipCodeLookup(): UseZipCodeLookupReturn {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const lookup = useCallback(
		async (zipCode: string): Promise<ZipCodeLookupResult | null> => {
			// Validate zip code format (5 digits for Mexico)
			const trimmedZipCode = zipCode.trim();
			if (!/^\d{5}$/.test(trimmedZipCode)) {
				setError("El código postal debe tener 5 dígitos");
				return null;
			}

			setLoading(true);
			setError(null);

			try {
				// Query the catalog by zip code
				// The catalog stores zip codes in metadata.code
				const response = await fetchCatalogEntries("zip-codes", {
					search: trimmedZipCode,
					pageSize: 100, // Get all settlements for this zip code
				});

				// Filter results to exact zip code matches
				const matches = response.data.filter((item) => {
					const metadata = item.metadata as ZipCodeMetadata | undefined;
					return metadata?.code === trimmedZipCode;
				});

				if (matches.length === 0) {
					return null;
				}

				// All entries for the same zip code should have the same municipality, state, city
				// Take the first one as reference
				const firstMatch = matches[0];
				const firstMetadata = firstMatch.metadata as unknown as ZipCodeMetadata;

				// Collect all unique settlements
				const settlements = matches.map((item) => {
					const metadata = item.metadata as unknown as ZipCodeMetadata;
					return {
						name: metadata.settlement,
						type: metadata.settlementType,
					};
				});

				return {
					zipCode: trimmedZipCode,
					municipality: firstMetadata.municipality,
					state: firstMetadata.state,
					city: firstMetadata.city || firstMetadata.municipality, // Fallback to municipality if city is null
					stateCode: firstMetadata.stateCode || "",
					settlements,
				};
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : "Error al buscar código postal";
				setError(errorMessage);
				return null;
			} finally {
				setLoading(false);
			}
		},
		[],
	);

	return {
		lookup,
		loading,
		error,
	};
}
