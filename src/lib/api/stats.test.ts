import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getClientStats, getOperationStats, getReportSummary } from "./stats";
import * as http from "./http";
import * as config from "./config";

vi.mock("./http");
vi.mock("./config");

describe("api/stats", () => {
	beforeEach(() => {
		vi.mocked(config.getAmlCoreBaseUrl).mockReturnValue(
			"https://test-api.example.com",
		);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("getClientStats", () => {
		const mockClientStats = {
			totalClients: 150,
			physicalClients: 100,
			moralClients: 50,
			trustClients: 0,
		};

		it("fetches client stats from the API", async () => {
			vi.mocked(http.fetchJson).mockResolvedValue({
				status: 200,
				json: mockClientStats,
			});

			const result = await getClientStats();

			expect(http.fetchJson).toHaveBeenCalledWith(
				"https://test-api.example.com/api/v1/clients/stats",
				expect.objectContaining({
					method: "GET",
					cache: "no-store",
				}),
			);
			expect(result).toEqual(mockClientStats);
		});

		it("uses custom baseUrl when provided", async () => {
			vi.mocked(http.fetchJson).mockResolvedValue({
				status: 200,
				json: mockClientStats,
			});

			await getClientStats({ baseUrl: "https://custom-api.example.com" });

			expect(http.fetchJson).toHaveBeenCalledWith(
				"https://custom-api.example.com/api/v1/clients/stats",
				expect.anything(),
			);
		});

		it("passes signal option when provided", async () => {
			const controller = new AbortController();
			vi.mocked(http.fetchJson).mockResolvedValue({
				status: 200,
				json: mockClientStats,
			});

			await getClientStats({ signal: controller.signal });

			expect(http.fetchJson).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					signal: controller.signal,
				}),
			);
		});

		it("passes jwt option when provided", async () => {
			vi.mocked(http.fetchJson).mockResolvedValue({
				status: 200,
				json: mockClientStats,
			});

			await getClientStats({ jwt: "test-token" });

			expect(http.fetchJson).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					jwt: "test-token",
				}),
			);
		});
	});

	describe("getOperationStats", () => {
		const mockOperationStats = {
			transactionsToday: 25,
			suspiciousTransactions: 3,
			totalVolume: "15000000.50",
			totalVehicles: 120,
		};

		it("fetches operation stats from the API", async () => {
			vi.mocked(http.fetchJson).mockResolvedValue({
				status: 200,
				json: mockOperationStats,
			});

			const result = await getOperationStats();

			expect(http.fetchJson).toHaveBeenCalledWith(
				"https://test-api.example.com/api/v1/operations/stats",
				expect.objectContaining({
					method: "GET",
					cache: "no-store",
				}),
			);
			expect(result).toEqual(mockOperationStats);
		});

		it("uses custom baseUrl when provided", async () => {
			vi.mocked(http.fetchJson).mockResolvedValue({
				status: 200,
				json: mockOperationStats,
			});

			await getOperationStats({ baseUrl: "https://custom-api.example.com" });

			expect(http.fetchJson).toHaveBeenCalledWith(
				"https://custom-api.example.com/api/v1/operations/stats",
				expect.anything(),
			);
		});

		it("passes signal option when provided", async () => {
			const controller = new AbortController();
			vi.mocked(http.fetchJson).mockResolvedValue({
				status: 200,
				json: mockOperationStats,
			});

			await getOperationStats({ signal: controller.signal });

			expect(http.fetchJson).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					signal: controller.signal,
				}),
			);
		});

		it("passes jwt option when provided", async () => {
			vi.mocked(http.fetchJson).mockResolvedValue({
				status: 200,
				json: mockOperationStats,
			});

			await getOperationStats({ jwt: "test-token" });

			expect(http.fetchJson).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					jwt: "test-token",
				}),
			);
		});
	});

	describe("getReportSummary", () => {
		const mockReportSummary = {
			alerts: {
				total: 15,
				bySeverity: { LOW: 5, MEDIUM: 4, HIGH: 3, CRITICAL: 3 },
				byStatus: {},
				byRule: [],
				byMonth: [],
				avgResolutionDays: 7.5,
				overdueCount: 2,
			},
			clients: {
				total: 100,
				byPersonType: {},
				byCountry: {},
				withAlerts: 8,
				newInPeriod: 12,
			},
			riskIndicators: {
				highRiskClients: 5,
				criticalAlerts: 3,
				overdueSubmissions: 1,
				complianceScore: 85,
			},
		};

		it("fetches report summary from the API with period params", async () => {
			vi.mocked(http.fetchJson).mockResolvedValue({
				status: 200,
				json: mockReportSummary,
			});

			const result = await getReportSummary({
				periodStart: "2026-03-01T00:00:00.000Z",
				periodEnd: "2026-03-31T23:59:59.999Z",
			});

			expect(http.fetchJson).toHaveBeenCalledWith(
				expect.stringContaining(
					"/api/v1/reports/aggregate/summary?periodStart=",
				),
				expect.objectContaining({
					method: "GET",
					cache: "no-store",
				}),
			);
			expect(result).toEqual(mockReportSummary);
		});

		it("includes comparison period params when provided", async () => {
			vi.mocked(http.fetchJson).mockResolvedValue({
				status: 200,
				json: mockReportSummary,
			});

			await getReportSummary({
				periodStart: "2026-03-01T00:00:00.000Z",
				periodEnd: "2026-03-31T23:59:59.999Z",
				comparisonPeriodStart: "2026-02-01T00:00:00.000Z",
				comparisonPeriodEnd: "2026-02-28T23:59:59.999Z",
			});

			const lastCallIndex = vi.mocked(http.fetchJson).mock.calls.length - 1;
			const calledUrl = vi.mocked(http.fetchJson).mock.calls[lastCallIndex][0];
			expect(calledUrl).toContain("comparisonPeriodStart=");
			expect(calledUrl).toContain("comparisonPeriodEnd=");
		});

		it("passes jwt option when provided", async () => {
			vi.mocked(http.fetchJson).mockResolvedValue({
				status: 200,
				json: mockReportSummary,
			});

			await getReportSummary({
				periodStart: "2026-03-01T00:00:00.000Z",
				periodEnd: "2026-03-31T23:59:59.999Z",
				jwt: "test-token",
			});

			expect(http.fetchJson).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					jwt: "test-token",
				}),
			);
		});
	});
});
