"use client";

import { FieldLabel } from "@/components/completeness/FieldLabel";
import { Input } from "@/components/ui/input";
import { CatalogSelector } from "@/components/catalogs/CatalogSelector";
import { useLanguage } from "@/components/LanguageProvider";
import type { ExtensionFormProps } from ".";
import { getCatalogCode } from "@/lib/catalog-utils";

export function ValuableForm({
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
				<FieldLabel htmlFor="valueTypeCode" tier="sat_required">
					{t("opFieldValueTypeCode")}
				</FieldLabel>
				<CatalogSelector
					catalogKey="tcv-transferred-value-types"
					value={(value.valueTypeCode as string) ?? ""}
					onValueChange={(val) => handleChange("valueTypeCode", val ?? "")}
					placeholder={t("selectPlaceholder")}
					disabled={disabled}
					getOptionValue={getCatalogCode}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="serviceTypeCode" tier="kyc_optional">
					{t("opFieldServiceTypeCode")}
				</FieldLabel>
				<CatalogSelector
					catalogKey="tcv-service-types"
					value={(value.serviceTypeCode as string) ?? ""}
					onValueChange={(val) => handleChange("serviceTypeCode", val ?? "")}
					placeholder={t("selectPlaceholder")}
					disabled={disabled}
					getOptionValue={getCatalogCode}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="transportMethod" tier="kyc_optional">
					{t("opFieldTransportMethod")}
				</FieldLabel>
				<Input
					id="transportMethod"
					value={(value.transportMethod as string) ?? ""}
					onChange={(e) => handleChange("transportMethod", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="originAddress" tier="kyc_optional">
					{t("opFieldOriginAddress")}
				</FieldLabel>
				<Input
					id="originAddress"
					value={(value.originAddress as string) ?? ""}
					onChange={(e) => handleChange("originAddress", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="destinationAddress" tier="kyc_optional">
					{t("opFieldDestinationAddress")}
				</FieldLabel>
				<Input
					id="destinationAddress"
					value={(value.destinationAddress as string) ?? ""}
					onChange={(e) => handleChange("destinationAddress", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="custodyStartDate" tier="kyc_optional">
					{t("opFieldCustodyStartDate")}
				</FieldLabel>
				<Input
					id="custodyStartDate"
					type="date"
					value={(value.custodyStartDate as string) ?? ""}
					onChange={(e) => handleChange("custodyStartDate", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="custodyEndDate" tier="kyc_optional">
					{t("opFieldCustodyEndDate")}
				</FieldLabel>
				<Input
					id="custodyEndDate"
					type="date"
					value={(value.custodyEndDate as string) ?? ""}
					onChange={(e) => handleChange("custodyEndDate", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="storageLocation" tier="kyc_optional">
					{t("opFieldStorageLocation")}
				</FieldLabel>
				<Input
					id="storageLocation"
					value={(value.storageLocation as string) ?? ""}
					onChange={(e) => handleChange("storageLocation", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="declaredValue" tier="kyc_optional">
					{t("opFieldDeclaredValue")}
				</FieldLabel>
				<Input
					id="declaredValue"
					inputMode="decimal"
					value={(value.declaredValue as string) ?? ""}
					onChange={(e) => handleChange("declaredValue", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="insuredValue" tier="kyc_optional">
					{t("opFieldInsuredValue")}
				</FieldLabel>
				<Input
					id="insuredValue"
					inputMode="decimal"
					value={(value.insuredValue as string) ?? ""}
					onChange={(e) => handleChange("insuredValue", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1 md:col-span-2">
				<FieldLabel htmlFor="description" tier="kyc_optional">
					{t("opFieldDescription")}
				</FieldLabel>
				<Input
					id="description"
					value={(value.description as string) ?? ""}
					onChange={(e) => handleChange("description", e.target.value)}
					disabled={disabled}
				/>
			</div>
		</div>
	);
}
