/**
 * Tests for AI billing utilities
 */

import { describe, it, expect } from "vitest";
import {
	createUsageTracker,
	formatTokenCount,
	getUsagePercentage,
	isOverLimit,
	calculateTotalTokens,
	calculateUsagePercentage,
} from "./billing";

describe("AI Billing", () => {
	describe("createUsageTracker", () => {
		it("should create a tracker with initial values", () => {
			const tracker = createUsageTracker(1000);
			expect(tracker.limit).toBe(1000);
			expect(tracker.used).toBe(0);
			expect(tracker.remaining).toBe(1000);
		});

		it("should calculate remaining correctly with initial used value", () => {
			const tracker = createUsageTracker(1000, 300);
			expect(tracker.limit).toBe(1000);
			expect(tracker.used).toBe(300);
			expect(tracker.remaining).toBe(700);
		});

		it("should handle zero limit", () => {
			const tracker = createUsageTracker(0);
			expect(tracker.limit).toBe(0);
			expect(tracker.used).toBe(0);
			expect(tracker.remaining).toBe(0);
		});

		it("should handle negative remaining", () => {
			const tracker = createUsageTracker(100, 150);
			expect(tracker.remaining).toBe(-50);
		});
	});

	describe("formatTokenCount", () => {
		it("should format small numbers without abbreviation", () => {
			expect(formatTokenCount(0)).toBe("0");
			expect(formatTokenCount(100)).toBe("100");
			expect(formatTokenCount(999)).toBe("999");
		});

		it("should format thousands with K suffix", () => {
			expect(formatTokenCount(1000)).toBe("1K");
			expect(formatTokenCount(1500)).toBe("1.5K");
			expect(formatTokenCount(10000)).toBe("10K");
		});

		it("should format millions with M suffix", () => {
			expect(formatTokenCount(1000000)).toBe("1M");
			expect(formatTokenCount(1500000)).toBe("1.5M");
			expect(formatTokenCount(10000000)).toBe("10M");
		});

		it("should handle edge cases", () => {
			expect(formatTokenCount(1)).toBe("1");
		});
	});

	describe("getUsagePercentage", () => {
		it("should calculate percentage correctly", () => {
			expect(getUsagePercentage(50, 100)).toBe(50);
			expect(getUsagePercentage(0, 100)).toBe(0);
			expect(getUsagePercentage(100, 100)).toBe(100);
		});

		it("should handle over-limit scenarios", () => {
			expect(getUsagePercentage(150, 100)).toBe(150);
		});

		it("should return 0 when limit is 0", () => {
			expect(getUsagePercentage(50, 0)).toBe(0);
		});

		it("should round to specified decimal places", () => {
			expect(getUsagePercentage(33, 100, 0)).toBe(33);
			expect(getUsagePercentage(33.333, 100, 2)).toBe(33.33);
		});
	});

	describe("isOverLimit", () => {
		it("should return false when under limit", () => {
			expect(isOverLimit(50, 100)).toBe(false);
			expect(isOverLimit(99, 100)).toBe(false);
			expect(isOverLimit(0, 100)).toBe(false);
		});

		it("should return false when at limit", () => {
			expect(isOverLimit(100, 100)).toBe(false);
		});

		it("should return true when over limit", () => {
			expect(isOverLimit(101, 100)).toBe(true);
			expect(isOverLimit(150, 100)).toBe(true);
		});

		it("should handle edge cases", () => {
			expect(isOverLimit(0, 0)).toBe(false);
			expect(isOverLimit(1, 0)).toBe(true);
		});
	});

	describe("calculateTotalTokens", () => {
		it("should calculate total tokens correctly", () => {
			const result = calculateTotalTokens(100, 50);
			expect(result.inputTokens).toBe(100);
			expect(result.outputTokens).toBe(50);
			expect(result.totalTokens).toBe(150);
		});

		it("should handle zero tokens", () => {
			const result = calculateTotalTokens(0, 0);
			expect(result.totalTokens).toBe(0);
		});
	});

	describe("calculateUsagePercentage", () => {
		it("should calculate percentage correctly", () => {
			expect(calculateUsagePercentage(50, 100)).toBe(50);
			expect(calculateUsagePercentage(0, 100)).toBe(0);
			expect(calculateUsagePercentage(100, 100)).toBe(100);
		});

		it("should cap at 100%", () => {
			expect(calculateUsagePercentage(150, 100)).toBe(100);
		});

		it("should return 0 when included is 0", () => {
			expect(calculateUsagePercentage(50, 0)).toBe(0);
		});
	});
});
