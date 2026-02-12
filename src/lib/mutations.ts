"use client";

import { toast } from "sonner";
import { ApiError, isUsageLimitError, getUsageLimitDetails } from "./api/http";

/**
 * Extracts validation error messages from Zod error format.
 * Zod format is a nested object like: { _errors?: string[], fieldName?: { _errors?: string[] } }
 */
function extractValidationMessages(details: unknown, prefix = ""): string[] {
	if (!details || typeof details !== "object") {
		return [];
	}

	const messages: string[] = [];
	const obj = details as Record<string, unknown>;

	// Check for _errors array (Zod format)
	if (Array.isArray(obj._errors) && obj._errors.length > 0) {
		const fieldLabel = prefix || "Campo";
		obj._errors.forEach((err) => {
			if (typeof err === "string" && err.trim()) {
				messages.push(`${fieldLabel}: ${err}`);
			}
		});
	}

	// Recursively check nested fields
	for (const [key, value] of Object.entries(obj)) {
		if (key === "_errors") continue;
		if (value && typeof value === "object") {
			const fieldLabel = prefix ? `${prefix}.${key}` : key;
			messages.push(...extractValidationMessages(value, fieldLabel));
		}
	}

	return messages;
}

/**
 * Formats validation messages into a user-friendly string.
 * If there's only one error, returns it directly. Otherwise, returns a summary.
 */
function formatValidationMessages(messages: string[]): string {
	if (messages.length === 0) {
		return "Error de validación";
	}

	if (messages.length === 1) {
		return messages[0];
	}

	// For multiple errors, show the first one and indicate there are more
	if (messages.length === 2) {
		return `${messages[0]} y ${messages[1]}`;
	}

	return `${messages[0]} y ${messages.length - 1} error(es) más`;
}

/**
 * Extracts a user-friendly error message from an error.
 * Handles ApiError instances and extracts messages from the API response body.
 * Specifically handles Zod validation errors from aml-svc.
 */
export function extractErrorMessage(error: unknown): string {
	if (error instanceof ApiError) {
		// Try to extract message from API response body
		if (error.body && typeof error.body === "object") {
			const body = error.body as Record<string, unknown>;

			// Check for validation errors in details (Zod format from aml-svc)
			if (body.details && typeof body.details === "object") {
				const validationMessages = extractValidationMessages(body.details);
				if (validationMessages.length > 0) {
					return formatValidationMessages(validationMessages);
				}
			}

			// Fallback to message or error fields
			if (typeof body.message === "string" && body.message.trim()) {
				// If message is just "Validation failed", try to get details
				if (body.message === "Validation failed" && body.details) {
					const validationMessages = extractValidationMessages(body.details);
					if (validationMessages.length > 0) {
						return formatValidationMessages(validationMessages);
					}
				}
				return body.message;
			}
			if (typeof body.error === "string" && body.error.trim()) {
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

/**
 * Builds the auth billing URL for upgrade redirects.
 * Replaces `aml.` in the origin with `auth.` and appends `/settings/billing`.
 */
function getBillingUrl(): string {
	if (typeof window === "undefined") return "/settings/billing";
	return `${window.location.origin.replace("aml.", "auth.")}/settings/billing`;
}

/**
 * Shows a persistent error toast when a usage limit is exceeded.
 * Includes the error message and an upgrade action button.
 */
export function showUsageLimitToast(error: unknown): void {
	const details = getUsageLimitDetails(error);
	const message =
		details?.message ?? "Has alcanzado el límite de uso de tu plan.";

	toast.error(message, {
		duration: 10_000,
		action: {
			label: "Mejorar plan",
			onClick: () => {
				window.open(getBillingUrl(), "_blank", "noopener,noreferrer");
			},
		},
	});
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
	const toastId = toast.loading(loading);

	try {
		const data = await mutation();
		const message = typeof success === "function" ? success(data) : success;
		toast.success(message, { id: toastId });
		if (onSuccess) {
			Promise.resolve(onSuccess(data)).catch((err) => {
				console.error("Error in onSuccess callback:", err);
			});
		}
		return data;
	} catch (err) {
		// Show a special toast with upgrade action for usage limit errors
		if (isUsageLimitError(err)) {
			toast.dismiss(toastId);
			showUsageLimitToast(err);
			throw err;
		}

		const message = error
			? typeof error === "function"
				? error(err)
				: error
			: extractErrorMessage(err);
		toast.error(message, { id: toastId });
		throw err;
	}
}
