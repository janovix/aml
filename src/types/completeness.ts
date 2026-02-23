/**
 * Three-tier field completeness system for AML operations and clients.
 *
 * RED   (sat_required)   -- Fields mandatory for SAT aviso XML submission (from XSD schemas)
 * YELLOW (alert_required) -- Fields needed for automated alert detection rules (from alert CSV)
 * GREY  (kyc_optional)   -- Additional fields for KYC/AML due diligence (nice to have)
 */

export type FieldTier = "sat_required" | "alert_required" | "kyc_optional";

export interface FieldRequirement {
	/** Dot-separated path, e.g. "client.nombre", "extension.marca_fabricante", "payment.fecha_pago" */
	fieldPath: string;
	/** Which tier this field belongs to */
	tier: FieldTier;
	/** Human-readable label in Spanish */
	label: string;
	/** Original XSD element name, for traceability (RED tier only) */
	xsdElement?: string;
	/** Alert codes that depend on this field (YELLOW tier only) */
	alertCodes?: string[];
}

export interface CompletenessResult {
	/** All RED (SAT-required) fields present? If false, notice cannot be submitted. */
	satReady: boolean;
	/** All YELLOW (alert-required) fields present? If false, automated alert detection is limited. */
	alertReady: boolean;
	/** All GREY (KYC) fields present? */
	fullyEnriched: boolean;
	/** List of missing fields with their requirement metadata */
	missing: Array<{ field: FieldRequirement; value: undefined }>;
	/** Summary counts by tier */
	summary: {
		red: { total: number; filled: number; missing: number };
		yellow: { total: number; filled: number; missing: number };
		grey: { total: number; filled: number; missing: number };
		total: number;
		filled: number;
	};
}

/** Entity type for completeness computation */
export type CompletenessEntityType = "client" | "operation" | "payment";

/** Color configuration for each tier, used across the UI */
export const TIER_COLORS: Record<
	FieldTier,
	{ dot: string; bg: string; text: string; border: string; label: string }
> = {
	sat_required: {
		dot: "bg-red-500",
		bg: "bg-red-50 dark:bg-red-950/50",
		text: "text-red-700 dark:text-red-400",
		border: "border-red-200 dark:border-red-800",
		label: "Requerido para aviso SAT",
	},
	alert_required: {
		dot: "bg-yellow-500",
		bg: "bg-yellow-50 dark:bg-yellow-950/50",
		text: "text-yellow-700 dark:text-yellow-400",
		border: "border-yellow-200 dark:border-yellow-800",
		label: "Necesario para alertas",
	},
	kyc_optional: {
		dot: "bg-gray-400",
		bg: "bg-gray-50 dark:bg-gray-900/50",
		text: "text-gray-600 dark:text-gray-400",
		border: "border-gray-200 dark:border-gray-800",
		label: "KYC complementario",
	},
};

/** Helper text shown next to field labels for each tier */
export const TIER_HELPER_TEXT: Record<FieldTier, string> = {
	sat_required: "Requerido para el aviso ante la SHCP",
	alert_required: "Necesario para detección automática de alertas",
	kyc_optional: "Información complementaria de KYC/PLD",
};
