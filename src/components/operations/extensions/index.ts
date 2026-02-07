import type { ActivityCode } from "@/types/operation";
import type React from "react";

export interface ExtensionFormProps {
	value: Record<string, unknown>;
	onChange: (value: Record<string, unknown>) => void;
	disabled?: boolean;
}

export { VehicleForm } from "./VehicleForm";
export { RealEstateForm } from "./RealEstateForm";
export { JewelryForm } from "./JewelryForm";
export { VirtualAssetForm } from "./VirtualAssetForm";
export { GamblingForm } from "./GamblingForm";
export { RentalForm } from "./RentalForm";
export { ArmoringForm } from "./ArmoringForm";
export { DonationForm } from "./DonationForm";
export { LoanForm } from "./LoanForm";
export { OfficialForm } from "./OfficialForm";
export { ProfessionalForm } from "./ProfessionalForm";
export { TravelerCheckForm } from "./TravelerCheckForm";
export { CardForm } from "./CardForm";
export { PrepaidForm } from "./PrepaidForm";
export { RewardForm } from "./RewardForm";
export { ValuableForm } from "./ValuableForm";
export { ArtForm } from "./ArtForm";
export { DevelopmentForm } from "./DevelopmentForm";

import { VehicleForm } from "./VehicleForm";
import { RealEstateForm } from "./RealEstateForm";
import { JewelryForm } from "./JewelryForm";
import { VirtualAssetForm } from "./VirtualAssetForm";
import { GamblingForm } from "./GamblingForm";
import { RentalForm } from "./RentalForm";
import { ArmoringForm } from "./ArmoringForm";
import { DonationForm } from "./DonationForm";
import { LoanForm } from "./LoanForm";
import { OfficialForm } from "./OfficialForm";
import { ProfessionalForm } from "./ProfessionalForm";
import { TravelerCheckForm } from "./TravelerCheckForm";
import { CardForm } from "./CardForm";
import { PrepaidForm } from "./PrepaidForm";
import { RewardForm } from "./RewardForm";
import { ValuableForm } from "./ValuableForm";
import { ArtForm } from "./ArtForm";
import { DevelopmentForm } from "./DevelopmentForm";

const EXTENSION_FORM_MAP: Record<
	string,
	React.ComponentType<ExtensionFormProps>
> = {
	VEH: VehicleForm,
	INM: RealEstateForm,
	MJR: JewelryForm,
	AVI: VirtualAssetForm,
	JYS: GamblingForm,
	ARI: RentalForm,
	BLI: ArmoringForm,
	DON: DonationForm,
	MPC: LoanForm,
	FEP: OfficialForm,
	SPR: ProfessionalForm,
	CHV: TravelerCheckForm,
	TSC: CardForm,
	TPP: PrepaidForm,
	TDR: RewardForm,
	TCV: ValuableForm,
	OBA: ArtForm,
	DIN: DevelopmentForm,
};

/**
 * Returns the extension form component for a given activity code.
 * Returns null for FES (no XSD schema available).
 */
export function getExtensionForm(
	activityCode: ActivityCode,
): React.ComponentType<ExtensionFormProps> | null {
	return EXTENSION_FORM_MAP[activityCode] ?? null;
}
