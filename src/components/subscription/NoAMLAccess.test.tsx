import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { NoAMLAccess } from "./NoAMLAccess";

vi.mock("next/link", () => ({
	default: ({
		children,
		href,
	}: {
		children: React.ReactNode;
		href: string;
	}) => <a href={href}>{children}</a>,
}));

vi.mock("lucide-react", () => ({
	ShieldX: () => <div data-testid="shield-x-icon" />,
	ArrowRight: () => <div data-testid="arrow-right-icon" />,
	Loader2: () => <div data-testid="loader-icon" />,
}));

vi.mock("@/components/LanguageProvider", () => ({
	useLanguage: () => ({
		t: (key: string) => {
			const translations: Record<string, string> = {
				loading: "Loading",
				"subscription.noAmlAccess.title": "AML Access Not Available",
				"subscription.noAmlAccess.description":
					"You do not have access to AML for this organization.",
				"subscription.noAmlAccess.upgradePrompt": "Please upgrade",
				"subscription.noAmlAccess.upgradeCta": "View available plans",
				"subscription.noAmlAccess.contactAdmin":
					"Contact your administrator to upgrade.",
				"subscription.noAmlAccess.backToSettings": "Go to settings",
			};
			return translations[key] || key;
		},
	}),
}));

vi.mock("@/lib/auth/config", () => ({
	getAuthAppUrl: () => "https://auth.example.workers.dev",
}));

vi.mock("@/lib/mutations", () => ({
	getBillingUrl: () => "https://auth.example.workers.dev/settings/billing",
}));

vi.mock("@/hooks/useFlags", () => ({
	useFlags: vi.fn(() => ({
		flags: { "stripe-billing-enabled": true },
		error: null,
		isLoading: false,
	})),
}));

import { useFlags } from "@/hooks/useFlags";

describe("NoAMLAccess", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(useFlags).mockReturnValue({
			flags: { "stripe-billing-enabled": true },
			error: null,
			isLoading: false,
		});
	});

	afterEach(() => {
		cleanup();
	});

	it("shows loading state when isLoading is true", () => {
		render(<NoAMLAccess isLoading={true} />);

		expect(screen.getByTestId("loader-icon")).toBeInTheDocument();
		expect(screen.getByText("Loading")).toBeInTheDocument();
	});

	it("shows upgrade CTA when stripe billing is enabled", () => {
		render(<NoAMLAccess isLoading={false} />);

		expect(screen.getByText("AML Access Not Available")).toBeInTheDocument();
		expect(screen.getByText("View available plans")).toBeInTheDocument();
		const billingLink = screen
			.getAllByRole("link")
			.find(
				(a) =>
					a.getAttribute("href") ===
					"https://auth.example.workers.dev/settings/billing",
			);
		expect(billingLink).toBeDefined();
	});

	it("shows contact admin message instead of upgrade CTA when stripe billing is disabled", () => {
		vi.mocked(useFlags).mockReturnValue({
			flags: { "stripe-billing-enabled": false },
			error: null,
			isLoading: false,
		});

		render(<NoAMLAccess isLoading={false} />);

		expect(
			screen.getByText("Contact your administrator to upgrade."),
		).toBeInTheDocument();
		expect(screen.queryByText("View available plans")).not.toBeInTheDocument();
		const billingLink = screen
			.queryAllByRole("link")
			.find(
				(a) =>
					a.getAttribute("href") ===
					"https://auth.example.workers.dev/settings/billing",
			);
		expect(billingLink).toBeUndefined();
	});

	it("shows upgrade CTA on flag error (fail-open)", () => {
		vi.mocked(useFlags).mockReturnValue({
			flags: {},
			error: "flags unavailable",
			isLoading: false,
		});

		render(<NoAMLAccess isLoading={false} />);

		expect(screen.getByText("View available plans")).toBeInTheDocument();
	});
});
