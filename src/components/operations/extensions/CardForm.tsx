"use client";

import { FieldLabel } from "@/components/completeness/FieldLabel";
import { CatalogSelector } from "@/components/catalogs/CatalogSelector";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/components/LanguageProvider";
import type { ExtensionFormProps } from ".";
import { getCatalogCode } from "@/lib/catalog-utils";

export function CardForm({ value, onChange, disabled }: ExtensionFormProps) {
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
				<FieldLabel htmlFor="cardTypeCode" tier="sat_required">
					{t("opFieldCardTypeCode")}
				</FieldLabel>
				<CatalogSelector
					catalogKey="tsc-card-types"
					value={(value.cardTypeCode as string) ?? ""}
					onValueChange={(val) => handleChange("cardTypeCode", val ?? "")}
					placeholder={t("selectPlaceholder")}
					disabled={disabled}
					getOptionValue={getCatalogCode}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="cardNumberMasked" tier="kyc_optional">
					{t("opFieldCardNumberMasked")}
				</FieldLabel>
				<Input
					id="cardNumberMasked"
					value={(value.cardNumberMasked as string) ?? ""}
					onChange={(e) => handleChange("cardNumberMasked", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="cardBrand" tier="kyc_optional">
					{t("opFieldCardBrand")}
				</FieldLabel>
				<Input
					id="cardBrand"
					value={(value.cardBrand as string) ?? ""}
					onChange={(e) => handleChange("cardBrand", e.target.value)}
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
				<FieldLabel htmlFor="creditLimit" tier="kyc_optional">
					{t("opFieldCreditLimit")}
				</FieldLabel>
				<Input
					id="creditLimit"
					value={(value.creditLimit as string) ?? ""}
					onChange={(e) => handleChange("creditLimit", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="transactionType" tier="kyc_optional">
					{t("opFieldTransactionType")}
				</FieldLabel>
				<Input
					id="transactionType"
					value={(value.transactionType as string) ?? ""}
					onChange={(e) => handleChange("transactionType", e.target.value)}
					disabled={disabled}
				/>
			</div>
		</div>
	);
}
