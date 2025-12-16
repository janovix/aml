import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { KpiCards } from "./KpiCards";

describe("KpiCards", () => {
	it("renders all KPI cards", () => {
		render(<KpiCards />);

		expect(screen.getByText("Avisos Abiertos")).toBeInTheDocument();
		expect(screen.getByText("Revisiones Urgentes")).toBeInTheDocument();
		expect(screen.getByText("Revisiones Completadas")).toBeInTheDocument();
		expect(screen.getByText("Total Clientes")).toBeInTheDocument();
	});

	it("displays correct values", () => {
		render(<KpiCards />);

		const values37 = screen.getAllByText("37");
		const values12 = screen.getAllByText("12");
		const values156 = screen.getAllByText("156");
		const values1248 = screen.getAllByText("1,248");
		expect(values37.length).toBeGreaterThan(0);
		expect(values12.length).toBeGreaterThan(0);
		expect(values156.length).toBeGreaterThan(0);
		expect(values1248.length).toBeGreaterThan(0);
	});

	it("displays trend information", () => {
		render(<KpiCards />);

		const trend8 = screen.getAllByText("8%");
		const trend23 = screen.getAllByText("23%");
		const trend12 = screen.getAllByText("12%");
		const nuevosHoy = screen.getAllByText("nuevos hoy");
		const esteMes = screen.getAllByText("este mes");
		const vsMes = screen.getAllByText("vs mes anterior");
		expect(trend8.length).toBeGreaterThan(0);
		expect(nuevosHoy.length).toBeGreaterThan(0);
		expect(trend23.length).toBeGreaterThan(0);
		expect(esteMes.length).toBeGreaterThan(0);
		expect(trend12.length).toBeGreaterThan(0);
		expect(vsMes.length).toBeGreaterThan(0);
	});

	it("has proper accessibility label", () => {
		render(<KpiCards />);

		const sections = screen.getAllByLabelText("Indicadores clave de rendimiento");
		expect(sections.length).toBeGreaterThan(0);
	});
});
