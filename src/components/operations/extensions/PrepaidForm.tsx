"use client";

import { FieldLabel } from "@/components/completeness/FieldLabel";
import { CatalogSelector } from "@/components/catalogs/CatalogSelector";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/components/LanguageProvider";
import type { ExtensionFormProps } from ".";

export function PrepaidForm({ value, onChange, disabled }: ExtensionFormProps) {
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
				<FieldLabel htmlFor="cardType" tier="sat_required">
					{t("opFieldCardType")}
				</FieldLabel>
				<Input
					id="cardType"
					value={(value.cardType as string) ?? ""}
					onChange={(e) => handleChange("cardType", e.target.value)}
					disabled={disabled}
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
				<FieldLabel htmlFor="isInitialLoad" tier="kyc_optional">
					{t("opFieldIsInitialLoad")}
				</FieldLabel>
				<div className="flex items-center h-10">
					<Switch
						id="isInitialLoad"
						checked={(value.isInitialLoad as boolean) ?? false}
						onCheckedChange={(checked) =>
							handleChange("isInitialLoad", checked)
						}
						disabled={disabled}
					/>
				</div>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="reloadAmount" tier="kyc_optional">
					{t("opFieldReloadAmount")}
				</FieldLabel>
				<Input
					id="reloadAmount"
					inputMode="decimal"
					value={(value.reloadAmount as string) ?? ""}
					onChange={(e) => handleChange("reloadAmount", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="currentBalance" tier="kyc_optional">
					{t("opFieldCurrentBalance")}
				</FieldLabel>
				<Input
					id="currentBalance"
					inputMode="decimal"
					value={(value.currentBalance as string) ?? ""}
					onChange={(e) => handleChange("currentBalance", e.target.value)}
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
		</div>
	);
}
