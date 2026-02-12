import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
	getSubscriptionStatus,
	isFreeTier,
	hasPaidSubscription,
	isEnterprise,
	getUsagePercentage,
	hasAMLAccess,
	hasWatchlistAccess,
	type SubscriptionStatus,
} from "./subscriptionClient";

// Mock the auth config
vi.mock("../auth/config", () => ({
	getAuthServiceUrl: () => "https://auth-svc.test",
}));

const createMockSubscription = (
	overrides: Partial<SubscriptionStatus> = {},
): SubscriptionStatus => ({
	hasSubscription: true,
	status: "active",
	plan: "business",
	limits: null,
	isTrialing: false,
	trialDaysRemaining: null,
	currentPeriodStart: "2024-01-01T00:00:00Z",
	currentPeriodEnd: "2024-02-01T00:00:00Z",
	cancelAtPeriodEnd: false,
	isLicenseBased: false,
	licenseExpiresAt: null,
	organizationsOwned: 1,
	organizationsLimit: 3,
	...overrides,
});

describe("subscriptionClient", () => {
	const originalFetch = global.fetch;

	beforeEach(() => {
		global.fetch = vi.fn();
	});

	afterEach(() => {
		global.fetch = originalFetch;
		vi.clearAllMocks();
	});

	describe("getSubscriptionStatus", () => {
		it("fetches subscription status from /api/subscription/status", async () => {
			const mockStatus = createMockSubscription();

			vi.mocked(global.fetch).mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true, data: mockStatus }),
			} as Response);

			const result = await getSubscriptionStatus();

			expect(global.fetch).toHaveBeenCalledWith(
				"https://auth-svc.test/api/subscription/status",
				{ credentials: "include" },
			);
			expect(result).toEqual(mockStatus);
		});

		it("returns null when response is not ok", async () => {
			vi.mocked(global.fetch).mockResolvedValueOnce({
				ok: false,
				status: 401,
			} as Response);

			const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

			const result = await getSubscriptionStatus();

			expect(result).toBeNull();
			expect(consoleSpy).toHaveBeenCalledWith(
				"Failed to fetch subscription status:",
				401,
			);

			consoleSpy.mockRestore();
		});

		it("returns null when API response indicates failure", async () => {
			vi.mocked(global.fetch).mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: false, error: "Not found" }),
			} as Response);

			const result = await getSubscriptionStatus();

			expect(result).toBeNull();
		});

		it("returns null when fetch throws an error", async () => {
			vi.mocked(global.fetch).mockRejectedValueOnce(new Error("Network error"));

			const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

			const result = await getSubscriptionStatus();

			expect(result).toBeNull();
			expect(consoleSpy).toHaveBeenCalledWith(
				"Error fetching subscription status:",
				expect.any(Error),
			);

			consoleSpy.mockRestore();
		});

		it("returns null when data is undefined", async () => {
			vi.mocked(global.fetch).mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true }),
			} as Response);

			const result = await getSubscriptionStatus();

			expect(result).toBeNull();
		});

		it("correctly parses license-based subscription", async () => {
			const mockStatus = createMockSubscription({
				plan: "enterprise",
				isLicenseBased: true,
				licenseExpiresAt: "2025-12-31T00:00:00Z",
				organizationsLimit: 0, // unlimited
			});

			vi.mocked(global.fetch).mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true, data: mockStatus }),
			} as Response);

			const result = await getSubscriptionStatus();

			expect(result?.isLicenseBased).toBe(true);
			expect(result?.licenseExpiresAt).toBe("2025-12-31T00:00:00Z");
			expect(result?.plan).toBe("enterprise");
		});
	});

	describe("isFreeTier", () => {
		it("returns true when user has no subscription", () => {
			const subscription = createMockSubscription({
				hasSubscription: false,
				status: null,
				plan: "none",
			});

			expect(isFreeTier(subscription)).toBe(true);
		});

		it("returns false when user has active subscription", () => {
			const subscription = createMockSubscription();

			expect(isFreeTier(subscription)).toBe(false);
		});

		it("returns false for license-based subscription", () => {
			const subscription = createMockSubscription({
				isLicenseBased: true,
				plan: "enterprise",
			});

			expect(isFreeTier(subscription)).toBe(false);
		});

		it("returns false for null subscription", () => {
			expect(isFreeTier(null)).toBe(false);
		});
	});

	describe("hasPaidSubscription", () => {
		it("returns true for business plan", () => {
			const subscription = createMockSubscription({ plan: "business" });

			expect(hasPaidSubscription(subscription)).toBe(true);
		});

		it("returns true for pro plan", () => {
			const subscription = createMockSubscription({ plan: "pro" });

			expect(hasPaidSubscription(subscription)).toBe(true);
		});

		it("returns true for enterprise license", () => {
			const subscription = createMockSubscription({
				plan: "enterprise",
				isLicenseBased: true,
			});

			expect(hasPaidSubscription(subscription)).toBe(true);
		});

		it("returns false when hasSubscription is false", () => {
			const subscription = createMockSubscription({
				hasSubscription: false,
				plan: "none",
			});

			expect(hasPaidSubscription(subscription)).toBe(false);
		});

		it("returns false for none plan", () => {
			const subscription = createMockSubscription({
				hasSubscription: false,
				plan: "none",
			});

			expect(hasPaidSubscription(subscription)).toBe(false);
		});

		it("returns false for null subscription", () => {
			expect(hasPaidSubscription(null)).toBe(false);
		});
	});

	describe("isEnterprise", () => {
		it("returns true for license-based subscription", () => {
			const subscription = createMockSubscription({
				isLicenseBased: true,
				plan: "enterprise",
			});

			expect(isEnterprise(subscription)).toBe(true);
		});

		it("returns true for enterprise plan even without license flag", () => {
			const subscription = createMockSubscription({
				plan: "enterprise",
				isLicenseBased: false,
			});

			expect(isEnterprise(subscription)).toBe(true);
		});

		it("returns false for business plan", () => {
			const subscription = createMockSubscription({ plan: "business" });

			expect(isEnterprise(subscription)).toBe(false);
		});

		it("returns false for null subscription", () => {
			expect(isEnterprise(null)).toBe(false);
		});
	});

	describe("getUsagePercentage", () => {
		it("calculates percentage correctly", () => {
			expect(getUsagePercentage(50, 100)).toBe(50);
		});

		it("returns 0 for unlimited (included <= 0)", () => {
			expect(getUsagePercentage(1000, -1)).toBe(0);
			expect(getUsagePercentage(0, 0)).toBe(0);
		});

		it("rounds percentage correctly", () => {
			expect(getUsagePercentage(33, 100)).toBe(33);
		});

		it("handles overage (above 100%)", () => {
			expect(getUsagePercentage(150, 100)).toBe(150);
		});
	});

	describe("hasAMLAccess", () => {
		it("returns true for active Stripe subscription", () => {
			const subscription = createMockSubscription({ status: "active" });

			expect(hasAMLAccess(subscription)).toBe(true);
		});

		it("returns true for trialing subscription", () => {
			const subscription = createMockSubscription({
				status: "trialing",
				isTrialing: true,
			});

			expect(hasAMLAccess(subscription)).toBe(true);
		});

		it("returns true for active enterprise license", () => {
			const subscription = createMockSubscription({
				status: "active",
				isLicenseBased: true,
				plan: "enterprise",
			});

			expect(hasAMLAccess(subscription)).toBe(true);
		});

		it("returns false when no subscription", () => {
			const subscription = createMockSubscription({
				hasSubscription: false,
				status: null,
			});

			expect(hasAMLAccess(subscription)).toBe(false);
		});

		it("returns false for canceled subscription", () => {
			const subscription = createMockSubscription({ status: "canceled" });

			expect(hasAMLAccess(subscription)).toBe(false);
		});

		it("returns false for null subscription", () => {
			expect(hasAMLAccess(null)).toBe(false);
		});
	});

	describe("hasWatchlistAccess", () => {
		it("returns true for active subscription", () => {
			const subscription = createMockSubscription({ status: "active" });

			expect(hasWatchlistAccess(subscription)).toBe(true);
		});

		it("returns false for null subscription", () => {
			expect(hasWatchlistAccess(null)).toBe(false);
		});
	});
});
