import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { PersonTypePicker, personTypeConfigs } from "./PersonTypePicker";
import { renderWithProviders } from "@/lib/testHelpers";

describe("PersonTypePicker", () => {
	it("renders all three person type options", () => {
		const onChange = vi.fn();
		renderWithProviders(
			<PersonTypePicker value="physical" onChange={onChange} />,
		);

		// Check for all three person type buttons by their Spanish labels
		expect(
			screen.getByRole("radio", { name: /persona física/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("radio", { name: /persona moral/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("radio", { name: /fideicomiso/i }),
		).toBeInTheDocument();
	});

	it("renders with radiogroup role", () => {
		const onChange = vi.fn();
		renderWithProviders(
			<PersonTypePicker value="physical" onChange={onChange} />,
		);

		expect(screen.getByRole("radiogroup")).toBeInTheDocument();
	});

	it("calls onChange when an option is clicked", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderWithProviders(
			<PersonTypePicker value="physical" onChange={onChange} />,
		);

		const moralButton = screen.getByRole("radio", { name: /persona moral/i });
		await user.click(moralButton);

		expect(onChange).toHaveBeenCalledWith("moral");
	});

	it("calls onChange with correct value for each type", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderWithProviders(
			<PersonTypePicker value="physical" onChange={onChange} />,
		);

		// Click moral
		const moralButton = screen.getByRole("radio", { name: /persona moral/i });
		await user.click(moralButton);
		expect(onChange).toHaveBeenCalledWith("moral");

		// Click trust
		const trustButton = screen.getByRole("radio", { name: /fideicomiso/i });
		await user.click(trustButton);
		expect(onChange).toHaveBeenCalledWith("trust");
	});

	it("marks the selected option with aria-checked", () => {
		const onChange = vi.fn();
		renderWithProviders(
			<PersonTypePicker value="physical" onChange={onChange} />,
		);

		const physicalButton = screen.getByRole("radio", {
			name: /persona física/i,
		});
		const moralButton = screen.getByRole("radio", { name: /persona moral/i });
		const trustButton = screen.getByRole("radio", { name: /fideicomiso/i });

		expect(physicalButton).toHaveAttribute("aria-checked", "true");
		expect(moralButton).toHaveAttribute("aria-checked", "false");
		expect(trustButton).toHaveAttribute("aria-checked", "false");
	});

	it("marks moral as selected when value is moral", () => {
		const onChange = vi.fn();
		renderWithProviders(<PersonTypePicker value="moral" onChange={onChange} />);

		const physicalButton = screen.getByRole("radio", {
			name: /persona física/i,
		});
		const moralButton = screen.getByRole("radio", { name: /persona moral/i });
		const trustButton = screen.getByRole("radio", { name: /fideicomiso/i });

		expect(physicalButton).toHaveAttribute("aria-checked", "false");
		expect(moralButton).toHaveAttribute("aria-checked", "true");
		expect(trustButton).toHaveAttribute("aria-checked", "false");
	});

	it("marks trust as selected when value is trust", () => {
		const onChange = vi.fn();
		renderWithProviders(<PersonTypePicker value="trust" onChange={onChange} />);

		const physicalButton = screen.getByRole("radio", {
			name: /persona física/i,
		});
		const moralButton = screen.getByRole("radio", { name: /persona moral/i });
		const trustButton = screen.getByRole("radio", { name: /fideicomiso/i });

		expect(physicalButton).toHaveAttribute("aria-checked", "false");
		expect(moralButton).toHaveAttribute("aria-checked", "false");
		expect(trustButton).toHaveAttribute("aria-checked", "true");
	});

	it("disables all options when disabled prop is true", () => {
		const onChange = vi.fn();
		renderWithProviders(
			<PersonTypePicker value="physical" onChange={onChange} disabled />,
		);

		const physicalButton = screen.getByRole("radio", {
			name: /persona física/i,
		});
		const moralButton = screen.getByRole("radio", { name: /persona moral/i });
		const trustButton = screen.getByRole("radio", { name: /fideicomiso/i });

		expect(physicalButton).toBeDisabled();
		expect(moralButton).toBeDisabled();
		expect(trustButton).toBeDisabled();
	});

	it("does not call onChange when disabled and clicked", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderWithProviders(
			<PersonTypePicker value="physical" onChange={onChange} disabled />,
		);

		const moralButton = screen.getByRole("radio", { name: /persona moral/i });
		await user.click(moralButton);

		expect(onChange).not.toHaveBeenCalled();
	});

	it("applies custom className when provided", () => {
		const onChange = vi.fn();
		renderWithProviders(
			<PersonTypePicker
				value="physical"
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
			<PersonTypePicker value="physical" onChange={onChange} id="my-picker" />,
		);

		const radiogroup = screen.getByRole("radiogroup");
		expect(radiogroup).toHaveAttribute("id", "my-picker");
	});

	it("exports personTypeConfigs with correct structure", () => {
		expect(personTypeConfigs).toHaveLength(3);

		const types = personTypeConfigs.map((c) => c.type);
		expect(types).toContain("physical");
		expect(types).toContain("moral");
		expect(types).toContain("trust");

		// Check that each config has required properties
		personTypeConfigs.forEach((config) => {
			expect(config).toHaveProperty("type");
			expect(config).toHaveProperty("labelKey");
			expect(config).toHaveProperty("descriptionKey");
		});
	});

	it("displays description text for each option", () => {
		const onChange = vi.fn();
		renderWithProviders(
			<PersonTypePicker value="physical" onChange={onChange} />,
		);

		// Check descriptions are rendered
		expect(
			screen.getByText(/individuo o persona natural/i),
		).toBeInTheDocument();
		expect(
			screen.getByText(/empresa o sociedad mercantil/i),
		).toBeInTheDocument();
		expect(
			screen.getByText(/contrato de administración fiduciaria/i),
		).toBeInTheDocument();
	});
});
