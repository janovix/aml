/**
 * Tests for all 18 operation extension forms.
 *
 * All forms follow the same ExtensionFormProps interface pattern:
 * - value: Record<string, unknown>
 * - onChange: (value) => void
 * - disabled?: boolean
 *
 * Each form renders a grid of fields (FieldLabel + Input/CatalogSelector).
 * We test: rendering, onChange callback, disabled propagation, and the
 * getExtensionForm registry function.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/lib/testHelpers";
import {
	VehicleForm,
	RealEstateForm,
	JewelryForm,
	VirtualAssetForm,
	GamblingForm,
	RentalForm,
	ArmoringForm,
	DonationForm,
	LoanForm,
	OfficialForm,
	ProfessionalForm,
	TravelerCheckForm,
	CardForm,
	PrepaidForm,
	RewardForm,
	ValuableForm,
	ArtForm,
	DevelopmentForm,
	getExtensionForm,
	type ExtensionFormProps,
} from ".";
import type { ActivityCode } from "@/types/operation";

// Mock CatalogSelector to avoid API calls
vi.mock("@/components/catalogs/CatalogSelector", () => ({
	CatalogSelector: ({
		value,
		onValueChange,
		placeholder,
		disabled,
	}: {
		catalogKey: string;
		value: string;
		onValueChange: (val: string | null) => void;
		placeholder?: string;
		disabled?: boolean;
	}) => (
		<select
			data-testid="catalog-selector"
			value={value}
			onChange={(e) => onValueChange(e.target.value || null)}
			disabled={disabled}
			aria-label={placeholder}
		>
			<option value="">{placeholder}</option>
			<option value="test-value">Test Value</option>
		</select>
	),
}));

/**
 * Helper to test any extension form for basic behavior
 */
function testExtensionForm(
	name: string,
	FormComponent: React.ComponentType<ExtensionFormProps>,
	requiredFields: string[],
) {
	describe(name, () => {
		it("renders without crashing", () => {
			const onChange = vi.fn();
			renderWithProviders(<FormComponent value={{}} onChange={onChange} />);
		});

		it("calls onChange when input values change", async () => {
			const user = userEvent.setup();
			const onChange = vi.fn();
			renderWithProviders(<FormComponent value={{}} onChange={onChange} />);

			// Find the first text input and type in it
			const inputs = screen.getAllByRole("textbox");
			if (inputs.length > 0) {
				await user.type(inputs[0], "x");
				expect(onChange).toHaveBeenCalled();
			}
		});

		it("disables all inputs when disabled prop is true", () => {
			const onChange = vi.fn();
			renderWithProviders(
				<FormComponent value={{}} onChange={onChange} disabled />,
			);

			const inputs = screen.getAllByRole("textbox");
			for (const input of inputs) {
				expect(input).toBeDisabled();
			}
		});

		it("renders existing values", () => {
			const onChange = vi.fn();
			const value: Record<string, unknown> = {};
			for (const field of requiredFields) {
				value[field] = "test-value";
			}

			renderWithProviders(<FormComponent value={value} onChange={onChange} />);

			// At least one input should have the test value
			const inputs = screen.getAllByRole("textbox");
			const hasValue = inputs.some(
				(input) => (input as HTMLInputElement).value === "test-value",
			);
			if (requiredFields.some((f) => !f.endsWith("Code"))) {
				// Only non-Code fields are text inputs
				expect(hasValue).toBe(true);
			}
		});
	});
}

// Test each extension form
testExtensionForm("VehicleForm", VehicleForm, [
	"model",
	"year",
	"vin",
	"plates",
]);
testExtensionForm("RealEstateForm", RealEstateForm, [
	"street",
	"externalNumber",
	"postalCode",
]);
testExtensionForm("JewelryForm", JewelryForm, [
	"metalType",
	"weightGrams",
	"purity",
]);
testExtensionForm("VirtualAssetForm", VirtualAssetForm, [
	"blockchainTxHash",
	"walletAddressOrigin",
]);
testExtensionForm("GamblingForm", GamblingForm, ["prizeAmount", "betAmount"]);
testExtensionForm("RentalForm", RentalForm, ["monthlyRent", "depositAmount"]);
testExtensionForm("ArmoringForm", ArmoringForm, [
	"vehicleBrand",
	"vehicleModel",
]);
testExtensionForm("DonationForm", DonationForm, ["purpose", "campaignName"]);
testExtensionForm("LoanForm", LoanForm, [
	"principalAmount",
	"interestRate",
	"termMonths",
]);
testExtensionForm("OfficialForm", OfficialForm, [
	"instrumentNumber",
	"instrumentDate",
]);
testExtensionForm("ProfessionalForm", ProfessionalForm, ["serviceDescription"]);
testExtensionForm("TravelerCheckForm", TravelerCheckForm, [
	"serialNumbers",
	"issuerName",
]);
testExtensionForm("CardForm", CardForm, ["cardBrand", "creditLimit"]);
testExtensionForm("PrepaidForm", PrepaidForm, [
	"reloadAmount",
	"currentBalance",
]);
testExtensionForm("RewardForm", RewardForm, ["programName", "pointsAmount"]);
testExtensionForm("ValuableForm", ValuableForm, [
	"transportMethod",
	"declaredValue",
]);
testExtensionForm("ArtForm", ArtForm, ["title", "artist"]);
testExtensionForm("DevelopmentForm", DevelopmentForm, [
	"projectName",
	"projectLocation",
]);

describe("getExtensionForm registry", () => {
	const activityFormMap: Array<[ActivityCode, string]> = [
		["VEH", "VehicleForm"],
		["INM", "RealEstateForm"],
		["MJR", "JewelryForm"],
		["AVI", "VirtualAssetForm"],
		["JYS", "GamblingForm"],
		["ARI", "RentalForm"],
		["BLI", "ArmoringForm"],
		["DON", "DonationForm"],
		["MPC", "LoanForm"],
		["FEP", "OfficialForm"],
		["SPR", "ProfessionalForm"],
		["CHV", "TravelerCheckForm"],
		["TSC", "CardForm"],
		["TPP", "PrepaidForm"],
		["TDR", "RewardForm"],
		["TCV", "ValuableForm"],
		["OBA", "ArtForm"],
		["DIN", "DevelopmentForm"],
	];

	it.each(activityFormMap)("returns a component for activity %s", (code) => {
		const form = getExtensionForm(code);
		expect(form).not.toBeNull();
	});

	it("returns null for FES (no XSD schema)", () => {
		const form = getExtensionForm("FES");
		expect(form).toBeNull();
	});

	it("returns null for unknown activity codes", () => {
		const form = getExtensionForm("UNKNOWN" as ActivityCode);
		expect(form).toBeNull();
	});
});
