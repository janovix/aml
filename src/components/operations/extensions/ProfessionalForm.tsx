"use client";

import { FieldLabel } from "@/components/completeness/FieldLabel";
import { CatalogSelector } from "@/components/catalogs/CatalogSelector";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/components/LanguageProvider";
import type { ExtensionFormProps } from ".";
import { getCatalogCode } from "@/lib/catalog-utils";

export function ProfessionalForm({
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
				<FieldLabel htmlFor="serviceAreaCode" tier="alert_required">
					{t("opFieldServiceAreaCode")}
				</FieldLabel>
				<CatalogSelector
					catalogKey="spr-service-areas"
					value={(value.serviceAreaCode as string) ?? ""}
					onValueChange={(val) => handleChange("serviceAreaCode", val ?? "")}
					placeholder={t("selectPlaceholder")}
					disabled={disabled}
					getOptionValue={getCatalogCode}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="clientFigureCode" tier="kyc_optional">
					{t("opFieldClientFigureCode")}
				</FieldLabel>
				<CatalogSelector
					catalogKey="spr-client-figures"
					value={(value.clientFigureCode as string) ?? ""}
					onValueChange={(val) => handleChange("clientFigureCode", val ?? "")}
					placeholder={t("selectPlaceholder")}
					disabled={disabled}
					getOptionValue={getCatalogCode}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="contributionReasonCode" tier="kyc_optional">
					{t("opFieldContributionReasonCode")}
				</FieldLabel>
				<CatalogSelector
					catalogKey="spr-contribution-reasons"
					value={(value.contributionReasonCode as string) ?? ""}
					onValueChange={(val) =>
						handleChange("contributionReasonCode", val ?? "")
					}
					placeholder={t("selectPlaceholder")}
					disabled={disabled}
					getOptionValue={getCatalogCode}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="assignmentTypeCode" tier="kyc_optional">
					{t("opFieldAssignmentTypeCode")}
				</FieldLabel>
				<CatalogSelector
					catalogKey="spr-assignment-types"
					value={(value.assignmentTypeCode as string) ?? ""}
					onValueChange={(val) => handleChange("assignmentTypeCode", val ?? "")}
					placeholder={t("selectPlaceholder")}
					disabled={disabled}
					getOptionValue={getCatalogCode}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="mergerTypeCode" tier="kyc_optional">
					{t("opFieldMergerTypeCode")}
				</FieldLabel>
				<CatalogSelector
					catalogKey="pld-merger-types"
					value={(value.mergerTypeCode as string) ?? ""}
					onValueChange={(val) => handleChange("mergerTypeCode", val ?? "")}
					placeholder={t("selectPlaceholder")}
					disabled={disabled}
					getOptionValue={getCatalogCode}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="incorporationReasonCode" tier="kyc_optional">
					{t("opFieldIncorporationReasonCode")}
				</FieldLabel>
				<CatalogSelector
					catalogKey="pld-incorporation-reasons"
					value={(value.incorporationReasonCode as string) ?? ""}
					onValueChange={(val) =>
						handleChange("incorporationReasonCode", val ?? "")
					}
					placeholder={t("selectPlaceholder")}
					disabled={disabled}
					getOptionValue={getCatalogCode}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="shareholderPositionCode" tier="kyc_optional">
					{t("opFieldShareholderPositionCode")}
				</FieldLabel>
				<CatalogSelector
					catalogKey="pld-shareholder-positions"
					value={(value.shareholderPositionCode as string) ?? ""}
					onValueChange={(val) =>
						handleChange("shareholderPositionCode", val ?? "")
					}
					placeholder={t("selectPlaceholder")}
					disabled={disabled}
					getOptionValue={getCatalogCode}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="sharePercentage" tier="kyc_optional">
					{t("opFieldSharePercentage")}
				</FieldLabel>
				<Input
					id="sharePercentage"
					inputMode="decimal"
					value={(value.sharePercentage as string) ?? ""}
					onChange={(e) => handleChange("sharePercentage", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="managedAssetTypeCode" tier="kyc_optional">
					{t("opFieldManagedAssetTypeCode")}
				</FieldLabel>
				<CatalogSelector
					catalogKey="spr-managed-asset-types"
					value={(value.managedAssetTypeCode as string) ?? ""}
					onValueChange={(val) =>
						handleChange("managedAssetTypeCode", val ?? "")
					}
					placeholder={t("selectPlaceholder")}
					disabled={disabled}
					getOptionValue={getCatalogCode}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="managementStatusCode" tier="kyc_optional">
					{t("opFieldManagementStatusCode")}
				</FieldLabel>
				<CatalogSelector
					catalogKey="spr-management-status-types"
					value={(value.managementStatusCode as string) ?? ""}
					onValueChange={(val) =>
						handleChange("managementStatusCode", val ?? "")
					}
					placeholder={t("selectPlaceholder")}
					disabled={disabled}
					getOptionValue={getCatalogCode}
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
					getOptionValue={getCatalogCode}
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

			<div className="space-y-1">
				<FieldLabel htmlFor="occupationCode" tier="kyc_optional">
					{t("opFieldOccupationCode")}
				</FieldLabel>
				<CatalogSelector
					catalogKey="spr-occupations"
					value={(value.occupationCode as string) ?? ""}
					onValueChange={(val) => handleChange("occupationCode", val ?? "")}
					placeholder={t("selectPlaceholder")}
					disabled={disabled}
					getOptionValue={getCatalogCode}
				/>
			</div>

			<div className="space-y-1 md:col-span-2">
				<FieldLabel htmlFor="serviceDescription" tier="kyc_optional">
					{t("opFieldServiceDescription")}
				</FieldLabel>
				<Input
					id="serviceDescription"
					value={(value.serviceDescription as string) ?? ""}
					onChange={(e) => handleChange("serviceDescription", e.target.value)}
					disabled={disabled}
				/>
			</div>
		</div>
	);
}
