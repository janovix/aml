"use client";

import { FieldLabel } from "@/components/completeness/FieldLabel";
import { CatalogSelector } from "@/components/catalogs/CatalogSelector";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/components/LanguageProvider";
import type { ExtensionFormProps } from ".";
import { getCatalogCode } from "@/lib/catalog-utils";

export function DonationForm({
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
				<FieldLabel htmlFor="donationType" tier="sat_required">
					{t("opFieldDonationType")}
				</FieldLabel>
				<CatalogSelector
					id="donationType"
					catalogKey="pld-donation-types"
					value={(value.donationType as string) ?? ""}
					onValueChange={(val) => handleChange("donationType", val ?? "")}
					placeholder={t("selectPlaceholder")}
					disabled={disabled}
					getOptionValue={getCatalogCode}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="isAnonymous" tier="alert_required">
					{t("opFieldIsAnonymous")}
				</FieldLabel>
				<div className="flex items-center h-10">
					<Switch
						id="isAnonymous"
						checked={(value.isAnonymous as boolean) ?? false}
						onCheckedChange={(checked) => handleChange("isAnonymous", checked)}
						disabled={disabled}
					/>
				</div>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="purpose" tier="kyc_optional">
					{t("opFieldPurpose")}
				</FieldLabel>
				<Input
					id="purpose"
					value={(value.purpose as string) ?? ""}
					onChange={(e) => handleChange("purpose", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="itemTypeCode" tier="kyc_optional">
					{t("opFieldItemTypeCode")}
				</FieldLabel>
				<CatalogSelector
					id="itemTypeCode"
					catalogKey="pld-liquidation-item-types"
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
					inputMode="decimal"
					value={(value.itemValue as string) ?? ""}
					onChange={(e) => handleChange("itemValue", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="campaignName" tier="kyc_optional">
					{t("opFieldCampaignName")}
				</FieldLabel>
				<Input
					id="campaignName"
					value={(value.campaignName as string) ?? ""}
					onChange={(e) => handleChange("campaignName", e.target.value)}
					disabled={disabled}
				/>
			</div>
		</div>
	);
}
