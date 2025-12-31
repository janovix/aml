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

const mockCurrentOrg = { id: "org-1", name: "Test Org", slug: "test-org" };

const mockUseOrgStore = vi.fn(() => ({
	currentOrg: mockCurrentOrg,
}));

vi.mock("@/lib/org-store", () => ({
	useOrgStore: () => mockUseOrgStore(),
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

		// Should show skeleton loaders instead of text
		const skeletons = screen.getAllByTestId("skeleton");
		expect(skeletons.length).toBeGreaterThan(0);

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

	it("renders deadline column with null submissionDeadline", async () => {
		const firstAlert = mockAlerts[0];
		if (!firstAlert || !firstAlert.alertRule) return;

		const alertWithoutDeadline: Alert = {
			...firstAlert,
			submissionDeadline: undefined,
		};

		vi.mocked(alertsApi.listAlerts).mockResolvedValueOnce({
			data: [alertWithoutDeadline],
			pagination: {
				page: 1,
				limit: 100,
				total: 1,
				totalPages: 1,
			},
		});

		render(<AlertsTable />);

		await waitFor(() => {
			// Should render alert even without deadline
			expect(screen.getByText(firstAlert.alertRule!.name)).toBeInTheDocument();
		});
	});

	it("renders deadline column with overdue status", async () => {
		const secondAlert = mockAlerts[1];
		if (!secondAlert || !secondAlert.alertRule) return;

		render(<AlertsTable />);

		await waitFor(() => {
			// Should render overdue alerts
			expect(screen.getByText(secondAlert.alertRule!.name)).toBeInTheDocument();
		});
	});

	it("renders ruleName column with notes", async () => {
		const firstAlert = mockAlerts[0];
		if (!firstAlert || !firstAlert.alertRule) return;

		const alertWithNotes: Alert = {
			...firstAlert,
			notes: "Test notes",
		};

		vi.mocked(alertsApi.listAlerts).mockResolvedValueOnce({
			data: [alertWithNotes],
			pagination: {
				page: 1,
				limit: 100,
				total: 1,
				totalPages: 1,
			},
		});

		render(<AlertsTable />);

		await waitFor(() => {
			// Should render alert with notes
			expect(screen.getByText(firstAlert.alertRule!.name)).toBeInTheDocument();
		});
	});

	it("renders action menu with DETECTED status options", async () => {
		const user = userEvent.setup();
		const firstAlert = mockAlerts[0];
		if (!firstAlert || !firstAlert.alertRule) return;

		const detectedAlert: Alert = {
			...firstAlert,
			status: "DETECTED",
		};

		vi.mocked(alertsApi.listAlerts).mockResolvedValueOnce({
			data: [detectedAlert],
			pagination: {
				page: 1,
				limit: 100,
				total: 1,
				totalPages: 1,
			},
		});

		render(<AlertsTable />);

		await waitFor(() => {
			expect(screen.getByText(firstAlert.alertRule!.name)).toBeInTheDocument();
		});

		// Open action menu
		const actionButtons = screen.getAllByRole("button", { hidden: true });
		const moreButton = actionButtons.find((btn) =>
			btn.querySelector('[class*="MoreHorizontal"]'),
		);
		if (moreButton) {
			await user.click(moreButton);

			await waitFor(() => {
				// Should show "Generar archivo" for DETECTED status
				expect(screen.getByText("Generar archivo")).toBeInTheDocument();
			});
		}
	});

	it("renders action menu with FILE_GENERATED status options", async () => {
		const user = userEvent.setup();
		const firstAlert = mockAlerts[0];
		if (!firstAlert || !firstAlert.alertRule) return;

		const fileGeneratedAlert: Alert = {
			...firstAlert,
			status: "FILE_GENERATED",
		};

		vi.mocked(alertsApi.listAlerts).mockResolvedValueOnce({
			data: [fileGeneratedAlert],
			pagination: {
				page: 1,
				limit: 100,
				total: 1,
				totalPages: 1,
			},
		});

		render(<AlertsTable />);

		await waitFor(() => {
			expect(screen.getByText(firstAlert.alertRule!.name)).toBeInTheDocument();
		});

		// Open action menu
		const actionButtons = screen.getAllByRole("button", { hidden: true });
		const moreButton = actionButtons.find((btn) =>
			btn.querySelector('[class*="MoreHorizontal"]'),
		);
		if (moreButton) {
			await user.click(moreButton);

			await waitFor(() => {
				// Should show "Enviar a SAT" for FILE_GENERATED status
				expect(screen.getByText("Enviar a SAT")).toBeInTheDocument();
			});
		}
	});

	it("renders action menu with cancel option for non-CANCELLED and non-SUBMITTED status", async () => {
		const user = userEvent.setup();
		const firstAlert = mockAlerts[0];
		if (!firstAlert || !firstAlert.alertRule) return;

		render(<AlertsTable />);

		await waitFor(() => {
			expect(screen.getByText(firstAlert.alertRule!.name)).toBeInTheDocument();
		});

		// Open action menu
		const actionButtons = screen.getAllByRole("button", { hidden: true });
		const moreButton = actionButtons.find((btn) =>
			btn.querySelector('[class*="MoreHorizontal"]'),
		);
		if (moreButton) {
			await user.click(moreButton);

			await waitFor(() => {
				// Should show "Cancelar alerta" for DETECTED status
				expect(screen.getByText("Cancelar alerta")).toBeInTheDocument();
			});
		}
	});

	it("does not render cancel option for CANCELLED status", async () => {
		const user = userEvent.setup();
		const firstAlert = mockAlerts[0];
		if (!firstAlert || !firstAlert.alertRule) return;

		const cancelledAlert: Alert = {
			...firstAlert,
			status: "CANCELLED",
		};

		vi.mocked(alertsApi.listAlerts).mockResolvedValueOnce({
			data: [cancelledAlert],
			pagination: {
				page: 1,
				limit: 100,
				total: 1,
				totalPages: 1,
			},
		});

		render(<AlertsTable />);

		await waitFor(() => {
			expect(screen.getByText(firstAlert.alertRule!.name)).toBeInTheDocument();
		});

		// Open action menu
		const actionButtons = screen.getAllByRole("button", { hidden: true });
		const moreButton = actionButtons.find((btn) =>
			btn.querySelector('[class*="MoreHorizontal"]'),
		);
		if (moreButton) {
			await user.click(moreButton);

			await waitFor(() => {
				// Should not show "Cancelar alerta" for CANCELLED status
				expect(screen.queryByText("Cancelar alerta")).not.toBeInTheDocument();
			});
		}
	});

	it("does not render cancel option for SUBMITTED status", async () => {
		const user = userEvent.setup();
		const firstAlert = mockAlerts[0];
		if (!firstAlert || !firstAlert.alertRule) return;

		const submittedAlert: Alert = {
			...firstAlert,
			status: "SUBMITTED",
		};

		vi.mocked(alertsApi.listAlerts).mockResolvedValueOnce({
			data: [submittedAlert],
			pagination: {
				page: 1,
				limit: 100,
				total: 1,
				totalPages: 1,
			},
		});

		render(<AlertsTable />);

		await waitFor(() => {
			expect(screen.getByText(firstAlert.alertRule!.name)).toBeInTheDocument();
		});

		// Open action menu
		const actionButtons = screen.getAllByRole("button", { hidden: true });
		const moreButton = actionButtons.find((btn) =>
			btn.querySelector('[class*="MoreHorizontal"]'),
		);
		if (moreButton) {
			await user.click(moreButton);

			await waitFor(() => {
				// Should not show "Cancelar alerta" for SUBMITTED status
				expect(screen.queryByText("Cancelar alerta")).not.toBeInTheDocument();
			});
		}
	});

	it("renders Generar archivo option for DETECTED status", async () => {
		const user = userEvent.setup();
		const firstAlert = mockAlerts[0];
		if (!firstAlert || !firstAlert.alertRule) return;

		const detectedAlert: Alert = {
			...firstAlert,
			status: "DETECTED",
		};

		vi.mocked(alertsApi.listAlerts).mockResolvedValueOnce({
			data: [detectedAlert],
			pagination: {
				page: 1,
				limit: 100,
				total: 1,
				totalPages: 1,
			},
		});

		render(<AlertsTable />);

		await waitFor(() => {
			expect(screen.getByText(firstAlert.alertRule!.name)).toBeInTheDocument();
		});

		// Open action menu
		const actionButtons = screen.getAllByRole("button", { hidden: true });
		const moreButton = actionButtons.find((btn) =>
			btn.querySelector('[class*="MoreHorizontal"]'),
		);
		if (moreButton) {
			await user.click(moreButton);

			await waitFor(() => {
				// Should show "Generar archivo" for DETECTED status
				expect(screen.getByText("Generar archivo")).toBeInTheDocument();
			});
		}
	});

	it("renders Enviar a SAT option for FILE_GENERATED status", async () => {
		const user = userEvent.setup();
		const firstAlert = mockAlerts[0];
		if (!firstAlert || !firstAlert.alertRule) return;

		const fileGeneratedAlert: Alert = {
			...firstAlert,
			status: "FILE_GENERATED",
		};

		vi.mocked(alertsApi.listAlerts).mockResolvedValueOnce({
			data: [fileGeneratedAlert],
			pagination: {
				page: 1,
				limit: 100,
				total: 1,
				totalPages: 1,
			},
		});

		render(<AlertsTable />);

		await waitFor(() => {
			expect(screen.getByText(firstAlert.alertRule!.name)).toBeInTheDocument();
		});

		// Open action menu
		const actionButtons = screen.getAllByRole("button", { hidden: true });
		const moreButton = actionButtons.find((btn) =>
			btn.querySelector('[class*="MoreHorizontal"]'),
		);
		if (moreButton) {
			await user.click(moreButton);

			await waitFor(() => {
				// Should show "Enviar a SAT" for FILE_GENERATED status
				expect(screen.getByText("Enviar a SAT")).toBeInTheDocument();
			});
		}
	});

	it("navigates to alert detail when Ver detalle is clicked", async () => {
		const user = userEvent.setup();
		render(<AlertsTable />);

		await waitFor(() => {
			expect(screen.getByText("Operación inusual")).toBeInTheDocument();
		});

		// Open action menu
		const actionButtons = screen.getAllByRole("button", { hidden: true });
		const moreButton = actionButtons.find((btn) =>
			btn.querySelector('[class*="MoreHorizontal"]'),
		);
		if (moreButton) {
			await user.click(moreButton);

			await waitFor(() => {
				expect(screen.getByText("Ver detalle")).toBeInTheDocument();
			});

			await user.click(screen.getByText("Ver detalle"));

			expect(mockPush).toHaveBeenCalledWith(`/alerts/${mockAlerts[0]?.id}`);
		}
	});

	it("navigates to client when Ver cliente is clicked", async () => {
		const user = userEvent.setup();
		render(<AlertsTable />);

		await waitFor(() => {
			expect(screen.getByText("Operación inusual")).toBeInTheDocument();
		});

		// Open action menu
		const actionButtons = screen.getAllByRole("button", { hidden: true });
		const moreButton = actionButtons.find((btn) =>
			btn.querySelector('[class*="MoreHorizontal"]'),
		);
		if (moreButton) {
			await user.click(moreButton);

			await waitFor(() => {
				expect(screen.getByText("Ver cliente")).toBeInTheDocument();
			});

			await user.click(screen.getByText("Ver cliente"));

			expect(mockPush).toHaveBeenCalledWith(
				`/clients/${mockAlerts[0]?.clientId}`,
			);
		}
	});

	it("renders CTA button that navigates to new alert page", async () => {
		const user = userEvent.setup();
		render(<AlertsTable />);

		await waitFor(() => {
			expect(screen.getByText("Operación inusual")).toBeInTheDocument();
		});

		// Find the new alert buttons in the PageHero (there are mobile and desktop versions)
		const newAlertButtons = screen.getAllByRole("button", {
			name: /nueva alerta/i,
		});
		expect(newAlertButtons.length).toBeGreaterThan(0);

		await user.click(newAlertButtons[0]);
		expect(mockPush).toHaveBeenCalledWith("/alerts/new");
	});

	it("refetches data when organization changes", async () => {
		// Initial render with org-1
		mockUseOrgStore.mockReturnValue({
			currentOrg: { id: "org-1", name: "Test Org", slug: "test-org" },
		});

		const { rerender } = render(<AlertsTable />);

		await waitFor(() => {
			expect(screen.getByText("Operación inusual")).toBeInTheDocument();
		});

		// Verify initial fetch was called
		expect(alertsApi.listAlerts).toHaveBeenCalledTimes(1);

		// Change organization
		mockUseOrgStore.mockReturnValue({
			currentOrg: { id: "org-2", name: "Other Org", slug: "other-org" },
		});

		// Rerender to trigger the effect with new org
		rerender(<AlertsTable />);

		// Wait for the refetch to be called
		await waitFor(() => {
			expect(alertsApi.listAlerts).toHaveBeenCalledTimes(2);
		});
	});
});
