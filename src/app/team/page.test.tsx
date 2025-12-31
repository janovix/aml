import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import TeamPage from "./page";

// Mock the OrgTeamTable component
vi.mock("@/components/org", () => ({
	OrgTeamTable: () => (
		<div data-testid="org-team-table">Mocked OrgTeamTable</div>
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
});
