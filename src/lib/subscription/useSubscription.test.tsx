import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import {
	SubscriptionProvider,
	useSubscription,
	useSubscriptionSafe,
} from "./useSubscription";
import * as subscriptionClient from "./subscriptionClient";
import type { SubscriptionStatus } from "./subscriptionClient";

// Mock the subscription client
vi.mock("./subscriptionClient", async (importOriginal) => {
	const original = await importOriginal<typeof subscriptionClient>();
	return {
		...original,
		getSubscriptionStatus: vi.fn(),
	};
});

// Test component that uses the hook
function TestComponent() {
	const subscription = useSubscription();
	return (
		<div>
			<div data-testid="loading">
				{subscription.isLoading ? "loading" : "loaded"}
			</div>
			<div data-testid="isFreeTier">
				{subscription.isFreeTier ? "free" : "paid"}
			</div>
			<div data-testid="hasPaidSubscription">
				{subscription.hasPaidSubscription ? "yes" : "no"}
			</div>
			<div data-testid="isNearLimit">
				{subscription.isNearLimit("notices") ? "yes" : "no"}
			</div>
			<div data-testid="isAtLimit">
				{subscription.isAtLimit("notices") ? "yes" : "no"}
			</div>
			<div data-testid="usagePercentage">
				{subscription.getUsagePercentage("notices")}
			</div>
			<button onClick={() => subscription.refresh()}>Refresh</button>
		</div>
	);
}

// Test component that uses the safe hook
function TestComponentSafe() {
	const subscription = useSubscriptionSafe();
	if (!subscription)
		return <div data-testid="no-subscription">No subscription</div>;
	return <div data-testid="has-subscription">Has subscription</div>;
}

describe("useSubscription", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("provides subscription context", async () => {
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
					used: 80,
					included: 100,
					remaining: 20,
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
			features: [],
			stripeCustomerId: "cus_123",
			organizationsOwned: 1,
			organizationsLimit: 3,
		};

		vi.mocked(subscriptionClient.getSubscriptionStatus).mockResolvedValueOnce(
			mockStatus,
		);

		render(
			<SubscriptionProvider>
				<TestComponent />
			</SubscriptionProvider>,
		);

		expect(screen.getByTestId("loading")).toHaveTextContent("loading");

		await waitFor(() => {
			expect(screen.getByTestId("loading")).toHaveTextContent("loaded");
		});

		expect(screen.getByTestId("isFreeTier")).toHaveTextContent("paid");
		expect(screen.getByTestId("hasPaidSubscription")).toHaveTextContent("yes");
		expect(screen.getByTestId("isNearLimit")).toHaveTextContent("yes");
		expect(screen.getByTestId("isAtLimit")).toHaveTextContent("no");
		expect(screen.getByTestId("usagePercentage")).toHaveTextContent("80");
	});

	it("handles free tier subscription", async () => {
		const mockStatus: SubscriptionStatus = {
			hasSubscription: false,
			isEnterprise: false,
			status: "inactive",
			planTier: "free",
			planName: null,
			currentPeriodStart: null,
			currentPeriodEnd: null,
			cancelAtPeriodEnd: false,
			usage: {
				notices: {
					allowed: true,
					used: 10,
					included: 50,
					remaining: 40,
					overage: 0,
					planTier: "free",
				},
				users: {
					allowed: true,
					used: 2,
					included: 3,
					remaining: 1,
					overage: 0,
					planTier: "free",
				},
			},
			features: [],
			stripeCustomerId: "",
			organizationsOwned: 0,
			organizationsLimit: 0,
		};

		vi.mocked(subscriptionClient.getSubscriptionStatus).mockResolvedValueOnce(
			mockStatus,
		);

		render(
			<SubscriptionProvider>
				<TestComponent />
			</SubscriptionProvider>,
		);

		await waitFor(() => {
			expect(screen.getByTestId("isFreeTier")).toHaveTextContent("free");
		});

		expect(screen.getByTestId("hasPaidSubscription")).toHaveTextContent("no");
	});

	it("handles subscription at limit", async () => {
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
					used: 100,
					included: 100,
					remaining: 0,
					overage: 0,
					planTier: "business",
				},
				users: {
					allowed: true,
					used: 10,
					included: 10,
					remaining: 0,
					overage: 0,
					planTier: "business",
				},
			},
			features: [],
			stripeCustomerId: "cus_123",
			organizationsOwned: 1,
			organizationsLimit: 3,
		};

		vi.mocked(subscriptionClient.getSubscriptionStatus).mockResolvedValueOnce(
			mockStatus,
		);

		render(
			<SubscriptionProvider>
				<TestComponent />
			</SubscriptionProvider>,
		);

		await waitFor(() => {
			expect(screen.getByTestId("isAtLimit")).toHaveTextContent("yes");
		});
	});

	it("handles subscription with no usage data", async () => {
		const mockStatus: SubscriptionStatus = {
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

		vi.mocked(subscriptionClient.getSubscriptionStatus).mockResolvedValueOnce(
			mockStatus,
		);

		render(
			<SubscriptionProvider>
				<TestComponent />
			</SubscriptionProvider>,
		);

		await waitFor(() => {
			expect(screen.getByTestId("isNearLimit")).toHaveTextContent("no");
			expect(screen.getByTestId("isAtLimit")).toHaveTextContent("no");
			expect(screen.getByTestId("usagePercentage")).toHaveTextContent("0");
		});
	});

	it("handles refresh", async () => {
		const mockStatus: SubscriptionStatus = {
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

		vi.mocked(subscriptionClient.getSubscriptionStatus)
			.mockResolvedValueOnce(mockStatus)
			.mockResolvedValueOnce(mockStatus);

		render(
			<SubscriptionProvider>
				<TestComponent />
			</SubscriptionProvider>,
		);

		await waitFor(() => {
			expect(screen.getByTestId("loading")).toHaveTextContent("loaded");
		});

		const refreshButton = screen.getByText("Refresh");
		await act(async () => {
			refreshButton.click();
		});

		await waitFor(() => {
			expect(subscriptionClient.getSubscriptionStatus).toHaveBeenCalledTimes(2);
		});
	});

	it("handles error during fetch", async () => {
		vi.mocked(subscriptionClient.getSubscriptionStatus).mockRejectedValueOnce(
			new Error("Network error"),
		);

		render(
			<SubscriptionProvider>
				<TestComponent />
			</SubscriptionProvider>,
		);

		await waitFor(() => {
			expect(screen.getByTestId("loading")).toHaveTextContent("loaded");
		});
	});

	it("throws error when used outside provider", () => {
		// Suppress console.error for this test
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		expect(() => {
			render(<TestComponent />);
		}).toThrow("useSubscription must be used within a SubscriptionProvider");

		consoleSpy.mockRestore();
	});

	it("returns null when used outside provider with safe hook", () => {
		render(<TestComponentSafe />);

		expect(screen.getByTestId("no-subscription")).toBeInTheDocument();
	});

	it("handles all metric types", async () => {
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
					used: 80,
					included: 100,
					remaining: 20,
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
				alerts: {
					allowed: true,
					used: 50,
					included: 100,
					remaining: 50,
					overage: 0,
					planTier: "business",
				},
				transactions: {
					allowed: true,
					used: 90,
					included: 100,
					remaining: 10,
					overage: 0,
					planTier: "business",
				},
			},
			features: [],
			stripeCustomerId: "cus_123",
			organizationsOwned: 1,
			organizationsLimit: 3,
		};

		vi.mocked(subscriptionClient.getSubscriptionStatus).mockResolvedValueOnce(
			mockStatus,
		);

		function TestAllMetrics() {
			const sub = useSubscription();
			return (
				<div>
					<div data-testid="notices-near">
						{sub.isNearLimit("notices") ? "yes" : "no"}
					</div>
					<div data-testid="users-near">
						{sub.isNearLimit("users") ? "yes" : "no"}
					</div>
					<div data-testid="alerts-near">
						{sub.isNearLimit("alerts") ? "yes" : "no"}
					</div>
					<div data-testid="transactions-near">
						{sub.isNearLimit("transactions") ? "yes" : "no"}
					</div>
				</div>
			);
		}

		render(
			<SubscriptionProvider>
				<TestAllMetrics />
			</SubscriptionProvider>,
		);

		await waitFor(() => {
			expect(screen.getByTestId("notices-near")).toHaveTextContent("yes");
			expect(screen.getByTestId("users-near")).toHaveTextContent("no");
			expect(screen.getByTestId("alerts-near")).toHaveTextContent("no");
			expect(screen.getByTestId("transactions-near")).toHaveTextContent("yes");
		});
	});
});
