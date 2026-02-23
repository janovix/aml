"use client";

import { FieldLabel } from "@/components/completeness/FieldLabel";
import { CatalogSelector } from "@/components/catalogs/CatalogSelector";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/components/LanguageProvider";
import type { ExtensionFormProps } from ".";
import { getCatalogCode } from "@/lib/catalog-utils";

export function LoanForm({ value, onChange, disabled }: ExtensionFormProps) {
	function handleChange(
		field: string,
		fieldValue: string | number | boolean | null,
	) {
		onChange({ ...value, [field]: fieldValue });
	}

	const { t } = useLanguage();

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div className="space-y-1">
				<FieldLabel htmlFor="principalAmount" tier="sat_required">
					{t("opFieldPrincipalAmount")}
				</FieldLabel>
				<Input
					id="principalAmount"
					inputMode="decimal"
					value={(value.principalAmount as string) ?? ""}
					onChange={(e) => handleChange("principalAmount", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="interestRate" tier="alert_required">
					{t("opFieldInterestRate")}
				</FieldLabel>
				<Input
					id="interestRate"
					inputMode="decimal"
					value={(value.interestRate as string) ?? ""}
					onChange={(e) => handleChange("interestRate", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="termMonths" tier="alert_required">
					{t("opFieldTermMonths")}
				</FieldLabel>
				<Input
					id="termMonths"
					inputMode="numeric"
					value={(value.termMonths as string) ?? ""}
					onChange={(e) => handleChange("termMonths", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="loanTypeCode" tier="kyc_optional">
					{t("opFieldLoanTypeCode")}
				</FieldLabel>
				<Input
					id="loanTypeCode"
					value={(value.loanTypeCode as string) ?? ""}
					onChange={(e) => handleChange("loanTypeCode", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="guaranteeTypeCode" tier="kyc_optional">
					{t("opFieldGuaranteeTypeCode")}
				</FieldLabel>
				<CatalogSelector
					catalogKey="pld-guarantee-types"
					value={(value.guaranteeTypeCode as string) ?? ""}
					onValueChange={(val) => handleChange("guaranteeTypeCode", val ?? "")}
					placeholder={t("selectPlaceholder")}
					disabled={disabled}
					getOptionValue={getCatalogCode}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="monthlyPayment" tier="kyc_optional">
					{t("opFieldMonthlyPayment")}
				</FieldLabel>
				<Input
					id="monthlyPayment"
					inputMode="decimal"
					value={(value.monthlyPayment as string) ?? ""}
					onChange={(e) => handleChange("monthlyPayment", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="disbursementDate" tier="kyc_optional">
					{t("opFieldDisbursementDate")}
				</FieldLabel>
				<Input
					id="disbursementDate"
					type="date"
					value={(value.disbursementDate as string) ?? ""}
					onChange={(e) => handleChange("disbursementDate", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="maturityDate" tier="kyc_optional">
					{t("opFieldMaturityDate")}
				</FieldLabel>
				<Input
					id="maturityDate"
					type="date"
					value={(value.maturityDate as string) ?? ""}
					onChange={(e) => handleChange("maturityDate", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1 md:col-span-2">
				<FieldLabel htmlFor="guaranteeDescription" tier="kyc_optional">
					{t("opFieldGuaranteeDescription")}
				</FieldLabel>
				<Input
					id="guaranteeDescription"
					value={(value.guaranteeDescription as string) ?? ""}
					onChange={(e) => handleChange("guaranteeDescription", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="guaranteeValue" tier="kyc_optional">
					{t("opFieldGuaranteeValue")}
				</FieldLabel>
				<Input
					id="guaranteeValue"
					inputMode="decimal"
					value={(value.guaranteeValue as string) ?? ""}
					onChange={(e) => handleChange("guaranteeValue", e.target.value)}
					disabled={disabled}
				/>
			</div>
		</div>
	);
}
