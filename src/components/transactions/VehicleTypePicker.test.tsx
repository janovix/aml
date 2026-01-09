import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { VehicleTypePicker, vehicleTypeConfigs } from "./VehicleTypePicker";
import { renderWithProviders } from "@/lib/testHelpers";

describe("VehicleTypePicker", () => {
	it("renders all three vehicle type options", () => {
		const onChange = vi.fn();
		renderWithProviders(<VehicleTypePicker value="" onChange={onChange} />);

		// Check for all three vehicle type buttons by their Spanish labels
		expect(
			screen.getByRole("radio", { name: /terrestre/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("radio", { name: /marítimo/i }),
		).toBeInTheDocument();
		expect(screen.getByRole("radio", { name: /aéreo/i })).toBeInTheDocument();
	});

	it("renders with radiogroup role", () => {
		const onChange = vi.fn();
		renderWithProviders(<VehicleTypePicker value="" onChange={onChange} />);

		expect(screen.getByRole("radiogroup")).toBeInTheDocument();
	});

	it("calls onChange when an option is clicked", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderWithProviders(<VehicleTypePicker value="" onChange={onChange} />);

		const landButton = screen.getByRole("radio", { name: /terrestre/i });
		await user.click(landButton);

		expect(onChange).toHaveBeenCalledWith("land");
	});

	it("calls onChange with correct value for each type", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderWithProviders(<VehicleTypePicker value="" onChange={onChange} />);

		// Click marine
		const marineButton = screen.getByRole("radio", { name: /marítimo/i });
		await user.click(marineButton);
		expect(onChange).toHaveBeenCalledWith("marine");

		// Click air
		const airButton = screen.getByRole("radio", { name: /aéreo/i });
		await user.click(airButton);
		expect(onChange).toHaveBeenCalledWith("air");
	});

	it("marks the selected option with aria-checked", () => {
		const onChange = vi.fn();
		renderWithProviders(<VehicleTypePicker value="land" onChange={onChange} />);

		const landButton = screen.getByRole("radio", { name: /terrestre/i });
		const marineButton = screen.getByRole("radio", { name: /marítimo/i });
		const airButton = screen.getByRole("radio", { name: /aéreo/i });

		expect(landButton).toHaveAttribute("aria-checked", "true");
		expect(marineButton).toHaveAttribute("aria-checked", "false");
		expect(airButton).toHaveAttribute("aria-checked", "false");
	});

	it("marks marine as selected when value is marine", () => {
		const onChange = vi.fn();
		renderWithProviders(
			<VehicleTypePicker value="marine" onChange={onChange} />,
		);

		const landButton = screen.getByRole("radio", { name: /terrestre/i });
		const marineButton = screen.getByRole("radio", { name: /marítimo/i });
		const airButton = screen.getByRole("radio", { name: /aéreo/i });

		expect(landButton).toHaveAttribute("aria-checked", "false");
		expect(marineButton).toHaveAttribute("aria-checked", "true");
		expect(airButton).toHaveAttribute("aria-checked", "false");
	});

	it("marks air as selected when value is air", () => {
		const onChange = vi.fn();
		renderWithProviders(<VehicleTypePicker value="air" onChange={onChange} />);

		const landButton = screen.getByRole("radio", { name: /terrestre/i });
		const marineButton = screen.getByRole("radio", { name: /marítimo/i });
		const airButton = screen.getByRole("radio", { name: /aéreo/i });

		expect(landButton).toHaveAttribute("aria-checked", "false");
		expect(marineButton).toHaveAttribute("aria-checked", "false");
		expect(airButton).toHaveAttribute("aria-checked", "true");
	});

	it("disables all options when disabled prop is true", () => {
		const onChange = vi.fn();
		renderWithProviders(
			<VehicleTypePicker value="" onChange={onChange} disabled />,
		);

		const landButton = screen.getByRole("radio", { name: /terrestre/i });
		const marineButton = screen.getByRole("radio", { name: /marítimo/i });
		const airButton = screen.getByRole("radio", { name: /aéreo/i });

		expect(landButton).toBeDisabled();
		expect(marineButton).toBeDisabled();
		expect(airButton).toBeDisabled();
	});

	it("does not call onChange when disabled and clicked", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderWithProviders(
			<VehicleTypePicker value="" onChange={onChange} disabled />,
		);

		const landButton = screen.getByRole("radio", { name: /terrestre/i });
		await user.click(landButton);

		expect(onChange).not.toHaveBeenCalled();
	});

	it("applies custom className when provided", () => {
		const onChange = vi.fn();
		renderWithProviders(
			<VehicleTypePicker
				value=""
				onChange={onChange}
				className="custom-class"
			/>,
		);

		const radiogroup = screen.getByRole("radiogroup");
		expect(radiogroup).toHaveClass("custom-class");
	});

	it("applies custom id when provided", () => {
		const onChange = vi.fn();
		renderWithProviders(
			<VehicleTypePicker value="" onChange={onChange} id="my-picker" />,
		);

		const radiogroup = screen.getByRole("radiogroup");
		expect(radiogroup).toHaveAttribute("id", "my-picker");
	});

	it("exports vehicleTypeConfigs with correct structure", () => {
		expect(vehicleTypeConfigs).toHaveLength(3);

		const types = vehicleTypeConfigs.map((c) => c.type);
		expect(types).toContain("land");
		expect(types).toContain("marine");
		expect(types).toContain("air");

		// Check that each config has required properties
		vehicleTypeConfigs.forEach((config) => {
			expect(config).toHaveProperty("type");
			expect(config).toHaveProperty("labelKey");
		});
	});
});
