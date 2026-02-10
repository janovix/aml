"use client";

import { FieldLabel } from "@/components/completeness/FieldLabel";
import { CatalogSelector } from "@/components/catalogs/CatalogSelector";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/components/LanguageProvider";
import type { ExtensionFormProps } from ".";
import { getCatalogCode } from "@/lib/catalog-utils";

export function GamblingForm({
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
				<FieldLabel htmlFor="gameTypeCode" tier="sat_required">
					{t("opFieldGameTypeCode")}
				</FieldLabel>
				<Input
					id="gameTypeCode"
					value={(value.gameTypeCode as string) ?? ""}
					onChange={(e) => handleChange("gameTypeCode", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="prizeAmount" tier="alert_required">
					{t("opFieldPrizeAmount")}
				</FieldLabel>
				<Input
					id="prizeAmount"
					inputMode="decimal"
					value={(value.prizeAmount as string) ?? ""}
					onChange={(e) => handleChange("prizeAmount", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="betAmount" tier="alert_required">
					{t("opFieldBetAmount")}
				</FieldLabel>
				<Input
					id="betAmount"
					inputMode="decimal"
					value={(value.betAmount as string) ?? ""}
					onChange={(e) => handleChange("betAmount", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="businessLineCode" tier="kyc_optional">
					{t("opFieldBusinessLineCode")}
				</FieldLabel>
				<CatalogSelector
					catalogKey="jys-business-lines"
					value={(value.businessLineCode as string) ?? ""}
					onValueChange={(val) => handleChange("businessLineCode", val ?? "")}
					placeholder={t("selectPlaceholder")}
					disabled={disabled}
					getOptionValue={getCatalogCode}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="operationMethodCode" tier="kyc_optional">
					{t("opFieldOperationMethodCode")}
				</FieldLabel>
				<CatalogSelector
					catalogKey="jys-operation-methods"
					value={(value.operationMethodCode as string) ?? ""}
					onValueChange={(val) =>
						handleChange("operationMethodCode", val ?? "")
					}
					placeholder={t("selectPlaceholder")}
					disabled={disabled}
					getOptionValue={getCatalogCode}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="ticketNumber" tier="kyc_optional">
					{t("opFieldTicketNumber")}
				</FieldLabel>
				<Input
					id="ticketNumber"
					value={(value.ticketNumber as string) ?? ""}
					onChange={(e) => handleChange("ticketNumber", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="eventName" tier="kyc_optional">
					{t("opFieldEventName")}
				</FieldLabel>
				<Input
					id="eventName"
					value={(value.eventName as string) ?? ""}
					onChange={(e) => handleChange("eventName", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="eventDate" tier="kyc_optional">
					{t("opFieldEventDate")}
				</FieldLabel>
				<Input
					id="eventDate"
					type="date"
					value={(value.eventDate as string) ?? ""}
					onChange={(e) => handleChange("eventDate", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="propertyTypeCode" tier="kyc_optional">
					{t("opFieldPropertyTypeCode")}
				</FieldLabel>
				<CatalogSelector
					catalogKey="pld-property-types"
					value={(value.propertyTypeCode as string) ?? ""}
					onValueChange={(val) => handleChange("propertyTypeCode", val ?? "")}
					placeholder={t("selectPlaceholder")}
					disabled={disabled}
					getOptionValue={getCatalogCode}
				/>
			</div>

			<div className="space-y-1 md:col-span-2">
				<FieldLabel htmlFor="propertyDescription" tier="kyc_optional">
					{t("opFieldPropertyDescription")}
				</FieldLabel>
				<Input
					id="propertyDescription"
					value={(value.propertyDescription as string) ?? ""}
					onChange={(e) => handleChange("propertyDescription", e.target.value)}
					disabled={disabled}
				/>
			</div>
		</div>
	);
}
