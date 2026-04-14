import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { BeneficialControllerSection } from "./BeneficialControllerSection";
import { renderWithProviders } from "@/lib/testHelpers";
import * as bcApi from "@/lib/api/beneficial-controllers";
import * as shApi from "@/lib/api/shareholders";

vi.mock("@/lib/api/beneficial-controllers", () => ({
	listClientBeneficialControllers: vi.fn(),
	deleteBeneficialController: vi.fn(),
}));

vi.mock("@/lib/api/shareholders", () => ({
	listClientShareholders: vi.fn(),
}));

vi.mock("@/components/clients/BeneficialControllerFormDialog", () => ({
	BeneficialControllerFormDialog: () => null,
}));

describe("BeneficialControllerSection", () => {
	beforeEach(() => {
		vi.mocked(bcApi.listClientBeneficialControllers).mockResolvedValue({
			data: [],
			total: 0,
		});
		vi.mocked(shApi.listClientShareholders).mockResolvedValue({
			data: [],
			total: 0,
		});
	});

	it("renders BC card for moral person after load", async () => {
		renderWithProviders(
			<BeneficialControllerSection clientId="c1" personType="moral" />,
		);

		await waitFor(() => {
			expect(
				screen.getByText("Beneficiarios Controladores"),
			).toBeInTheDocument();
		});
	});
});
