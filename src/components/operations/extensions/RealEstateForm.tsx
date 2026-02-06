"use client";

import { CatalogSelector } from "@/components/catalogs/CatalogSelector";
import { FieldLabel } from "@/components/completeness/FieldLabel";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/components/LanguageProvider";
import type { ExtensionFormProps } from ".";

export function RealEstateForm({
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
				<FieldLabel htmlFor="propertyTypeCode" tier="sat_required">
					{t("opFieldPropertyTypeCode")}
				</FieldLabel>
				<CatalogSelector
					catalogKey="pld-property-types"
					value={(value.propertyTypeCode as string) ?? ""}
					onValueChange={(val) => handleChange("propertyTypeCode", val ?? "")}
					placeholder={t("selectPlaceholder")}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="street" tier="sat_required">
					{t("opFieldStreet")}
				</FieldLabel>
				<Input
					id="street"
					value={(value.street as string) ?? ""}
					onChange={(e) => handleChange("street", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="externalNumber" tier="sat_required">
					{t("opFieldExternalNumber")}
				</FieldLabel>
				<Input
					id="externalNumber"
					value={(value.externalNumber as string) ?? ""}
					onChange={(e) => handleChange("externalNumber", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="postalCode" tier="sat_required">
					{t("opFieldPostalCode")}
				</FieldLabel>
				<Input
					id="postalCode"
					value={(value.postalCode as string) ?? ""}
					onChange={(e) => handleChange("postalCode", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="registryFolio" tier="sat_required">
					{t("opFieldRegistryFolio")}
				</FieldLabel>
				<Input
					id="registryFolio"
					value={(value.registryFolio as string) ?? ""}
					onChange={(e) => handleChange("registryFolio", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="landAreaM2" tier="sat_required">
					{t("opFieldLandArea")}
				</FieldLabel>
				<Input
					id="landAreaM2"
					value={(value.landAreaM2 as string) ?? ""}
					onChange={(e) => handleChange("landAreaM2", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="constructionAreaM2" tier="sat_required">
					{t("opFieldConstructionArea")}
				</FieldLabel>
				<Input
					id="constructionAreaM2"
					value={(value.constructionAreaM2 as string) ?? ""}
					onChange={(e) => handleChange("constructionAreaM2", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="municipality" tier="alert_required">
					{t("opFieldMunicipality")}
				</FieldLabel>
				<Input
					id="municipality"
					value={(value.municipality as string) ?? ""}
					onChange={(e) => handleChange("municipality", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="stateCode" tier="alert_required">
					{t("opFieldStateCode")}
				</FieldLabel>
				<CatalogSelector
					catalogKey="states"
					value={(value.stateCode as string) ?? ""}
					onValueChange={(val) => handleChange("stateCode", val ?? "")}
					placeholder={t("selectPlaceholder")}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="internalNumber" tier="kyc_optional">
					{t("opFieldInternalNumber")}
				</FieldLabel>
				<Input
					id="internalNumber"
					value={(value.internalNumber as string) ?? ""}
					onChange={(e) => handleChange("internalNumber", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="neighborhood" tier="kyc_optional">
					{t("opFieldNeighborhood")}
				</FieldLabel>
				<Input
					id="neighborhood"
					value={(value.neighborhood as string) ?? ""}
					onChange={(e) => handleChange("neighborhood", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="registryDate" tier="kyc_optional">
					{t("opFieldRegistryDate")}
				</FieldLabel>
				<Input
					id="registryDate"
					type="date"
					value={(value.registryDate as string) ?? ""}
					onChange={(e) => handleChange("registryDate", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="clientFigureCode" tier="kyc_optional">
					{t("opFieldClientFigureCode")}
				</FieldLabel>
				<CatalogSelector
					catalogKey="inm-client-figures"
					value={(value.clientFigureCode as string) ?? ""}
					onValueChange={(val) => handleChange("clientFigureCode", val ?? "")}
					placeholder={t("selectPlaceholder")}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="personFigureCode" tier="kyc_optional">
					{t("opFieldPersonFigureCode")}
				</FieldLabel>
				<CatalogSelector
					catalogKey="inm-person-figures"
					value={(value.personFigureCode as string) ?? ""}
					onValueChange={(val) => handleChange("personFigureCode", val ?? "")}
					placeholder={t("selectPlaceholder")}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="countryCode" tier="kyc_optional">
					{t("opFieldCountryCode")}
				</FieldLabel>
				<CatalogSelector
					catalogKey="countries"
					value={(value.countryCode as string) ?? ""}
					onValueChange={(val) => handleChange("countryCode", val ?? "")}
					placeholder={t("selectPlaceholder")}
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
