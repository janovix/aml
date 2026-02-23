import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LabelWithInfo } from "./LabelWithInfo";

describe("LabelWithInfo", () => {
	it("renders plain label without tier or description", () => {
		render(<LabelWithInfo htmlFor="name">Nombre</LabelWithInfo>);
		const label = screen.getByText("Nombre");
		expect(label).toBeInTheDocument();
		expect(label.tagName).toBe("LABEL");
	});

	it("renders required indicator", () => {
		render(
			<LabelWithInfo required htmlFor="name">
				Nombre
			</LabelWithInfo>,
		);
		expect(screen.getByText("*")).toBeInTheDocument();
	});

	it("renders tier dot for sat_required", () => {
		const { container } = render(
			<LabelWithInfo tier="sat_required">Nombre</LabelWithInfo>,
		);
		const dot = container.querySelector(".bg-red-500");
		expect(dot).toBeInTheDocument();
	});

	it("renders tier dot for alert_required", () => {
		const { container } = render(
			<LabelWithInfo tier="alert_required">RFC</LabelWithInfo>,
		);
		const dot = container.querySelector(".bg-yellow-500");
		expect(dot).toBeInTheDocument();
	});

	it("renders tier dot for kyc_optional", () => {
		const { container } = render(
			<LabelWithInfo tier="kyc_optional">PEP</LabelWithInfo>,
		);
		const dot = container.querySelector(".bg-gray-400");
		expect(dot).toBeInTheDocument();
	});

	it("renders info icon when description is provided", () => {
		render(
			<LabelWithInfo description="This is a help text">Campo</LabelWithInfo>,
		);
		const infoIcon = screen.getByRole("img", {
			name: "Información del campo",
		});
		expect(infoIcon).toBeInTheDocument();
	});

	it("does not render info icon without description", () => {
		render(<LabelWithInfo>Campo</LabelWithInfo>);
		expect(
			screen.queryByRole("img", { name: "Información del campo" }),
		).not.toBeInTheDocument();
	});

	it("renders both tier dot and info icon", () => {
		const { container } = render(
			<LabelWithInfo tier="sat_required" description="Help text">
				Campo
			</LabelWithInfo>,
		);
		const dot = container.querySelector(".bg-red-500");
		const infoIcon = screen.getByRole("img", {
			name: "Información del campo",
		});
		expect(dot).toBeInTheDocument();
		expect(infoIcon).toBeInTheDocument();
	});

	it("applies custom className", () => {
		render(<LabelWithInfo className="my-label">Nombre</LabelWithInfo>);
		expect(screen.getByText("Nombre")).toHaveClass("my-label");
	});
});
