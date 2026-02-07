"use client";

import { FieldLabel } from "@/components/completeness/FieldLabel";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/components/LanguageProvider";
import type { ExtensionFormProps } from ".";

export function RewardForm({ value, onChange, disabled }: ExtensionFormProps) {
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
				<FieldLabel htmlFor="rewardType" tier="sat_required">
					{t("opFieldRewardType")}
				</FieldLabel>
				<Input
					id="rewardType"
					value={(value.rewardType as string) ?? ""}
					onChange={(e) => handleChange("rewardType", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="programName" tier="kyc_optional">
					{t("opFieldProgramName")}
				</FieldLabel>
				<Input
					id="programName"
					value={(value.programName as string) ?? ""}
					onChange={(e) => handleChange("programName", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="pointsAmount" tier="kyc_optional">
					{t("opFieldPointsAmount")}
				</FieldLabel>
				<Input
					id="pointsAmount"
					value={(value.pointsAmount as string) ?? ""}
					onChange={(e) => handleChange("pointsAmount", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="pointsValue" tier="kyc_optional">
					{t("opFieldPointsValue")}
				</FieldLabel>
				<Input
					id="pointsValue"
					value={(value.pointsValue as string) ?? ""}
					onChange={(e) => handleChange("pointsValue", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="pointsExpiryDate" tier="kyc_optional">
					{t("opFieldPointsExpiryDate")}
				</FieldLabel>
				<Input
					id="pointsExpiryDate"
					type="date"
					value={(value.pointsExpiryDate as string) ?? ""}
					onChange={(e) => handleChange("pointsExpiryDate", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1">
				<FieldLabel htmlFor="redemptionType" tier="kyc_optional">
					{t("opFieldRedemptionType")}
				</FieldLabel>
				<Input
					id="redemptionType"
					value={(value.redemptionType as string) ?? ""}
					onChange={(e) => handleChange("redemptionType", e.target.value)}
					disabled={disabled}
				/>
			</div>

			<div className="space-y-1 md:col-span-2">
				<FieldLabel htmlFor="redemptionDescription" tier="kyc_optional">
					{t("opFieldRedemptionDescription")}
				</FieldLabel>
				<Input
					id="redemptionDescription"
					value={(value.redemptionDescription as string) ?? ""}
					onChange={(e) =>
						handleChange("redemptionDescription", e.target.value)
					}
					disabled={disabled}
				/>
			</div>
		</div>
	);
}
