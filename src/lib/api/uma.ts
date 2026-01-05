import { getUmaServiceBaseUrl } from "./config";
import { fetchJson } from "./http";

/**
 * UMA (Unidad de Medida y Actualización) value entity.
 * This is the official unit of measurement in Mexico used for calculating
 * thresholds in AML regulations.
 */
export interface UmaValue {
	id: string;
	year: number;
	dailyValue: string; // Decimal as string to preserve precision
	effectiveDate: string;
	endDate?: string | null;
	approvedBy?: string | null;
	notes?: string | null;
	active: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface UmaOptions {
	baseUrl?: string;
	signal?: AbortSignal;
	/** JWT token for authentication */
	jwt?: string;
}

/**
 * Fetches the currently active UMA value.
 * This is the value used for threshold calculations in alert rules.
 *
 * @param opts - Optional configuration for the request
 * @returns The active UMA value or null if none is configured
 */
export async function getActiveUmaValue(
	opts?: UmaOptions,
): Promise<UmaValue | null> {
	const baseUrl = opts?.baseUrl ?? getUmaServiceBaseUrl();
	const url = new URL("/api/v1/uma-values/active", baseUrl);

	try {
		const { json } = await fetchJson<UmaValue>(url.toString(), {
			method: "GET",
			cache: "no-store",
			signal: opts?.signal,
			jwt: opts?.jwt,
		});
		return json;
	} catch (error) {
		// Return null if no active UMA value is found (404)
		if (
			error instanceof Error &&
			"status" in error &&
			(error as { status: number }).status === 404
		) {
			return null;
		}
		throw error;
	}
}

/**
 * Calculates the alert threshold in MXN based on the UMA value.
 * The standard threshold for mandatory SAT reporting is 6,420 UMA.
 *
 * @param umaValue - The UMA value entity
 * @param multiplier - The UMA multiplier (default: 6420 for AVISO_OBLIGATORIO)
 * @returns The threshold in MXN
 */
export function calculateUmaThreshold(
	umaValue: UmaValue | null,
	multiplier: number = 6420,
): number {
	if (!umaValue) {
		// Fallback to 2025 UMA value if none configured
		return multiplier * 113.14;
	}
	return multiplier * parseFloat(umaValue.dailyValue);
}
