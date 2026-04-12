import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { RiskBadge, DDBadge } from "./RiskBadge";

describe("RiskBadge", () => {
	it("renders LOW label in Spanish by default", () => {
		render(<RiskBadge level="LOW" />);
		expect(screen.getByText("Bajo")).toBeInTheDocument();
	});

	it("renders HIGH label in English when specified", () => {
		render(<RiskBadge level="HIGH" language="en" />);
		expect(screen.getByText("High")).toBeInTheDocument();
	});

	it("renders MEDIUM_LOW label in Spanish", () => {
		render(<RiskBadge level="MEDIUM_LOW" language="es" />);
		expect(screen.getByText("Medio-Bajo")).toBeInTheDocument();
	});

	it("renders MEDIUM_HIGH label in English", () => {
		render(<RiskBadge level="MEDIUM_HIGH" language="en" />);
		expect(screen.getByText("Medium-High")).toBeInTheDocument();
	});

	it("applies md size class", () => {
		const { container } = render(<RiskBadge level="HIGH" size="md" />);
		const badge = container.querySelector("[class*='text-sm']");
		expect(badge).toBeInTheDocument();
	});

	it("applies custom className", () => {
		const { container } = render(
			<RiskBadge level="LOW" className="custom-test" />,
		);
		const badge = container.querySelector(".custom-test");
		expect(badge).toBeInTheDocument();
	});
});

describe("DDBadge", () => {
	it("renders SIMPLIFIED label in Spanish", () => {
		render(<DDBadge level="SIMPLIFIED" />);
		expect(screen.getByText("Simplificada")).toBeInTheDocument();
	});

	it("renders STANDARD label in English", () => {
		render(<DDBadge level="STANDARD" language="en" />);
		expect(screen.getByText("Standard")).toBeInTheDocument();
	});

	it("renders ENHANCED label in Spanish", () => {
		render(<DDBadge level="ENHANCED" language="es" />);
		expect(screen.getByText("Reforzada")).toBeInTheDocument();
	});
});
