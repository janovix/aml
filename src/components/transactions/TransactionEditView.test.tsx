import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TransactionEditView } from "./TransactionEditView";

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: vi.fn(),
	}),
	usePathname: () => "/transactions/TRX-2024-001/edit",
}));

describe("TransactionEditView", () => {
	it("renders edit transaction header", () => {
		render(<TransactionEditView transactionId="TRX-2024-001" />);
		expect(screen.getByText("Editar Transacción")).toBeInTheDocument();
	});
});
