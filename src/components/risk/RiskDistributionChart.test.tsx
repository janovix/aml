import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { RiskDistributionChart } from "./RiskDistributionChart";

describe("RiskDistributionChart", () => {
	const distribution = {
		LOW: 40,
		MEDIUM_LOW: 20,
		MEDIUM: 15,
		MEDIUM_HIGH: 10,
		HIGH: 5,
	};

	it("renders legend items for each risk level", () => {
		render(
			<RiskDistributionChart
				distribution={distribution}
				total={90}
				language="es"
			/>,
		);
		expect(screen.getByText(/Bajo \(44%\)/)).toBeInTheDocument();
		expect(screen.getByText(/Alto \(6%\)/)).toBeInTheDocument();
	});

	it("shows counts in legend", () => {
		render(
			<RiskDistributionChart
				distribution={distribution}
				total={90}
				language="en"
			/>,
		);
		expect(screen.getByText("40")).toBeInTheDocument();
		expect(screen.getByText("5")).toBeInTheDocument();
	});

	it("renders empty state when total is 0", () => {
		render(
			<RiskDistributionChart
				distribution={{
					LOW: 0,
					MEDIUM_LOW: 0,
					MEDIUM: 0,
					MEDIUM_HIGH: 0,
					HIGH: 0,
				}}
				total={0}
				language="es"
			/>,
		);
		expect(
			screen.getByText("Sin datos de distribución de riesgo"),
		).toBeInTheDocument();
	});

	it("renders English empty state", () => {
		render(
			<RiskDistributionChart
				distribution={{
					LOW: 0,
					MEDIUM_LOW: 0,
					MEDIUM: 0,
					MEDIUM_HIGH: 0,
					HIGH: 0,
				}}
				total={0}
				language="en"
			/>,
		);
		expect(screen.getByText("No risk distribution data")).toBeInTheDocument();
	});
});
