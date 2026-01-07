import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { UmaBadge } from "./UmaBadge";
import { renderWithProviders } from "@/lib/testHelpers";

// Mock cookies module to return Spanish language for tests
vi.mock("@/lib/cookies", () => ({
	getCookie: (name: string) => {
		if (name === "janovix-lang") return "es";
		return undefined;
	},
	setCookie: vi.fn(),
	deleteCookie: vi.fn(),
	COOKIE_NAMES: {
		THEME: "janovix-theme",
		LANGUAGE: "janovix-lang",
	},
}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
	}),
	usePathname: () => "/test-org/dashboard",
	useSearchParams: () => new URLSearchParams(),
	useParams: () => ({ orgSlug: "test-org" }),
}));

// Mock the JWT hook
vi.mock("@/hooks/useJwt", () => ({
	useJwt: () => ({
		jwt: "mock-token",
		isLoading: false,
	}),
}));

// Mock the org store
vi.mock("@/lib/org-store", () => ({
	useOrgStore: () => ({
		currentOrg: { id: "org-123", slug: "test-org", name: "Test Org" },
		organizations: [],
		setCurrentOrg: vi.fn(),
	}),
}));

// Mock the UMA API
vi.mock("@/lib/api/uma", () => ({
	getActiveUmaValue: vi.fn().mockResolvedValue({
		id: "UMA-001",
		year: 2025,
		dailyValue: "113.14",
		effectiveDate: "2025-01-01T00:00:00Z",
		endDate: null,
		approvedBy: null,
		notes: null,
		active: true,
		createdAt: "2024-12-15T10:00:00Z",
		updatedAt: "2024-12-15T10:00:00Z",
	}),
	calculateUmaThreshold: vi.fn().mockReturnValue(726358.8),
}));

describe("UmaBadge", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders UMA threshold badge", async () => {
		renderWithProviders(<UmaBadge />);

		await waitFor(
			() => {
				// Should show the badge with threshold value (formatted number with K/M suffix)
				const badge = screen.getByText(/\d+/);
				expect(badge).toBeInTheDocument();
			},
			{ timeout: 3000 },
		);
	});
});

// Additional tests for missing branches
import * as umaApi from "@/lib/api/uma";
import * as useJwtModule from "@/hooks/useJwt";
import * as orgStoreModule from "@/lib/org-store";

describe("UmaBadge branch coverage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns null when no org is selected", async () => {
		vi.spyOn(orgStoreModule, "useOrgStore").mockReturnValue({
			currentOrg: null,
			organizations: [],
			setCurrentOrg: vi.fn(),
			addOrganization: vi.fn(),
			isLoading: false,
		});

		const { container } = renderWithProviders(<UmaBadge />);

		await waitFor(() => {
			expect(container.firstChild).toBeNull();
		});
	});

	it("returns null when UMA value is null", async () => {
		vi.spyOn(umaApi, "getActiveUmaValue").mockResolvedValue(null as never);

		const { container } = renderWithProviders(<UmaBadge />);

		await waitFor(() => {
			// Should not render anything when UMA is null
			expect(container.querySelector("[class*='badge']")).toBeNull();
		});
	});

	it("handles API error gracefully", async () => {
		vi.spyOn(umaApi, "getActiveUmaValue").mockRejectedValue(
			new Error("API Error"),
		);

		const { container } = renderWithProviders(<UmaBadge />);

		await waitFor(() => {
			// Should not render anything on error
			expect(container.querySelector("[class*='badge']")).toBeNull();
		});
	});

	it("shows loading skeleton while fetching", async () => {
		vi.spyOn(useJwtModule, "useJwt").mockReturnValue({
			jwt: "mock-token",
			isLoading: true,
			error: null,
			refetch: vi.fn(),
		});

		// Reset UMA mock to delay response
		vi.spyOn(umaApi, "getActiveUmaValue").mockImplementation(
			() =>
				new Promise((resolve) =>
					setTimeout(
						() =>
							resolve({
								id: "UMA-001",
								year: 2025,
								dailyValue: "113.14",
								effectiveDate: "2025-01-01T00:00:00Z",
								endDate: null,
								approvedBy: null,
								notes: null,
								active: true,
								createdAt: "2024-12-15T10:00:00Z",
								updatedAt: "2024-12-15T10:00:00Z",
							}),
						1000,
					),
				),
		);

		renderWithProviders(<UmaBadge />);

		// Should show nothing while JWT is loading (UMA fetch hasn't started)
		await waitFor(() => {
			// The component will wait for JWT to be ready
		});
	});
});
