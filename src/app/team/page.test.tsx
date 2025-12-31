import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import TeamPage from "./page";

// Mock the OrgTeamTable component
vi.mock("@/components/org", () => ({
	OrgTeamTable: () => (
		<div data-testid="org-team-table">Mocked OrgTeamTable</div>
	),
}));

// Mock the AlertsTable component
vi.mock("@/components/alerts", () => ({
	AlertsTable: () => <div data-testid="alerts-table">Mocked AlertsTable</div>,
}));

// Mock the ReportsTable component
vi.mock("@/components/reports", () => ({
	ReportsTable: () => (
		<div data-testid="reports-table">Mocked ReportsTable</div>
	),
}));

describe("TeamPage", () => {
	it("renders the page title", () => {
		render(<TeamPage />);

		expect(
			screen.getByRole("heading", { name: "Team", level: 1 }),
		).toBeInTheDocument();
	});

	it("renders the page description", () => {
		render(<TeamPage />);

		expect(
			screen.getByText(
				"Manage your organization's team members and invitations.",
			),
		).toBeInTheDocument();
	});

	it("renders the OrgTeamTable component", () => {
		render(<TeamPage />);

		expect(screen.getByTestId("org-team-table")).toBeInTheDocument();
	});

	it("renders the AlertsTable component", () => {
		render(<TeamPage />);

		expect(screen.getByTestId("alerts-table")).toBeInTheDocument();
	});

	it("renders the ReportsTable component", () => {
		render(<TeamPage />);

		expect(screen.getByTestId("reports-table")).toBeInTheDocument();
	});
});
