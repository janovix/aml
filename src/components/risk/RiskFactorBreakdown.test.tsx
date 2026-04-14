import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { RiskFactorBreakdown } from "./RiskFactorBreakdown";
import type { ElementScore } from "@/lib/api/risk";

describe("RiskFactorBreakdown", () => {
	it("renders known element label and factors", () => {
		const elements: ElementScore[] = [
			{
				elementType: "CLIENT",
				factors: [
					{
						name: "F1",
						score: 1,
						weight: 1,
						weightedScore: 2.5,
					},
				],
				rawScore: 5,
				riskLevel: "MEDIUM",
			},
		];

		render(<RiskFactorBreakdown elements={elements} language="es" />);
		expect(screen.getByText("Clientes")).toBeInTheDocument();
		expect(screen.getByText("F1")).toBeInTheDocument();
	});

	it("falls back to raw elementType for unknown codes", () => {
		const elements: ElementScore[] = [
			{
				elementType: "CUSTOM_X",
				factors: [],
				rawScore: 3,
				riskLevel: "LOW",
			},
		];

		render(<RiskFactorBreakdown elements={elements} />);
		expect(screen.getByText("CUSTOM_X")).toBeInTheDocument();
	});
});
