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
			<div data-testid="isEnterprise">
				{subscription.isEnterprise ? "yes" : "no"}
			</div>
			<div data-testid="plan">{subscription.subscription?.plan ?? "none"}</div>
			<div data-testid="isLicenseBased">
				{subscription.subscription?.isLicenseBased ? "yes" : "no"}
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

	it("provides subscription context for Stripe subscription", async () => {
		const mockStatus = createMockSubscription();

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
		expect(screen.getByTestId("isEnterprise")).toHaveTextContent("no");
		expect(screen.getByTestId("plan")).toHaveTextContent("business");
		expect(screen.getByTestId("isLicenseBased")).toHaveTextContent("no");
	});

	it("provides subscription context for enterprise license", async () => {
		const mockStatus = createMockSubscription({
			plan: "enterprise",
			isLicenseBased: true,
			licenseExpiresAt: "2025-12-31T00:00:00Z",
			organizationsLimit: 0, // unlimited
		});

		vi.mocked(subscriptionClient.getSubscriptionStatus).mockResolvedValueOnce(
			mockStatus,
		);

		render(
			<SubscriptionProvider>
				<TestComponent />
			</SubscriptionProvider>,
		);

		await waitFor(() => {
			expect(screen.getByTestId("loading")).toHaveTextContent("loaded");
		});

		expect(screen.getByTestId("isFreeTier")).toHaveTextContent("paid");
		expect(screen.getByTestId("hasPaidSubscription")).toHaveTextContent("yes");
		expect(screen.getByTestId("isEnterprise")).toHaveTextContent("yes");
		expect(screen.getByTestId("plan")).toHaveTextContent("enterprise");
		expect(screen.getByTestId("isLicenseBased")).toHaveTextContent("yes");
	});

	it("handles free tier subscription", async () => {
		const mockStatus = createMockSubscription({
			hasSubscription: false,
			status: null,
			plan: "none",
		});

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
		expect(screen.getByTestId("isEnterprise")).toHaveTextContent("no");
	});

	it("handles refresh", async () => {
		const mockStatus = createMockSubscription();

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

	it("handles null subscription from API", async () => {
		vi.mocked(subscriptionClient.getSubscriptionStatus).mockResolvedValueOnce(
			null,
		);

		render(
			<SubscriptionProvider>
				<TestComponent />
			</SubscriptionProvider>,
		);

		await waitFor(() => {
			expect(screen.getByTestId("loading")).toHaveTextContent("loaded");
		});

		expect(screen.getByTestId("isFreeTier")).toHaveTextContent("paid");
		expect(screen.getByTestId("hasPaidSubscription")).toHaveTextContent("no");
		expect(screen.getByTestId("plan")).toHaveTextContent("none");
	});
});
