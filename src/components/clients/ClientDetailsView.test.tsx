import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { ClientDetailsView } from "./ClientDetailsView";
import { mockClients } from "@/data/mockClients";
import { LanguageProvider } from "@/components/LanguageProvider";

// Helper to render with LanguageProvider - force Spanish for consistent testing
const renderWithProviders = (ui: React.ReactElement) => {
	return render(ui, {
		wrapper: ({ children }) => (
			<LanguageProvider defaultLanguage="es">{children}</LanguageProvider>
		),
	});
};

const mockNavigateTo = vi.fn();
const mockGetClientById = vi.fn();

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
	}),
	usePathname: () => "/test-org/clients/1",
	useSearchParams: () => new URLSearchParams(),
	useParams: () => ({ orgSlug: "test-org", id: "1" }),
}));

vi.mock("@/hooks/useOrgNavigation", () => ({
	useOrgNavigation: () => ({
		navigateTo: mockNavigateTo,
		orgPath: (path: string) => `/test-org${path}`,
	}),
}));

vi.mock("@/hooks/use-toast", () => ({
	useToast: () => ({
		toast: vi.fn(),
		toasts: [],
	}),
}));

vi.mock("@/hooks/useJwt", () => ({
	useJwt: () => ({
		jwt: "test-jwt-token",
		isLoading: false,
		error: null,
		refetch: vi.fn(),
	}),
}));

vi.mock("@/lib/api/clients", () => ({
	getClientById: (...args: unknown[]) => mockGetClientById(...args),
}));

vi.mock("@/hooks/use-mobile", () => ({
	useIsMobile: () => false,
}));

// Mock PageHeroSkeleton to simplify testing
vi.mock("@/components/skeletons", () => ({
	PageHeroSkeleton: () => (
		<div data-testid="page-hero-skeleton">Loading...</div>
	),
}));

describe("ClientDetailsView", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetClientById.mockReset();
	});

	it("renders loading skeleton initially", () => {
		const client = mockClients[0];
		mockGetClientById.mockResolvedValue(client);

		renderWithProviders(<ClientDetailsView clientId={client.id} />);

		// Should show skeleton while loading
		expect(screen.getByTestId("page-hero-skeleton")).toBeInTheDocument();
	});

	it("calls getClientById with correct params", async () => {
		const client = mockClients[0];
		mockGetClientById.mockResolvedValue(client);

		renderWithProviders(<ClientDetailsView clientId={client.id} />);

		await waitFor(() => {
			expect(mockGetClientById).toHaveBeenCalledWith({
				id: client.id,
			});
		});
	});
});
