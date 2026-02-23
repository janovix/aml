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
				"subscription.banner.freeTier": "Free Tier",
				"subscription.banner.freeTierDesc": "Upgrade to unlock more features",
				"subscription.banner.upgrade": "Upgrade",
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

const createMockSubscription = (
	overrides?: Partial<SubscriptionStatus>,
): SubscriptionStatus => ({
	hasSubscription: false,
	status: null,
	plan: "none",
	limits: null,
	isTrialing: false,
	trialDaysRemaining: null,
	currentPeriodStart: null,
	currentPeriodEnd: null,
	cancelAtPeriodEnd: false,
	isLicenseBased: false,
	licenseExpiresAt: null,
	organizationsOwned: 0,
	organizationsLimit: 0,
	...overrides,
});

describe("SubscriptionBanner", () => {
	beforeEach(() => {
		vi.clearAllMocks();
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

	it("does not render for active Stripe subscription", async () => {
		const mockStatus = createMockSubscription({
			hasSubscription: true,
			status: "active",
			plan: "business",
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

	it("does not render for enterprise license", async () => {
		const mockStatus = createMockSubscription({
			hasSubscription: true,
			status: "active",
			plan: "enterprise",
			isLicenseBased: true,
			licenseExpiresAt: "2025-12-31T00:00:00Z",
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

	it("does not show dismiss button when not dismissible", async () => {
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
});
