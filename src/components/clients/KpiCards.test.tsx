import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { KpiCards } from "./KpiCards";

describe("KpiCards", () => {
	it("renders all KPI cards", () => {
		render(<KpiCards />);

		expect(screen.getByText("Avisos Abiertos")).toBeInTheDocument();
		expect(screen.getByText("Revisiones Urgentes")).toBeInTheDocument();
		expect(screen.getByText("Total Clientes")).toBeInTheDocument();
	});

	it("displays correct values", () => {
		render(<KpiCards />);

		expect(screen.getByText("37")).toBeInTheDocument();
		expect(screen.getByText("12")).toBeInTheDocument();
		expect(screen.getByText("1,248")).toBeInTheDocument();
	});

	it("displays trends when available", () => {
		render(<KpiCards />);

		expect(screen.getByText("nuevos hoy")).toBeInTheDocument();
		expect(screen.getByText("vs mes anterior")).toBeInTheDocument();
	});
});
