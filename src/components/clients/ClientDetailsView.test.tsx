import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ClientDetailsView } from "./ClientDetailsView";
import * as clientsApi from "@/lib/api/clients";
import { mockClients } from "@/data/mockClients";

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: vi.fn(),
	}),
	usePathname: () => "/clients/1",
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
	getClientByRfc: vi.fn(),
}));

describe("ClientDetailsView", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders client details header", async () => {
		const client = mockClients[0];
		vi.mocked(clientsApi.getClientByRfc).mockResolvedValue(client);

		render(<ClientDetailsView clientId={client.rfc} />);

		await waitFor(() => {
			expect(screen.getByText("Detalles del Cliente")).toBeInTheDocument();
		});
	});
});
