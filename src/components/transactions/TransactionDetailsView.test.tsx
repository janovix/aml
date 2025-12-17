import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TransactionDetailsView } from "./TransactionDetailsView";

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: vi.fn(),
	}),
	usePathname: () => "/transactions/TRX-2024-001",
}));

describe("TransactionDetailsView", () => {
	it("renders the transaction id in the header", () => {
		render(<TransactionDetailsView transactionId="TRX-2024-001" />);
		expect(screen.getByText("TRX-2024-001")).toBeInTheDocument();
	});
});
