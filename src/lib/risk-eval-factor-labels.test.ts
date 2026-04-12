import { describe, expect, it } from "vitest";
import {
	RISK_EVAL_FACTOR_KEYS,
	riskEvalFactorLabel,
} from "./risk-eval-factor-labels";
import type { TranslationKeys } from "@/lib/translations";

describe("riskEvalFactorLabel", () => {
	const t = (key: TranslationKeys) => `t:${key}`;

	it("uses mapped translation key when factor is known", () => {
		expect(riskEvalFactorLabel("pep_status", t)).toBe(
			"t:riskEvalFactorPepStatus",
		);
	});

	it("humanizes unknown factor names", () => {
		expect(riskEvalFactorLabel("custom_metric_name", t)).toBe(
			"custom metric name",
		);
	});

	it("RISK_EVAL_FACTOR_KEYS covers expected keys", () => {
		expect(RISK_EVAL_FACTOR_KEYS.volume).toBe("riskEvalFactorVolume");
		expect(RISK_EVAL_FACTOR_KEYS.kyc_completeness).toBe(
			"riskEvalFactorKycCompleteness",
		);
	});
});
