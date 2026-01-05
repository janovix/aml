import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getActiveUmaValue, calculateUmaThreshold, type UmaValue } from "./uma";
import * as http from "./http";
import * as config from "./config";

vi.mock("./http");
vi.mock("./config");

describe("api/uma", () => {
	beforeEach(() => {
		vi.mocked(config.getAmlCoreBaseUrl).mockReturnValue(
			"https://test-api.example.com",
		);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("getActiveUmaValue", () => {
		const mockUmaValue: UmaValue = {
			id: "UMA-001",
			year: 2025,
			dailyValue: "113.14",
			effectiveDate: "2025-01-01T00:00:00Z",
			endDate: "2025-12-31T23:59:59Z",
			approvedBy: "admin@example.com",
			notes: "UMA value for 2025",
			active: true,
			createdAt: "2024-12-15T10:00:00Z",
			updatedAt: "2024-12-15T10:00:00Z",
		};

		it("fetches active UMA value from the API", async () => {
			vi.mocked(http.fetchJson).mockResolvedValue({
				status: 200,
				json: mockUmaValue,
			});

			const result = await getActiveUmaValue();

			expect(http.fetchJson).toHaveBeenCalledWith(
				"https://test-api.example.com/api/v1/uma-values/active",
				expect.objectContaining({
					method: "GET",
					cache: "no-store",
				}),
			);
			expect(result).toEqual(mockUmaValue);
		});

		it("uses custom baseUrl when provided", async () => {
			vi.mocked(http.fetchJson).mockResolvedValue({
				status: 200,
				json: mockUmaValue,
			});

			await getActiveUmaValue({ baseUrl: "https://custom-api.example.com" });

			expect(http.fetchJson).toHaveBeenCalledWith(
				"https://custom-api.example.com/api/v1/uma-values/active",
				expect.anything(),
			);
		});

		it("passes signal option when provided", async () => {
			const controller = new AbortController();
			vi.mocked(http.fetchJson).mockResolvedValue({
				status: 200,
				json: mockUmaValue,
			});

			await getActiveUmaValue({ signal: controller.signal });

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
				json: mockUmaValue,
			});

			await getActiveUmaValue({ jwt: "test-token" });

			expect(http.fetchJson).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					jwt: "test-token",
				}),
			);
		});

		it("returns null when no active UMA value is found (404)", async () => {
			const error = new Error("Not found") as Error & { status: number };
			error.status = 404;
			vi.mocked(http.fetchJson).mockRejectedValue(error);

			const result = await getActiveUmaValue();

			expect(result).toBeNull();
		});

		it("throws error for non-404 errors", async () => {
			const error = new Error("Server error") as Error & { status: number };
			error.status = 500;
			vi.mocked(http.fetchJson).mockRejectedValue(error);

			await expect(getActiveUmaValue()).rejects.toThrow("Server error");
		});
	});

	describe("calculateUmaThreshold", () => {
		const mockUmaValue: UmaValue = {
			id: "UMA-001",
			year: 2025,
			dailyValue: "113.14",
			effectiveDate: "2025-01-01T00:00:00Z",
			endDate: null,
			approvedBy: null,
			notes: null,
			active: true,
			createdAt: "2024-12-15T10:00:00Z",
			updatedAt: "2024-12-15T10:00:00Z",
		};

		it("calculates threshold with default multiplier (6420)", () => {
			const threshold = calculateUmaThreshold(mockUmaValue);

			// 6420 * 113.14 = 726,358.80
			expect(threshold).toBeCloseTo(726358.8, 2);
		});

		it("calculates threshold with custom multiplier", () => {
			const threshold = calculateUmaThreshold(mockUmaValue, 1000);

			// 1000 * 113.14 = 113,140
			expect(threshold).toBeCloseTo(113140, 2);
		});

		it("returns fallback threshold when UMA value is null", () => {
			const threshold = calculateUmaThreshold(null);

			// 6420 * 113.14 (fallback) = 726,358.80
			expect(threshold).toBeCloseTo(726358.8, 2);
		});

		it("returns fallback threshold with custom multiplier when UMA value is null", () => {
			const threshold = calculateUmaThreshold(null, 1000);

			// 1000 * 113.14 (fallback) = 113,140
			expect(threshold).toBeCloseTo(113140, 2);
		});
	});
});
