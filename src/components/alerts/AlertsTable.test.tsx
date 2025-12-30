import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AlertsTable } from "./AlertsTable";
import { mockClients } from "@/data/mockClients";
import type { Alert, AlertsListResponse } from "@/lib/api/alerts";
import * as alertsApi from "@/lib/api/alerts";
import * as clientsApi from "@/lib/api/clients";

const mockToast = vi.fn();

vi.mock("@/hooks/use-toast", () => ({
	useToast: () => ({
		toast: mockToast,
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

vi.mock("@/hooks/use-mobile", () => ({
	useIsMobile: () => false,
}));

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: mockPush,
	}),
}));

vi.mock("@/lib/api/alerts", () => ({
	listAlerts: vi.fn(),
	getAlertById: vi.fn(),
}));

vi.mock("@/lib/api/clients", () => ({
	getClientByRfc: vi.fn(),
}));

const mockAlerts: Alert[] = [
	{
		id: "alert-1",
		alertRuleId: "rule-1",
		clientId: mockClients[0].rfc,
		status: "DETECTED",
		severity: "HIGH",
		idempotencyKey: "key-1",
		contextHash: "hash-1",
		alertData: "{}",
		submissionDeadline: new Date(Date.now() + 86400000 * 7).toISOString(), // 7 days from now
		isOverdue: false,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		alertRule: {
			id: "rule-1",
			name: "Operación inusual",
			description: "Detecta operaciones inusuales",
			active: true,
			severity: "HIGH",
			ruleConfig: "{}",
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		},
	},
	{
		id: "alert-2",
		alertRuleId: "rule-2",
		clientId: mockClients[1].rfc,
		status: "SUBMITTED",
		severity: "MEDIUM",
		idempotencyKey: "key-2",
		contextHash: "hash-2",
		alertData: "{}",
		submissionDeadline: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
		isOverdue: true,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		alertRule: {
			id: "rule-2",
			name: "Transacción de alto monto",
			description: "Detecta transacciones de alto monto",
			active: true,
			severity: "MEDIUM",
			ruleConfig: "{}",
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		},
	},
	{
		id: "alert-3",
		alertRuleId: "rule-3",
		clientId: mockClients[2].rfc,
		status: "CANCELLED",
		severity: "LOW",
		idempotencyKey: "key-3",
		contextHash: "hash-3",
		alertData: "{}",
		isOverdue: false,
		cancellationReason: "Falso positivo",
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		alertRule: {
			id: "rule-3",
			name: "Estructuración",
			description: "Detecta estructuración",
			active: true,
			severity: "LOW",
			ruleConfig: "{}",
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		},
	},
];

describe("AlertsTable", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(alertsApi.listAlerts).mockResolvedValue({
			data: mockAlerts,
			pagination: {
				page: 1,
				limit: 100,
				total: mockAlerts.length,
				totalPages: 1,
			},
		} as AlertsListResponse);

		vi.mocked(clientsApi.getClientByRfc).mockImplementation(async ({ rfc }) => {
			const client = mockClients.find((c) => c.rfc === rfc);
			if (client) {
				return client;
			}
			throw new Error("Client not found");
		});
	});

	it("renders table with alert data", async () => {
		render(<AlertsTable />);

		await waitFor(() => {
			expect(screen.getByText("Operación inusual")).toBeInTheDocument();
		});
	});

	it("renders all alert rows", async () => {
		render(<AlertsTable />);

		await waitFor(() => {
			expect(screen.getByText("Operación inusual")).toBeInTheDocument();
			expect(screen.getByText("Transacción de alto monto")).toBeInTheDocument();
			expect(screen.getByText("Estructuración")).toBeInTheDocument();
		});
	});

	it("allows selecting individual alerts", async () => {
		const user = userEvent.setup();
		render(<AlertsTable />);

		await waitFor(() => {
			expect(screen.getByText("Operación inusual")).toBeInTheDocument();
		});

		const checkboxes = screen.getAllByRole("checkbox");
		const firstAlertCheckbox = checkboxes[1];
		await user.click(firstAlertCheckbox);

		await waitFor(() => {
			expect(firstAlertCheckbox).toBeChecked();
		});
	});

	it("allows selecting all alerts", async () => {
		const user = userEvent.setup();
		render(<AlertsTable />);

		await waitFor(() => {
			expect(screen.getByText("Operación inusual")).toBeInTheDocument();
		});

		const selectAllCheckbox = screen.getAllByRole("checkbox")[0];
		await user.click(selectAllCheckbox);

		await waitFor(() => {
			expect(selectAllCheckbox).toBeChecked();
		});
	});

	it("shows loading state while fetching", async () => {
		let resolveAlerts: (value: unknown) => void;
		const alertsPromise = new Promise((resolve) => {
			resolveAlerts = resolve;
		});
		vi.mocked(alertsApi.listAlerts).mockReturnValue(
			alertsPromise as Promise<AlertsListResponse>,
		);

		render(<AlertsTable />);

		expect(screen.getByText("Cargando alertas...")).toBeInTheDocument();

		resolveAlerts!({
			data: mockAlerts,
			pagination: {
				page: 1,
				limit: 100,
				total: mockAlerts.length,
				totalPages: 1,
			},
		});

		await waitFor(() => {
			expect(screen.getByText("Operación inusual")).toBeInTheDocument();
		});
	});

	it("handles API error gracefully", async () => {
		vi.mocked(alertsApi.listAlerts).mockRejectedValue(new Error("API error"));

		render(<AlertsTable />);

		await waitFor(() => {
			expect(mockToast).toHaveBeenCalledWith(
				expect.objectContaining({
					title: "Error",
					description: "No se pudieron cargar las alertas.",
					variant: "destructive",
				}),
			);
		});
	});

	it("has search functionality", async () => {
		const user = userEvent.setup();
		render(<AlertsTable />);

		await waitFor(() => {
			expect(screen.getByText("Operación inusual")).toBeInTheDocument();
		});

		const searchInput = screen.getByPlaceholderText(/buscar/i);
		expect(searchInput).toBeInTheDocument();

		await user.type(searchInput, "Operación");

		await waitFor(() => {
			expect(screen.getByText("Operación inusual")).toBeInTheDocument();
		});
	});

	it("has filter popovers", async () => {
		render(<AlertsTable />);

		await waitFor(() => {
			expect(screen.getByText("Operación inusual")).toBeInTheDocument();
		});

		// Use getAllByText since filter can appear in multiple places
		const estadoFilters = screen.getAllByText("Estado");
		const severidadFilters = screen.getAllByText("Severidad");
		const vencimientoFilters = screen.getAllByText("Vencimiento");
		expect(estadoFilters.length).toBeGreaterThan(0);
		expect(severidadFilters.length).toBeGreaterThan(0);
		expect(vencimientoFilters.length).toBeGreaterThan(0);
	});

	it("renders action menu for alerts", async () => {
		render(<AlertsTable />);

		await waitFor(() => {
			expect(screen.getByText("Operación inusual")).toBeInTheDocument();
		});

		// Check that rows have action buttons
		const rows = screen.getAllByRole("row");
		expect(rows.length).toBeGreaterThan(1); // header + data rows
	});

	it("renders client links in alerts", async () => {
		render(<AlertsTable />);

		await waitFor(() => {
			expect(screen.getByText("Operación inusual")).toBeInTheDocument();
		});

		// Check for client links
		const links = screen.getAllByRole("link");
		expect(links.length).toBeGreaterThan(0);
	});

	it("shows selected count in footer", async () => {
		const user = userEvent.setup();
		render(<AlertsTable />);

		await waitFor(() => {
			expect(screen.getByText("Operación inusual")).toBeInTheDocument();
		});

		const checkboxes = screen.getAllByRole("checkbox");
		await user.click(checkboxes[1]);
		await user.click(checkboxes[2]);

		await waitFor(() => {
			expect(screen.getByText(/2 seleccionados/)).toBeInTheDocument();
		});
	});

	it("passes filters to API", async () => {
		const filters = { status: "DETECTED" as const };
		render(<AlertsTable filters={filters} />);

		await waitFor(() => {
			expect(alertsApi.listAlerts).toHaveBeenCalledWith(
				expect.objectContaining({
					status: "DETECTED",
				}),
			);
		});
	});
});
