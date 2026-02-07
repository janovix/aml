"use client";

import { CatalogSelector } from "@/components/catalogs/CatalogSelector";
import { FieldLabel } from "@/components/completeness/FieldLabel";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/components/LanguageProvider";
import type { ExtensionFormProps } from ".";
import { getCatalogCode } from "@/lib/catalog-utils";

function getBrandCatalogKey(vehicleType: string | undefined): string {
	switch (vehicleType) {
		case "MARINE":
			return "maritime-vehicle-brands";
		case "AIR":
			return "air-vehicle-brands";
		default:
			return "terrestrial-vehicle-brands";
	}
}

export function VehicleForm({ value, onChange, disabled }: ExtensionFormProps) {
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
				<FieldLabel htmlFor="vehicleType" tier="sat_required">
					{t("opFieldVehicleType")}
				</FieldLabel>
				<Select
					value={(value.vehicleType as string) ?? ""}
					onValueChange={(v) => handleChange("vehicleType", v)}
					disabled={disabled}
				>
					<SelectTrigger id="vehicleType">
						<SelectValue placeholder={t("selectTypePlaceholder")} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="LAND">{t("txnVehicleTypeLand")}</SelectItem>
						<SelectItem value="MARINE">{t("txnVehicleTypeMarine")}</SelectItem>
						<SelectItem value="AIR">{t("txnVehicleTypeAir")}</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="brand" tier="sat_required">
					{t("opFieldBrand")}
				</FieldLabel>
				<CatalogSelector
					catalogKey={getBrandCatalogKey(value.vehicleType as string)}
					value={(value.brand as string) ?? ""}
					onValueChange={(val) => handleChange("brand", val ?? "")}
					placeholder={t("selectBrandPlaceholder")}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="model" tier="sat_required">
					{t("opFieldModel")}
				</FieldLabel>
				<Input
					id="model"
					value={(value.model as string) ?? ""}
					onChange={(e) => handleChange("model", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="year" tier="sat_required">
					{t("opFieldYear")}
				</FieldLabel>
				<Input
					id="year"
					value={(value.year as string) ?? ""}
					onChange={(e) => handleChange("year", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="vin" tier="alert_required">
					{t("opFieldVin")}
				</FieldLabel>
				<Input
					id="vin"
					value={(value.vin as string) ?? ""}
					onChange={(e) => handleChange("vin", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="plates" tier="alert_required">
					{t("opFieldPlates")}
				</FieldLabel>
				<Input
					id="plates"
					value={(value.plates as string) ?? ""}
					onChange={(e) => handleChange("plates", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="repuve" tier="kyc_optional">
					{t("opFieldRepuve")}
				</FieldLabel>
				<Input
					id="repuve"
					value={(value.repuve as string) ?? ""}
					onChange={(e) => handleChange("repuve", e.target.value)}
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
				<FieldLabel htmlFor="engineNumber" tier="kyc_optional">
					{t("opFieldEngineNumber")}
				</FieldLabel>
				<Input
					id="engineNumber"
					value={(value.engineNumber as string) ?? ""}
					onChange={(e) => handleChange("engineNumber", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="armorLevelCode" tier="kyc_optional">
					{t("opFieldArmorLevelCode")}
				</FieldLabel>
				<CatalogSelector
					catalogKey="pld-armor-levels"
					value={(value.armorLevelCode as string) ?? ""}
					onValueChange={(val) => handleChange("armorLevelCode", val ?? "")}
					placeholder={t("selectPlaceholder")}
					disabled={disabled}
					getOptionValue={getCatalogCode}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="flagCountryCode" tier="kyc_optional">
					{t("opFieldFlagCountryCode")}
				</FieldLabel>
				<CatalogSelector
					catalogKey="countries"
					value={(value.flagCountryCode as string) ?? ""}
					onValueChange={(val) => handleChange("flagCountryCode", val ?? "")}
					placeholder={t("selectPlaceholder")}
					disabled={disabled}
					getOptionValue={getCatalogCode}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="registrationNumber" tier="kyc_optional">
					{t("opFieldRegistrationNumber")}
				</FieldLabel>
				<Input
					id="registrationNumber"
					value={(value.registrationNumber as string) ?? ""}
					onChange={(e) => handleChange("registrationNumber", e.target.value)}
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
