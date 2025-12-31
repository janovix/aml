import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ClientDetailsView } from "./ClientDetailsView";
import { mockClients } from "@/data/mockClients";

const mockNavigateTo = vi.fn();
const mockGetClientByRfc = vi.fn();

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
	getClientByRfc: (...args: unknown[]) => mockGetClientByRfc(...args),
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
		mockGetClientByRfc.mockReset();
	});

	it("renders loading skeleton initially", () => {
		const client = mockClients[0];
		mockGetClientByRfc.mockResolvedValue(client);

		render(<ClientDetailsView clientId={client.rfc} />);

		// Should show skeleton while loading
		expect(screen.getByTestId("page-hero-skeleton")).toBeInTheDocument();
	});

	it("calls getClientByRfc with correct params", async () => {
		const client = mockClients[0];
		mockGetClientByRfc.mockResolvedValue(client);

		render(<ClientDetailsView clientId={client.rfc} />);

		await waitFor(() => {
			expect(mockGetClientByRfc).toHaveBeenCalledWith({
				rfc: client.rfc,
			});
		});
	});
});
