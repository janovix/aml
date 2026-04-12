import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ClientRiskSection } from "./ClientRiskSection";
import { renderWithProviders } from "@/lib/testHelpers";
import { makeClientRiskAssessment } from "./risk-test-fixtures";

const getClientRiskAssessment = vi.fn();
const getClientRiskHistory = vi.fn();
const triggerClientRiskAssessment = vi.fn();

vi.mock("@/lib/api/risk", () => ({
	getClientRiskAssessment: (...a: unknown[]) => getClientRiskAssessment(...a),
	getClientRiskHistory: (...a: unknown[]) => getClientRiskHistory(...a),
	triggerClientRiskAssessment: (...a: unknown[]) =>
		triggerClientRiskAssessment(...a),
}));

vi.mock("@/hooks/useJwt", () => ({
	useJwt: () => ({ jwt: "jwt-1" }),
}));

vi.mock("@/hooks/useOrgNavigation", () => ({
	useOrgNavigation: () => ({ orgPath: (p: string) => `/o${p}` }),
}));

describe("ClientRiskSection", () => {
	beforeEach(() => {
		getClientRiskAssessment.mockReset();
		getClientRiskHistory.mockReset();
		triggerClientRiskAssessment.mockReset();
	});

	it("renders element breakdown when assessment loads", async () => {
		const assessment = makeClientRiskAssessment();
		getClientRiskAssessment.mockResolvedValue(assessment);
		getClientRiskHistory.mockResolvedValue([]);

		renderWithProviders(<ClientRiskSection clientId="c-1" />);

		await waitFor(() => {
			expect(screen.getByText("Desglose por Elementos")).toBeInTheDocument();
		});
	});

	it("calls triggerClientRiskAssessment when Re-evaluar clicked", async () => {
		const user = userEvent.setup();
		const assessment = makeClientRiskAssessment();
		getClientRiskAssessment.mockResolvedValue(assessment);
		getClientRiskHistory.mockResolvedValue([]);
		triggerClientRiskAssessment.mockResolvedValue(undefined);

		renderWithProviders(<ClientRiskSection clientId="c-1" />);

		await waitFor(() =>
			expect(screen.getByRole("button", { name: /re-evaluar/i })).toBeEnabled(),
		);

		await user.click(screen.getByRole("button", { name: /re-evaluar/i }));
		await waitFor(() =>
			expect(triggerClientRiskAssessment).toHaveBeenCalledWith(
				"c-1",
				expect.objectContaining({ jwt: "jwt-1" }),
			),
		);
	});
});
