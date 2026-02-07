"use client";

import { FieldLabel } from "@/components/completeness/FieldLabel";
import { CatalogSelector } from "@/components/catalogs/CatalogSelector";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/components/LanguageProvider";
import type { ExtensionFormProps } from ".";
import { getCatalogCode } from "@/lib/catalog-utils";

export function OfficialForm({
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
				<FieldLabel htmlFor="actTypeCode" tier="sat_required">
					{t("opFieldActTypeCode")}
				</FieldLabel>
				<CatalogSelector
					catalogKey="fes-act-types"
					value={(value.actTypeCode as string) ?? ""}
					onValueChange={(val) => handleChange("actTypeCode", val ?? "")}
					placeholder={t("selectPlaceholder")}
					disabled={disabled}
					getOptionValue={getCatalogCode}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="instrumentNumber" tier="kyc_optional">
					{t("opFieldInstrumentNumber")}
				</FieldLabel>
				<Input
					id="instrumentNumber"
					value={(value.instrumentNumber as string) ?? ""}
					onChange={(e) => handleChange("instrumentNumber", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="instrumentDate" tier="kyc_optional">
					{t("opFieldInstrumentDate")}
				</FieldLabel>
				<Input
					id="instrumentDate"
					type="date"
					value={(value.instrumentDate as string) ?? ""}
					onChange={(e) => handleChange("instrumentDate", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="trustTypeCode" tier="kyc_optional">
					{t("opFieldTrustTypeCode")}
				</FieldLabel>
				<CatalogSelector
					catalogKey="fep-trust-types"
					value={(value.trustTypeCode as string) ?? ""}
					onValueChange={(val) => handleChange("trustTypeCode", val ?? "")}
					placeholder={t("selectPlaceholder")}
					disabled={disabled}
					getOptionValue={getCatalogCode}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="trustIdentifier" tier="kyc_optional">
					{t("opFieldTrustIdentifier")}
				</FieldLabel>
				<Input
					id="trustIdentifier"
					value={(value.trustIdentifier as string) ?? ""}
					onChange={(e) => handleChange("trustIdentifier", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="trustPurpose" tier="kyc_optional">
					{t("opFieldTrustPurpose")}
				</FieldLabel>
				<Input
					id="trustPurpose"
					value={(value.trustPurpose as string) ?? ""}
					onChange={(e) => handleChange("trustPurpose", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="movementTypeCode" tier="kyc_optional">
					{t("opFieldMovementTypeCode")}
				</FieldLabel>
				<CatalogSelector
					catalogKey="fep-movement-types"
					value={(value.movementTypeCode as string) ?? ""}
					onValueChange={(val) => handleChange("movementTypeCode", val ?? "")}
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
					catalogKey="fep-assignment-types"
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
				<FieldLabel htmlFor="patrimonyModificationTypeCode" tier="kyc_optional">
					{t("opFieldPatrimonyModificationType")}
				</FieldLabel>
				<CatalogSelector
					catalogKey="pld-patrimony-modification-types"
					value={(value.patrimonyModificationTypeCode as string) ?? ""}
					onValueChange={(val) =>
						handleChange("patrimonyModificationTypeCode", val ?? "")
					}
					placeholder={t("selectPlaceholder")}
					disabled={disabled}
					getOptionValue={getCatalogCode}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="powerOfAttorneyTypeCode" tier="kyc_optional">
					{t("opFieldPowerOfAttorneyType")}
				</FieldLabel>
				<CatalogSelector
					catalogKey="pld-power-of-attorney-types"
					value={(value.powerOfAttorneyTypeCode as string) ?? ""}
					onValueChange={(val) =>
						handleChange("powerOfAttorneyTypeCode", val ?? "")
					}
					placeholder={t("selectPlaceholder")}
					disabled={disabled}
					getOptionValue={getCatalogCode}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="grantingTypeCode" tier="kyc_optional">
					{t("opFieldGrantingTypeCode")}
				</FieldLabel>
				<CatalogSelector
					catalogKey="pld-granting-types"
					value={(value.grantingTypeCode as string) ?? ""}
					onValueChange={(val) => handleChange("grantingTypeCode", val ?? "")}
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
					value={(value.sharePercentage as string) ?? ""}
					onChange={(e) => handleChange("sharePercentage", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="itemTypeCode" tier="kyc_optional">
					{t("opFieldItemTypeCode")}
				</FieldLabel>
				<CatalogSelector
					catalogKey="pld-appraisal-item-types"
					value={(value.itemTypeCode as string) ?? ""}
					onValueChange={(val) => handleChange("itemTypeCode", val ?? "")}
					placeholder={t("selectPlaceholder")}
					disabled={disabled}
					getOptionValue={getCatalogCode}
				/>
			</div>

			<div className="space-y-1 md:col-span-2">
				<FieldLabel htmlFor="itemDescription" tier="kyc_optional">
					{t("opFieldItemDescription")}
				</FieldLabel>
				<Input
					id="itemDescription"
					value={(value.itemDescription as string) ?? ""}
					onChange={(e) => handleChange("itemDescription", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="itemValue" tier="kyc_optional">
					{t("opFieldItemValue")}
				</FieldLabel>
				<Input
					id="itemValue"
					value={(value.itemValue as string) ?? ""}
					onChange={(e) => handleChange("itemValue", e.target.value)}
					disabled={disabled}
				/>
			</div>
		</div>
	);
}
