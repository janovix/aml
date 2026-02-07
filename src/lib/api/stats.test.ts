import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getClientStats, getOperationStats } from "./stats";
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
			operationsToday: 25,
			suspiciousOperations: 3,
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
});
