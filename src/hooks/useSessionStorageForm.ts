"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const SESSION_STORAGE_PREFIX = "aml_form_draft_";

/**
 * Custom hook for persisting form data in session storage.
 * Data is automatically saved when form values change and restored when
 * the component mounts. Provides a clear function to remove stored data
 * after successful submission.
 *
 * @param key - Unique identifier for the form (e.g., "client_create", "transaction_create")
 * @param initialData - The initial/default form data
 * @returns Tuple of [formData, setFormData, clearStorage]
 */
export function useSessionStorageForm<T extends object>(
	key: string,
	initialData: T,
): [T, React.Dispatch<React.SetStateAction<T>>, () => void] {
	const storageKey = `${SESSION_STORAGE_PREFIX}${key}`;
	const isInitialized = useRef(false);

	// Initialize state with stored data or initial data
	const [formData, setFormData] = useState<T>(() => {
		// Only run on client side
		if (typeof window === "undefined") {
			return initialData;
		}

		try {
			const stored = sessionStorage.getItem(storageKey);
			if (stored) {
				const parsed = JSON.parse(stored) as T;
				// Merge stored data with initial data to handle any new fields
				return { ...initialData, ...parsed };
			}
		} catch (error) {
			console.warn(
				`Failed to parse session storage for key "${storageKey}":`,
				error,
			);
			// Clear corrupted data
			sessionStorage.removeItem(storageKey);
		}
		return initialData;
	});

	// Save to session storage whenever form data changes (but not on initial mount)
	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		// Skip the first render to avoid overwriting stored data
		if (!isInitialized.current) {
			isInitialized.current = true;
			return;
		}

		try {
			sessionStorage.setItem(storageKey, JSON.stringify(formData));
		} catch (error) {
			console.warn(
				`Failed to save to session storage for key "${storageKey}":`,
				error,
			);
		}
	}, [formData, storageKey]);

	// Function to clear session storage (call after successful submission)
	const clearStorage = useCallback(() => {
		if (typeof window === "undefined") {
			return;
		}

		try {
			sessionStorage.removeItem(storageKey);
		} catch (error) {
			console.warn(
				`Failed to clear session storage for key "${storageKey}":`,
				error,
			);
		}
	}, [storageKey]);

	return [formData, setFormData, clearStorage];
}
