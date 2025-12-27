import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { KpiCards } from "./KpiCards";
import * as statsApi from "@/lib/api/stats";

const mockToast = vi.fn();

vi.mock("@/hooks/use-toast", () => ({
	useToast: () => ({
		toast: mockToast,
		toasts: [],
	}),
}));

vi.mock("@/lib/api/stats", () => ({
	getClientStats: vi.fn(),
}));

describe("KpiCards", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(statsApi.getClientStats).mockResolvedValue({
			openAlerts: 37,
			urgentReviews: 12,
			totalClients: 1248,
		});
	});

	it("renders all KPI cards", async () => {
		render(<KpiCards />);

		expect(screen.getByText("Avisos Abiertos")).toBeInTheDocument();
		expect(screen.getByText("Revisiones Urgentes")).toBeInTheDocument();
		expect(screen.getByText("Total Clientes")).toBeInTheDocument();
	});

	it("displays correct values", async () => {
		render(<KpiCards />);

		await waitFor(() => {
			expect(screen.getByText("37")).toBeInTheDocument();
		});

		expect(screen.getByText("12")).toBeInTheDocument();
		expect(screen.getByText("1,248")).toBeInTheDocument();
	});
});
