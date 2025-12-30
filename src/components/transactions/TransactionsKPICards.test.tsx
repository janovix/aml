import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { TransactionsKPICards } from "./TransactionsKPICards";
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
	getTransactionStats: vi.fn(),
}));

describe("TransactionsKPICards", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(statsApi.getTransactionStats).mockResolvedValue({
			transactionsToday: 15,
			suspiciousTransactions: 3,
			totalVolume: "1500000.00",
			totalVehicles: 42,
		});
	});

	it("renders all KPI cards", async () => {
		render(<TransactionsKPICards />);

		await waitFor(() => {
			expect(screen.getByText("Transacciones Hoy")).toBeInTheDocument();
			expect(screen.getByText("Transacciones Sospechosas")).toBeInTheDocument();
			expect(screen.getByText("Volumen Total")).toBeInTheDocument();
			expect(screen.getByText("Total Vehículos")).toBeInTheDocument();
		});
	});

	it("shows loading state initially", () => {
		// Create a promise that doesn't resolve immediately
		let resolveStats: (value: unknown) => void;
		const statsPromise = new Promise((resolve) => {
			resolveStats = resolve;
		});
		vi.mocked(statsApi.getTransactionStats).mockReturnValue(
			statsPromise as ReturnType<typeof statsApi.getTransactionStats>,
		);

		render(<TransactionsKPICards />);

		// Should show loading state
		const loadingIndicators = screen.getAllByText("...");
		expect(loadingIndicators.length).toBe(4);

		// Clean up
		resolveStats!({
			transactionsToday: 15,
			suspiciousTransactions: 3,
			totalVolume: "1500000.00",
			totalVehicles: 42,
		});
	});

	it("displays fetched stats values", async () => {
		render(<TransactionsKPICards />);

		await waitFor(() => {
			expect(screen.getByText("15")).toBeInTheDocument(); // transactionsToday
			expect(screen.getByText("3")).toBeInTheDocument(); // suspiciousTransactions
			expect(screen.getByText("$1.5M")).toBeInTheDocument(); // totalVolume formatted
			expect(screen.getByText("42")).toBeInTheDocument(); // totalVehicles
		});
	});

	it("formats currency in millions correctly", async () => {
		vi.mocked(statsApi.getTransactionStats).mockResolvedValue({
			transactionsToday: 10,
			suspiciousTransactions: 1,
			totalVolume: "5500000.00",
			totalVehicles: 100,
		});

		render(<TransactionsKPICards />);

		await waitFor(() => {
			expect(screen.getByText("$5.5M")).toBeInTheDocument();
		});
	});

	it("formats currency in thousands correctly", async () => {
		vi.mocked(statsApi.getTransactionStats).mockResolvedValue({
			transactionsToday: 10,
			suspiciousTransactions: 1,
			totalVolume: "150000.00",
			totalVehicles: 100,
		});

		render(<TransactionsKPICards />);

		await waitFor(() => {
			expect(screen.getByText("$150.0K")).toBeInTheDocument();
		});
	});

	it("formats small currency amounts correctly", async () => {
		vi.mocked(statsApi.getTransactionStats).mockResolvedValue({
			transactionsToday: 10,
			suspiciousTransactions: 1,
			totalVolume: "500.00",
			totalVehicles: 100,
		});

		render(<TransactionsKPICards />);

		await waitFor(() => {
			expect(screen.getByText("$500")).toBeInTheDocument();
		});
	});

	it("handles NaN currency value", async () => {
		vi.mocked(statsApi.getTransactionStats).mockResolvedValue({
			transactionsToday: 10,
			suspiciousTransactions: 1,
			totalVolume: "not-a-number",
			totalVehicles: 100,
		});

		render(<TransactionsKPICards />);

		await waitFor(() => {
			expect(screen.getByText("$0")).toBeInTheDocument();
		});
	});

	it("handles API error gracefully", async () => {
		vi.mocked(statsApi.getTransactionStats).mockRejectedValue(
			new Error("API error"),
		);

		render(<TransactionsKPICards />);

		await waitFor(() => {
			expect(mockToast).toHaveBeenCalledWith(
				expect.objectContaining({
					title: "Error",
					description: "No se pudieron cargar las estadísticas.",
					variant: "destructive",
				}),
			);
		});
	});

	it("handles ApiError with enhanced logging", async () => {
		const apiError = new ApiError("Internal Server Error", {
			status: 500,
			body: { message: "Database error" },
		});
		vi.mocked(statsApi.getTransactionStats).mockRejectedValue(apiError);

		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		render(<TransactionsKPICards />);

		await waitFor(() => {
			expect(mockToast).toHaveBeenCalled();
		});

		// Verify console.error was called with API error info
		expect(consoleSpy).toHaveBeenCalled();

		consoleSpy.mockRestore();
	});

	it("handles null stats gracefully", async () => {
		vi.mocked(statsApi.getTransactionStats).mockResolvedValue({
			transactionsToday: 0,
			suspiciousTransactions: 0,
			totalVolume: "",
			totalVehicles: 0,
		});

		render(<TransactionsKPICards />);

		await waitFor(() => {
			expect(screen.getByText("Transacciones Hoy")).toBeInTheDocument();
		});

		// Should show default values
		await waitFor(() => {
			const zeros = screen.getAllByText("0");
			expect(zeros.length).toBeGreaterThan(0);
		});
	});

	it("renders accessible section with label", async () => {
		render(<TransactionsKPICards />);

		await waitFor(() => {
			expect(
				screen.getByLabelText("Indicadores clave de transacciones"),
			).toBeInTheDocument();
		});
	});

	it("formats large vehicle numbers with locale formatting", async () => {
		vi.mocked(statsApi.getTransactionStats).mockResolvedValue({
			transactionsToday: 10,
			suspiciousTransactions: 1,
			totalVolume: "1000000.00",
			totalVehicles: 1500,
		});

		render(<TransactionsKPICards />);

		await waitFor(() => {
			// Should format 1500 as "1,500" in es-MX locale
			expect(screen.getByText("1,500")).toBeInTheDocument();
		});
	});
});
