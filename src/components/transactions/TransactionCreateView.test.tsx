import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TransactionCreateView } from "./TransactionCreateView";

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
		render(<TransactionCreateView />);
		expect(screen.getByText("Nueva Transacción")).toBeInTheDocument();
	});
});
