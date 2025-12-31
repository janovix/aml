import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ReportesPage from "./page";

// Mock the ReportsTable component
vi.mock("@/components/reports", () => ({
	ReportsTable: () => (
		<div data-testid="reports-table">Mocked ReportsTable</div>
	),
}));

describe("ReportesPage", () => {
	it("renders the page title", () => {
		render(<ReportesPage />);

		expect(
			screen.getByRole("heading", { name: "Reportes", level: 1 }),
		).toBeInTheDocument();
	});

	it("renders the page description", () => {
		render(<ReportesPage />);

		expect(
			screen.getByText("Gestión y seguimiento de reportes AML"),
		).toBeInTheDocument();
	});

	it("renders the ReportsTable component", () => {
		render(<ReportesPage />);

		expect(screen.getByTestId("reports-table")).toBeInTheDocument();
	});
});
