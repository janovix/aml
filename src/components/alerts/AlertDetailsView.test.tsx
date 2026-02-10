import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { AlertDetailsView } from "./AlertDetailsView";
import * as alertsApi from "@/lib/api/alerts";
import * as clientsApi from "@/lib/api/clients";
import * as mutations from "@/lib/mutations";
import type { Alert } from "@/lib/api/alerts";
import { mockClients } from "@/data/mockClients";
import { renderWithProviders } from "@/lib/testHelpers";

const mockNavigateTo = vi.fn();
const mockOrgPath = vi.fn((path: string) => `/test-org${path}`);
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
const mockExecuteMutation = vi.fn();

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
	}),
	usePathname: () => "/test-org/alerts/alert-1",
	useSearchParams: () => new URLSearchParams(),
	useParams: () => ({ orgSlug: "test-org", id: "alert-1" }),
}));

vi.mock("@/hooks/useOrgNavigation", () => ({
	useOrgNavigation: () => ({
		navigateTo: mockNavigateTo,
		orgPath: mockOrgPath,
	}),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
	toast: Object.assign(vi.fn(), {
		success: (...args: unknown[]) => mockToastSuccess(...args),
		error: (...args: unknown[]) => mockToastError(...args),
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

vi.mock("@/lib/api/alerts", () => ({
	getAlertById: vi.fn(),
	cancelAlert: vi.fn(),
}));

vi.mock("@/lib/api/clients", () => ({
	getClientById: vi.fn(),
}));

vi.mock("@/lib/mutations", () => ({
	executeMutation: (opts: unknown) => mockExecuteMutation(opts),
	extractErrorMessage: (error: unknown) =>
		error instanceof Error ? error.message : String(error),
}));

vi.mock("@/components/skeletons", () => ({
	PageHeroSkeleton: () => (
		<div data-testid="page-hero-skeleton">Loading...</div>
	),
}));

const mockAlert: Alert = {
	id: "alert-1",
	alertRuleId: "2501",
	clientId: mockClients[0].id,
	status: "DETECTED",
	severity: "HIGH",
	idempotencyKey: "key-1",
	contextHash: "hash-1",
	metadata: { clientName: "Test Company" },
	isManual: false,
	isOverdue: false,
	submissionDeadline: new Date(Date.now() + 86400000 * 7).toISOString(),
	createdAt: new Date("2024-01-01T10:00:00Z").toISOString(),
	updatedAt: new Date("2024-01-01T10:00:00Z").toISOString(),
	alertRule: {
		id: "2501",
		name: "EL CLIENTE SE REHÚSA A PROPORCIONAR DOCUMENTOS",
		description:
			"El cliente se niega a proporcionar la documentación necesaria",
		active: true,
		severity: "HIGH",
		ruleType: null,
		isManualOnly: true,
		activityCode: "VEH",
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	},
};

describe("AlertDetailsView", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.restoreAllMocks();
		mockExecuteMutation.mockImplementation(async ({ mutation, onSuccess }) => {
			const result = await mutation();
			if (onSuccess) {
				onSuccess(result);
			}
			return result;
		});
	});

	it("renders loading skeleton initially", () => {
		vi.mocked(alertsApi.getAlertById).mockImplementation(
			() =>
				new Promise((resolve) => {
					setTimeout(() => resolve(mockAlert), 100);
				}),
		);

		renderWithProviders(<AlertDetailsView alertId="alert-1" />);

		expect(screen.getByTestId("page-hero-skeleton")).toBeInTheDocument();
	});

	it("calls getAlertById with correct params", async () => {
		vi.mocked(alertsApi.getAlertById).mockResolvedValue(mockAlert);
		vi.mocked(clientsApi.getClientById).mockResolvedValue(mockClients[0]);

		renderWithProviders(<AlertDetailsView alertId="alert-1" />);

		await waitFor(() => {
			expect(alertsApi.getAlertById).toHaveBeenCalledWith({
				id: "alert-1",
				jwt: "test-jwt-token",
			});
		});
	});

	it("displays alert rule name in header", async () => {
		vi.mocked(alertsApi.getAlertById).mockResolvedValue(mockAlert);
		vi.mocked(clientsApi.getClientById).mockResolvedValue(mockClients[0]);

		renderWithProviders(<AlertDetailsView alertId="alert-1" />);

		await waitFor(() => {
			const ruleNames = screen.getAllByText(
				"EL CLIENTE SE REHÚSA A PROPORCIONAR DOCUMENTOS",
			);
			expect(ruleNames.length).toBeGreaterThan(0);
		});
	});

	it("displays alert rule code in subtitle", async () => {
		vi.mocked(alertsApi.getAlertById).mockResolvedValue(mockAlert);
		vi.mocked(clientsApi.getClientById).mockResolvedValue(mockClients[0]);

		renderWithProviders(<AlertDetailsView alertId="alert-1" />);

		await waitFor(() => {
			expect(screen.getByText(/Código: 2501/)).toBeInTheDocument();
		});
	});

	it("displays alert status badge", async () => {
		vi.mocked(alertsApi.getAlertById).mockResolvedValue(mockAlert);
		vi.mocked(clientsApi.getClientById).mockResolvedValue(mockClients[0]);

		renderWithProviders(<AlertDetailsView alertId="alert-1" />);

		await waitFor(() => {
			expect(screen.getByText("Detectada")).toBeInTheDocument();
		});
	});

	it("displays alert severity badge", async () => {
		vi.mocked(alertsApi.getAlertById).mockResolvedValue(mockAlert);
		vi.mocked(clientsApi.getClientById).mockResolvedValue(mockClients[0]);

		renderWithProviders(<AlertDetailsView alertId="alert-1" />);

		await waitFor(() => {
			expect(screen.getByText("Alta")).toBeInTheDocument();
		});
	});

	it("displays alert rule description", async () => {
		vi.mocked(alertsApi.getAlertById).mockResolvedValue(mockAlert);
		vi.mocked(clientsApi.getClientById).mockResolvedValue(mockClients[0]);

		renderWithProviders(<AlertDetailsView alertId="alert-1" />);

		await waitFor(() => {
			expect(
				screen.getByText(
					"El cliente se niega a proporcionar la documentación necesaria",
				),
			).toBeInTheDocument();
		});
	});

	it("displays alert type badge", async () => {
		vi.mocked(alertsApi.getAlertById).mockResolvedValue(mockAlert);
		vi.mocked(clientsApi.getClientById).mockResolvedValue(mockClients[0]);

		renderWithProviders(<AlertDetailsView alertId="alert-1" />);

		await waitFor(() => {
			expect(screen.getByText("Automática")).toBeInTheDocument();
		});
	});

	it("displays manual alert type when isManual is true", async () => {
		const manualAlert = { ...mockAlert, isManual: true };
		vi.mocked(alertsApi.getAlertById).mockResolvedValue(manualAlert);
		vi.mocked(clientsApi.getClientById).mockResolvedValue(mockClients[0]);

		renderWithProviders(<AlertDetailsView alertId="alert-1" />);

		await waitFor(() => {
			expect(screen.getByText("Manual")).toBeInTheDocument();
		});
	});

	it("displays client information when client is fetched", async () => {
		vi.mocked(alertsApi.getAlertById).mockResolvedValue(mockAlert);
		vi.mocked(clientsApi.getClientById).mockResolvedValue(mockClients[0]);

		renderWithProviders(<AlertDetailsView alertId="alert-1" />);

		await waitFor(() => {
			expect(clientsApi.getClientById).toHaveBeenCalledWith({
				id: mockClients[0].id,
				jwt: "test-jwt-token",
			});
			expect(screen.getByText(mockClients[0].rfc)).toBeInTheDocument();
		});
	});

	it("displays client ID when client fetch fails", async () => {
		vi.mocked(alertsApi.getAlertById).mockResolvedValue(mockAlert);
		vi.mocked(clientsApi.getClientById).mockRejectedValue(
			new Error("Client not found"),
		);

		renderWithProviders(<AlertDetailsView alertId="alert-1" />);

		await waitFor(() => {
			expect(screen.getByText(/ID del Cliente: /)).toBeInTheDocument();
		});
	});

	it("displays submission deadline when available", async () => {
		vi.mocked(alertsApi.getAlertById).mockResolvedValue(mockAlert);
		vi.mocked(clientsApi.getClientById).mockResolvedValue(mockClients[0]);

		renderWithProviders(<AlertDetailsView alertId="alert-1" />);

		await waitFor(() => {
			expect(screen.getByText("Fecha Límite de Envío")).toBeInTheDocument();
		});
	});

	it("displays overdue indicator when alert is overdue", async () => {
		const overdueAlert = {
			...mockAlert,
			isOverdue: true,
			submissionDeadline: new Date(Date.now() - 86400000).toISOString(),
		};
		vi.mocked(alertsApi.getAlertById).mockResolvedValue(overdueAlert);
		vi.mocked(clientsApi.getClientById).mockResolvedValue(mockClients[0]);

		renderWithProviders(<AlertDetailsView alertId="alert-1" />);

		await waitFor(() => {
			expect(screen.getByText(/Vencida/)).toBeInTheDocument();
		});
	});

	it("displays notes when available", async () => {
		const alertWithNotes = {
			...mockAlert,
			notes: "Esta es una nota de prueba",
		};
		vi.mocked(alertsApi.getAlertById).mockResolvedValue(alertWithNotes);
		vi.mocked(clientsApi.getClientById).mockResolvedValue(mockClients[0]);

		renderWithProviders(<AlertDetailsView alertId="alert-1" />);

		await waitFor(() => {
			expect(
				screen.getByText("Esta es una nota de prueba"),
			).toBeInTheDocument();
		});
	});

	it("displays operation link when transactionId is available", async () => {
		const alertWithOperation = {
			...mockAlert,
			transactionId: "TRX-2024-001",
		};
		vi.mocked(alertsApi.getAlertById).mockResolvedValue(alertWithOperation);
		vi.mocked(clientsApi.getClientById).mockResolvedValue(mockClients[0]);

		renderWithProviders(<AlertDetailsView alertId="alert-1" />);

		await waitFor(() => {
			expect(screen.getByText("Operación Relacionada")).toBeInTheDocument();
			expect(screen.getByText("TRX-2024-001")).toBeInTheDocument();
		});
	});

	it("displays all related operations for N:1 alerts with transactionIds in metadata", async () => {
		const alertWithMultipleOperations = {
			...mockAlert,
			metadata: {
				transactionIds: ["TRX-2024-001", "TRX-2024-002", "TRX-2024-003"],
			},
		};
		vi.mocked(alertsApi.getAlertById).mockResolvedValue(
			alertWithMultipleOperations,
		);
		vi.mocked(clientsApi.getClientById).mockResolvedValue(mockClients[0]);

		renderWithProviders(<AlertDetailsView alertId="alert-1" />);

		await waitFor(() => {
			expect(screen.getByText("Operaciones Relacionadas")).toBeInTheDocument();
			expect(screen.getByText("TRX-2024-001")).toBeInTheDocument();
			expect(screen.getByText("TRX-2024-002")).toBeInTheDocument();
			expect(screen.getByText("TRX-2024-003")).toBeInTheDocument();
			// Check for count badge
			expect(screen.getByText("3")).toBeInTheDocument();
		});
	});

	it("combines transactionId and metadata transactionIds without duplicates", async () => {
		const alertWithBoth = {
			...mockAlert,
			transactionId: "TRX-2024-001",
			metadata: {
				transactionIds: ["TRX-2024-001", "TRX-2024-002"],
			},
		};
		vi.mocked(alertsApi.getAlertById).mockResolvedValue(alertWithBoth);
		vi.mocked(clientsApi.getClientById).mockResolvedValue(mockClients[0]);

		renderWithProviders(<AlertDetailsView alertId="alert-1" />);

		await waitFor(() => {
			expect(screen.getByText("Operaciones Relacionadas")).toBeInTheDocument();
			// Should only show each operation once
			const operationIds = screen.getAllByText("TRX-2024-001");
			expect(operationIds).toHaveLength(1);
			expect(screen.getByText("TRX-2024-002")).toBeInTheDocument();
			// Check for count badge
			expect(screen.getByText("2")).toBeInTheDocument();
		});
	});

	it("displays metadata when available", async () => {
		const alertWithMetadata = {
			...mockAlert,
			metadata: { clientName: "Test Company", customField: "value" },
		};
		vi.mocked(alertsApi.getAlertById).mockResolvedValue(alertWithMetadata);
		vi.mocked(clientsApi.getClientById).mockResolvedValue(mockClients[0]);

		renderWithProviders(<AlertDetailsView alertId="alert-1" />);

		await waitFor(() => {
			expect(screen.getByText("Metadatos")).toBeInTheDocument();
			expect(screen.getByText(/clientName/)).toBeInTheDocument();
		});
	});

	it("displays file generated date when available", async () => {
		const alertWithFile = {
			...mockAlert,
			status: "FILE_GENERATED" as const,
			fileGeneratedAt: new Date("2024-01-02T10:00:00Z").toISOString(),
		};
		vi.mocked(alertsApi.getAlertById).mockResolvedValue(alertWithFile);
		vi.mocked(clientsApi.getClientById).mockResolvedValue(mockClients[0]);

		renderWithProviders(<AlertDetailsView alertId="alert-1" />);

		await waitFor(() => {
			const fileGeneratedTexts = screen.getAllByText("Archivo Generado");
			expect(fileGeneratedTexts.length).toBeGreaterThan(0);
		});
	});

	it("displays submitted date and SAT info when available", async () => {
		const submittedAlert = {
			...mockAlert,
			status: "SUBMITTED" as const,
			submittedAt: new Date("2024-01-03T10:00:00Z").toISOString(),
			satFolioNumber: "FOLIO-123",
			satAcknowledgmentReceipt: "ACK-456",
		};
		vi.mocked(alertsApi.getAlertById).mockResolvedValue(submittedAlert);
		vi.mocked(clientsApi.getClientById).mockResolvedValue(mockClients[0]);

		renderWithProviders(<AlertDetailsView alertId="alert-1" />);

		await waitFor(() => {
			expect(screen.getByText("Enviada a SAT")).toBeInTheDocument();
			expect(screen.getByText("FOLIO-123")).toBeInTheDocument();
			expect(screen.getByText("ACK-456")).toBeInTheDocument();
		});
	});

	it("displays cancelled date and reason when alert is cancelled", async () => {
		const cancelledAlert = {
			...mockAlert,
			status: "CANCELLED" as const,
			cancelledAt: new Date("2024-01-04T10:00:00Z").toISOString(),
			cancellationReason: "Error en los datos",
		};
		vi.mocked(alertsApi.getAlertById).mockResolvedValue(cancelledAlert);
		vi.mocked(clientsApi.getClientById).mockResolvedValue(mockClients[0]);

		renderWithProviders(<AlertDetailsView alertId="alert-1" />);

		await waitFor(() => {
			const cancelledTexts = screen.getAllByText("Cancelada");
			expect(cancelledTexts.length).toBeGreaterThan(0);
			expect(screen.getByText(/Razón: Error en los datos/)).toBeInTheDocument();
		});
	});

	it("does not show cancel button when alert is cancelled", async () => {
		const cancelledAlert = {
			...mockAlert,
			status: "CANCELLED" as const,
		};
		vi.mocked(alertsApi.getAlertById).mockResolvedValue(cancelledAlert);
		vi.mocked(clientsApi.getClientById).mockResolvedValue(mockClients[0]);

		renderWithProviders(<AlertDetailsView alertId="alert-1" />);

		await waitFor(() => {
			expect(screen.queryByText("Cancelar Alerta")).not.toBeInTheDocument();
		});
	});

	it("shows cancel button when alert is not cancelled", async () => {
		vi.mocked(alertsApi.getAlertById).mockResolvedValue(mockAlert);
		vi.mocked(clientsApi.getClientById).mockResolvedValue(mockClients[0]);

		renderWithProviders(<AlertDetailsView alertId="alert-1" />);

		await waitFor(() => {
			// Button appears twice (mobile and desktop), check that at least one exists
			expect(screen.getAllByText("Cancelar Alerta")[0]).toBeInTheDocument();
		});
	});

	it("opens cancel dialog when cancel button is clicked", async () => {
		const user = userEvent.setup();
		vi.mocked(alertsApi.getAlertById).mockResolvedValue(mockAlert);
		vi.mocked(clientsApi.getClientById).mockResolvedValue(mockClients[0]);

		renderWithProviders(<AlertDetailsView alertId="alert-1" />);

		await waitFor(() => {
			// Button appears twice (mobile and desktop), check that at least one exists
			expect(screen.getAllByText("Cancelar Alerta")[0]).toBeInTheDocument();
		});

		// Button appears twice (mobile and desktop), get the first one
		const cancelButton = screen.getAllByText("Cancelar Alerta")[0];
		await user.click(cancelButton);

		await waitFor(() => {
			expect(screen.getByText("¿Cancelar alerta?")).toBeInTheDocument();
		});
	});

	it("cancels alert with reason when form is submitted", async () => {
		const user = userEvent.setup();
		const cancelledAlert = {
			...mockAlert,
			status: "CANCELLED" as const,
		};
		vi.mocked(alertsApi.getAlertById)
			.mockResolvedValueOnce(mockAlert)
			.mockResolvedValueOnce(cancelledAlert);
		vi.mocked(clientsApi.getClientById).mockResolvedValue(mockClients[0]);
		vi.mocked(alertsApi.cancelAlert).mockResolvedValue(cancelledAlert);

		renderWithProviders(<AlertDetailsView alertId="alert-1" />);

		await waitFor(() => {
			// Button appears twice (mobile and desktop), check that at least one exists
			expect(screen.getAllByText("Cancelar Alerta")[0]).toBeInTheDocument();
		});

		// Button appears twice (mobile and desktop), get the first one
		const cancelButton = screen.getAllByText("Cancelar Alerta")[0];
		await user.click(cancelButton);

		await waitFor(() => {
			expect(screen.getByText("¿Cancelar alerta?")).toBeInTheDocument();
		});

		const reasonInput = screen.getByPlaceholderText(
			"Describe la razón de la cancelación...",
		);
		await user.type(reasonInput, "Error en los datos");

		const confirmButton = screen.getByText("Confirmar Cancelación");
		await user.click(confirmButton);

		await waitFor(() => {
			expect(mockExecuteMutation).toHaveBeenCalledWith(
				expect.objectContaining({
					mutation: expect.any(Function),
					loading: "Cancelando alerta...",
					success: "Alerta cancelada exitosamente",
				}),
			);
		});
	});

	it("navigates back to alerts list when back button is clicked", async () => {
		const user = userEvent.setup();
		vi.mocked(alertsApi.getAlertById).mockResolvedValue(mockAlert);
		vi.mocked(clientsApi.getClientById).mockResolvedValue(mockClients[0]);

		renderWithProviders(<AlertDetailsView alertId="alert-1" />);

		await waitFor(() => {
			// PageHero renders the back button, find it by role or text
			const backButton = screen.getByRole("button", { name: /volver/i });
			expect(backButton).toBeInTheDocument();
			user.click(backButton);
		});

		await waitFor(() => {
			expect(mockNavigateTo).toHaveBeenCalledWith("/alerts");
		});
	});

	it("navigates to alerts list on error", async () => {
		vi.mocked(alertsApi.getAlertById).mockRejectedValue(
			new Error("Alert not found"),
		);

		renderWithProviders(<AlertDetailsView alertId="alert-1" />);

		await waitFor(() => {
			expect(mockNavigateTo).toHaveBeenCalledWith("/alerts");
			expect(mockToastError).toHaveBeenCalled();
		});
	});

	it("displays error message when alert is not found", async () => {
		vi.mocked(alertsApi.getAlertById).mockResolvedValue(
			null as unknown as Alert,
		);

		renderWithProviders(<AlertDetailsView alertId="alert-1" />);

		await waitFor(() => {
			expect(screen.getByText("Alerta no encontrada")).toBeInTheDocument();
			expect(screen.getByText("La alerta no existe")).toBeInTheDocument();
		});
	});

	it("displays different severity badges correctly", async () => {
		const severities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

		for (const severity of severities) {
			vi.clearAllMocks();
			const alert = { ...mockAlert, severity };
			vi.mocked(alertsApi.getAlertById).mockResolvedValue(alert);
			vi.mocked(clientsApi.getClientById).mockResolvedValue(mockClients[0]);

			const { unmount } = renderWithProviders(
				<AlertDetailsView alertId="alert-1" />,
			);

			await waitFor(() => {
				const severityLabels: Record<typeof severity, string> = {
					LOW: "Baja",
					MEDIUM: "Media",
					HIGH: "Alta",
					CRITICAL: "Crítica",
				};
				expect(screen.getByText(severityLabels[severity])).toBeInTheDocument();
			});

			unmount();
		}
	});

	it("displays different status badges correctly", async () => {
		const statuses = [
			"DETECTED",
			"FILE_GENERATED",
			"SUBMITTED",
			"OVERDUE",
			"CANCELLED",
		] as const;

		for (const status of statuses) {
			vi.clearAllMocks();
			const alert = { ...mockAlert, status };
			vi.mocked(alertsApi.getAlertById).mockResolvedValue(alert);
			vi.mocked(clientsApi.getClientById).mockResolvedValue(mockClients[0]);

			const { unmount } = renderWithProviders(
				<AlertDetailsView alertId="alert-1" />,
			);

			await waitFor(() => {
				const statusLabels: Record<typeof status, string> = {
					DETECTED: "Detectada",
					FILE_GENERATED: "Archivo Generado",
					SUBMITTED: "Enviada",
					OVERDUE: "Vencida",
					CANCELLED: "Canceladas", // Plural form used in the translation
				};
				expect(screen.getByText(statusLabels[status])).toBeInTheDocument();
			});

			unmount();
		}
	});

	it("displays formatted dates correctly", async () => {
		vi.mocked(alertsApi.getAlertById).mockResolvedValue(mockAlert);
		vi.mocked(clientsApi.getClientById).mockResolvedValue(mockClients[0]);

		renderWithProviders(<AlertDetailsView alertId="alert-1" />);

		await waitFor(() => {
			// Check that created date is displayed (formatted)
			expect(screen.getByText("Creada")).toBeInTheDocument();
		});
	});

	it("does not display updated date when same as created date", async () => {
		vi.mocked(alertsApi.getAlertById).mockResolvedValue(mockAlert);
		vi.mocked(clientsApi.getClientById).mockResolvedValue(mockClients[0]);

		renderWithProviders(<AlertDetailsView alertId="alert-1" />);

		await waitFor(() => {
			expect(screen.queryByText("Actualizada")).not.toBeInTheDocument();
		});
	});

	it("displays updated date when different from created date", async () => {
		const updatedAlert = {
			...mockAlert,
			updatedAt: new Date("2024-01-02T10:00:00Z").toISOString(),
		};
		vi.mocked(alertsApi.getAlertById).mockResolvedValue(updatedAlert);
		vi.mocked(clientsApi.getClientById).mockResolvedValue(mockClients[0]);

		renderWithProviders(<AlertDetailsView alertId="alert-1" />);

		await waitFor(() => {
			expect(screen.getByText("Actualizada")).toBeInTheDocument();
		});
	});
});
