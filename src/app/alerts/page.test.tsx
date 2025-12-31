import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import AlertsPage from "./page";

// Mock the AlertsTable component
vi.mock("@/components/alerts", () => ({
	AlertsTable: () => <div data-testid="alerts-table">Mocked AlertsTable</div>,
}));

describe("AlertsPage", () => {
	it("renders the AlertsTable component", () => {
		render(<AlertsPage />);

		expect(screen.getByTestId("alerts-table")).toBeInTheDocument();
	});
});
