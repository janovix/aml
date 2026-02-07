"use client";

import { FieldLabel } from "@/components/completeness/FieldLabel";
import { Input } from "@/components/ui/input";
import { CatalogSelector } from "@/components/catalogs/CatalogSelector";
import { useLanguage } from "@/components/LanguageProvider";
import type { ExtensionFormProps } from ".";

export function RentalForm({ value, onChange, disabled }: ExtensionFormProps) {
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
				<FieldLabel htmlFor="monthlyRent" tier="kyc_optional">
					{t("opFieldMonthlyRent")}
				</FieldLabel>
				<Input
					id="monthlyRent"
					value={(value.monthlyRent as string) ?? ""}
					onChange={(e) => handleChange("monthlyRent", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="depositAmount" tier="kyc_optional">
					{t("opFieldDepositAmount")}
				</FieldLabel>
				<Input
					id="depositAmount"
					value={(value.depositAmount as string) ?? ""}
					onChange={(e) => handleChange("depositAmount", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="contractStartDate" tier="kyc_optional">
					{t("opFieldContractStartDate")}
				</FieldLabel>
				<Input
					id="contractStartDate"
					type="date"
					value={(value.contractStartDate as string) ?? ""}
					onChange={(e) => handleChange("contractStartDate", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="contractEndDate" tier="kyc_optional">
					{t("opFieldContractEndDate")}
				</FieldLabel>
				<Input
					id="contractEndDate"
					type="date"
					value={(value.contractEndDate as string) ?? ""}
					onChange={(e) => handleChange("contractEndDate", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="street" tier="kyc_optional">
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
				<FieldLabel htmlFor="externalNumber" tier="kyc_optional">
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
				<FieldLabel htmlFor="postalCode" tier="kyc_optional">
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
				<FieldLabel htmlFor="municipality" tier="kyc_optional">
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
				<FieldLabel htmlFor="stateCode" tier="kyc_optional">
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
				<FieldLabel htmlFor="rentalPeriodMonths" tier="kyc_optional">
					{t("opFieldRentalPeriod")}
				</FieldLabel>
				<Input
					id="rentalPeriodMonths"
					value={(value.rentalPeriodMonths as string) ?? ""}
					onChange={(e) => handleChange("rentalPeriodMonths", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="isPrepaid" tier="kyc_optional">
					{t("opFieldIsPrepaid")}
				</FieldLabel>
				<Input
					id="isPrepaid"
					value={(value.isPrepaid as string) ?? ""}
					onChange={(e) => handleChange("isPrepaid", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="prepaidMonths" tier="kyc_optional">
					{t("opFieldPrepaidMonths")}
				</FieldLabel>
				<Input
					id="prepaidMonths"
					value={(value.prepaidMonths as string) ?? ""}
					onChange={(e) => handleChange("prepaidMonths", e.target.value)}
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
