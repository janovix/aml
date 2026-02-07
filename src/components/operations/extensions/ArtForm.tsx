"use client";

import { CatalogSelector } from "@/components/catalogs/CatalogSelector";
import { FieldLabel } from "@/components/completeness/FieldLabel";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/components/LanguageProvider";
import type { ExtensionFormProps } from ".";

export function ArtForm({ value, onChange, disabled }: ExtensionFormProps) {
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
				<FieldLabel htmlFor="artworkTypeCode" tier="sat_required">
					{t("opFieldArtworkTypeCode")}
				</FieldLabel>
				<CatalogSelector
					catalogKey="oba-traded-object-types"
					value={(value.artworkTypeCode as string) ?? ""}
					onValueChange={(val) => handleChange("artworkTypeCode", val ?? "")}
					placeholder={t("selectPlaceholder")}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="artist" tier="alert_required">
					{t("opFieldArtist")}
				</FieldLabel>
				<Input
					id="artist"
					value={(value.artist as string) ?? ""}
					onChange={(e) => handleChange("artist", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1 md:col-span-2">
				<FieldLabel htmlFor="provenance" tier="alert_required">
					{t("opFieldProvenance")}
				</FieldLabel>
				<Input
					id="provenance"
					value={(value.provenance as string) ?? ""}
					onChange={(e) => handleChange("provenance", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="title" tier="kyc_optional">
					{t("opFieldTitle")}
				</FieldLabel>
				<Input
					id="title"
					value={(value.title as string) ?? ""}
					onChange={(e) => handleChange("title", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="yearCreated" tier="kyc_optional">
					{t("opFieldYearCreated")}
				</FieldLabel>
				<Input
					id="yearCreated"
					value={(value.yearCreated as string) ?? ""}
					onChange={(e) => handleChange("yearCreated", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="medium" tier="kyc_optional">
					{t("opFieldMedium")}
				</FieldLabel>
				<Input
					id="medium"
					value={(value.medium as string) ?? ""}
					onChange={(e) => handleChange("medium", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="dimensions" tier="kyc_optional">
					{t("opFieldDimensions")}
				</FieldLabel>
				<Input
					id="dimensions"
					value={(value.dimensions as string) ?? ""}
					onChange={(e) => handleChange("dimensions", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="certificateAuthenticity" tier="kyc_optional">
					{t("opFieldCertificateAuthenticity")}
				</FieldLabel>
				<Input
					id="certificateAuthenticity"
					value={(value.certificateAuthenticity as string) ?? ""}
					onChange={(e) =>
						handleChange("certificateAuthenticity", e.target.value)
					}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="previousOwner" tier="kyc_optional">
					{t("opFieldPreviousOwner")}
				</FieldLabel>
				<Input
					id="previousOwner"
					value={(value.previousOwner as string) ?? ""}
					onChange={(e) => handleChange("previousOwner", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="isAntique" tier="kyc_optional">
					{t("opFieldIsAntique")}
				</FieldLabel>
				<Input
					id="isAntique"
					value={(value.isAntique as string) ?? ""}
					onChange={(e) => handleChange("isAntique", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="auctionHouse" tier="kyc_optional">
					{t("opFieldAuctionHouse")}
				</FieldLabel>
				<Input
					id="auctionHouse"
					value={(value.auctionHouse as string) ?? ""}
					onChange={(e) => handleChange("auctionHouse", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="lotNumber" tier="kyc_optional">
					{t("opFieldLotNumber")}
				</FieldLabel>
				<Input
					id="lotNumber"
					value={(value.lotNumber as string) ?? ""}
					onChange={(e) => handleChange("lotNumber", e.target.value)}
					disabled={disabled}
				/>
			</div>
		</div>
	);
}
