import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import AlertasPage from "./page";

// Mock the AlertsTable component
vi.mock("@/components/alerts", () => ({
	AlertsTable: () => <div data-testid="alerts-table">Mocked AlertsTable</div>,
}));

describe("AlertasPage", () => {
	it("renders the page title", () => {
		render(<AlertasPage />);

		expect(
			screen.getByRole("heading", { name: "Alertas", level: 1 }),
		).toBeInTheDocument();
	});

	it("renders the page description", () => {
		render(<AlertasPage />);

		expect(
			screen.getByText("Monitoreo y gestión de alertas AML"),
		).toBeInTheDocument();
	});

	it("renders the AlertsTable component", () => {
		render(<AlertasPage />);

		expect(screen.getByTestId("alerts-table")).toBeInTheDocument();
	});
});
