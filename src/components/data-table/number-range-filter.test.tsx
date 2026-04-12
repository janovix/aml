"use client";

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NumberRangeFilter } from "./number-range-filter";

describe("NumberRangeFilter", () => {
	it("calls onChangeRange when Apply is clicked with values", async () => {
		const user = userEvent.setup();
		const onChangeRange = vi.fn();

		render(
			<NumberRangeFilter
				id="n1"
				label="Monto"
				min="0"
				max="1000000"
				activeValues={[]}
				onChangeRange={onChangeRange}
				onClear={vi.fn()}
			/>,
		);

		await user.click(screen.getByRole("button", { name: /monto/i }));
		const inputs = document.querySelectorAll('input[type="number"]');
		expect(inputs.length).toBe(2);
		fireEvent.change(inputs[0]!, { target: { value: "1000" } });
		fireEvent.change(inputs[1]!, { target: { value: "5000" } });
		await user.click(screen.getByRole("button", { name: /aplicar/i }));

		expect(onChangeRange).toHaveBeenCalledWith("1000", "5000");
	});

	it("shows range hint when min/max provided", async () => {
		const user = userEvent.setup();

		render(
			<NumberRangeFilter
				id="n1"
				label="Monto"
				min="10"
				max="99"
				activeValues={[]}
				onChangeRange={vi.fn()}
				onClear={vi.fn()}
			/>,
		);

		await user.click(screen.getByRole("button", { name: /monto/i }));
		expect(screen.getByText(/rango:/i)).toBeInTheDocument();
	});
});
