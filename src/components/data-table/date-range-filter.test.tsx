"use client";

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DateRangeFilter } from "./date-range-filter";

describe("DateRangeFilter", () => {
	it("calls onChangeRange when Apply is clicked with dates", async () => {
		const user = userEvent.setup();
		const onChangeRange = vi.fn();
		const onClear = vi.fn();

		render(
			<DateRangeFilter
				id="d1"
				label="Fecha"
				activeValues={[]}
				onChangeRange={onChangeRange}
				onClear={onClear}
			/>,
		);

		await user.click(screen.getByRole("button", { name: /fecha/i }));
		const inputs = document.querySelectorAll('input[type="date"]');
		expect(inputs.length).toBe(2);
		fireEvent.change(inputs[0]!, { target: { value: "2024-01-01" } });
		fireEvent.change(inputs[1]!, { target: { value: "2024-12-31" } });
		await user.click(screen.getByRole("button", { name: /aplicar/i }));

		expect(onChangeRange).toHaveBeenCalledWith("2024-01-01", "2024-12-31");
	});

	it("shows clear and calls onClear when active", async () => {
		const user = userEvent.setup();
		const onClear = vi.fn();

		render(
			<DateRangeFilter
				id="d1"
				label="Fecha"
				activeValues={["2024-01-01", ""]}
				onChangeRange={vi.fn()}
				onClear={onClear}
				clearText="Reset"
			/>,
		);

		await user.click(screen.getByRole("button", { name: /fecha/i }));
		await user.click(screen.getByRole("button", { name: "Reset" }));
		expect(onClear).toHaveBeenCalled();
	});
});
