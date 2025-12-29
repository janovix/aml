"use client";

import { toast } from "sonner";
import { ApiError } from "./api/http";

/**
 * Extracts a user-friendly error message from an error.
 * Handles ApiError instances and extracts messages from the API response body.
 */
function extractErrorMessage(error: unknown): string {
	if (error instanceof ApiError) {
		// Try to extract message from API response body
		if (error.body && typeof error.body === "object") {
			const body = error.body as Record<string, unknown>;
			if (typeof body.message === "string") {
				return body.message;
			}
			if (typeof body.error === "string") {
				return body.error;
			}
		}
		return error.message || "Ocurrió un error en la solicitud";
	}

	if (error instanceof Error) {
		return error.message;
	}

	return "Ocurrió un error inesperado";
}

export interface MutationOptions<T> {
	/**
	 * The mutation function that returns a promise
	 */
	mutation: () => Promise<T>;
	/**
	 * Loading message to show while the mutation is in progress
	 */
	loading: string;
	/**
	 * Success message to show when the mutation succeeds.
	 * Can be a string or a function that receives the result data.
	 */
	success: string | ((data: T) => string);
	/**
	 * Error message to show when the mutation fails.
	 * If not provided, will extract from the error automatically.
	 */
	error?: string | ((error: unknown) => string);
	/**
	 * Optional callback to execute on success (e.g., navigation)
	 */
	onSuccess?: (data: T) => void | Promise<void>;
}

/**
 * Executes a mutation with Sonner promise toast feedback.
 * Shows loading, success, and error states automatically.
 *
 * @example
 * ```ts
 * await executeMutation({
 *   mutation: () => createClient({ input: clientData }),
 *   loading: "Creando cliente...",
 *   success: "Cliente creado exitosamente",
 *   onSuccess: () => router.push("/clients"),
 * });
 * ```
 */
export async function executeMutation<T>({
	mutation,
	loading,
	success,
	error,
	onSuccess,
}: MutationOptions<T>): Promise<T> {
	const promise = mutation();

	toast.promise(promise, {
		loading,
		success: (data) => {
			const message = typeof success === "function" ? success(data) : success;
			if (onSuccess) {
				// Execute onSuccess callback asynchronously after toast is shown
				Promise.resolve(onSuccess(data)).catch((err) => {
					console.error("Error in onSuccess callback:", err);
				});
			}
			return message;
		},
		error: (err) => {
			if (error) {
				return typeof error === "function" ? error(err) : error;
			}
			return extractErrorMessage(err);
		},
	});

	return promise;
}
