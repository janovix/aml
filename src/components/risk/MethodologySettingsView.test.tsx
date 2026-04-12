import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { MethodologySettingsView } from "./MethodologySettingsView";
import { renderWithProviders } from "@/lib/testHelpers";
import type { MethodologyData } from "@/lib/api/risk";

const getEffectiveMethodology = vi.fn();
vi.mock("@/lib/api/risk", () => ({
	getEffectiveMethodology: (...a: unknown[]) => getEffectiveMethodology(...a),
	resetMethodologyToDefault: vi.fn(),
	saveMethodologyOverride: vi.fn(),
}));

vi.mock("@/hooks/useJwt", () => ({
	useJwt: () => ({ jwt: "jwt-1" }),
}));

vi.mock("@/hooks/useOrgNavigation", () => ({
	useOrgNavigation: () => ({ orgPath: (p: string) => `/o${p}` }),
}));

vi.mock("sonner", () => ({
	toast: { error: vi.fn(), success: vi.fn() },
}));

function makeMethodology(): MethodologyData {
	return {
		id: "m1",
		scope: "ORGANIZATION",
		sourceScope: "ORGANIZATION",
		name: "Test methodology",
		version: 1,
		scaleMax: 100,
		categories: [],
		thresholds: [],
		mitigants: [],
	};
}

describe("MethodologySettingsView", () => {
	beforeEach(() => {
		getEffectiveMethodology.mockReset();
	});

	it("shows methodology name after load", async () => {
		getEffectiveMethodology.mockResolvedValue(makeMethodology());

		renderWithProviders(<MethodologySettingsView />);

		await waitFor(() => {
			expect(screen.getByText(/Test methodology/)).toBeInTheDocument();
		});
	});
});
