import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { RiskScoreGauge } from "./RiskScoreGauge";

describe("RiskScoreGauge", () => {
	it("renders the score value", () => {
		render(<RiskScoreGauge score={5.5} level="MEDIUM" />);
		expect(screen.getByText("5.5")).toBeInTheDocument();
	});

	it("renders label when provided", () => {
		render(
			<RiskScoreGauge score={3.2} level="MEDIUM_LOW" label="Inherent Risk" />,
		);
		expect(screen.getByText("Inherent Risk")).toBeInTheDocument();
	});

	it("does not render label when not provided", () => {
		const { container } = render(<RiskScoreGauge score={7.0} level="HIGH" />);
		const spans = container.querySelectorAll("span");
		const labelSpans = Array.from(spans).filter((s) =>
			s.classList.contains("text-xs"),
		);
		expect(labelSpans).toHaveLength(0);
	});

	it("renders SVG circles", () => {
		const { container } = render(
			<RiskScoreGauge score={4.0} level="MEDIUM_LOW" />,
		);
		const circles = container.querySelectorAll("circle");
		expect(circles).toHaveLength(2);
	});
});
