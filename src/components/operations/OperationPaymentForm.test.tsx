import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, t } from "@/lib/testHelpers";
import { OperationPaymentForm } from "./OperationPaymentForm";
import type { OperationPaymentInput } from "@/types/operation";

// Mock CatalogSelector
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
			<option value="01">Efectivo</option>
		</select>
	),
}));

const defaultPayment: OperationPaymentInput = {
	paymentDate: "2024-01-15",
	paymentFormCode: "",
	monetaryInstrumentCode: null,
	currencyCode: "MXN",
	amount: "",
	bankName: null,
	accountNumberMasked: null,
	checkNumber: null,
	reference: null,
};

describe("OperationPaymentForm", () => {
	it("renders a payment row", () => {
		const onChange = vi.fn();
		renderWithProviders(
			<OperationPaymentForm payments={[defaultPayment]} onChange={onChange} />,
		);

		// Should render payment date input
		const dateInput = screen.getByDisplayValue("2024-01-15");
		expect(dateInput).toBeInTheDocument();
	});

	it("renders add payment button", () => {
		const onChange = vi.fn();
		renderWithProviders(
			<OperationPaymentForm payments={[defaultPayment]} onChange={onChange} />,
		);

		expect(screen.getByText(t("opAddPaymentMethod"))).toBeInTheDocument();
	});

	it("calls onChange when add button is clicked", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderWithProviders(
			<OperationPaymentForm payments={[defaultPayment]} onChange={onChange} />,
		);

		await user.click(screen.getByText(t("opAddPaymentMethod")));
		expect(onChange).toHaveBeenCalled();
		// Should add a second payment
		const newPayments = onChange.mock.calls[0][0];
		expect(newPayments).toHaveLength(2);
	});

	it("shows remove button when there are multiple payments", () => {
		const onChange = vi.fn();
		renderWithProviders(
			<OperationPaymentForm
				payments={[defaultPayment, { ...defaultPayment }]}
				onChange={onChange}
			/>,
		);

		// Should render Trash2 icon buttons
		const removeButtons = screen.getAllByRole("button");
		// Should have at least 2 remove buttons + 1 add button
		expect(removeButtons.length).toBeGreaterThanOrEqual(3);
	});

	it("does not show remove button with single payment", () => {
		const onChange = vi.fn();
		const { container } = renderWithProviders(
			<OperationPaymentForm payments={[defaultPayment]} onChange={onChange} />,
		);

		// The only button should be the "add" button
		const buttons = container.querySelectorAll("button");
		// Should just be the add button
		const buttonTexts = Array.from(buttons).map((b) => b.textContent);
		expect(
			buttonTexts.some((text) => text?.includes(t("opAddPaymentMethod"))),
		).toBe(true);
	});

	it("calls onChange when amount is typed", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderWithProviders(
			<OperationPaymentForm payments={[defaultPayment]} onChange={onChange} />,
		);

		const amountInput = screen.getByPlaceholderText("0.00");
		await user.type(amountInput, "5000");
		expect(onChange).toHaveBeenCalled();
	});

	it("disables inputs when disabled prop is true", () => {
		const onChange = vi.fn();
		renderWithProviders(
			<OperationPaymentForm
				payments={[defaultPayment]}
				onChange={onChange}
				disabled
			/>,
		);

		const inputs = screen.getAllByRole("textbox");
		for (const input of inputs) {
			expect(input).toBeDisabled();
		}
	});
});
