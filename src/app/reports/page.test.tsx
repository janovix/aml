import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ReportsPage from "./page";

// Mock the ReportsTable component
vi.mock("@/components/reports", () => ({
	ReportsTable: () => (
		<div data-testid="reports-table">Mocked ReportsTable</div>
	),
}));

describe("ReportsPage", () => {
	it("renders the ReportsTable component", () => {
		render(<ReportsPage />);

		expect(screen.getByTestId("reports-table")).toBeInTheDocument();
	});
});
