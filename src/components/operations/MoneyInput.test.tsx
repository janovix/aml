import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MoneyInput } from "./MoneyInput";
import { renderWithProviders } from "@/lib/testHelpers";

vi.mock("@/hooks/useCurrencies", () => ({
	useCurrencies: () => ({
		currencies: [
			{ shortName: "MXN", name: "Peso mexicano" },
			{ shortName: "USD", name: "Dólar" },
		],
		loading: false,
		getByCode: (code: string) =>
			code === "MXN"
				? { shortName: "MXN", name: "Peso mexicano" }
				: code === "USD"
					? { shortName: "USD", name: "Dólar" }
					: undefined,
	}),
}));

vi.mock("@/lib/api/exchange-rates", () => ({
	fetchExchangeRate: vi.fn().mockResolvedValue({ rate: 18.5 }),
}));

describe("MoneyInput", () => {
	it("calls onAmountChange when typing in amount field", async () => {
		const user = userEvent.setup();
		const onAmountChange = vi.fn();
		const onCurrencyChange = vi.fn();

		renderWithProviders(
			<MoneyInput
				amount=""
				currencyCode="MXN"
				onAmountChange={onAmountChange}
				onCurrencyChange={onCurrencyChange}
				mainCurrency="MXN"
				label="Monto"
				autoFetchRate={false}
			/>,
		);

		const input = screen.getByRole("textbox");
		await user.type(input, "50");
		expect(onAmountChange.mock.calls.length).toBeGreaterThan(0);
	});
});
