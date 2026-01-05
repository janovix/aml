import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { ReportDetailsView } from "./ReportDetailsView";
import * as reportsApi from "@/lib/api/reports";
import { renderWithProviders } from "@/lib/testHelpers";
import * as sonner from "sonner";

const mockNavigateTo = vi.fn();

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
	}),
	usePathname: () => "/test-org/reports/report-1",
	useSearchParams: () => new URLSearchParams(),
	useParams: () => ({ orgSlug: "test-org", id: "report-1" }),
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
	getReportById: vi.fn(),
	generateReportFile: vi.fn(),
	getReportDownloadUrl: vi.fn(),
	submitReportToSat: vi.fn(),
	acknowledgeReport: vi.fn(),
}));

vi.mock("@/components/skeletons", () => ({
	PageHeroSkeleton: () => (
		<div data-testid="page-hero-skeleton">Loading...</div>
	),
}));

const mockReport: reportsApi.ReportWithAlertSummary = {
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
	alertSummary: {
		total: 10,
		bySeverity: { HIGH: 5, MEDIUM: 3, LOW: 2 },
		byStatus: { DETECTED: 8, SUBMITTED: 2 },
		byRule: [
			{ ruleId: "RULE001", ruleName: "Rule 1", count: 5 },
			{ ruleId: "RULE002", ruleName: "Rule 2", count: 5 },
		],
	},
};

describe("ReportDetailsView", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		global.window.open = vi.fn();
		vi.mocked(sonner.toast.success).mockClear();
		vi.mocked(sonner.toast.error).mockClear();
	});

	it("renders loading skeleton when loading", async () => {
		vi.mocked(reportsApi.getReportById).mockImplementation(
			() => new Promise(() => {}), // Never resolves
		);

		renderWithProviders(<ReportDetailsView reportId="report-1" />);

		expect(screen.getByTestId("page-hero-skeleton")).toBeInTheDocument();
	});

	it("renders report details when loaded", async () => {
		vi.mocked(reportsApi.getReportById).mockResolvedValue(mockReport);

		renderWithProviders(<ReportDetailsView reportId="report-1" />);

		await waitFor(() => {
			expect(
				screen.getByText("Reporte Mensual Enero 2024"),
			).toBeInTheDocument();
		});

		expect(screen.getByText("report-1")).toBeInTheDocument();
		expect(screen.getByText("Mensual")).toBeInTheDocument();
		expect(screen.getByText("Borrador")).toBeInTheDocument();
	});

	it("displays error message when report not found", async () => {
		vi.mocked(reportsApi.getReportById).mockRejectedValue(
			new Error("Report not found"),
		);

		renderWithProviders(<ReportDetailsView reportId="report-1" />);

		await waitFor(() => {
			expect(screen.getByText("Reporte no encontrado")).toBeInTheDocument();
		});

		expect(sonner.toast.error).toHaveBeenCalledWith(
			"Error al cargar el reporte",
		);
	});

	it("generates report file when generate button is clicked", async () => {
		const generatedReport = {
			...mockReport,
			status: "GENERATED" as const,
			generatedAt: "2024-01-20T10:00:00Z",
		};

		vi.mocked(reportsApi.getReportById)
			.mockResolvedValueOnce(mockReport)
			.mockResolvedValueOnce(generatedReport);
		vi.mocked(reportsApi.generateReportFile).mockResolvedValue({
			message: "Report generated",
			reportId: "report-1",
			alertCount: 10,
			types: ["XML", "PDF"],
		});

		renderWithProviders(<ReportDetailsView reportId="report-1" />);

		await waitFor(() => {
			expect(screen.getByText("Generar XML y PDF")).toBeInTheDocument();
		});

		const generateButton = screen.getByText("Generar XML y PDF");
		await userEvent.click(generateButton);

		await waitFor(() => {
			expect(reportsApi.generateReportFile).toHaveBeenCalledWith({
				id: "report-1",
				jwt: "test-jwt-token",
			});
		});

		expect(sonner.toast.success).toHaveBeenCalledWith(
			"Reporte generado exitosamente",
		);
	});

	it("downloads XML file when download XML button is clicked", async () => {
		const generatedReport = {
			...mockReport,
			status: "GENERATED" as const,
			generatedAt: "2024-01-20T10:00:00Z",
		};

		vi.mocked(reportsApi.getReportById).mockResolvedValue(generatedReport);
		vi.mocked(reportsApi.getReportDownloadUrl).mockResolvedValue({
			fileUrl: "https://example.com/report.xml",
			fileSize: 1024,
			format: "xml",
		});

		renderWithProviders(<ReportDetailsView reportId="report-1" />);

		await waitFor(() => {
			expect(screen.getByText("Descargar XML (SAT)")).toBeInTheDocument();
		});

		const downloadButton = screen.getByText("Descargar XML (SAT)");
		await userEvent.click(downloadButton);

		await waitFor(() => {
			expect(reportsApi.getReportDownloadUrl).toHaveBeenCalledWith({
				id: "report-1",
				format: "xml",
				jwt: "test-jwt-token",
			});
		});

		expect(global.window.open).toHaveBeenCalledWith(
			"https://example.com/report.xml",
			"_blank",
		);
	});

	it("downloads PDF file when download PDF button is clicked", async () => {
		const generatedReport = {
			...mockReport,
			status: "GENERATED" as const,
			generatedAt: "2024-01-20T10:00:00Z",
		};

		vi.mocked(reportsApi.getReportById).mockResolvedValue(generatedReport);
		vi.mocked(reportsApi.getReportDownloadUrl).mockResolvedValue({
			fileUrl: "https://example.com/report.pdf",
			fileSize: 2048,
			format: "pdf",
		});

		renderWithProviders(<ReportDetailsView reportId="report-1" />);

		await waitFor(() => {
			expect(screen.getByText("Descargar PDF")).toBeInTheDocument();
		});

		const downloadButton = screen.getByText("Descargar PDF");
		await userEvent.click(downloadButton);

		await waitFor(() => {
			expect(reportsApi.getReportDownloadUrl).toHaveBeenCalledWith({
				id: "report-1",
				format: "pdf",
				jwt: "test-jwt-token",
			});
		});

		expect(global.window.open).toHaveBeenCalledWith(
			"https://example.com/report.pdf",
			"_blank",
		);
	});

	it("opens submit dialog when submit button is clicked", async () => {
		const user = userEvent.setup();
		const generatedReport = {
			...mockReport,
			status: "GENERATED" as const,
			generatedAt: "2024-01-20T10:00:00Z",
		};

		vi.mocked(reportsApi.getReportById).mockResolvedValue(generatedReport);

		renderWithProviders(<ReportDetailsView reportId="report-1" />);

		await waitFor(() => {
			expect(screen.getByText("Marcar como Enviado a SAT")).toBeInTheDocument();
		});

		const submitButton = screen.getByText("Marcar como Enviado a SAT");
		await user.click(submitButton);

		// Wait for dialog to open - check for the input field which confirms dialog is open
		await waitFor(() => {
			expect(
				screen.getByLabelText("Número de Folio (opcional)"),
			).toBeInTheDocument();
		});

		// Verify dialog title is visible (appears in dialog header)
		expect(
			screen.getAllByText("Marcar como Enviado a SAT").length,
		).toBeGreaterThan(1);

		// Verify cancel button is present
		expect(screen.getByText("Cancelar")).toBeInTheDocument();
	});

	it("submits report to SAT with folio number", async () => {
		const generatedReport = {
			...mockReport,
			status: "GENERATED" as const,
			generatedAt: "2024-01-20T10:00:00Z",
		};

		const submittedReport = {
			...generatedReport,
			status: "SUBMITTED" as const,
			submittedAt: "2024-01-21T10:00:00Z",
			satFolioNumber: "SAT-12345",
		};

		vi.mocked(reportsApi.getReportById)
			.mockResolvedValueOnce(generatedReport)
			.mockResolvedValueOnce(submittedReport);
		vi.mocked(reportsApi.submitReportToSat).mockResolvedValue(submittedReport);

		renderWithProviders(<ReportDetailsView reportId="report-1" />);

		await waitFor(() => {
			expect(screen.getByText("Marcar como Enviado a SAT")).toBeInTheDocument();
		});

		const submitButton = screen.getByText("Marcar como Enviado a SAT");
		await userEvent.click(submitButton);

		await waitFor(() => {
			expect(
				screen.getByLabelText("Número de Folio (opcional)"),
			).toBeInTheDocument();
		});

		const folioInput = screen.getByLabelText("Número de Folio (opcional)");
		await userEvent.type(folioInput, "SAT-12345");

		const confirmButton = screen.getByText("Confirmar Envío");
		await userEvent.click(confirmButton);

		await waitFor(() => {
			expect(reportsApi.submitReportToSat).toHaveBeenCalledWith({
				id: "report-1",
				satFolioNumber: "SAT-12345",
				jwt: "test-jwt-token",
			});
		});

		expect(sonner.toast.success).toHaveBeenCalledWith(
			"Reporte marcado como enviado",
		);
	});

	it("opens acknowledge dialog when acknowledge button is clicked", async () => {
		const submittedReport = {
			...mockReport,
			status: "SUBMITTED" as const,
			submittedAt: "2024-01-21T10:00:00Z",
			satFolioNumber: "SAT-12345",
		};

		vi.mocked(reportsApi.getReportById).mockResolvedValue(submittedReport);

		renderWithProviders(<ReportDetailsView reportId="report-1" />);

		await waitFor(() => {
			expect(screen.getByText("Registrar Acuse SAT")).toBeInTheDocument();
		});

		const acknowledgeButton = screen.getByText("Registrar Acuse SAT");
		await userEvent.click(acknowledgeButton);

		await waitFor(() => {
			expect(screen.getByText("Registrar Acuse del SAT")).toBeInTheDocument();
		});

		expect(
			screen.getByText(
				"Ingresa el número de folio del acuse recibido del SAT.",
			),
		).toBeInTheDocument();
	});

	it("acknowledges report with folio number", async () => {
		const submittedReport = {
			...mockReport,
			status: "SUBMITTED" as const,
			submittedAt: "2024-01-21T10:00:00Z",
			satFolioNumber: "SAT-12345",
		};

		const acknowledgedReport = {
			...submittedReport,
			status: "ACKNOWLEDGED" as const,
			satFolioNumber: "SAT-ACK-12345",
		};

		vi.mocked(reportsApi.getReportById)
			.mockResolvedValueOnce(submittedReport)
			.mockResolvedValueOnce(acknowledgedReport);
		vi.mocked(reportsApi.acknowledgeReport).mockResolvedValue(
			acknowledgedReport,
		);

		renderWithProviders(<ReportDetailsView reportId="report-1" />);

		await waitFor(() => {
			expect(screen.getByText("Registrar Acuse SAT")).toBeInTheDocument();
		});

		const acknowledgeButton = screen.getByText("Registrar Acuse SAT");
		await userEvent.click(acknowledgeButton);

		await waitFor(() => {
			expect(screen.getByLabelText("Número de Folio *")).toBeInTheDocument();
		});

		const folioInput = screen.getByLabelText("Número de Folio *");
		await userEvent.type(folioInput, "SAT-ACK-12345");

		const confirmButton = screen.getByText("Registrar Acuse");
		await userEvent.click(confirmButton);

		await waitFor(() => {
			expect(reportsApi.acknowledgeReport).toHaveBeenCalledWith({
				id: "report-1",
				satFolioNumber: "SAT-ACK-12345",
				jwt: "test-jwt-token",
			});
		});

		expect(sonner.toast.success).toHaveBeenCalledWith(
			"Acuse de SAT registrado",
		);
	});

	it("displays alert summary correctly", async () => {
		vi.mocked(reportsApi.getReportById).mockResolvedValue(mockReport);

		renderWithProviders(<ReportDetailsView reportId="report-1" />);

		await waitFor(() => {
			expect(screen.getByText("Resumen de Alertas")).toBeInTheDocument();
		});

		expect(screen.getByText("high")).toBeInTheDocument();
		expect(screen.getByText("medium")).toBeInTheDocument();
		expect(screen.getByText("low")).toBeInTheDocument();
		expect(screen.getByText("Rule 1")).toBeInTheDocument();
		expect(screen.getByText("Rule 2")).toBeInTheDocument();
	});

	it("displays notes when present", async () => {
		const reportWithNotes = {
			...mockReport,
			notes: "Test notes for the report",
		};

		vi.mocked(reportsApi.getReportById).mockResolvedValue(reportWithNotes);

		renderWithProviders(<ReportDetailsView reportId="report-1" />);

		await waitFor(() => {
			expect(screen.getByText("Notas")).toBeInTheDocument();
		});

		expect(screen.getByText("Test notes for the report")).toBeInTheDocument();
	});

	it("handles download error gracefully", async () => {
		const generatedReport = {
			...mockReport,
			status: "GENERATED" as const,
			generatedAt: "2024-01-20T10:00:00Z",
		};

		vi.mocked(reportsApi.getReportById).mockResolvedValue(generatedReport);
		vi.mocked(reportsApi.getReportDownloadUrl).mockRejectedValue(
			new Error("Failed to download file"),
		);

		renderWithProviders(<ReportDetailsView reportId="report-1" />);

		await waitFor(() => {
			expect(screen.getByText("Descargar XML (SAT)")).toBeInTheDocument();
		});

		const downloadButton = screen.getByText("Descargar XML (SAT)");
		await userEvent.click(downloadButton);

		await waitFor(() => {
			expect(sonner.toast.error).toHaveBeenCalledWith(
				"Error al descargar el reporte",
			);
		});
	});

	it("disables generate button when recordCount is 0", async () => {
		const reportWithNoRecords = {
			...mockReport,
			recordCount: 0,
		};

		vi.mocked(reportsApi.getReportById).mockResolvedValue(reportWithNoRecords);

		renderWithProviders(<ReportDetailsView reportId="report-1" />);

		await waitFor(() => {
			expect(screen.getByText("Generar XML y PDF")).toBeInTheDocument();
		});

		const generateButton = screen.getByText("Generar XML y PDF");
		expect(generateButton).toBeDisabled();
	});

	it("navigates back to reports list when back button is clicked", async () => {
		vi.mocked(reportsApi.getReportById).mockResolvedValue(mockReport);

		renderWithProviders(<ReportDetailsView reportId="report-1" />);

		await waitFor(() => {
			expect(screen.getByText("Volver a Reportes")).toBeInTheDocument();
		});

		const backButton = screen.getAllByText("Volver a Reportes")[0];
		await userEvent.click(backButton);

		expect(mockNavigateTo).toHaveBeenCalledWith("/reports");
	});

	it("shows non-monthly report download button correctly", async () => {
		const quarterlyReport = {
			...mockReport,
			type: "QUARTERLY" as const,
			status: "GENERATED" as const,
			generatedAt: "2024-01-20T10:00:00Z",
		};

		vi.mocked(reportsApi.getReportById).mockResolvedValue(quarterlyReport);

		renderWithProviders(<ReportDetailsView reportId="report-1" />);

		await waitFor(() => {
			expect(screen.getByText("Descargar PDF")).toBeInTheDocument();
		});

		// Should not show XML download button for non-monthly reports
		expect(screen.queryByText("Descargar XML (SAT)")).not.toBeInTheDocument();
	});
});
