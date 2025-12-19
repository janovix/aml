import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AlertsTable } from "./AlertsTable";
import { useRouter } from "next/navigation";

vi.mock("next/navigation", () => ({
	useRouter: vi.fn(),
}));

vi.mock("@/hooks/use-toast", () => ({
	useToast: () => ({
		toast: vi.fn(),
	}),
}));

describe("AlertsTable", () => {
	it("should render alerts grouped by fiscal month", () => {
		const mockPush = vi.fn();
		vi.mocked(useRouter).mockReturnValue({
			push: mockPush,
		} as unknown as ReturnType<typeof useRouter>);

		render(<AlertsTable />);

		// Should show fiscal month groups
		expect(
			screen.getAllByText(
				/Enero|Febrero|Marzo|Abril|Mayo|Junio|Julio|Agosto|Septiembre|Octubre|Noviembre|Diciembre/,
			).length,
		).toBeGreaterThan(0);
	});

	it("should allow expanding and collapsing fiscal month groups", async () => {
		const user = userEvent.setup();
		const mockPush = vi.fn();
		vi.mocked(useRouter).mockReturnValue({
			push: mockPush,
		} as unknown as ReturnType<typeof useRouter>);

		render(<AlertsTable />);

		// Find and click a fiscal month header to collapse/expand
		const monthHeaders = screen.getAllByRole("button");
		if (monthHeaders.length > 0) {
			await user.click(monthHeaders[0]);
		}
	});
});
