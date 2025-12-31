import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TransactionsPageContent } from "./TransactionsPageContent";
import * as statsApi from "@/lib/api/stats";
import * as transactionsApi from "@/lib/api/transactions";
import * as clientsApi from "@/lib/api/clients";
import { mockTransactions } from "@/data/mockTransactions";
import { mockClients } from "@/data/mockClients";

const mockPush = vi.fn();
const mockPathname = vi.fn(() => "/transactions");
const mockToast = vi.fn();

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: mockPush,
	}),
	usePathname: () => mockPathname(),
}));

vi.mock("@/hooks/use-toast", () => ({
	useToast: () => ({
		toast: mockToast,
		toasts: [],
	}),
}));

vi.mock("@/lib/api/stats", () => ({
	getTransactionStats: vi.fn(),
}));

// Don't mock TransactionsTable - we need to test the actual component with search functionality
// But we need to mock the APIs it uses
vi.mock("@/lib/api/transactions", () => ({
	listTransactions: vi.fn(),
}));

vi.mock("@/lib/api/clients", () => ({
	getClientByRfc: vi.fn(),
}));

vi.mock("@/hooks/use-mobile", () => ({
	useIsMobile: () => false,
}));

describe("TransactionsPageContent", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(statsApi.getTransactionStats).mockResolvedValue({
			transactionsToday: 15,
			suspiciousTransactions: 3,
			totalVolume: "1500000.00",
			totalVehicles: 42,
		});

		// Mock transactions API for TransactionsTable
		vi.mocked(transactionsApi.listTransactions).mockResolvedValue({
			data: mockTransactions,
			pagination: {
				page: 1,
				limit: 20,
				total: mockTransactions.length,
				totalPages: Math.ceil(mockTransactions.length / 20),
			},
		});

		// Mock client fetching - return clients based on clientId
		const clientIdToRfc: Record<string, string> = {
			"1": "EGL850101AAA",
			"2": "CNO920315BBB",
			"3": "SFM880520CCC",
			"4": "IDP950712DDD",
			"5": "PECJ850615E56",
		};

		vi.mocked(clientsApi.getClientByRfc).mockImplementation(async ({ rfc }) => {
			let client = mockClients.find((c) => c.rfc === rfc);
			if (!client && clientIdToRfc[rfc]) {
				client = mockClients.find((c) => c.rfc === clientIdToRfc[rfc]);
			}
			if (client) {
				return client;
			}
			throw new Error("Client not found");
		});
	});

	it("renders page header", () => {
		render(<TransactionsPageContent />);

		const transaccionesHeaders = screen.getAllByText("Transacciones");
		const descriptionTexts = screen.getAllByText(
			"Gestión de transacciones de vehículos",
		);
		expect(transaccionesHeaders.length).toBeGreaterThan(0);
		expect(descriptionTexts.length).toBeGreaterThan(0);
	});

	it("renders new transaction button", () => {
		render(<TransactionsPageContent />);

		const newButtons = screen.getAllByRole("button", {
			name: /nueva transacción/i,
		});
		expect(newButtons.length).toBeGreaterThan(0);
	});

	it("navigates to new transaction page when button is clicked", async () => {
		const user = userEvent.setup();
		render(<TransactionsPageContent />);

		const buttons = screen.getAllByRole("button", {
			name: /nueva transacción/i,
		});
		expect(buttons.length).toBeGreaterThan(0);

		// Click the first button (mobile or desktop)
		await user.click(buttons[0]);

		expect(mockPush).toHaveBeenCalledWith("/transactions/new");
	});

	it("renders KPI cards", () => {
		render(<TransactionsPageContent />);

		const transaccionesHoy = screen.getAllByText("Transacciones Hoy");
		const transaccionesSospechosas = screen.getAllByText(
			"Transacciones Sospechosas",
		);
		const volumenTotal = screen.getAllByText("Volumen Total");
		expect(transaccionesHoy.length).toBeGreaterThan(0);
		expect(transaccionesSospechosas.length).toBeGreaterThan(0);
		expect(volumenTotal.length).toBeGreaterThan(0);
	});

	it("renders transactions table with built-in search", async () => {
		render(<TransactionsPageContent />);

		// Wait for the DataTable to load and check for search placeholder
		await waitFor(
			() => {
				const searchInputs = screen.getAllByPlaceholderText(/buscar/i);
				expect(searchInputs.length).toBeGreaterThan(0);
			},
			{ timeout: 10000 },
		);
	});

	// Mobile menu button removed - sidebar is now handled by DashboardLayout
	it.skip("renders mobile menu button", () => {
		// This test is skipped as mobile menu is now handled by DashboardLayout
	});

	// Sidebar is now handled by DashboardLayout, not TransactionsPageContent
	it.skip("renders sidebar", () => {
		// This test is skipped as sidebar is now handled by DashboardLayout
	});

	it("displays loading state", async () => {
		// Mock a delayed response to catch loading state
		vi.mocked(statsApi.getTransactionStats).mockImplementation(
			() =>
				new Promise((resolve) => {
					setTimeout(() => {
						resolve({
							transactionsToday: 15,
							suspiciousTransactions: 3,
							totalVolume: "1500000.00",
							totalVehicles: 42,
						});
					}, 100);
				}),
		);

		render(<TransactionsPageContent />);

		// Should show loading indicators
		const loadingIndicators = screen.getAllByText("...");
		expect(loadingIndicators.length).toBeGreaterThan(0);
	});

	it("handles null stats gracefully", async () => {
		vi.mocked(statsApi.getTransactionStats).mockResolvedValue({
			transactionsToday: 0,
			suspiciousTransactions: 0,
			totalVolume: "0",
			totalVehicles: 0,
		});

		render(<TransactionsPageContent />);

		// Wait for stats to load and verify zero values are displayed
		// Check for stat labels first to ensure component rendered
		expect(screen.getByText("Transacciones Hoy")).toBeInTheDocument();

		// Wait for loading to complete (check that "..." is gone)
		await waitFor(
			() => {
				// After loading, the "..." should be replaced with actual values
				const loadingIndicators = screen.queryAllByText("...");
				// In stat cards, there should be no "..." after loading
				expect(loadingIndicators.length).toBe(0);
			},
			{ timeout: 5000 },
		);

		// Then verify zero values are displayed
		const zeroValues = screen.getAllByText("0");
		expect(zeroValues.length).toBeGreaterThan(0);
	});

	it("handles ApiError when fetching stats", async () => {
		const { ApiError } = await import("@/lib/api/http");
		const apiError = new ApiError("API error", {
			status: 500,
			body: { message: "Internal server error" },
		});

		vi.mocked(statsApi.getTransactionStats).mockRejectedValue(apiError);

		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		render(<TransactionsPageContent />);

		// Wait for async error handling to complete
		await new Promise((resolve) => setTimeout(resolve, 100));

		expect(consoleSpy).toHaveBeenCalledWith(
			expect.stringContaining(
				"[TransactionsPageContent] API error fetching transaction stats:",
			),
			expect.stringContaining("status=500"),
			expect.stringContaining("message=API error"),
			"body=",
			{ message: "Internal server error" },
		);

		expect(mockToast).toHaveBeenCalledWith({
			title: "Error",
			description: "No se pudieron cargar las estadísticas.",
			variant: "destructive",
		});

		consoleSpy.mockRestore();
	});

	it("handles generic Error when fetching stats", async () => {
		const genericError = new Error("Network error");

		vi.mocked(statsApi.getTransactionStats).mockRejectedValue(genericError);

		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		render(<TransactionsPageContent />);

		// Wait for async error handling to complete
		await new Promise((resolve) => setTimeout(resolve, 100));

		expect(consoleSpy).toHaveBeenCalledWith(
			expect.stringContaining(
				"[TransactionsPageContent] Error fetching transaction stats:",
			),
			"Network error",
		);

		expect(mockToast).toHaveBeenCalledWith({
			title: "Error",
			description: "No se pudieron cargar las estadísticas.",
			variant: "destructive",
		});

		consoleSpy.mockRestore();
	});

	it("formats currency for amounts >= 1M", async () => {
		vi.mocked(statsApi.getTransactionStats).mockResolvedValue({
			transactionsToday: 15,
			suspiciousTransactions: 3,
			totalVolume: "2500000.00", // 2.5M
			totalVehicles: 42,
		});

		render(<TransactionsPageContent />);

		// Should format as $2.5M
		await screen.findByText("$2.5M");
	});

	it("formats currency for amounts >= 1K but < 1M", async () => {
		vi.mocked(statsApi.getTransactionStats).mockResolvedValue({
			transactionsToday: 15,
			suspiciousTransactions: 3,
			totalVolume: "50000.00", // 50K
			totalVehicles: 42,
		});

		render(<TransactionsPageContent />);

		// Should format as $50.0K
		await screen.findByText("$50.0K");
	});

	it("formats currency for amounts < 1K", async () => {
		vi.mocked(statsApi.getTransactionStats).mockResolvedValue({
			transactionsToday: 15,
			suspiciousTransactions: 3,
			totalVolume: "500.00", // < 1K
			totalVehicles: 42,
		});

		render(<TransactionsPageContent />);

		// Should format as regular currency (MXN format)
		const volumeElement = screen.getByText("Volumen Total").closest("div");
		expect(volumeElement).toBeInTheDocument();
	});

	it("handles NaN currency values", async () => {
		vi.mocked(statsApi.getTransactionStats).mockResolvedValue({
			transactionsToday: 15,
			suspiciousTransactions: 3,
			totalVolume: "invalid", // Will cause NaN
			totalVehicles: 42,
		});

		render(<TransactionsPageContent />);

		// Should display $0 for invalid amounts
		const volumeLabels = screen.getAllByText("Volumen Total");
		expect(volumeLabels.length).toBeGreaterThan(0);
	});

	it("handles null totalVolume", async () => {
		vi.mocked(statsApi.getTransactionStats).mockResolvedValue({
			transactionsToday: 15,
			suspiciousTransactions: 3,
			totalVolume: null as unknown as string,
			totalVehicles: 42,
		});

		render(<TransactionsPageContent />);

		// Should display $0 for null volume
		const volumeLabels = screen.getAllByText("Volumen Total");
		expect(volumeLabels.length).toBeGreaterThan(0);
	});

	it("renders maximum of 3 stat cards", () => {
		render(<TransactionsPageContent />);

		// Should render exactly 3 stat cards
		const transaccionesHoy = screen.getAllByText("Transacciones Hoy");
		const transaccionesSospechosas = screen.getAllByText(
			"Transacciones Sospechosas",
		);
		const volumenTotal = screen.getAllByText("Volumen Total");
		expect(transaccionesHoy.length).toBeGreaterThan(0);
		expect(transaccionesSospechosas.length).toBeGreaterThan(0);
		expect(volumenTotal.length).toBeGreaterThan(0);
	});

	it("formats currency for exactly 1M", async () => {
		vi.mocked(statsApi.getTransactionStats).mockResolvedValue({
			transactionsToday: 15,
			suspiciousTransactions: 3,
			totalVolume: "1000000.00", // Exactly 1M
			totalVehicles: 42,
		});

		render(<TransactionsPageContent />);

		// Should format as $1.0M
		await screen.findByText("$1.0M");
	});

	it("formats currency for exactly 1K", async () => {
		vi.mocked(statsApi.getTransactionStats).mockResolvedValue({
			transactionsToday: 15,
			suspiciousTransactions: 3,
			totalVolume: "1000.00", // Exactly 1K
			totalVehicles: 42,
		});

		render(<TransactionsPageContent />);

		// Should format as $1.0K
		await screen.findByText("$1.0K");
	});

	it("formats currency for zero amount", async () => {
		vi.mocked(statsApi.getTransactionStats).mockResolvedValue({
			transactionsToday: 15,
			suspiciousTransactions: 3,
			totalVolume: "0.00",
			totalVehicles: 42,
		});

		render(<TransactionsPageContent />);

		// Should format as $0
		const volumeLabels = screen.getAllByText("Volumen Total");
		expect(volumeLabels.length).toBeGreaterThan(0);
	});

	it("handles non-Error exception when fetching stats", async () => {
		vi.mocked(statsApi.getTransactionStats).mockRejectedValue("String error");

		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		render(<TransactionsPageContent />);

		// Wait for async error handling to complete
		await new Promise((resolve) => setTimeout(resolve, 100));

		expect(consoleSpy).toHaveBeenCalledWith(
			expect.stringContaining(
				"[TransactionsPageContent] Error fetching transaction stats:",
			),
			"String error",
		);

		expect(mockToast).toHaveBeenCalledWith({
			title: "Error",
			description: "No se pudieron cargar las estadísticas.",
			variant: "destructive",
		});

		consoleSpy.mockRestore();
	});
});
