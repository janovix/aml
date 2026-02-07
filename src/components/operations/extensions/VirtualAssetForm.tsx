"use client";

import { FieldLabel } from "@/components/completeness/FieldLabel";
import { Input } from "@/components/ui/input";
import { CatalogSelector } from "@/components/catalogs/CatalogSelector";
import { useLanguage } from "@/components/LanguageProvider";
import type { ExtensionFormProps } from ".";
import { getCatalogCode } from "@/lib/catalog-utils";

export function VirtualAssetForm({
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
				<FieldLabel htmlFor="assetTypeCode" tier="sat_required">
					{t("opFieldAssetTypeCode")}
				</FieldLabel>
				<Input
					id="assetTypeCode"
					value={(value.assetTypeCode as string) ?? ""}
					onChange={(e) => handleChange("assetTypeCode", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="blockchainTxHash" tier="sat_required">
					{t("opFieldBlockchainTxHash")}
				</FieldLabel>
				<Input
					id="blockchainTxHash"
					value={(value.blockchainTxHash as string) ?? ""}
					onChange={(e) => handleChange("blockchainTxHash", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="walletAddressOrigin" tier="alert_required">
					{t("opFieldWalletAddressOrigin")}
				</FieldLabel>
				<Input
					id="walletAddressOrigin"
					value={(value.walletAddressOrigin as string) ?? ""}
					onChange={(e) => handleChange("walletAddressOrigin", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="walletAddressDestination" tier="alert_required">
					{t("opFieldWalletAddressDestination")}
				</FieldLabel>
				<Input
					id="walletAddressDestination"
					value={(value.walletAddressDestination as string) ?? ""}
					onChange={(e) =>
						handleChange("walletAddressDestination", e.target.value)
					}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="exchangeName" tier="alert_required">
					{t("opFieldExchangeName")}
				</FieldLabel>
				<Input
					id="exchangeName"
					value={(value.exchangeName as string) ?? ""}
					onChange={(e) => handleChange("exchangeName", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="assetName" tier="kyc_optional">
					{t("opFieldAssetName")}
				</FieldLabel>
				<Input
					id="assetName"
					value={(value.assetName as string) ?? ""}
					onChange={(e) => handleChange("assetName", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="exchangeCountryCode" tier="kyc_optional">
					{t("opFieldExchangeCountryCode")}
				</FieldLabel>
				<CatalogSelector
					catalogKey="countries"
					value={(value.exchangeCountryCode as string) ?? ""}
					onValueChange={(val) =>
						handleChange("exchangeCountryCode", val ?? "")
					}
					placeholder={t("selectPlaceholder")}
					disabled={disabled}
					getOptionValue={getCatalogCode}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="assetQuantity" tier="kyc_optional">
					{t("opFieldAssetQuantity")}
				</FieldLabel>
				<Input
					id="assetQuantity"
					value={(value.assetQuantity as string) ?? ""}
					onChange={(e) => handleChange("assetQuantity", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="assetUnitPrice" tier="kyc_optional">
					{t("opFieldAssetUnitPrice")}
				</FieldLabel>
				<Input
					id="assetUnitPrice"
					value={(value.assetUnitPrice as string) ?? ""}
					onChange={(e) => handleChange("assetUnitPrice", e.target.value)}
					disabled={disabled}
				/>
			</div>
		</div>
	);
}
