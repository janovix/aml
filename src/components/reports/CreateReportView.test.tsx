import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { CreateReportView } from "./CreateReportView";
import * as reportsApi from "@/lib/api/reports";
import { renderWithProviders } from "@/lib/testHelpers";
import * as sonner from "sonner";

const mockNavigateTo = vi.fn();

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
	}),
	usePathname: () => "/test-org/reports/new",
	useSearchParams: () => new URLSearchParams(),
	useParams: () => ({ orgSlug: "test-org" }),
}));

vi.mock("@/hooks/useOrgNavigation", () => ({
	useOrgNavigation: () => ({
		navigateTo: mockNavigateTo,
		orgPath: (path: string) => `/test-org${path}`,
	}),
}));

vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

vi.mock("@/hooks/useJwt", () => ({
	useJwt: () => ({
		jwt: "test-jwt-token",
		isLoading: false,
	}),
}));

vi.mock("@/lib/api/reports", () => ({
	previewReport: vi.fn(),
	createReport: vi.fn(),
	calculateQuarterlyPeriod: vi.fn(),
	calculateAnnualPeriod: vi.fn(),
}));

const mockPreview: reportsApi.ReportPreviewResponse = {
	total: 10,
	bySeverity: { HIGH: 5, MEDIUM: 3, LOW: 2 },
	byStatus: { DETECTED: 8, SUBMITTED: 2 },
	periodStart: "2024-01-01T00:00:00Z",
	periodEnd: "2024-01-31T23:59:59.999Z",
};

const mockCreatedReport: reportsApi.Report = {
	id: "report-1",
	organizationId: "org-1",
	name: "Resumen Ejecutivo - Enero 2024",
	periodType: "MONTHLY",
	status: "DRAFT",
	periodStart: "2024-01-01T00:00:00Z",
	periodEnd: "2024-01-31T23:59:59.999Z",
	reportedMonth: "202401",
	recordCount: 10,
	pdfFileUrl: null,
	fileSize: null,
	generatedAt: null,
	createdBy: "user-1",
	notes: null,
	createdAt: "2024-01-15T10:00:00Z",
	updatedAt: "2024-01-15T10:00:00Z",
};

describe("CreateReportView", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(sonner.toast.success).mockClear();
		vi.mocked(sonner.toast.error).mockClear();
		const currentYear = new Date().getFullYear();

		vi.mocked(reportsApi.calculateQuarterlyPeriod).mockReturnValue({
			periodStart: new Date("2024-01-01T00:00:00Z"),
			periodEnd: new Date("2024-03-31T23:59:59.999Z"),
			reportedMonth: `${currentYear}Q1`,
			displayName: `Q1 ${currentYear}`,
		});

		vi.mocked(reportsApi.calculateAnnualPeriod).mockReturnValue({
			periodStart: new Date(`${currentYear}-01-01T00:00:00Z`),
			periodEnd: new Date(`${currentYear}-12-31T23:59:59.999Z`),
			reportedMonth: String(currentYear),
			displayName: `Anual ${currentYear}`,
		});

		vi.mocked(reportsApi.previewReport).mockResolvedValue(mockPreview);
	});

	// Helper function to navigate through wizard steps
	async function goToStep(step: number) {
		const user = userEvent.setup();

		// Step 1: Select template
		if (step >= 1) {
			await waitFor(() => {
				expect(
					screen.getByText("Selecciona una Plantilla"),
				).toBeInTheDocument();
			});

			// Select Executive Summary template
			const templateButton = screen
				.getByText("Resumen Ejecutivo")
				.closest("button");
			if (templateButton) {
				await user.click(templateButton);
			}
		}

		// Navigate to step 2
		if (step >= 2) {
			const nextButton = screen.getByText("Siguiente");
			await user.click(nextButton);

			await waitFor(() => {
				expect(screen.getByText("Define el Período")).toBeInTheDocument();
			});
		}

		// Navigate to step 3
		if (step >= 3) {
			const nextButton = screen.getByText("Siguiente");
			await user.click(nextButton);

			await waitFor(() => {
				expect(screen.getByText("Opciones del Reporte")).toBeInTheDocument();
			});
		}

		// Navigate to step 4
		if (step >= 4) {
			const nextButton = screen.getByText("Siguiente");
			await user.click(nextButton);

			await waitFor(() => {
				expect(screen.getByText("Revisar y Crear")).toBeInTheDocument();
			});
		}
	}

	it("renders wizard with template selection as first step", async () => {
		renderWithProviders(<CreateReportView />);

		await waitFor(() => {
			expect(screen.getByText("Nuevo Reporte")).toBeInTheDocument();
		});

		expect(screen.getByText("Selecciona una Plantilla")).toBeInTheDocument();
		expect(screen.getByText("Resumen Ejecutivo")).toBeInTheDocument();
		expect(screen.getByText("Estado de Cumplimiento")).toBeInTheDocument();
		expect(screen.getByText("Análisis de Transacciones")).toBeInTheDocument();
	});

	it("shows all available templates", async () => {
		renderWithProviders(<CreateReportView />);

		await waitFor(() => {
			expect(screen.getByText("Resumen Ejecutivo")).toBeInTheDocument();
		});

		expect(screen.getByText("Estado de Cumplimiento")).toBeInTheDocument();
		expect(screen.getByText("Análisis de Transacciones")).toBeInTheDocument();
		expect(
			screen.getByText("Perfil de Riesgo de Clientes"),
		).toBeInTheDocument();
		expect(screen.getByText("Desglose de Alertas")).toBeInTheDocument();
		expect(screen.getByText("Comparación de Períodos")).toBeInTheDocument();
	});

	it("enables next button only when template is selected", async () => {
		const user = userEvent.setup();
		renderWithProviders(<CreateReportView />);

		await waitFor(() => {
			expect(screen.getByText("Siguiente")).toBeInTheDocument();
		});

		// Next button should be disabled initially
		const nextButton = screen.getByText("Siguiente");
		expect(nextButton).toBeDisabled();

		// Select a template
		const templateButton = screen
			.getByText("Resumen Ejecutivo")
			.closest("button");
		if (templateButton) {
			await user.click(templateButton);
		}

		// Next button should now be enabled
		expect(nextButton).toBeEnabled();
	});

	it("navigates to period step when next is clicked after selecting template", async () => {
		renderWithProviders(<CreateReportView />);
		await goToStep(2);

		expect(screen.getByText("Define el Período")).toBeInTheDocument();
		expect(screen.getByText("Mensual")).toBeInTheDocument();
		expect(screen.getByText("Trimestral")).toBeInTheDocument();
		expect(screen.getByText("Anual")).toBeInTheDocument();
		expect(screen.getByText("Personalizado")).toBeInTheDocument();
	});

	it("shows monthly period options by default", async () => {
		renderWithProviders(<CreateReportView />);
		await goToStep(2);

		expect(screen.getByLabelText("Año")).toBeInTheDocument();
		expect(screen.getByLabelText("Mes")).toBeInTheDocument();
	});

	it("switches to quarterly period options", async () => {
		const user = userEvent.setup();
		renderWithProviders(<CreateReportView />);
		await goToStep(2);

		// Click on Trimestral button
		const quarterlyButton = screen.getByText("Trimestral").closest("button");
		if (quarterlyButton) {
			await user.click(quarterlyButton);
		}

		await waitFor(() => {
			expect(screen.getByLabelText("Trimestre")).toBeInTheDocument();
		});
	});

	it("switches to annual period options", async () => {
		const user = userEvent.setup();
		renderWithProviders(<CreateReportView />);
		await goToStep(2);

		// Click on Anual button
		const annualButton = screen.getByText("Anual").closest("button");
		if (annualButton) {
			await user.click(annualButton);
		}

		await waitFor(() => {
			expect(screen.getByLabelText("Año")).toBeInTheDocument();
			// Should only have year selector, not month or quarter
			expect(screen.queryByLabelText("Mes")).not.toBeInTheDocument();
		});
	});

	it("switches to custom date range options", async () => {
		const user = userEvent.setup();
		renderWithProviders(<CreateReportView />);
		await goToStep(2);

		// Click on Personalizado button
		const customButton = screen.getByText("Personalizado").closest("button");
		if (customButton) {
			await user.click(customButton);
		}

		await waitFor(() => {
			expect(screen.getByLabelText("Fecha inicio")).toBeInTheDocument();
			expect(screen.getByLabelText("Fecha fin")).toBeInTheDocument();
		});
	});

	it("shows period display text after selecting period", async () => {
		renderWithProviders(<CreateReportView />);
		await goToStep(2);

		await waitFor(() => {
			expect(screen.getByText("Período seleccionado:")).toBeInTheDocument();
		});
	});

	it("navigates to options step", async () => {
		renderWithProviders(<CreateReportView />);
		await goToStep(3);

		expect(screen.getByText("Opciones del Reporte")).toBeInTheDocument();
		expect(screen.getByLabelText("Nombre del Reporte")).toBeInTheDocument();
		expect(screen.getByLabelText("Notas (opcional)")).toBeInTheDocument();
	});

	it("auto-generates report name based on template and period", async () => {
		renderWithProviders(<CreateReportView />);
		await goToStep(3);

		const nameInput = screen.getByLabelText(
			"Nombre del Reporte",
		) as HTMLInputElement;
		expect(nameInput.value).toContain("Resumen Ejecutivo");
	});

	it("allows editing report name", async () => {
		const user = userEvent.setup();
		renderWithProviders(<CreateReportView />);
		await goToStep(3);

		const nameInput = screen.getByLabelText("Nombre del Reporte");
		await user.clear(nameInput);
		await user.type(nameInput, "Custom Report Name");

		expect(nameInput).toHaveValue("Custom Report Name");
	});

	it("allows adding notes", async () => {
		const user = userEvent.setup();
		renderWithProviders(<CreateReportView />);
		await goToStep(3);

		const notesInput = screen.getByLabelText("Notas (opcional)");
		await user.type(notesInput, "Test notes for report");

		expect(notesInput).toHaveValue("Test notes for report");
	});

	it("shows charts toggle in options", async () => {
		renderWithProviders(<CreateReportView />);
		await goToStep(3);

		expect(screen.getByText("Incluir Gráficas")).toBeInTheDocument();
	});

	it("navigates to review step", async () => {
		renderWithProviders(<CreateReportView />);
		await goToStep(4);

		expect(screen.getByText("Revisar y Crear")).toBeInTheDocument();
		expect(screen.getByText("Configuración del Reporte")).toBeInTheDocument();
		expect(screen.getByText("Vista Previa de Datos")).toBeInTheDocument();
	});

	it("displays preview data in review step", async () => {
		renderWithProviders(<CreateReportView />);
		await goToStep(4);

		await waitFor(() => {
			expect(screen.getByText("Total Alertas")).toBeInTheDocument();
		});

		expect(screen.getByText("10")).toBeInTheDocument();
	});

	it("displays severity breakdown in preview", async () => {
		renderWithProviders(<CreateReportView />);
		await goToStep(4);

		await waitFor(() => {
			expect(screen.getByText("Por Severidad")).toBeInTheDocument();
		});

		expect(screen.getByText("high")).toBeInTheDocument();
		expect(screen.getByText("medium")).toBeInTheDocument();
		expect(screen.getByText("low")).toBeInTheDocument();
	});

	it("displays status breakdown in preview", async () => {
		renderWithProviders(<CreateReportView />);
		await goToStep(4);

		await waitFor(() => {
			expect(screen.getByText("Por Estado")).toBeInTheDocument();
		});

		expect(screen.getByText("detected")).toBeInTheDocument();
		expect(screen.getByText("submitted")).toBeInTheDocument();
	});

	it("shows empty preview message when no alerts", async () => {
		vi.mocked(reportsApi.previewReport).mockResolvedValue({
			...mockPreview,
			total: 0,
			bySeverity: {},
			byStatus: {},
		});

		renderWithProviders(<CreateReportView />);
		await goToStep(4);

		await waitFor(() => {
			expect(
				screen.getByText("No hay alertas en este período"),
			).toBeInTheDocument();
		});
	});

	it("creates report successfully from review step", async () => {
		const user = userEvent.setup();
		vi.mocked(reportsApi.createReport).mockResolvedValue(mockCreatedReport);

		renderWithProviders(<CreateReportView />);
		await goToStep(4);

		await waitFor(() => {
			expect(screen.getByText("Crear Reporte")).toBeInTheDocument();
		});

		const submitButton = screen.getByText("Crear Reporte");
		await user.click(submitButton);

		await waitFor(() => {
			expect(reportsApi.createReport).toHaveBeenCalled();
		});

		expect(sonner.toast.success).toHaveBeenCalledWith(
			"Reporte creado exitosamente",
		);
		expect(mockNavigateTo).toHaveBeenCalledWith("/reports/report-1");
	});

	it("handles creation error gracefully", async () => {
		const user = userEvent.setup();
		vi.mocked(reportsApi.createReport).mockRejectedValue(
			new Error("Failed to create report"),
		);

		renderWithProviders(<CreateReportView />);
		await goToStep(4);

		const submitButton = screen.getByText("Crear Reporte");
		await user.click(submitButton);

		await waitFor(() => {
			expect(sonner.toast.error).toHaveBeenCalled();
		});

		expect(mockNavigateTo).not.toHaveBeenCalled();
	});

	it("shows loading state when creating report", async () => {
		const user = userEvent.setup();
		vi.mocked(reportsApi.createReport).mockImplementation(
			() => new Promise(() => {}), // Never resolves
		);

		renderWithProviders(<CreateReportView />);
		await goToStep(4);

		const submitButton = screen.getByText("Crear Reporte");
		await user.click(submitButton);

		await waitFor(() => {
			expect(screen.getByText("Creando...")).toBeInTheDocument();
		});
	});

	it("allows going back to previous steps", async () => {
		const user = userEvent.setup();
		renderWithProviders(<CreateReportView />);
		await goToStep(2);

		const backButton = screen.getByText("Anterior");
		await user.click(backButton);

		await waitFor(() => {
			expect(screen.getByText("Selecciona una Plantilla")).toBeInTheDocument();
		});
	});

	it("navigates back to reports list when back button is clicked", async () => {
		const user = userEvent.setup();
		renderWithProviders(<CreateReportView />);

		await waitFor(() => {
			expect(screen.getByText("Volver a Reportes")).toBeInTheDocument();
		});

		const backButton = screen.getByText("Volver a Reportes");
		await user.click(backButton);

		expect(mockNavigateTo).toHaveBeenCalledWith("/reports");
	});

	it("fetches preview when period changes", async () => {
		const user = userEvent.setup();
		renderWithProviders(<CreateReportView />);

		// Go to step 2 first
		await goToStep(2);

		// Preview should have been called
		expect(reportsApi.previewReport).toHaveBeenCalled();

		// Reset the call count
		vi.mocked(reportsApi.previewReport).mockClear();

		// Change month
		const monthSelect = screen.getByLabelText("Mes");
		await user.click(monthSelect);

		await waitFor(() => {
			expect(
				screen.getByRole("option", { name: "Febrero" }),
			).toBeInTheDocument();
		});

		await user.click(screen.getByRole("option", { name: "Febrero" }));

		await waitFor(() => {
			expect(reportsApi.previewReport).toHaveBeenCalled();
		});
	});

	it("disables previous button on first step", async () => {
		renderWithProviders(<CreateReportView />);

		await waitFor(() => {
			expect(screen.getByText("Anterior")).toBeInTheDocument();
		});

		const backButton = screen.getByText("Anterior");
		expect(backButton).toBeDisabled();
	});
});
