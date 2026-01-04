import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import React from "react";
import { TransactionCreateView } from "./TransactionCreateView";
import { renderWithProviders } from "@/lib/testHelpers";

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
	}),
	usePathname: () => "/test-org/transactions/new",
	useSearchParams: () => ({
		get: () => null,
	}),
	useParams: () => ({ orgSlug: "test-org" }),
}));

describe("TransactionCreateView", () => {
	it("renders create transaction header", () => {
		renderWithProviders(<TransactionCreateView />);
		expect(screen.getByText("Nueva Transacción")).toBeInTheDocument();
	});
});
