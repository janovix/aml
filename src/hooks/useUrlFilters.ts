"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useEffect } from "react";

/**
 * Allowed filter value types
 */
type FilterValue = string | number | boolean | string[] | null | undefined;

/**
 * Filter state object
 */
type FilterState = Record<string, FilterValue>;

/**
 * Serialization config
 */
interface UseUrlFiltersConfig {
	/**
	 * Allowed filter keys - only these will be read/written from URL
	 * This prevents arbitrary parameters from being processed
	 */
	allowedKeys: string[];

	/**
	 * Key prefix for URL params (e.g., "f_" -> "f_status=active")
	 * Helps avoid collisions with other URL params
	 */
	prefix?: string;

	/**
	 * Maximum length for string values (security measure)
	 * @default 256
	 */
	maxValueLength?: number;

	/**
	 * Maximum number of array items
	 * @default 50
	 */
	maxArrayItems?: number;

	/**
	 * Whether to replace or push to history
	 * @default "replace"
	 */
	historyMode?: "replace" | "push";

	/**
	 * Debounce delay in ms for URL updates
	 * @default 300
	 */
	debounceMs?: number;
}

/**
 * Sanitize a string value
 */
function sanitizeString(value: string, maxLength: number): string {
	// Trim and limit length
	const trimmed = String(value).trim().slice(0, maxLength);
	// Remove any null bytes or control characters
	return trimmed.replace(/[\x00-\x1F\x7F]/g, "");
}

/**
 * Validate and sanitize a filter value
 */
function sanitizeValue(
	value: string | null,
	maxValueLength: number,
	maxArrayItems: number,
): FilterValue {
	if (value === null || value === undefined || value === "") {
		return undefined;
	}

	// Try to parse as JSON for arrays/objects
	if (value.startsWith("[")) {
		try {
			const parsed = JSON.parse(value);
			if (Array.isArray(parsed)) {
				return parsed
					.slice(0, maxArrayItems)
					.map((v) => sanitizeString(String(v), maxValueLength))
					.filter(Boolean);
			}
		} catch {
			// Not valid JSON, treat as string
		}
	}

	// Boolean values
	if (value === "true") return true;
	if (value === "false") return false;

	// Numeric values (only if purely numeric)
	if (/^-?\d+(\.\d+)?$/.test(value)) {
		const num = Number(value);
		if (!Number.isNaN(num) && Number.isFinite(num)) {
			return num;
		}
	}

	// Default to sanitized string
	return sanitizeString(value, maxValueLength);
}

/**
 * Serialize a filter value for URL
 */
function serializeValue(value: FilterValue): string | null {
	if (value === null || value === undefined) {
		return null;
	}

	if (Array.isArray(value)) {
		if (value.length === 0) return null;
		return JSON.stringify(value);
	}

	if (typeof value === "boolean") {
		return value.toString();
	}

	if (typeof value === "number") {
		return value.toString();
	}

	const str = String(value).trim();
	return str === "" ? null : str;
}

/**
 * Hook for persisting filter state in URL search params
 *
 * Features:
 * - Whitelisted keys only (security)
 * - Value sanitization (prevents XSS/injection)
 * - Debounced URL updates (performance)
 * - Type-safe serialization/deserialization
 */
export function useUrlFilters<T extends FilterState>(
	config: UseUrlFiltersConfig,
): {
	filters: Partial<T>;
	setFilters: (filters: Partial<T>) => void;
	setFilter: <K extends keyof T>(key: K, value: T[K]) => void;
	clearFilters: () => void;
	isFiltered: boolean;
} {
	const {
		allowedKeys,
		prefix = "",
		maxValueLength = 256,
		maxArrayItems = 50,
		historyMode = "replace",
		debounceMs = 300,
	} = config;

	const searchParams = useSearchParams();
	const pathname = usePathname();
	const router = useRouter();
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const pendingFiltersRef = useRef<Partial<T> | null>(null);

	// Parse filters from URL
	const filters = useMemo(() => {
		const result: Partial<T> = {};

		for (const key of allowedKeys) {
			const paramKey = prefix + key;
			const rawValue = searchParams.get(paramKey);

			if (rawValue !== null) {
				const sanitized = sanitizeValue(
					rawValue,
					maxValueLength,
					maxArrayItems,
				);
				if (sanitized !== undefined) {
					(result as Record<string, FilterValue>)[key] = sanitized;
				}
			}
		}

		return result;
	}, [searchParams, allowedKeys, prefix, maxValueLength, maxArrayItems]);

	// Check if any filters are active
	const isFiltered = useMemo(() => {
		return Object.keys(filters).length > 0;
	}, [filters]);

	// Update URL with new filters (debounced)
	const updateUrl = useCallback(
		(newFilters: Partial<T>) => {
			// Clear any pending update
			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
			}

			pendingFiltersRef.current = newFilters;

			debounceRef.current = setTimeout(() => {
				const params = new URLSearchParams(searchParams.toString());

				// Remove all filter params first
				for (const key of allowedKeys) {
					params.delete(prefix + key);
				}

				// Add new filter params
				const filtersToApply = pendingFiltersRef.current ?? newFilters;
				for (const [key, value] of Object.entries(filtersToApply)) {
					if (!allowedKeys.includes(key)) continue;

					const serialized = serializeValue(value as FilterValue);
					if (serialized !== null) {
						params.set(prefix + key, serialized);
					}
				}

				const newUrl = params.toString()
					? `${pathname}?${params.toString()}`
					: pathname;

				if (historyMode === "replace") {
					router.replace(newUrl, { scroll: false });
				} else {
					router.push(newUrl, { scroll: false });
				}

				pendingFiltersRef.current = null;
			}, debounceMs);
		},
		[
			searchParams,
			pathname,
			router,
			allowedKeys,
			prefix,
			historyMode,
			debounceMs,
		],
	);

	// Set all filters at once
	const setFilters = useCallback(
		(newFilters: Partial<T>) => {
			updateUrl(newFilters);
		},
		[updateUrl],
	);

	// Set a single filter
	const setFilter = useCallback(
		<K extends keyof T>(key: K, value: T[K]) => {
			const newFilters = { ...filters, [key]: value };

			// Remove undefined/null values
			if (value === undefined || value === null || value === "") {
				delete (newFilters as Record<string, unknown>)[key as string];
			}

			updateUrl(newFilters);
		},
		[filters, updateUrl],
	);

	// Clear all filters
	const clearFilters = useCallback(() => {
		updateUrl({} as Partial<T>);
	}, [updateUrl]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
			}
		};
	}, []);

	return {
		filters,
		setFilters,
		setFilter,
		clearFilters,
		isFiltered,
	};
}

/**
 * Create a typed useUrlFilters hook for a specific filter shape
 */
export function createUrlFiltersHook<T extends FilterState>(
	config: Omit<UseUrlFiltersConfig, "allowedKeys"> & {
		allowedKeys: (keyof T)[];
	},
) {
	return function useTypedUrlFilters() {
		return useUrlFilters<T>({
			...config,
			allowedKeys: config.allowedKeys as string[],
		});
	};
}
