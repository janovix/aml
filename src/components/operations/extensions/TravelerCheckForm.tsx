"use client";

import { FieldLabel } from "@/components/completeness/FieldLabel";
import { Input } from "@/components/ui/input";
import { CatalogSelector } from "@/components/catalogs/CatalogSelector";
import { useLanguage } from "@/components/LanguageProvider";
import type { ExtensionFormProps } from ".";
import { getCatalogCode } from "@/lib/catalog-utils";

export function TravelerCheckForm({
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
				<FieldLabel htmlFor="denominationCode" tier="sat_required">
					{t("opFieldDenominationCode")}
				</FieldLabel>
				<CatalogSelector
					catalogKey="chv-currency-denominations"
					value={(value.denominationCode as string) ?? ""}
					onValueChange={(val) => handleChange("denominationCode", val ?? "")}
					placeholder={t("selectPlaceholder")}
					disabled={disabled}
					getOptionValue={getCatalogCode}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="checkCount" tier="sat_required">
					{t("opFieldCheckCount")}
				</FieldLabel>
				<Input
					id="checkCount"
					value={(value.checkCount as string) ?? ""}
					onChange={(e) => handleChange("checkCount", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1 md:col-span-2">
				<FieldLabel htmlFor="serialNumbers" tier="kyc_optional">
					{t("opFieldSerialNumbers")}
				</FieldLabel>
				<Input
					id="serialNumbers"
					value={(value.serialNumbers as string) ?? ""}
					onChange={(e) => handleChange("serialNumbers", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="issuerName" tier="kyc_optional">
					{t("opFieldIssuerName")}
				</FieldLabel>
				<Input
					id="issuerName"
					value={(value.issuerName as string) ?? ""}
					onChange={(e) => handleChange("issuerName", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="issuerCountryCode" tier="kyc_optional">
					{t("opFieldIssuerCountryCode")}
				</FieldLabel>
				<CatalogSelector
					catalogKey="countries"
					value={(value.issuerCountryCode as string) ?? ""}
					onValueChange={(val) => handleChange("issuerCountryCode", val ?? "")}
					placeholder={t("selectPlaceholder")}
					disabled={disabled}
					getOptionValue={getCatalogCode}
				/>
			</div>
		</div>
	);
}
