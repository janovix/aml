import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
	getSubscriptionStatus,
	isFreeTier,
	hasPaidSubscription,
	getUsagePercentage,
	isNearLimit,
	isAtLimit,
	type SubscriptionStatus,
	type PlanTier,
	type UsageCheckResult,
} from "./subscriptionClient";

// Mock the auth config
vi.mock("../auth/config", () => ({
	getAuthServiceUrl: () => "https://auth-svc.test",
}));

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
		it("fetches subscription status successfully", async () => {
			const mockStatus: SubscriptionStatus = {
				hasSubscription: true,
				isEnterprise: false,
				status: "active",
				planTier: "business",
				planName: "Business Plan",
				currentPeriodStart: "2024-01-01T00:00:00Z",
				currentPeriodEnd: "2024-02-01T00:00:00Z",
				cancelAtPeriodEnd: false,
				usage: {
					notices: {
						allowed: true,
						used: 10,
						included: 100,
						remaining: 90,
						overage: 0,
						planTier: "business",
					},
					users: {
						allowed: true,
						used: 5,
						included: 10,
						remaining: 5,
						overage: 0,
						planTier: "business",
					},
				},
				features: ["feature1", "feature2"],
				stripeCustomerId: "cus_123",
				organizationsOwned: 1,
				organizationsLimit: 3,
			};

			vi.mocked(global.fetch).mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true, data: mockStatus }),
			} as Response);

			const result = await getSubscriptionStatus();

			expect(global.fetch).toHaveBeenCalledWith(
				"https://auth-svc.test/api/subscription",
				{ credentials: "include" },
			);
			expect(result).toEqual(mockStatus);
		});

		it("returns null when response is not ok", async () => {
			vi.mocked(global.fetch).mockResolvedValueOnce({
				ok: false,
				status: 404,
			} as Response);

			const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

			const result = await getSubscriptionStatus();

			expect(result).toBeNull();
			expect(consoleSpy).toHaveBeenCalledWith(
				"Failed to fetch subscription status:",
				404,
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
	});

	describe("isFreeTier", () => {
		it("returns true for free tier plan", () => {
			const subscription: SubscriptionStatus = {
				hasSubscription: false,
				isEnterprise: false,
				status: "inactive",
				planTier: "free",
				planName: null,
				currentPeriodStart: null,
				currentPeriodEnd: null,
				cancelAtPeriodEnd: false,
				usage: null,
				features: [],
				stripeCustomerId: "",
				organizationsOwned: 0,
				organizationsLimit: 0,
			};

			expect(isFreeTier(subscription)).toBe(true);
		});

		it("returns true when has stripeCustomerId but no subscription", () => {
			const subscription: SubscriptionStatus = {
				hasSubscription: false,
				isEnterprise: false,
				status: "inactive",
				planTier: "none",
				planName: null,
				currentPeriodStart: null,
				currentPeriodEnd: null,
				cancelAtPeriodEnd: false,
				usage: null,
				features: [],
				stripeCustomerId: "cus_123",
				organizationsOwned: 0,
				organizationsLimit: 0,
			};

			expect(isFreeTier(subscription)).toBe(true);
		});

		it("returns false for paid tier", () => {
			const subscription: SubscriptionStatus = {
				hasSubscription: true,
				isEnterprise: false,
				status: "active",
				planTier: "business",
				planName: "Business Plan",
				currentPeriodStart: "2024-01-01T00:00:00Z",
				currentPeriodEnd: "2024-02-01T00:00:00Z",
				cancelAtPeriodEnd: false,
				usage: null,
				features: [],
				stripeCustomerId: "cus_123",
				organizationsOwned: 1,
				organizationsLimit: 3,
			};

			expect(isFreeTier(subscription)).toBe(false);
		});

		it("returns false for null subscription", () => {
			expect(isFreeTier(null)).toBe(false);
		});
	});

	describe("hasPaidSubscription", () => {
		it("returns true for business plan", () => {
			const subscription: SubscriptionStatus = {
				hasSubscription: true,
				isEnterprise: false,
				status: "active",
				planTier: "business",
				planName: "Business Plan",
				currentPeriodStart: "2024-01-01T00:00:00Z",
				currentPeriodEnd: "2024-02-01T00:00:00Z",
				cancelAtPeriodEnd: false,
				usage: null,
				features: [],
				stripeCustomerId: "cus_123",
				organizationsOwned: 1,
				organizationsLimit: 3,
			};

			expect(hasPaidSubscription(subscription)).toBe(true);
		});

		it("returns true for pro plan", () => {
			const subscription: SubscriptionStatus = {
				hasSubscription: true,
				isEnterprise: false,
				status: "active",
				planTier: "pro",
				planName: "Pro Plan",
				currentPeriodStart: "2024-01-01T00:00:00Z",
				currentPeriodEnd: "2024-02-01T00:00:00Z",
				cancelAtPeriodEnd: false,
				usage: null,
				features: [],
				stripeCustomerId: "cus_123",
				organizationsOwned: 2,
				organizationsLimit: 5,
			};

			expect(hasPaidSubscription(subscription)).toBe(true);
		});

		it("returns false for free tier", () => {
			const subscription: SubscriptionStatus = {
				hasSubscription: false,
				isEnterprise: false,
				status: "inactive",
				planTier: "free",
				planName: null,
				currentPeriodStart: null,
				currentPeriodEnd: null,
				cancelAtPeriodEnd: false,
				usage: null,
				features: [],
				stripeCustomerId: "",
				organizationsOwned: 0,
				organizationsLimit: 0,
			};

			expect(hasPaidSubscription(subscription)).toBe(false);
		});

		it("returns false for none tier", () => {
			const subscription: SubscriptionStatus = {
				hasSubscription: false,
				isEnterprise: false,
				status: "inactive",
				planTier: "none",
				planName: null,
				currentPeriodStart: null,
				currentPeriodEnd: null,
				cancelAtPeriodEnd: false,
				usage: null,
				features: [],
				stripeCustomerId: "",
				organizationsOwned: 0,
				organizationsLimit: 0,
			};

			expect(hasPaidSubscription(subscription)).toBe(false);
		});

		it("returns false when hasSubscription is false", () => {
			const subscription: SubscriptionStatus = {
				hasSubscription: false,
				isEnterprise: false,
				status: "inactive",
				planTier: "business",
				planName: null,
				currentPeriodStart: null,
				currentPeriodEnd: null,
				cancelAtPeriodEnd: false,
				usage: null,
				features: [],
				stripeCustomerId: "",
				organizationsOwned: 0,
				organizationsLimit: 0,
			};

			expect(hasPaidSubscription(subscription)).toBe(false);
		});

		it("returns false for null subscription", () => {
			expect(hasPaidSubscription(null)).toBe(false);
		});
	});

	describe("getUsagePercentage", () => {
		it("calculates percentage correctly", () => {
			const usage: UsageCheckResult = {
				allowed: true,
				used: 50,
				included: 100,
				remaining: 50,
				overage: 0,
				planTier: "business",
			};

			expect(getUsagePercentage(usage)).toBe(50);
		});

		it("returns 0 for unlimited (included === -1)", () => {
			const usage: UsageCheckResult = {
				allowed: true,
				used: 1000,
				included: -1,
				remaining: -1,
				overage: 0,
				planTier: "enterprise",
			};

			expect(getUsagePercentage(usage)).toBe(0);
		});

		it("returns 0 when included is 0", () => {
			const usage: UsageCheckResult = {
				allowed: false,
				used: 0,
				included: 0,
				remaining: 0,
				overage: 0,
				planTier: "none",
			};

			expect(getUsagePercentage(usage)).toBe(0);
		});

		it("rounds percentage correctly", () => {
			const usage: UsageCheckResult = {
				allowed: true,
				used: 33,
				included: 100,
				remaining: 67,
				overage: 0,
				planTier: "business",
			};

			expect(getUsagePercentage(usage)).toBe(33);
		});

		it("handles overage correctly", () => {
			const usage: UsageCheckResult = {
				allowed: true,
				used: 150,
				included: 100,
				remaining: 0,
				overage: 50,
				planTier: "business",
			};

			expect(getUsagePercentage(usage)).toBe(150);
		});
	});

	describe("isNearLimit", () => {
		it("returns true when at 80%", () => {
			const usage: UsageCheckResult = {
				allowed: true,
				used: 80,
				included: 100,
				remaining: 20,
				overage: 0,
				planTier: "business",
			};

			expect(isNearLimit(usage)).toBe(true);
		});

		it("returns true when above 80%", () => {
			const usage: UsageCheckResult = {
				allowed: true,
				used: 90,
				included: 100,
				remaining: 10,
				overage: 0,
				planTier: "business",
			};

			expect(isNearLimit(usage)).toBe(true);
		});

		it("returns false when below 80%", () => {
			const usage: UsageCheckResult = {
				allowed: true,
				used: 79,
				included: 100,
				remaining: 21,
				overage: 0,
				planTier: "business",
			};

			expect(isNearLimit(usage)).toBe(false);
		});

		it("returns false for unlimited", () => {
			const usage: UsageCheckResult = {
				allowed: true,
				used: 1000,
				included: -1,
				remaining: -1,
				overage: 0,
				planTier: "enterprise",
			};

			expect(isNearLimit(usage)).toBe(false);
		});
	});

	describe("isAtLimit", () => {
		it("returns true when at 100%", () => {
			const usage: UsageCheckResult = {
				allowed: true,
				used: 100,
				included: 100,
				remaining: 0,
				overage: 0,
				planTier: "business",
			};

			expect(isAtLimit(usage)).toBe(true);
		});

		it("returns true when above 100%", () => {
			const usage: UsageCheckResult = {
				allowed: true,
				used: 150,
				included: 100,
				remaining: 0,
				overage: 50,
				planTier: "business",
			};

			expect(isAtLimit(usage)).toBe(true);
		});

		it("returns false when below 100%", () => {
			const usage: UsageCheckResult = {
				allowed: true,
				used: 99,
				included: 100,
				remaining: 1,
				overage: 0,
				planTier: "business",
			};

			expect(isAtLimit(usage)).toBe(false);
		});

		it("returns false for unlimited", () => {
			const usage: UsageCheckResult = {
				allowed: true,
				used: 1000,
				included: -1,
				remaining: -1,
				overage: 0,
				planTier: "enterprise",
			};

			expect(isAtLimit(usage)).toBe(false);
		});
	});
});
