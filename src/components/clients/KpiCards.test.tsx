import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { KpiCards } from "./KpiCards";
import * as statsApi from "@/lib/api/stats";
import { ApiError } from "@/lib/api/http";

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

	it("handles ApiError with enhanced logging", async () => {
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});
		const apiError = new ApiError("API error", {
			status: 500,
			body: { message: "Internal server error" },
		});
		vi.mocked(statsApi.getClientStats).mockRejectedValue(apiError);

		render(<KpiCards />);

		await waitFor(() => {
			expect(mockToast).toHaveBeenCalledWith(
				expect.objectContaining({
					title: "Error",
					description: "No se pudieron cargar las estadísticas.",
					variant: "destructive",
				}),
			);
		});

		expect(consoleErrorSpy).toHaveBeenCalledWith(
			"[KpiCards] API error fetching client stats:",
			"status=500",
			"message=API error",
			"body=",
			{ message: "Internal server error" },
		);

		consoleErrorSpy.mockRestore();
	});

	it("handles non-ApiError gracefully", async () => {
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});
		const genericError = new Error("Network error");
		vi.mocked(statsApi.getClientStats).mockRejectedValue(genericError);

		render(<KpiCards />);

		await waitFor(() => {
			expect(mockToast).toHaveBeenCalledWith(
				expect.objectContaining({
					title: "Error",
					description: "No se pudieron cargar las estadísticas.",
					variant: "destructive",
				}),
			);
		});

		expect(consoleErrorSpy).toHaveBeenCalledWith(
			"[KpiCards] Error fetching client stats:",
			"Network error",
		);

		consoleErrorSpy.mockRestore();
	});
});
