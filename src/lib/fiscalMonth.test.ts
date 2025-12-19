import { describe, it, expect } from "vitest";
import {
	getFiscalMonth,
	getFiscalMonthStartDate,
	getFiscalMonthEndDate,
	getFiscalMonthDisplayName,
	groupAlertsByFiscalMonth,
} from "./fiscalMonth";

describe("fiscalMonth utilities", () => {
	describe("getFiscalMonth", () => {
		it("should return current month for dates on or before 17th", () => {
			const date1 = new Date(2024, 0, 1); // Jan 1, 2024
			expect(getFiscalMonth(date1)).toBe("2024-01");

			const date2 = new Date(2024, 0, 17); // Jan 17, 2024
			expect(getFiscalMonth(date2)).toBe("2024-01");
		});

		it("should return next month for dates after 17th", () => {
			const date1 = new Date(2024, 0, 18); // Jan 18, 2024
			expect(getFiscalMonth(date1)).toBe("2024-02");

			const date2 = new Date(2024, 0, 31); // Jan 31, 2024
			expect(getFiscalMonth(date2)).toBe("2024-02");
		});

		it("should handle year boundary correctly", () => {
			const date1 = new Date(2024, 11, 18); // Dec 18, 2024 -> Jan 2025 fiscal month
			expect(getFiscalMonth(date1)).toBe("2025-01");

			const date2 = new Date(2024, 11, 31); // Dec 31, 2024 -> Jan 2025 fiscal month
			expect(getFiscalMonth(date2)).toBe("2025-01");
		});
	});

	describe("getFiscalMonthStartDate", () => {
		it("should return 18th of previous month", () => {
			const startDate = getFiscalMonthStartDate("2024-02");
			expect(startDate.getFullYear()).toBe(2024);
			expect(startDate.getMonth()).toBe(0); // January (0-indexed)
			expect(startDate.getDate()).toBe(18);
		});

		it("should handle January correctly (previous year December)", () => {
			const startDate = getFiscalMonthStartDate("2024-01");
			expect(startDate.getFullYear()).toBe(2023);
			expect(startDate.getMonth()).toBe(11); // December (0-indexed)
			expect(startDate.getDate()).toBe(18);
		});
	});

	describe("getFiscalMonthEndDate", () => {
		it("should return 17th of current month", () => {
			const endDate = getFiscalMonthEndDate("2024-02");
			expect(endDate.getFullYear()).toBe(2024);
			expect(endDate.getMonth()).toBe(1); // February (0-indexed)
			expect(endDate.getDate()).toBe(17);
		});
	});

	describe("getFiscalMonthDisplayName", () => {
		it("should return formatted display name", () => {
			const displayName = getFiscalMonthDisplayName("2024-02");
			expect(displayName).toContain("Febrero 2024");
			expect(displayName).toContain("18 Enero");
			expect(displayName).toContain("17 Febrero");
		});
	});

	describe("groupAlertsByFiscalMonth", () => {
		it("should group alerts by fiscal month", () => {
			const alerts = [
				{ fiscalMonth: "2024-01" },
				{ fiscalMonth: "2024-01" },
				{ fiscalMonth: "2024-02" },
			];

			const groups = groupAlertsByFiscalMonth(alerts);
			expect(groups).toHaveLength(2);
			expect(groups[0]?.fiscalMonth).toBe("2024-02"); // Most recent first
			expect(groups[0]?.alerts).toHaveLength(1);
			expect(groups[1]?.fiscalMonth).toBe("2024-01");
			expect(groups[1]?.alerts).toHaveLength(2);
		});

		it("should return empty array for empty input", () => {
			const groups = groupAlertsByFiscalMonth([]);
			expect(groups).toHaveLength(0);
		});
	});
});
