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
	calculateMonthlyPeriod: vi.fn(),
	calculateQuarterlyPeriod: vi.fn(),
	calculateAnnualPeriod: vi.fn(),
}));

const mockPreview: reportsApi.ReportPreviewResponse = {
	total: 10,
	bySeverity: { HIGH: 5, MEDIUM: 3, LOW: 2 },
	byStatus: { DETECTED: 8, SUBMITTED: 2 },
	periodStart: "2024-01-17T00:00:00Z",
	periodEnd: "2024-02-16T23:59:59.999Z",
};

const mockCreatedReport: reportsApi.Report = {
	id: "report-1",
	organizationId: "org-1",
	name: "Reporte Mensual Enero 2024",
	type: "MONTHLY",
	status: "DRAFT",
	periodStart: "2024-01-17T00:00:00Z",
	periodEnd: "2024-02-16T23:59:59.999Z",
	reportedMonth: "202402",
	recordCount: 10,
	xmlFileUrl: null,
	pdfFileUrl: null,
	fileSize: null,
	pdfFileSize: null,
	generatedAt: null,
	submittedAt: null,
	satFolioNumber: null,
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
		const currentMonth = new Date().getMonth() + 1;

		vi.mocked(reportsApi.calculateMonthlyPeriod).mockReturnValue({
			periodStart: new Date("2024-01-17T00:00:00Z"),
			periodEnd: new Date("2024-02-16T23:59:59.999Z"),
			reportedMonth: `${currentYear}${String(currentMonth).padStart(2, "0")}`,
			displayName: `Enero ${currentYear}`,
		});

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

	it("renders form with report type selection", async () => {
		renderWithProviders(<CreateReportView />);

		await waitFor(() => {
			expect(screen.getByText("Nuevo Reporte")).toBeInTheDocument();
		});

		expect(screen.getAllByText("Mensual").length).toBeGreaterThan(0);
		expect(screen.getAllByText("Trimestral").length).toBeGreaterThan(0);
		expect(screen.getAllByText("Anual").length).toBeGreaterThan(0);
		expect(screen.getAllByText("Personalizado").length).toBeGreaterThan(0);
	});

	it("selects monthly report type by default", async () => {
		renderWithProviders(<CreateReportView />);

		await waitFor(() => {
			expect(screen.getAllByText("Mensual").length).toBeGreaterThan(0);
		});

		// Check that monthly period fields are shown
		expect(screen.getByLabelText("Año")).toBeInTheDocument();
		expect(screen.getByLabelText("Mes")).toBeInTheDocument();
	});

	it("switches to quarterly report type", async () => {
		renderWithProviders(<CreateReportView />);

		await waitFor(() => {
			expect(screen.getAllByText("Trimestral").length).toBeGreaterThan(0);
		});

		const quarterlyButtons = screen.getAllByText("Trimestral");
		const quarterlyButton = quarterlyButtons.find((btn) =>
			btn.closest("button"),
		);
		if (quarterlyButton) {
			const button = quarterlyButton.closest("button");
			if (button && !button.disabled) {
				await userEvent.click(button);
			}
		}

		await waitFor(() => {
			expect(screen.getByLabelText("Trimestre")).toBeInTheDocument();
		});

		expect(reportsApi.calculateQuarterlyPeriod).toHaveBeenCalled();
	});

	it("switches to annual report type", async () => {
		renderWithProviders(<CreateReportView />);

		await waitFor(() => {
			expect(screen.getAllByText("Anual").length).toBeGreaterThan(0);
		});

		const annualButtons = screen.getAllByText("Anual");
		const annualButton = annualButtons.find((btn) => btn.closest("button"));
		if (annualButton) {
			const button = annualButton.closest("button");
			if (button && !button.disabled) {
				await userEvent.click(button);
			}
		}

		await waitFor(() => {
			expect(screen.getByLabelText("Año")).toBeInTheDocument();
		});

		expect(reportsApi.calculateAnnualPeriod).toHaveBeenCalled();
	});

	it("switches to custom report type", async () => {
		renderWithProviders(<CreateReportView />);

		await waitFor(() => {
			expect(screen.getAllByText("Personalizado").length).toBeGreaterThan(0);
		});

		const customButtons = screen.getAllByText("Personalizado");
		const customButton = customButtons.find((btn) => btn.closest("button"));
		if (customButton) {
			const button = customButton.closest("button");
			if (button && !button.disabled) {
				await userEvent.click(button);
			}
		}

		await waitFor(() => {
			expect(screen.getByLabelText("Fecha inicio")).toBeInTheDocument();
			expect(screen.getByLabelText("Fecha fin")).toBeInTheDocument();
		});
	});

	it("updates year selection for monthly report", async () => {
		const user = userEvent.setup();
		renderWithProviders(<CreateReportView />);

		await waitFor(() => {
			expect(screen.getByLabelText("Año")).toBeInTheDocument();
		});

		const yearSelect = screen.getByLabelText("Año");
		await user.click(yearSelect);

		// Wait for the select options to appear and select a different year
		await waitFor(() => {
			expect(screen.getByRole("option", { name: "2023" })).toBeInTheDocument();
		});

		await user.click(screen.getByRole("option", { name: "2023" }));

		await waitFor(() => {
			expect(reportsApi.calculateMonthlyPeriod).toHaveBeenCalled();
		});
	});

	it("updates month selection for monthly report", async () => {
		const user = userEvent.setup();
		renderWithProviders(<CreateReportView />);

		await waitFor(() => {
			expect(screen.getByLabelText("Mes")).toBeInTheDocument();
		});

		const monthSelect = screen.getByLabelText("Mes");
		await user.click(monthSelect);

		// Wait for the select options to appear and select February
		await waitFor(() => {
			expect(
				screen.getByRole("option", { name: "Febrero" }),
			).toBeInTheDocument();
		});

		await user.click(screen.getByRole("option", { name: "Febrero" }));

		await waitFor(() => {
			expect(reportsApi.calculateMonthlyPeriod).toHaveBeenCalled();
		});
	});

	it("updates quarter selection for quarterly report", async () => {
		const user = userEvent.setup();
		renderWithProviders(<CreateReportView />);

		await waitFor(() => {
			expect(screen.getAllByText("Trimestral").length).toBeGreaterThan(0);
		});

		const quarterlyButtons = screen.getAllByText("Trimestral");
		const quarterlyButton = quarterlyButtons.find((btn) =>
			btn.closest("button"),
		);
		if (quarterlyButton) {
			const button = quarterlyButton.closest("button");
			if (button && !button.disabled) {
				await user.click(button);
			}
		}

		await waitFor(() => {
			expect(screen.getByLabelText("Trimestre")).toBeInTheDocument();
		});

		const quarterSelect = screen.getByLabelText("Trimestre");
		await user.click(quarterSelect);

		// Wait for the select options to appear and select Q2
		await waitFor(() => {
			expect(
				screen.getByRole("option", { name: "Q2 (Abr-Jun)" }),
			).toBeInTheDocument();
		});

		await user.click(screen.getByRole("option", { name: "Q2 (Abr-Jun)" }));

		await waitFor(() => {
			expect(reportsApi.calculateQuarterlyPeriod).toHaveBeenCalled();
		});
	});

	it("updates custom date range", async () => {
		renderWithProviders(<CreateReportView />);

		await waitFor(() => {
			expect(screen.getByText("Personalizado")).toBeInTheDocument();
		});

		const customButton = screen.getByText("Personalizado").closest("button");
		if (customButton) {
			await userEvent.click(customButton);
		}

		await waitFor(() => {
			expect(screen.getByLabelText("Fecha inicio")).toBeInTheDocument();
		});

		const startDateInput = screen.getByLabelText("Fecha inicio");
		await userEvent.type(startDateInput, "2024-01-01");

		const endDateInput = screen.getByLabelText("Fecha fin");
		await userEvent.type(endDateInput, "2024-01-31");

		await waitFor(() => {
			expect(reportsApi.previewReport).toHaveBeenCalled();
		});
	});

	it("displays preview when period is selected", async () => {
		renderWithProviders(<CreateReportView />);

		// Wait for the preview data to be fetched and displayed
		await waitFor(() => {
			expect(screen.getByText("Total Alertas")).toBeInTheDocument();
		});

		expect(screen.getByText("10")).toBeInTheDocument();
	});

	it("displays preview with severity breakdown", async () => {
		renderWithProviders(<CreateReportView />);

		await waitFor(() => {
			expect(screen.getByText("Por Severidad")).toBeInTheDocument();
		});

		expect(screen.getByText("high")).toBeInTheDocument();
		expect(screen.getByText("medium")).toBeInTheDocument();
		expect(screen.getByText("low")).toBeInTheDocument();
	});

	it("displays preview with status breakdown", async () => {
		renderWithProviders(<CreateReportView />);

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

		await waitFor(() => {
			expect(
				screen.getByText("No hay alertas en este período"),
			).toBeInTheDocument();
		});
	});

	it("auto-generates report name based on type and period", async () => {
		renderWithProviders(<CreateReportView />);

		await waitFor(() => {
			expect(screen.getByLabelText("Nombre del Reporte")).toBeInTheDocument();
		});

		const nameInput = screen.getByLabelText(
			"Nombre del Reporte",
		) as HTMLInputElement;
		expect(nameInput.value).toContain("Reporte Mensual");
	});

	it("allows editing report name", async () => {
		renderWithProviders(<CreateReportView />);

		await waitFor(() => {
			expect(screen.getByLabelText("Nombre del Reporte")).toBeInTheDocument();
		});

		const nameInput = screen.getByLabelText("Nombre del Reporte");
		await userEvent.clear(nameInput);
		await userEvent.type(nameInput, "Custom Report Name");

		expect(nameInput).toHaveValue("Custom Report Name");
	});

	it("allows adding notes", async () => {
		renderWithProviders(<CreateReportView />);

		await waitFor(() => {
			expect(screen.getByLabelText("Notas (opcional)")).toBeInTheDocument();
		});

		const notesInput = screen.getByLabelText("Notas (opcional)");
		await userEvent.type(notesInput, "Test notes");

		expect(notesInput).toHaveValue("Test notes");
	});

	it("creates report successfully", async () => {
		vi.mocked(reportsApi.createReport).mockResolvedValue(mockCreatedReport);

		renderWithProviders(<CreateReportView />);

		await waitFor(() => {
			expect(screen.getByText("Crear Reporte")).toBeInTheDocument();
		});

		const submitButton = screen.getByText("Crear Reporte");
		await userEvent.click(submitButton);

		await waitFor(() => {
			expect(reportsApi.createReport).toHaveBeenCalled();
		});

		expect(sonner.toast.success).toHaveBeenCalledWith(
			"Reporte creado exitosamente",
		);
		expect(mockNavigateTo).toHaveBeenCalledWith("/reports/report-1");
	});

	it("includes notes in report creation", async () => {
		vi.mocked(reportsApi.createReport).mockResolvedValue(mockCreatedReport);

		renderWithProviders(<CreateReportView />);

		await waitFor(() => {
			expect(screen.getByLabelText("Notas (opcional)")).toBeInTheDocument();
		});

		const notesInput = screen.getByLabelText("Notas (opcional)");
		await userEvent.type(notesInput, "Test notes");

		const submitButton = screen.getByText("Crear Reporte");
		await userEvent.click(submitButton);

		await waitFor(() => {
			expect(reportsApi.createReport).toHaveBeenCalledWith(
				expect.objectContaining({
					notes: "Test notes",
				}),
			);
		});
	});

	it("handles creation error gracefully", async () => {
		vi.mocked(reportsApi.createReport).mockRejectedValue(
			new Error("Failed to create report"),
		);

		renderWithProviders(<CreateReportView />);

		await waitFor(() => {
			expect(screen.getByText("Crear Reporte")).toBeInTheDocument();
		});

		const submitButton = screen.getByText("Crear Reporte");
		await userEvent.click(submitButton);

		await waitFor(() => {
			expect(sonner.toast.error).toHaveBeenCalledWith(
				"Error al crear el reporte",
			);
		});

		expect(mockNavigateTo).not.toHaveBeenCalled();
	});

	it("disables submit button when loading", async () => {
		vi.mocked(reportsApi.createReport).mockImplementation(
			() => new Promise(() => {}), // Never resolves
		);

		renderWithProviders(<CreateReportView />);

		await waitFor(() => {
			expect(screen.getByText("Crear Reporte")).toBeInTheDocument();
		});

		const submitButton = screen.getByText("Crear Reporte");
		await userEvent.click(submitButton);

		await waitFor(() => {
			expect(screen.getByText("Creando...")).toBeInTheDocument();
		});

		const creatingButton = screen.getByText("Creando...");
		expect(creatingButton).toBeDisabled();
	});

	it("navigates back to reports list when back button is clicked", async () => {
		renderWithProviders(<CreateReportView />);

		await waitFor(() => {
			expect(screen.getByText("Volver a Reportes")).toBeInTheDocument();
		});

		const backButton = screen.getByText("Volver a Reportes");
		await userEvent.click(backButton);

		expect(mockNavigateTo).toHaveBeenCalledWith("/reports");
	});

	it("displays period information correctly", async () => {
		renderWithProviders(<CreateReportView />);

		await waitFor(() => {
			expect(screen.getByText("Período seleccionado:")).toBeInTheDocument();
		});

		// Should show the calculated period dates
		expect(screen.getByText(/Período seleccionado:/)).toBeInTheDocument();
	});

	it("shows output format info for monthly reports", async () => {
		renderWithProviders(<CreateReportView />);

		await waitFor(() => {
			expect(screen.getByText("Formato de salida:")).toBeInTheDocument();
		});

		expect(screen.getAllByText("XML").length).toBeGreaterThan(0);
	});

	it("shows output format info for quarterly reports", async () => {
		renderWithProviders(<CreateReportView />);

		await waitFor(() => {
			expect(screen.getAllByText("Trimestral").length).toBeGreaterThan(0);
		});

		const quarterlyButtons = screen.getAllByText("Trimestral");
		const quarterlyButton = quarterlyButtons.find((btn) =>
			btn.closest("button"),
		);
		if (quarterlyButton) {
			const button = quarterlyButton.closest("button");
			if (button && !button.disabled) {
				await userEvent.click(button);
			}
		}

		await waitFor(() => {
			expect(screen.getAllByText("PDF").length).toBeGreaterThan(0);
		});
	});

	it("fetches preview when period changes", async () => {
		const user = userEvent.setup();
		const currentYear = new Date().getFullYear();

		// Make calculateMonthlyPeriod return different values based on month
		// This ensures the useMemo sees actual changes
		vi.mocked(reportsApi.calculateMonthlyPeriod).mockImplementation(
			(year: number, month: number) => ({
				periodStart: new Date(
					`${year}-${String(month).padStart(2, "0")}-17T00:00:00Z`,
				),
				periodEnd: new Date(
					`${year}-${String(month + 1).padStart(2, "0")}-16T23:59:59.999Z`,
				),
				reportedMonth: `${year}${String(month).padStart(2, "0")}`,
				displayName: `Month ${month} ${year}`,
			}),
		);

		renderWithProviders(<CreateReportView />);

		await waitFor(() => {
			expect(reportsApi.previewReport).toHaveBeenCalled();
		});

		// Reset the call count to test the change
		vi.mocked(reportsApi.previewReport).mockClear();

		// Change month
		const monthSelect = screen.getByLabelText("Mes");
		await user.click(monthSelect);

		// Wait for the select options to appear and select February
		await waitFor(() => {
			expect(
				screen.getByRole("option", { name: "Febrero" }),
			).toBeInTheDocument();
		});

		await user.click(screen.getByRole("option", { name: "Febrero" }));

		await waitFor(() => {
			// Preview should be fetched again after month change
			expect(reportsApi.previewReport).toHaveBeenCalledTimes(1);
		});

		// Verify the call was made with February's period
		expect(reportsApi.previewReport).toHaveBeenCalledWith(
			expect.objectContaining({
				type: "MONTHLY",
				periodStart: expect.stringContaining(`${currentYear}-02-17`),
			}),
		);
	});

	it("handles preview error gracefully", async () => {
		vi.mocked(reportsApi.previewReport).mockRejectedValue(
			new Error("Failed to fetch preview"),
		);

		renderWithProviders(<CreateReportView />);

		await waitFor(() => {
			expect(screen.getByText("Vista Previa")).toBeInTheDocument();
		});

		// Should show empty state when preview fails (wait for async error to be caught)
		await waitFor(() => {
			expect(
				screen.getByText("Selecciona un período para ver la vista previa"),
			).toBeInTheDocument();
		});
	});
});
