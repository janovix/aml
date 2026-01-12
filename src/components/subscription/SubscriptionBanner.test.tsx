import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SubscriptionBanner } from "./SubscriptionBanner";
import { SubscriptionProvider } from "@/lib/subscription";
import * as subscriptionClient from "@/lib/subscription/subscriptionClient";
import type { SubscriptionStatus } from "@/lib/subscription/subscriptionClient";

// Mock next/link
vi.mock("next/link", () => ({
	default: ({
		children,
		href,
	}: {
		children: React.ReactNode;
		href: string;
	}) => <a href={href}>{children}</a>,
}));

// Mock useLanguage
vi.mock("@/components/LanguageProvider", () => ({
	useLanguage: () => ({
		t: (key: string) => {
			const translations: Record<string, string> = {
				"subscription.banner.limitReached": "Limit Reached",
				"subscription.banner.limitReachedDesc":
					"You have reached your limit for {metrics}",
				"subscription.banner.nearLimit": "Near Limit",
				"subscription.banner.nearLimitDesc":
					"You are approaching your limit for {metrics}",
				"subscription.banner.freeTier": "Free Tier",
				"subscription.banner.freeTierDesc": "Upgrade to unlock more features",
				"subscription.banner.upgrade": "Upgrade",
				"subscription.metrics.notices": "notices",
				"subscription.metrics.users": "users",
				"subscription.metrics.alerts": "alerts",
				"subscription.metrics.transactions": "transactions",
				"common.dismiss": "Dismiss",
			};
			return translations[key] || key;
		},
	}),
}));

// Mock window.location
const mockLocation = {
	origin: "https://aml.example.com",
};

Object.defineProperty(window, "location", {
	value: mockLocation,
	writable: true,
});

describe("SubscriptionBanner", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const createMockSubscription = (
		overrides?: Partial<SubscriptionStatus>,
	): SubscriptionStatus => ({
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
		...overrides,
	});

	it("renders free tier banner", async () => {
		const mockStatus = createMockSubscription();
		vi.spyOn(subscriptionClient, "getSubscriptionStatus").mockResolvedValue(
			mockStatus,
		);

		render(
			<SubscriptionProvider>
				<SubscriptionBanner />
			</SubscriptionProvider>,
		);

		await screen.findByText("Free Tier");
		expect(
			screen.getByText("Upgrade to unlock more features"),
		).toBeInTheDocument();
	});

	it("renders near limit warning", async () => {
		const mockStatus = createMockSubscription({
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
		});
		vi.spyOn(subscriptionClient, "getSubscriptionStatus").mockResolvedValue(
			mockStatus,
		);

		render(
			<SubscriptionProvider>
				<SubscriptionBanner checkMetrics={["notices"]} />
			</SubscriptionProvider>,
		);

		await screen.findByText("Near Limit");
		expect(
			screen.getByText(/You are approaching your limit for notices/),
		).toBeInTheDocument();
	});

	it("renders limit reached urgent warning", async () => {
		const mockStatus = createMockSubscription({
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
		});
		vi.spyOn(subscriptionClient, "getSubscriptionStatus").mockResolvedValue(
			mockStatus,
		);

		render(
			<SubscriptionProvider>
				<SubscriptionBanner checkMetrics={["notices", "users"]} />
			</SubscriptionProvider>,
		);

		await screen.findByText("Limit Reached");
		expect(
			screen.getByText(/You have reached your limit for notices, users/),
		).toBeInTheDocument();
	});

	it("does not render when dismissed", async () => {
		const mockStatus = createMockSubscription();
		vi.spyOn(subscriptionClient, "getSubscriptionStatus").mockResolvedValue(
			mockStatus,
		);

		const { container } = render(
			<SubscriptionProvider>
				<SubscriptionBanner />
			</SubscriptionProvider>,
		);

		await screen.findByText("Free Tier");

		const dismissButton = screen.getByRole("button", { name: "Dismiss" });
		await userEvent.click(dismissButton);

		expect(container.firstChild).toBeNull();
	});

	it("does not render when not dismissible", async () => {
		const mockStatus = createMockSubscription();
		vi.spyOn(subscriptionClient, "getSubscriptionStatus").mockResolvedValue(
			mockStatus,
		);

		render(
			<SubscriptionProvider>
				<SubscriptionBanner dismissible={false} />
			</SubscriptionProvider>,
		);

		await screen.findByText("Free Tier");
		expect(
			screen.queryByRole("button", { name: "Dismiss" }),
		).not.toBeInTheDocument();
	});

	it("does not render when showFreeTierBanner is false", async () => {
		const mockStatus = createMockSubscription();
		vi.spyOn(subscriptionClient, "getSubscriptionStatus").mockResolvedValue(
			mockStatus,
		);

		const { container } = render(
			<SubscriptionProvider>
				<SubscriptionBanner showFreeTierBanner={false} />
			</SubscriptionProvider>,
		);

		await new Promise((resolve) => setTimeout(resolve, 100));
		expect(container.firstChild).toBeNull();
	});

	it("does not render when has paid subscription without warnings", async () => {
		const mockStatus = createMockSubscription({
			hasSubscription: true,
			planTier: "business",
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
					used: 2,
					included: 10,
					remaining: 8,
					overage: 0,
					planTier: "business",
				},
			},
		});
		vi.spyOn(subscriptionClient, "getSubscriptionStatus").mockResolvedValue(
			mockStatus,
		);

		const { container } = render(
			<SubscriptionProvider>
				<SubscriptionBanner />
			</SubscriptionProvider>,
		);

		await new Promise((resolve) => setTimeout(resolve, 100));
		expect(container.firstChild).toBeNull();
	});

	it("uses custom billingUrl when provided", async () => {
		const mockStatus = createMockSubscription();
		vi.spyOn(subscriptionClient, "getSubscriptionStatus").mockResolvedValue(
			mockStatus,
		);

		render(
			<SubscriptionProvider>
				<SubscriptionBanner billingUrl="https://custom-billing.example.com" />
			</SubscriptionProvider>,
		);

		await screen.findByText("Free Tier");
		const upgradeLink = screen.getByRole("link", { name: "Upgrade" });
		expect(upgradeLink).toHaveAttribute(
			"href",
			"https://custom-billing.example.com",
		);
	});

	it("generates billing URL from window.location when not provided", async () => {
		const mockStatus = createMockSubscription();
		vi.spyOn(subscriptionClient, "getSubscriptionStatus").mockResolvedValue(
			mockStatus,
		);

		render(
			<SubscriptionProvider>
				<SubscriptionBanner />
			</SubscriptionProvider>,
		);

		await screen.findByText("Free Tier");
		const upgradeLink = screen.getByRole("link", { name: "Upgrade" });
		expect(upgradeLink).toHaveAttribute(
			"href",
			"https://auth.example.com/settings/billing",
		);
	});

	it("does not render when subscription is loading", () => {
		vi.spyOn(subscriptionClient, "getSubscriptionStatus").mockImplementation(
			() => new Promise(() => {}), // Never resolves
		);

		const { container } = render(
			<SubscriptionProvider>
				<SubscriptionBanner />
			</SubscriptionProvider>,
		);

		expect(container.firstChild).toBeNull();
	});

	it("does not render when subscription is null", async () => {
		vi.spyOn(subscriptionClient, "getSubscriptionStatus").mockResolvedValue(
			null,
		);

		const { container } = render(
			<SubscriptionProvider>
				<SubscriptionBanner />
			</SubscriptionProvider>,
		);

		await new Promise((resolve) => setTimeout(resolve, 100));
		expect(container.firstChild).toBeNull();
	});

	it("handles multiple metrics at limit", async () => {
		const mockStatus = createMockSubscription({
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
				alerts: {
					allowed: true,
					used: 50,
					included: 50,
					remaining: 0,
					overage: 0,
					planTier: "business",
				},
			},
		});
		vi.spyOn(subscriptionClient, "getSubscriptionStatus").mockResolvedValue(
			mockStatus,
		);

		render(
			<SubscriptionProvider>
				<SubscriptionBanner checkMetrics={["notices", "users", "alerts"]} />
			</SubscriptionProvider>,
		);

		await screen.findByText("Limit Reached");
		expect(
			screen.getByText(
				/You have reached your limit for notices, users, alerts/,
			),
		).toBeInTheDocument();
	});

	it("prioritizes at limit over near limit", async () => {
		const mockStatus = createMockSubscription({
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
					used: 80,
					included: 100,
					remaining: 20,
					overage: 0,
					planTier: "business",
				},
			},
		});
		vi.spyOn(subscriptionClient, "getSubscriptionStatus").mockResolvedValue(
			mockStatus,
		);

		render(
			<SubscriptionProvider>
				<SubscriptionBanner checkMetrics={["notices", "users"]} />
			</SubscriptionProvider>,
		);

		await screen.findByText("Limit Reached");
		expect(screen.queryByText("Near Limit")).not.toBeInTheDocument();
	});
});
