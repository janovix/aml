import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TransactionsKpiCards } from "./TransactionsKpiCards";
import { mockTransactions } from "@/data/mockTransactions";

describe("TransactionsKpiCards", () => {
	it("renders all KPI cards", () => {
		render(<TransactionsKpiCards />);

		expect(screen.getByText("Total Transacciones")).toBeInTheDocument();
		expect(screen.getByText("Monto Total")).toBeInTheDocument();
		expect(screen.getByText("Completadas")).toBeInTheDocument();
		expect(screen.getByText("En Revisión")).toBeInTheDocument();
		expect(screen.getByText("Avisos Totales")).toBeInTheDocument();
	});

	it("displays correct transaction count", () => {
		render(<TransactionsKpiCards />);

		const countElements = screen.getAllByText(
			mockTransactions.length.toString(),
		);
		expect(countElements.length).toBeGreaterThan(0);
	});

	it("displays correct completed count", () => {
		render(<TransactionsKpiCards />);

		const completedCount = mockTransactions.filter(
			(txn) => txn.status === "COMPLETADA",
		).length;
		const countElements = screen.getAllByText(completedCount.toString());
		expect(countElements.length).toBeGreaterThan(0);
	});

	it("displays correct pending count", () => {
		render(<TransactionsKpiCards />);

		const pendingCount = mockTransactions.filter(
			(txn) => txn.status === "PENDIENTE" || txn.status === "EN_REVISION",
		).length;
		const countElements = screen.getAllByText(pendingCount.toString());
		expect(countElements.length).toBeGreaterThan(0);
	});

	it("displays total alerts", () => {
		render(<TransactionsKpiCards />);

		const totalAlerts = mockTransactions.reduce(
			(sum, txn) => sum + txn.alertCount,
			0,
		);
		const countElements = screen.getAllByText(totalAlerts.toString());
		expect(countElements.length).toBeGreaterThan(0);
	});

	it("has accessible labels", () => {
		render(<TransactionsKpiCards />);

		const sections = screen.getAllByLabelText(
			"Indicadores clave de rendimiento",
		);
		expect(sections.length).toBeGreaterThan(0);
	});
});
