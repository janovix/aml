import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AlertsKpiCards } from "./AlertsKpiCards";

describe("AlertsKpiCards", () => {
	it("should render KPI cards with alert statistics", () => {
		render(<AlertsKpiCards />);

		expect(screen.getByText("Avisos Pendientes")).toBeInTheDocument();
		expect(screen.getByText("En Revisión")).toBeInTheDocument();
		expect(screen.getByText("Resueltos")).toBeInTheDocument();
		expect(screen.getByText("Críticos")).toBeInTheDocument();
	});

	it("should display numeric values for each KPI", () => {
		render(<AlertsKpiCards />);

		const values = screen.getAllByText(/\d+/);
		expect(values.length).toBeGreaterThan(0);
	});
});
