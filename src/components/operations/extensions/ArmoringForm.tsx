"use client";

import { CatalogSelector } from "@/components/catalogs/CatalogSelector";
import { FieldLabel } from "@/components/completeness/FieldLabel";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/components/LanguageProvider";
import type { ExtensionFormProps } from ".";

export function ArmoringForm({
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
				<FieldLabel htmlFor="itemType" tier="sat_required">
					{t("opFieldItemType")}
				</FieldLabel>
				<Input
					id="itemType"
					value={(value.itemType as string) ?? ""}
					onChange={(e) => handleChange("itemType", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="armorLevelCode" tier="sat_required">
					{t("opFieldArmorLevelCode")}
				</FieldLabel>
				<CatalogSelector
					catalogKey="pld-armor-levels"
					value={(value.armorLevelCode as string) ?? ""}
					onValueChange={(val) => handleChange("armorLevelCode", val ?? "")}
					placeholder={t("selectPlaceholder")}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="itemStatusCode" tier="kyc_optional">
					{t("opFieldItemStatusCode")}
				</FieldLabel>
				<CatalogSelector
					catalogKey="bli-armored-item-status"
					value={(value.itemStatusCode as string) ?? ""}
					onValueChange={(val) => handleChange("itemStatusCode", val ?? "")}
					placeholder={t("selectPlaceholder")}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="armoredPartCode" tier="kyc_optional">
					{t("opFieldArmoredPartCode")}
				</FieldLabel>
				<CatalogSelector
					catalogKey="bli-armored-property-parts"
					value={(value.armoredPartCode as string) ?? ""}
					onValueChange={(val) => handleChange("armoredPartCode", val ?? "")}
					placeholder={t("selectPlaceholder")}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="vehicleType" tier="kyc_optional">
					{t("opFieldVehicleType")}
				</FieldLabel>
				<Input
					id="vehicleType"
					value={(value.vehicleType as string) ?? ""}
					onChange={(e) => handleChange("vehicleType", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="vehicleBrand" tier="kyc_optional">
					{t("opFieldVehicleBrand")}
				</FieldLabel>
				<Input
					id="vehicleBrand"
					value={(value.vehicleBrand as string) ?? ""}
					onChange={(e) => handleChange("vehicleBrand", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="vehicleModel" tier="kyc_optional">
					{t("opFieldVehicleModel")}
				</FieldLabel>
				<Input
					id="vehicleModel"
					value={(value.vehicleModel as string) ?? ""}
					onChange={(e) => handleChange("vehicleModel", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="vehicleYear" tier="kyc_optional">
					{t("opFieldVehicleYear")}
				</FieldLabel>
				<Input
					id="vehicleYear"
					value={(value.vehicleYear as string) ?? ""}
					onChange={(e) => handleChange("vehicleYear", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="vehicleVin" tier="kyc_optional">
					{t("opFieldVehicleVin")}
				</FieldLabel>
				<Input
					id="vehicleVin"
					value={(value.vehicleVin as string) ?? ""}
					onChange={(e) => handleChange("vehicleVin", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="vehiclePlates" tier="kyc_optional">
					{t("opFieldVehiclePlates")}
				</FieldLabel>
				<Input
					id="vehiclePlates"
					value={(value.vehiclePlates as string) ?? ""}
					onChange={(e) => handleChange("vehiclePlates", e.target.value)}
					disabled={disabled}
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
