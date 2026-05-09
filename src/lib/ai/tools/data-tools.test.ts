import { describe, it, expect, vi, beforeEach } from "vitest";
import { createDataTools } from "./data-tools";

vi.mock("@/lib/api/config", () => ({
	getAmlCoreBaseUrl: vi.fn(() => "https://aml.example.com"),
}));

function mockJsonResponse(body: unknown) {
	return {
		ok: true,
		json: async () => body,
		text: async () => "",
	} as Response;
}

describe("createDataTools", () => {
	beforeEach(() => {
		vi.stubGlobal("fetch", vi.fn());
	});

	it("sends X-Environment on getClientStats", async () => {
		vi.mocked(fetch).mockResolvedValueOnce(
			mockJsonResponse({
				totalClients: 3,
				physicalClients: 2,
				moralClients: 1,
				trustClients: 0,
			}),
		);
		const tools = createDataTools("my-jwt", { dataEnvironment: "staging" });
		await tools.getClientStats.execute();
		expect(fetch).toHaveBeenCalledWith(
			"https://aml.example.com/api/v1/clients/stats",
			expect.objectContaining({
				headers: expect.objectContaining({
					Authorization: "Bearer my-jwt",
					"X-Environment": "staging",
				}),
			}),
		);
	});

	it("listOperations sends activityCode query param", async () => {
		vi.mocked(fetch).mockResolvedValueOnce(
			mockJsonResponse({
				data: [],
				pagination: {
					total: 0,
					page: 1,
					limit: 10,
					totalPages: 0,
				},
			}),
		);
		const tools = createDataTools("jwt", { dataEnvironment: "production" });
		await tools.listOperations.execute({
			activityCode: "VEH",
			limit: 10,
			page: 1,
		});
		const url = vi.mocked(fetch).mock.calls[0][0] as string;
		expect(url).toContain("activityCode=VEH");
		expect(url).not.toContain("operationType=");
	});

	it("getTransactionAggregation calls aggregate/operations", async () => {
		vi.mocked(fetch).mockResolvedValueOnce(
			mockJsonResponse({
				total: 0,
				totalAmount: 0,
				avgAmount: 0,
				byOperationType: {},
				byCurrency: {},
				byMonth: [],
				topClients: [],
			}),
		);
		const tools = createDataTools("jwt", { dataEnvironment: "production" });
		await tools.getTransactionAggregation.execute({
			periodStart: "2026-01-01T00:00:00.000Z",
			periodEnd: "2026-01-31T23:59:59.999Z",
		});
		const url = vi.mocked(fetch).mock.calls[0][0] as string;
		expect(url).toContain("/api/v1/reports/aggregate/operations");
	});
});
