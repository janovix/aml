import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApproachingUsageLimitBanner } from "./ApproachingUsageLimitBanner";

const mockGetUsageDetails = vi.fn();

vi.mock("@/lib/subscription/subscriptionClient", () => ({
	getUsageDetails: () => mockGetUsageDetails(),
}));

vi.mock("@/lib/auth/config", () => ({
	getAuthAppUrl: () => "https://auth.example.com",
}));

vi.mock("@/hooks/useFlags", () => ({
	useFlags: vi.fn(() => ({
		flags: { "stripe-billing-enabled": true },
		error: null,
		isLoading: false,
	})),
}));

vi.mock("next/link", () => ({
	default: ({
		children,
		href,
		...rest
	}: {
		children: React.ReactNode;
		href: string;
	}) => (
		<a href={href} {...rest}>
			{children}
		</a>
	),
}));

vi.mock("lucide-react", () => ({
	X: () => <span data-testid="x-icon" />,
}));

import { useFlags } from "@/hooks/useFlags";

describe("ApproachingUsageLimitBanner", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.clear();
		vi.mocked(useFlags).mockReturnValue({
			flags: { "stripe-billing-enabled": true },
			error: null,
			isLoading: false,
		});
	});

	afterEach(() => {
		cleanup();
	});

	const baseDetails = () => ({
		period: { end: "2026-04-30" },
		limits: {
			reports: 100,
			notices: 100,
			alerts: 100,
			operations: 100,
			clients: 100,
			users: 10,
		},
		usage: {
			reports: 85,
			notices: 0,
			alerts: 0,
			operations: 0,
			clients: 0,
			users: 0,
		},
	});

	it("shows banner when usage is at or above 80% of quota", async () => {
		mockGetUsageDetails.mockResolvedValue(baseDetails());

		render(<ApproachingUsageLimitBanner />);

		await waitFor(() => {
			expect(
				screen.getByText(/You're approaching plan limits this billing period:/),
			).toBeInTheDocument();
		});
		expect(screen.getByText(/reports 85%/)).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: /Usage & billing/i }),
		).toHaveAttribute("href", "https://auth.example.com/settings/billing");
	});

	it("does not show when usage is below threshold", async () => {
		mockGetUsageDetails.mockResolvedValue({
			...baseDetails(),
			usage: {
				reports: 50,
				notices: 0,
				alerts: 0,
				operations: 0,
				clients: 0,
				users: 0,
			},
		});

		const { container } = render(<ApproachingUsageLimitBanner />);

		await waitFor(() => {
			expect(mockGetUsageDetails).toHaveBeenCalled();
		});
		expect(container.firstChild).toBeNull();
	});

	it("does not show when limit is zero", async () => {
		mockGetUsageDetails.mockResolvedValue({
			...baseDetails(),
			limits: {
				reports: 0,
				notices: 100,
				alerts: 100,
				operations: 100,
				clients: 100,
				users: 10,
			},
			usage: {
				reports: 100,
				notices: 0,
				alerts: 0,
				operations: 0,
				clients: 0,
				users: 0,
			},
		});

		const { container } = render(<ApproachingUsageLimitBanner />);

		await waitFor(() => {
			expect(mockGetUsageDetails).toHaveBeenCalled();
		});
		expect(container.firstChild).toBeNull();
	});

	it("does not show when getUsageDetails returns nullish limits", async () => {
		mockGetUsageDetails.mockResolvedValue(null);

		const { container } = render(<ApproachingUsageLimitBanner />);

		await waitFor(() => {
			expect(mockGetUsageDetails).toHaveBeenCalled();
		});
		expect(container.firstChild).toBeNull();
	});

	it("does not show when banner was dismissed for this period", async () => {
		mockGetUsageDetails.mockResolvedValue(baseDetails());
		localStorage.setItem("janovix:usage-banner-dismissed:2026-04-30", "1");

		const { container } = render(<ApproachingUsageLimitBanner />);

		await waitFor(() => {
			expect(mockGetUsageDetails).toHaveBeenCalled();
		});
		expect(container.firstChild).toBeNull();
	});

	it("dismiss sets localStorage and hides banner", async () => {
		const user = userEvent.setup();
		mockGetUsageDetails.mockResolvedValue(baseDetails());

		render(<ApproachingUsageLimitBanner />);

		await waitFor(() => {
			expect(
				screen.getByText(/You're approaching plan limits this billing period:/),
			).toBeInTheDocument();
		});

		await user.click(screen.getByRole("button", { name: "Dismiss" }));

		expect(
			localStorage.getItem("janovix:usage-banner-dismissed:2026-04-30"),
		).toBe("1");
		expect(
			screen.queryByText(/You're approaching plan limits this billing period:/),
		).not.toBeInTheDocument();
	});

	it("hides Usage & billing link when stripe billing is disabled", async () => {
		vi.mocked(useFlags).mockReturnValue({
			flags: { "stripe-billing-enabled": false },
			error: null,
			isLoading: false,
		});
		mockGetUsageDetails.mockResolvedValue(baseDetails());

		render(<ApproachingUsageLimitBanner />);

		await waitFor(() => {
			expect(screen.getByText(/reports 85%/)).toBeInTheDocument();
		});
		expect(
			screen.queryByRole("link", { name: /Usage & billing/i }),
		).not.toBeInTheDocument();
	});

	it("shows Usage & billing link when stripe flags fail to load (fail-open)", async () => {
		vi.mocked(useFlags).mockReturnValue({
			flags: {},
			error: "flags unavailable",
			isLoading: false,
		});
		mockGetUsageDetails.mockResolvedValue(baseDetails());

		render(<ApproachingUsageLimitBanner />);

		await waitFor(() => {
			expect(screen.getByText(/reports 85%/)).toBeInTheDocument();
		});
		expect(
			screen.getByRole("link", { name: /Usage & billing/i }),
		).toHaveAttribute("href", "https://auth.example.com/settings/billing");
	});
});
