"use client";

import { FieldLabel } from "@/components/completeness/FieldLabel";
import { Input } from "@/components/ui/input";
import { CatalogSelector } from "@/components/catalogs/CatalogSelector";
import { useLanguage } from "@/components/LanguageProvider";
import type { ExtensionFormProps } from ".";

export function DevelopmentForm({
	value,
	onChange,
	disabled,
}: ExtensionFormProps) {
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
				<FieldLabel htmlFor="developmentTypeCode" tier="sat_required">
					{t("opFieldDevelopmentTypeCode")}
				</FieldLabel>
				<CatalogSelector
					catalogKey="din-development-types"
					value={(value.developmentTypeCode as string) ?? ""}
					onValueChange={(val) =>
						handleChange("developmentTypeCode", val ?? "")
					}
					placeholder={t("selectPlaceholder")}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="creditTypeCode" tier="kyc_optional">
					{t("opFieldCreditTypeCode")}
				</FieldLabel>
				<CatalogSelector
					catalogKey="din-credit-types"
					value={(value.creditTypeCode as string) ?? ""}
					onValueChange={(val) => handleChange("creditTypeCode", val ?? "")}
					placeholder={t("selectPlaceholder")}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="projectName" tier="kyc_optional">
					{t("opFieldProjectName")}
				</FieldLabel>
				<Input
					id="projectName"
					value={(value.projectName as string) ?? ""}
					onChange={(e) => handleChange("projectName", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="projectLocation" tier="kyc_optional">
					{t("opFieldProjectLocation")}
				</FieldLabel>
				<Input
					id="projectLocation"
					value={(value.projectLocation as string) ?? ""}
					onChange={(e) => handleChange("projectLocation", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="contributionType" tier="kyc_optional">
					{t("opFieldContributionType")}
				</FieldLabel>
				<Input
					id="contributionType"
					value={(value.contributionType as string) ?? ""}
					onChange={(e) => handleChange("contributionType", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="contributionAmount" tier="kyc_optional">
					{t("opFieldContributionAmount")}
				</FieldLabel>
				<Input
					id="contributionAmount"
					value={(value.contributionAmount as string) ?? ""}
					onChange={(e) => handleChange("contributionAmount", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="thirdPartyTypeCode" tier="kyc_optional">
					{t("opFieldThirdPartyTypeCode")}
				</FieldLabel>
				<CatalogSelector
					catalogKey="din-third-party-types"
					value={(value.thirdPartyTypeCode as string) ?? ""}
					onValueChange={(val) => handleChange("thirdPartyTypeCode", val ?? "")}
					placeholder={t("selectPlaceholder")}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="thirdPartyName" tier="kyc_optional">
					{t("opFieldThirdPartyName")}
				</FieldLabel>
				<Input
					id="thirdPartyName"
					value={(value.thirdPartyName as string) ?? ""}
					onChange={(e) => handleChange("thirdPartyName", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="financialInstitutionTypeCode" tier="kyc_optional">
					{t("opFieldFinancialInstitutionType")}
				</FieldLabel>
				<CatalogSelector
					catalogKey="pld-financial-institution-types"
					value={(value.financialInstitutionTypeCode as string) ?? ""}
					onValueChange={(val) =>
						handleChange("financialInstitutionTypeCode", val ?? "")
					}
					placeholder={t("selectPlaceholder")}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="financialInstitutionName" tier="kyc_optional">
					{t("opFieldFinancialInstitutionName")}
				</FieldLabel>
				<Input
					id="financialInstitutionName"
					value={(value.financialInstitutionName as string) ?? ""}
					onChange={(e) =>
						handleChange("financialInstitutionName", e.target.value)
					}
					disabled={disabled}
				/>
			</div>
		</div>
	);
}
