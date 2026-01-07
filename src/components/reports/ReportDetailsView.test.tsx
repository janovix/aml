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
	downloadReportFile: vi.fn(),
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

		expect(sonner.toast.error).toHaveBeenCalled();
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
			types: ["PDF"],
		});

		renderWithProviders(<ReportDetailsView reportId="report-1" />);

		await waitFor(() => {
			expect(screen.getByText("Generar PDF")).toBeInTheDocument();
		});

		const generateButton = screen.getByText("Generar PDF");
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

	it("downloads report file when download button is clicked", async () => {
		const generatedReport = {
			...mockReport,
			status: "GENERATED" as const,
			generatedAt: "2024-01-20T10:00:00Z",
		};

		vi.mocked(reportsApi.getReportById).mockResolvedValue(generatedReport);
		vi.mocked(reportsApi.downloadReportFile).mockResolvedValue();

		renderWithProviders(<ReportDetailsView reportId="report-1" />);

		await waitFor(() => {
			expect(screen.getByText("Descargar PDF")).toBeInTheDocument();
		});

		const downloadButton = screen.getByText("Descargar PDF");
		await userEvent.click(downloadButton);

		await waitFor(() => {
			expect(reportsApi.downloadReportFile).toHaveBeenCalledWith({
				id: "report-1",
				jwt: "test-jwt-token",
			});
		});
	});

	it("displays alert summary correctly", async () => {
		vi.mocked(reportsApi.getReportById).mockResolvedValue(mockReport);

		renderWithProviders(<ReportDetailsView reportId="report-1" />);

		await waitFor(() => {
			expect(screen.getByText("Desglose Detallado")).toBeInTheDocument();
		});

		expect(screen.getByText("high")).toBeInTheDocument();
		expect(screen.getByText("medium")).toBeInTheDocument();
		expect(screen.getByText("low")).toBeInTheDocument();
		// Use getAllByText since rules may appear in multiple places (charts and table)
		expect(screen.getAllByText("Rule 1").length).toBeGreaterThan(0);
		expect(screen.getAllByText("Rule 2").length).toBeGreaterThan(0);
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
		vi.mocked(reportsApi.downloadReportFile).mockRejectedValue(
			new Error("Failed to download file"),
		);

		renderWithProviders(<ReportDetailsView reportId="report-1" />);

		await waitFor(() => {
			expect(screen.getByText("Descargar PDF")).toBeInTheDocument();
		});

		const downloadButton = screen.getByText("Descargar PDF");
		await userEvent.click(downloadButton);

		await waitFor(() => {
			expect(sonner.toast.error).toHaveBeenCalled();
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
			expect(screen.getByText("Generar PDF")).toBeInTheDocument();
		});

		const generateButton = screen.getByText("Generar PDF");
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

	it("shows quarterly report correctly", async () => {
		const quarterlyReport = {
			...mockReport,
			periodType: "QUARTERLY" as const,
			status: "GENERATED" as const,
			generatedAt: "2024-01-20T10:00:00Z",
		};

		vi.mocked(reportsApi.getReportById).mockResolvedValue(quarterlyReport);

		renderWithProviders(<ReportDetailsView reportId="report-1" />);

		await waitFor(() => {
			expect(screen.getByText("Trimestral")).toBeInTheDocument();
		});

		expect(screen.getByText("Descargar PDF")).toBeInTheDocument();
	});
});
