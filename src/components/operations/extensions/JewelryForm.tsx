"use client";

import { CatalogSelector } from "@/components/catalogs/CatalogSelector";
import { FieldLabel } from "@/components/completeness/FieldLabel";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/components/LanguageProvider";
import type { ExtensionFormProps } from ".";

export function JewelryForm({ value, onChange, disabled }: ExtensionFormProps) {
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
				<FieldLabel htmlFor="itemTypeCode" tier="sat_required">
					{t("opFieldItemTypeCode")}
				</FieldLabel>
				<CatalogSelector
					catalogKey="mjr-item-types"
					value={(value.itemTypeCode as string) ?? ""}
					onValueChange={(val) => handleChange("itemTypeCode", val ?? "")}
					placeholder={t("selectPlaceholder")}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="metalType" tier="kyc_optional">
					{t("opFieldMetalType")}
				</FieldLabel>
				<Input
					id="metalType"
					value={(value.metalType as string) ?? ""}
					onChange={(e) => handleChange("metalType", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="weightGrams" tier="kyc_optional">
					{t("opFieldWeightGrams")}
				</FieldLabel>
				<Input
					id="weightGrams"
					value={(value.weightGrams as string) ?? ""}
					onChange={(e) => handleChange("weightGrams", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="purity" tier="kyc_optional">
					{t("opFieldPurity")}
				</FieldLabel>
				<Input
					id="purity"
					value={(value.purity as string) ?? ""}
					onChange={(e) => handleChange("purity", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1 md:col-span-2">
				<FieldLabel htmlFor="jewelryDescription" tier="kyc_optional">
					{t("opFieldDescription")}
				</FieldLabel>
				<Input
					id="jewelryDescription"
					value={(value.jewelryDescription as string) ?? ""}
					onChange={(e) => handleChange("jewelryDescription", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="brand" tier="kyc_optional">
					{t("opFieldBrand")}
				</FieldLabel>
				<Input
					id="brand"
					value={(value.brand as string) ?? ""}
					onChange={(e) => handleChange("brand", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="serialNumber" tier="kyc_optional">
					{t("opFieldSerialNumber")}
				</FieldLabel>
				<Input
					id="serialNumber"
					value={(value.serialNumber as string) ?? ""}
					onChange={(e) => handleChange("serialNumber", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="tradeUnitCode" tier="kyc_optional">
					{t("opFieldTradeUnitCode")}
				</FieldLabel>
				<CatalogSelector
					catalogKey="mjr-trade-units"
					value={(value.tradeUnitCode as string) ?? ""}
					onValueChange={(val) => handleChange("tradeUnitCode", val ?? "")}
					placeholder={t("selectPlaceholder")}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="quantity" tier="kyc_optional">
					{t("opFieldQuantity")}
				</FieldLabel>
				<Input
					id="quantity"
					value={(value.quantity as string) ?? ""}
					onChange={(e) => handleChange("quantity", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="unitPrice" tier="kyc_optional">
					{t("opFieldUnitPrice")}
				</FieldLabel>
				<Input
					id="unitPrice"
					value={(value.unitPrice as string) ?? ""}
					onChange={(e) => handleChange("unitPrice", e.target.value)}
					disabled={disabled}
				/>
			</div>
		</div>
	);
}
