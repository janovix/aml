import { describe, it, expect, vi, beforeEach } from "vitest";
import { createExtendedJanbotTools } from "./extended-tools";

vi.mock("@/lib/api/config", () => ({
	getAmlCoreBaseUrl: vi.fn(() => "https://aml.example.com"),
}));

describe("createExtendedJanbotTools", () => {
	beforeEach(() => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({}),
				text: async () => "",
			} as Response),
		);
	});

	it("sends X-Environment on amlFetch", async () => {
		const tools = createExtendedJanbotTools("jwt", {
			dataEnvironment: "development",
		});
		await tools.getRiskDashboardSummary.execute();
		expect(fetch).toHaveBeenCalledWith(
			"https://aml.example.com/api/v1/risk/dashboard",
			expect.objectContaining({
				headers: expect.objectContaining({
					Authorization: "Bearer jwt",
					"X-Environment": "development",
				}),
			}),
		);
	});
});
