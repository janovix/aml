import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FieldLabel } from "./FieldLabel";

describe("FieldLabel", () => {
	it("renders label text", () => {
		render(<FieldLabel>Email</FieldLabel>);
		expect(screen.getByText("Email")).toBeInTheDocument();
	});

	it("renders without tier as a plain label", () => {
		const { container } = render(
			<FieldLabel htmlFor="email">Email</FieldLabel>,
		);
		const label = container.querySelector("label");
		expect(label).toBeInTheDocument();
		expect(label?.getAttribute("for")).toBe("email");
	});

	it("renders required indicator", () => {
		render(<FieldLabel required>Email</FieldLabel>);
		expect(screen.getByText("*")).toBeInTheDocument();
	});

	it("renders tier dot for sat_required", () => {
		const { container } = render(
			<FieldLabel tier="sat_required">Nombre</FieldLabel>,
		);
		const dot = container.querySelector(".rounded-full");
		expect(dot).toBeInTheDocument();
		expect(dot?.className).toContain("bg-red-500");
	});

	it("renders tier dot for alert_required", () => {
		const { container } = render(
			<FieldLabel tier="alert_required">RFC</FieldLabel>,
		);
		const dot = container.querySelector(".rounded-full");
		expect(dot).toBeInTheDocument();
		expect(dot?.className).toContain("bg-yellow-500");
	});

	it("renders tier dot for kyc_optional", () => {
		const { container } = render(
			<FieldLabel tier="kyc_optional">PEP</FieldLabel>,
		);
		const dot = container.querySelector(".rounded-full");
		expect(dot).toBeInTheDocument();
		expect(dot?.className).toContain("bg-gray-400");
	});

	it("applies custom className", () => {
		const { container } = render(
			<FieldLabel className="custom">Label</FieldLabel>,
		);
		const label = container.querySelector(".custom");
		expect(label).toBeInTheDocument();
	});
});
