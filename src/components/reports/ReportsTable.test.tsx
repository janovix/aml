import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { ReportsTable } from "./ReportsTable";
import { renderWithProviders } from "@/lib/testHelpers";
import * as reportsApi from "@/lib/api/reports";

const mockToast = vi.fn();

vi.mock("@/hooks/use-toast", () => ({
	useToast: () => ({
		toast: mockToast,
		toasts: [],
	}),
}));

vi.mock("@/hooks/use-mobile", () => ({
	useIsMobile: () => false,
}));

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: mockPush,
		replace: vi.fn(),
	}),
	usePathname: () => "/test-org/reports",
	useSearchParams: () => new URLSearchParams(),
	useParams: () => ({ orgSlug: "test-org" }),
}));

// Mock the JWT hook
const mockUseJwt = vi.fn();
vi.mock("@/hooks/useJwt", () => ({
	useJwt: () => mockUseJwt(),
}));

// Mock the org store
const mockUseOrgStore = vi.fn();
vi.mock("@/lib/org-store", () => ({
	useOrgStore: () => mockUseOrgStore(),
}));

// Mock the reports API
vi.mock("@/lib/api/reports", () => ({
	listReports: vi.fn(),
	deleteReport: vi.fn(),
	generateReportFile: vi.fn(),
	getReportDownloadUrl: vi.fn(),
}));

// Mock report data
const mockReports: reportsApi.Report[] = [
	{
		id: "RPT001",
		organizationId: "org-1",
		name: "Reporte Mensual Diciembre 2024",
		type: "MONTHLY",
		status: "DRAFT",
		periodStart: "2024-11-17T00:00:00Z",
		periodEnd: "2024-12-16T23:59:59Z",
		reportedMonth: "202412",
		recordCount: 10,
		xmlFileUrl: null,
		pdfFileUrl: null,
		fileSize: null,
		generatedAt: null,
		submittedAt: null,
		satFolioNumber: null,
		createdBy: "user-1",
		notes: null,
		createdAt: "2024-12-01T00:00:00Z",
		updatedAt: "2024-12-01T00:00:00Z",
	},
	{
		id: "RPT002",
		organizationId: "org-1",
		name: "Reporte Trimestral Q4 2024",
		type: "QUARTERLY",
		status: "GENERATED",
		periodStart: "2024-10-01T00:00:00Z",
		periodEnd: "2024-12-31T23:59:59Z",
		reportedMonth: "2024Q4",
		recordCount: 25,
		xmlFileUrl: null,
		pdfFileUrl: "https://example.com/report.pdf",
		fileSize: 12345,
		generatedAt: "2024-12-28T10:00:00Z",
		submittedAt: null,
		satFolioNumber: null,
		createdBy: "user-1",
		notes: null,
		createdAt: "2024-10-01T00:00:00Z",
		updatedAt: "2024-12-28T10:00:00Z",
	},
	{
		id: "RPT003",
		organizationId: "org-1",
		name: "Reporte Mensual Noviembre 2024",
		type: "MONTHLY",
		status: "SUBMITTED",
		periodStart: "2024-10-17T00:00:00Z",
		periodEnd: "2024-11-16T23:59:59Z",
		reportedMonth: "202411",
		recordCount: 8,
		xmlFileUrl: "https://example.com/report.xml",
		pdfFileUrl: null,
		fileSize: 5678,
		generatedAt: "2024-12-10T09:00:00Z",
		submittedAt: "2024-12-15T14:30:00Z",
		satFolioNumber: "SAT-2024-12345",
		createdBy: "user-1",
		notes: null,
		createdAt: "2024-11-01T00:00:00Z",
		updatedAt: "2024-12-15T14:30:00Z",
	},
];

describe("ReportsTable", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUseJwt.mockReturnValue({
			jwt: "test-jwt-token",
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		});
		mockUseOrgStore.mockReturnValue({
			currentOrg: { id: "org-1", name: "Test Org", slug: "test-org" },
		});
		vi.mocked(reportsApi.listReports).mockResolvedValue({
			data: mockReports,
			pagination: {
				page: 1,
				limit: 20,
				total: mockReports.length,
				totalPages: 1,
			},
		});
	});

	it("renders table with report data", async () => {
		renderWithProviders(<ReportsTable />);

		await waitFor(() => {
			expect(
				screen.getByText("REPORTE MENSUAL DICIEMBRE 2024"),
			).toBeInTheDocument();
		});
	});

	it("renders report names", async () => {
		renderWithProviders(<ReportsTable />);

		await waitFor(() => {
			expect(
				screen.getByText("REPORTE MENSUAL DICIEMBRE 2024"),
			).toBeInTheDocument();
			expect(
				screen.getByText("REPORTE TRIMESTRAL Q4 2024"),
			).toBeInTheDocument();
		});
	});

	it("renders report names as links to report details", async () => {
		renderWithProviders(<ReportsTable />);

		await waitFor(() => {
			const reportLink = screen.getByRole("link", {
				name: "REPORTE MENSUAL DICIEMBRE 2024",
			});
			expect(reportLink).toBeInTheDocument();
			expect(reportLink).toHaveAttribute("href", "/test-org/reports/RPT001");
		});
	});

	it("allows selecting individual reports", async () => {
		const user = userEvent.setup();
		renderWithProviders(<ReportsTable />);

		await waitFor(() => {
			expect(
				screen.getByText("REPORTE MENSUAL DICIEMBRE 2024"),
			).toBeInTheDocument();
		});

		const checkboxes = screen.getAllByRole("checkbox");
		const firstReportCheckbox = checkboxes[1];
		await user.click(firstReportCheckbox);

		await waitFor(() => {
			expect(firstReportCheckbox).toBeChecked();
		});
	});

	it("allows selecting all reports", async () => {
		const user = userEvent.setup();
		renderWithProviders(<ReportsTable />);

		await waitFor(() => {
			expect(
				screen.getByText("REPORTE MENSUAL DICIEMBRE 2024"),
			).toBeInTheDocument();
		});

		const selectAllCheckbox = screen.getAllByRole("checkbox")[0];
		await user.click(selectAllCheckbox);

		await waitFor(() => {
			expect(selectAllCheckbox).toBeChecked();
		});
	});

	it("displays page hero with title", async () => {
		renderWithProviders(<ReportsTable />);

		await waitFor(() => {
			expect(screen.getByText("Reportes")).toBeInTheDocument();
		});
	});

	it("shows stats in page hero", async () => {
		renderWithProviders(<ReportsTable />);

		await waitFor(() => {
			expect(screen.getByText("Total Reportes")).toBeInTheDocument();
			expect(screen.getByText("Borradores")).toBeInTheDocument();
			expect(screen.getByText("Enviados")).toBeInTheDocument();
		});
	});

	it("displays report periods", async () => {
		renderWithProviders(<ReportsTable />);

		await waitFor(() => {
			expect(screen.getByText("202412")).toBeInTheDocument();
			expect(screen.getByText("2024Q4")).toBeInTheDocument();
		});
	});

	it("displays record count", async () => {
		renderWithProviders(<ReportsTable />);

		await waitFor(() => {
			expect(screen.getByText("10")).toBeInTheDocument();
			expect(screen.getByText("25")).toBeInTheDocument();
		});
	});

	it("shows loading state initially", async () => {
		// Mock listReports to never resolve, keeping the loading state
		vi.mocked(reportsApi.listReports).mockImplementation(
			() => new Promise(() => {}), // Never resolves
		);

		renderWithProviders(<ReportsTable />);

		// The DataTable shows skeleton rows during loading state
		// Check that skeleton elements exist in the loading state
		await waitFor(() => {
			const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
			// We should have multiple skeleton elements during loading
			expect(skeletons.length).toBeGreaterThan(0);
		});
	});

	it("shows empty state when no reports", async () => {
		vi.mocked(reportsApi.listReports).mockResolvedValue({
			data: [],
			pagination: {
				page: 1,
				limit: 20,
				total: 0,
				totalPages: 0,
			},
		});

		renderWithProviders(<ReportsTable />);

		await waitFor(() => {
			expect(
				screen.getByText("No se encontraron reportes"),
			).toBeInTheDocument();
		});
	});

	it("shows error state when no organization is selected", async () => {
		mockUseOrgStore.mockReturnValue({
			currentOrg: null,
		});

		renderWithProviders(<ReportsTable />);

		await waitFor(() => {
			expect(screen.getByText("Sin organización")).toBeInTheDocument();
			expect(
				screen.getByText("Selecciona una organización para ver los reportes"),
			).toBeInTheDocument();
		});
	});

	it("calls API with correct parameters", async () => {
		renderWithProviders(<ReportsTable />);

		await waitFor(() => {
			expect(reportsApi.listReports).toHaveBeenCalledWith(
				expect.objectContaining({
					page: 1,
					limit: 20,
					jwt: "test-jwt-token",
				}),
			);
		});
	});

	it("refetches when organization changes", async () => {
		renderWithProviders(<ReportsTable />);

		await waitFor(() => {
			expect(reportsApi.listReports).toHaveBeenCalledTimes(1);
		});

		mockUseOrgStore.mockReturnValue({
			currentOrg: { id: "org-2", name: "Other Org", slug: "other-org" },
		});

		// Force re-render
		renderWithProviders(<ReportsTable />);

		await waitFor(() => {
			expect(reportsApi.listReports).toHaveBeenCalledTimes(2);
		});
	});

	it("handles API error gracefully", async () => {
		vi.mocked(reportsApi.listReports).mockRejectedValue(new Error("API error"));

		renderWithProviders(<ReportsTable />);

		await waitFor(() => {
			expect(mockToast).toHaveBeenCalledWith(
				expect.objectContaining({
					title: "Error",
					description: "No se pudieron cargar los reportes",
					variant: "destructive",
				}),
			);
		});
	});

	it("clears data when organization is not selected and JWT is not loading", async () => {
		mockUseOrgStore.mockReturnValue({
			currentOrg: null,
		});

		mockUseJwt.mockReturnValue({
			jwt: "test-jwt-token",
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		});

		renderWithProviders(<ReportsTable />);

		await waitFor(() => {
			// Should not call listReports when org is not selected
			expect(reportsApi.listReports).not.toHaveBeenCalled();
		});
	});

	it("handles filter changes correctly", async () => {
		renderWithProviders(<ReportsTable filters={{ type: "MONTHLY" }} />);

		await waitFor(() => {
			expect(reportsApi.listReports).toHaveBeenCalledWith(
				expect.objectContaining({
					type: "MONTHLY",
				}),
			);
		});

		// Change filters
		const { rerender } = renderWithProviders(
			<ReportsTable filters={{ type: "QUARTERLY" }} />,
		);

		await waitFor(() => {
			expect(reportsApi.listReports).toHaveBeenCalledWith(
				expect.objectContaining({
					type: "QUARTERLY",
				}),
			);
		});
	});
});
