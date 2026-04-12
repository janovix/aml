import type { TranslationKeys } from "@/lib/translations";

/** Maps stored factor `name` to i18n keys used in evaluation detail. */
export const RISK_EVAL_FACTOR_KEYS: Record<string, TranslationKeys> = {
	pep_status: "riskEvalFactorPepStatus",
	nationality_risk: "riskEvalFactorNationalityRisk",
	person_type: "riskEvalFactorPersonType",
	screening_result: "riskEvalFactorScreeningResult",
	bc_complexity: "riskEvalFactorBcComplexity",
	client_age: "riskEvalFactorClientAge",
	domicile_state_risk: "riskEvalFactorDomicileStateRisk",
	operation_location_risk: "riskEvalFactorOperationLocationRisk",
	cross_border: "riskEvalFactorCrossBorder",
	country_risk: "riskEvalFactorCountryRisk",
	activity_enr_risk: "riskEvalFactorActivityEnrRisk",
	activity_diversity: "riskEvalFactorActivityDiversity",
	cash_ratio: "riskEvalFactorCashRatio",
	near_threshold_ratio: "riskEvalFactorNearThresholdRatio",
	third_party_ratio: "riskEvalFactorThirdPartyRatio",
	operation_frequency: "riskEvalFactorOperationFrequency",
	volume: "riskEvalFactorVolume",
	kyc_completeness: "riskEvalFactorKycCompleteness",
	documents_verified: "riskEvalFactorDocumentsVerified",
	relationship_length: "riskEvalFactorRelationshipLength",
	regulated_counterparty: "riskEvalFactorRegulatedCounterparty",
};

export function riskEvalFactorLabel(
	factorName: string,
	t: (key: TranslationKeys) => string,
): string {
	const key = RISK_EVAL_FACTOR_KEYS[factorName];
	return key ? t(key) : factorName.replace(/_/g, " ");
}
