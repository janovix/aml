import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { NoticeDetailsView } from "./NoticeDetailsView";
import { renderWithProviders } from "@/lib/testHelpers";
import * as noticesApi from "@/lib/api/notices";

// Mock sonner toast
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
vi.mock("sonner", () => ({
	toast: Object.assign(vi.fn(), {
		success: (...args: unknown[]) => mockToastSuccess(...args),
		error: (...args: unknown[]) => mockToastError(...args),
	}),
}));

vi.mock("@/hooks/use-mobile", () => ({
	useIsMobile: () => false,
}));

const mockPush = vi.fn();
const mockBack = vi.fn();

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: mockPush,
		replace: vi.fn(),
		back: mockBack,
	}),
	usePathname: () => "/test-org/notices/NTC001",
	useSearchParams: () => new URLSearchParams(),
	useParams: () => ({ orgSlug: "test-org", noticeId: "NTC001" }),
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

// Mock the notices API
vi.mock("@/lib/api/notices", () => ({
	getNoticeById: vi.fn(),
	generateNoticeFile: vi.fn(),
	downloadNoticeXml: vi.fn(),
	submitNoticeToSat: vi.fn(),
	acknowledgeNotice: vi.fn(),
	deleteNotice: vi.fn(),
}));

// Mock notice data
const mockDraftNotice: noticesApi.NoticeWithAlertSummary = {
	id: "NTC001",
	organizationId: "org-1",
	name: "Aviso SAT Diciembre 2024",
	status: "DRAFT",
	periodStart: "2024-11-17T00:00:00Z",
	periodEnd: "2024-12-16T23:59:59Z",
	reportedMonth: "202412",
	recordCount: 10,
	xmlFileUrl: null,
	fileSize: null,
	generatedAt: null,
	submittedAt: null,
	satFolioNumber: null,
	createdBy: "user-1",
	notes: null,
	createdAt: "2024-12-01T00:00:00Z",
	updatedAt: "2024-12-01T00:00:00Z",
	alertSummary: {
		total: 10,
		bySeverity: { CRITICAL: 2, HIGH: 5, MEDIUM: 3 },
		byStatus: { OPEN: 4, UNDER_REVIEW: 4, RESOLVED: 2 },
		byRule: [
			{ ruleId: "rule-1", ruleName: "Unusual Activity", count: 5 },
			{ ruleId: "rule-2", ruleName: "High Value Transaction", count: 3 },
			{ ruleId: "rule-3", ruleName: "New Client Risk", count: 2 },
		],
	},
};

const mockGeneratedNotice: noticesApi.NoticeWithAlertSummary = {
	...mockDraftNotice,
	id: "NTC002",
	status: "GENERATED",
	xmlFileUrl: "https://example.com/notice.xml",
	fileSize: 12345,
	generatedAt: "2024-12-20T10:00:00Z",
};

const mockSubmittedNotice: noticesApi.NoticeWithAlertSummary = {
	...mockGeneratedNotice,
	id: "NTC003",
	status: "SUBMITTED",
	submittedAt: "2024-12-21T14:30:00Z",
};

const mockAcknowledgedNotice: noticesApi.NoticeWithAlertSummary = {
	...mockSubmittedNotice,
	id: "NTC004",
	status: "ACKNOWLEDGED",
	satFolioNumber: "SAT-2024-12345",
};

describe("NoticeDetailsView", () => {
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
	});

	describe("Loading and Error States", () => {
		it("shows loading state while fetching notice", async () => {
			vi.mocked(noticesApi.getNoticeById).mockImplementation(
				() => new Promise(() => {}), // Never resolves
			);

			renderWithProviders(<NoticeDetailsView noticeId="NTC001" />);

			await waitFor(() => {
				// Check for any loader icon (lucide-loader-2 or lucide-loader-circle)
				const loader = document.querySelector(
					'[class*="lucide-loader"], [class*="animate-spin"]',
				);
				expect(loader).toBeInTheDocument();
			});
		});

		it("shows not found state when notice does not exist", async () => {
			vi.mocked(noticesApi.getNoticeById).mockRejectedValue(
				new Error("Not found"),
			);

			renderWithProviders(<NoticeDetailsView noticeId="NTC001" />);

			await waitFor(() => {
				expect(screen.getByText("Aviso no encontrado")).toBeInTheDocument();
			});
		});

		it("shows error toast when API fails", async () => {
			vi.mocked(noticesApi.getNoticeById).mockRejectedValue(
				new Error("API error"),
			);

			renderWithProviders(<NoticeDetailsView noticeId="NTC001" />);

			await waitFor(() => {
				expect(mockToastError).toHaveBeenCalled();
			});
		});
	});

	describe("DRAFT Notice", () => {
		beforeEach(() => {
			vi.mocked(noticesApi.getNoticeById).mockResolvedValue(mockDraftNotice);
		});

		it("renders notice details correctly", async () => {
			renderWithProviders(<NoticeDetailsView noticeId="NTC001" />);

			await waitFor(() => {
				expect(
					screen.getByText("Aviso SAT Diciembre 2024"),
				).toBeInTheDocument();
				expect(screen.getByText("Borrador")).toBeInTheDocument();
				expect(screen.getByText("ID: NTC001")).toBeInTheDocument();
			});
		});

		it("shows period information", async () => {
			renderWithProviders(<NoticeDetailsView noticeId="NTC001" />);

			await waitFor(() => {
				expect(screen.getByText("202412")).toBeInTheDocument();
				expect(screen.getByText("10")).toBeInTheDocument(); // recordCount
			});
		});

		it("shows alert summary", async () => {
			renderWithProviders(<NoticeDetailsView noticeId="NTC001" />);

			await waitFor(() => {
				expect(screen.getByText("10 alertas")).toBeInTheDocument();
				expect(screen.getByText("CRITICAL: 2")).toBeInTheDocument();
				expect(screen.getByText("HIGH: 5")).toBeInTheDocument();
				expect(screen.getByText("MEDIUM: 3")).toBeInTheDocument();
			});
		});

		it("shows Generate XML and Delete buttons for DRAFT", async () => {
			renderWithProviders(<NoticeDetailsView noticeId="NTC001" />);

			await waitFor(() => {
				expect(screen.getByText("Generar XML")).toBeInTheDocument();
				expect(screen.getByText("Eliminar")).toBeInTheDocument();
			});
		});

		it("handles generate action", async () => {
			vi.mocked(noticesApi.generateNoticeFile).mockResolvedValue({
				message: "Notice generated successfully",
				noticeId: "NTC001",
				alertCount: 10,
			});

			const user = userEvent.setup();
			renderWithProviders(<NoticeDetailsView noticeId="NTC001" />);

			await waitFor(() => {
				expect(screen.getByText("Generar XML")).toBeInTheDocument();
			});

			await user.click(screen.getByText("Generar XML"));

			await waitFor(() => {
				expect(noticesApi.generateNoticeFile).toHaveBeenCalledWith({
					id: "NTC001",
					jwt: "test-jwt-token",
				});
			});

			await waitFor(() => {
				expect(mockToastSuccess).toHaveBeenCalledWith(
					"El archivo XML ha sido generado exitosamente",
				);
			});
		});

		it("handles generate error gracefully", async () => {
			vi.mocked(noticesApi.generateNoticeFile).mockRejectedValue(
				new Error("Generation failed"),
			);

			const user = userEvent.setup();
			renderWithProviders(<NoticeDetailsView noticeId="NTC001" />);

			await waitFor(() => {
				expect(screen.getByText("Generar XML")).toBeInTheDocument();
			});

			await user.click(screen.getByText("Generar XML"));

			await waitFor(() => {
				expect(mockToastError).toHaveBeenCalled();
			});
		});

		it("opens delete dialog and handles delete", async () => {
			vi.mocked(noticesApi.deleteNotice).mockResolvedValue(undefined);

			const user = userEvent.setup();
			renderWithProviders(<NoticeDetailsView noticeId="NTC001" />);

			await waitFor(() => {
				expect(screen.getByText("Eliminar")).toBeInTheDocument();
			});

			await user.click(screen.getByText("Eliminar"));

			await waitFor(() => {
				expect(screen.getByText("Eliminar Aviso")).toBeInTheDocument();
			});

			// Find delete button in dialog
			const dialogButtons = screen.getAllByRole("button", {
				name: /eliminar/i,
			});
			const confirmButton = dialogButtons.find((btn) =>
				btn.className.includes("destructive"),
			);
			await user.click(confirmButton!);

			await waitFor(() => {
				expect(noticesApi.deleteNotice).toHaveBeenCalledWith({
					id: "NTC001",
					jwt: "test-jwt-token",
				});
			});

			await waitFor(() => {
				expect(mockToastSuccess).toHaveBeenCalledWith(
					expect.stringContaining("ha sido eliminado"),
				);
			});
		});
	});

	describe("GENERATED Notice", () => {
		beforeEach(() => {
			vi.mocked(noticesApi.getNoticeById).mockResolvedValue(
				mockGeneratedNotice,
			);
		});

		it("shows Download and Submit buttons for GENERATED", async () => {
			renderWithProviders(<NoticeDetailsView noticeId="NTC002" />);

			await waitFor(() => {
				expect(screen.getByText("Descargar XML")).toBeInTheDocument();
				expect(screen.getByText("Marcar como Enviado")).toBeInTheDocument();
			});
		});

		it("handles download action", async () => {
			vi.mocked(noticesApi.downloadNoticeXml).mockResolvedValue();

			const user = userEvent.setup();
			renderWithProviders(<NoticeDetailsView noticeId="NTC002" />);

			await waitFor(() => {
				expect(screen.getByText("Descargar XML")).toBeInTheDocument();
			});

			await user.click(screen.getByText("Descargar XML"));

			await waitFor(() => {
				expect(noticesApi.downloadNoticeXml).toHaveBeenCalledWith({
					id: "NTC002",
					jwt: "test-jwt-token",
				});
			});
		});

		it("opens submit dialog and handles submit", async () => {
			vi.mocked(noticesApi.submitNoticeToSat).mockResolvedValue({
				...mockGeneratedNotice,
				status: "SUBMITTED",
				submittedAt: new Date().toISOString(),
			});

			const user = userEvent.setup();
			renderWithProviders(<NoticeDetailsView noticeId="NTC002" />);

			await waitFor(() => {
				expect(screen.getByText("Marcar como Enviado")).toBeInTheDocument();
			});

			await user.click(screen.getByText("Marcar como Enviado"));

			await waitFor(() => {
				expect(
					screen.getByText(
						"Confirma que has subido el archivo XML al portal del SAT. Opcionalmente puedes ingresar el número de folio.",
					),
				).toBeInTheDocument();
			});

			// Fill in optional folio
			const folioInput = screen.getByPlaceholderText(
				"Ingresa el folio del SAT",
			);
			await user.type(folioInput, "SAT-2024-12345");

			await user.click(screen.getByText("Confirmar Envío"));

			await waitFor(() => {
				expect(noticesApi.submitNoticeToSat).toHaveBeenCalledWith({
					id: "NTC002",
					satFolioNumber: "SAT-2024-12345",
					jwt: "test-jwt-token",
				});
			});

			await waitFor(() => {
				expect(mockToastSuccess).toHaveBeenCalledWith(
					"El aviso ha sido marcado como enviado al SAT",
				);
			});
		});
	});

	describe("SUBMITTED Notice", () => {
		beforeEach(() => {
			vi.mocked(noticesApi.getNoticeById).mockResolvedValue(
				mockSubmittedNotice,
			);
		});

		it("shows Download and Acknowledge buttons for SUBMITTED", async () => {
			renderWithProviders(<NoticeDetailsView noticeId="NTC003" />);

			await waitFor(() => {
				expect(screen.getByText("Descargar XML")).toBeInTheDocument();
				expect(screen.getByText("Registrar Acuse")).toBeInTheDocument();
			});
		});

		it("shows submission date", async () => {
			renderWithProviders(<NoticeDetailsView noticeId="NTC003" />);

			await waitFor(() => {
				expect(screen.getByText("Fecha de Envío")).toBeInTheDocument();
			});
		});

		it("opens acknowledge dialog and handles acknowledge", async () => {
			vi.mocked(noticesApi.acknowledgeNotice).mockResolvedValue({
				...mockSubmittedNotice,
				status: "ACKNOWLEDGED",
				satFolioNumber: "SAT-ACK-2024-99999",
			});

			const user = userEvent.setup();
			renderWithProviders(<NoticeDetailsView noticeId="NTC003" />);

			await waitFor(() => {
				expect(screen.getByText("Registrar Acuse")).toBeInTheDocument();
			});

			await user.click(screen.getByText("Registrar Acuse"));

			await waitFor(() => {
				expect(screen.getByText("Registrar Acuse del SAT")).toBeInTheDocument();
			});

			// Fill in required folio
			const folioInput = screen.getByPlaceholderText(
				"Ingresa el folio del acuse",
			);
			await user.type(folioInput, "SAT-ACK-2024-99999");

			// Find the "Registrar Acuse" button in the dialog
			const dialogButtons = screen.getAllByRole("button");
			const registerButton = dialogButtons.find(
				(btn) =>
					btn.textContent?.includes("Registrar Acuse") &&
					!btn.textContent?.includes("del SAT"),
			);
			await user.click(registerButton!);

			await waitFor(() => {
				expect(noticesApi.acknowledgeNotice).toHaveBeenCalledWith({
					id: "NTC003",
					satFolioNumber: "SAT-ACK-2024-99999",
					jwt: "test-jwt-token",
				});
			});

			await waitFor(() => {
				expect(mockToastSuccess).toHaveBeenCalled();
			});
		});

		it("disables acknowledge button when folio is empty", async () => {
			const user = userEvent.setup();
			renderWithProviders(<NoticeDetailsView noticeId="NTC003" />);

			await waitFor(() => {
				expect(screen.getByText("Registrar Acuse")).toBeInTheDocument();
			});

			await user.click(screen.getByText("Registrar Acuse"));

			await waitFor(() => {
				expect(screen.getByText("Registrar Acuse del SAT")).toBeInTheDocument();
			});

			// Find the "Registrar Acuse" button in the dialog - it should be disabled
			const dialogButtons = screen.getAllByRole("button");
			const registerButton = dialogButtons.find(
				(btn) =>
					btn.textContent?.includes("Registrar Acuse") &&
					!btn.textContent?.includes("del SAT"),
			);
			expect(registerButton).toBeDisabled();
		});
	});

	describe("ACKNOWLEDGED Notice", () => {
		beforeEach(() => {
			vi.mocked(noticesApi.getNoticeById).mockResolvedValue(
				mockAcknowledgedNotice,
			);
		});

		it("shows only Download button for ACKNOWLEDGED", async () => {
			renderWithProviders(<NoticeDetailsView noticeId="NTC004" />);

			await waitFor(() => {
				expect(screen.getByText("Descargar XML")).toBeInTheDocument();
			});

			// Should not have other action buttons
			expect(screen.queryByText("Marcar como Enviado")).not.toBeInTheDocument();
			expect(screen.queryByText("Registrar Acuse")).not.toBeInTheDocument();
			expect(screen.queryByText("Eliminar")).not.toBeInTheDocument();
			expect(screen.queryByText("Generar XML")).not.toBeInTheDocument();
		});

		it("shows SAT folio number", async () => {
			renderWithProviders(<NoticeDetailsView noticeId="NTC004" />);

			await waitFor(() => {
				expect(screen.getByText("Folio SAT")).toBeInTheDocument();
				expect(screen.getByText("SAT-2024-12345")).toBeInTheDocument();
			});
		});

		it("shows Acusado status", async () => {
			renderWithProviders(<NoticeDetailsView noticeId="NTC004" />);

			await waitFor(() => {
				expect(screen.getByText("Acusado por SAT")).toBeInTheDocument();
			});
		});
	});

	describe("Navigation", () => {
		beforeEach(() => {
			vi.mocked(noticesApi.getNoticeById).mockResolvedValue(mockDraftNotice);
		});

		it("navigates back when back button is clicked", async () => {
			const user = userEvent.setup();
			renderWithProviders(<NoticeDetailsView noticeId="NTC001" />);

			await waitFor(() => {
				expect(
					screen.getByText("Aviso SAT Diciembre 2024"),
				).toBeInTheDocument();
			});

			const backButton = screen.getByRole("button", { name: "" }); // Back button has no text
			await user.click(backButton);

			expect(mockBack).toHaveBeenCalled();
		});

		it("shows return button when notice is not found", async () => {
			vi.mocked(noticesApi.getNoticeById).mockRejectedValue(
				new Error("Not found"),
			);

			const user = userEvent.setup();
			renderWithProviders(<NoticeDetailsView noticeId="NTC001" />);

			await waitFor(() => {
				expect(screen.getByText("Volver a avisos")).toBeInTheDocument();
			});

			await user.click(screen.getByText("Volver a avisos"));

			expect(mockPush).toHaveBeenCalledWith("/test-org/notices");
		});
	});

	describe("Error Handling", () => {
		beforeEach(() => {
			vi.mocked(noticesApi.getNoticeById).mockResolvedValue(
				mockGeneratedNotice,
			);
		});

		it("handles download error gracefully", async () => {
			vi.mocked(noticesApi.downloadNoticeXml).mockRejectedValue(
				new Error("Download failed"),
			);

			const user = userEvent.setup();
			renderWithProviders(<NoticeDetailsView noticeId="NTC002" />);

			await waitFor(() => {
				expect(screen.getByText("Descargar XML")).toBeInTheDocument();
			});

			await user.click(screen.getByText("Descargar XML"));

			// The component uses toast.error with extractErrorMessage
			await waitFor(() => {
				expect(noticesApi.downloadNoticeXml).toHaveBeenCalled();
			});
		});

		it("handles submit error gracefully", async () => {
			vi.mocked(noticesApi.submitNoticeToSat).mockRejectedValue(
				new Error("Submit failed"),
			);

			const user = userEvent.setup();
			renderWithProviders(<NoticeDetailsView noticeId="NTC002" />);

			await waitFor(() => {
				expect(screen.getByText("Marcar como Enviado")).toBeInTheDocument();
			});

			await user.click(screen.getByText("Marcar como Enviado"));

			await waitFor(() => {
				expect(screen.getByText("Confirmar Envío")).toBeInTheDocument();
			});

			await user.click(screen.getByText("Confirmar Envío"));

			await waitFor(() => {
				expect(mockToastError).toHaveBeenCalled();
			});
		});

		it("handles delete error gracefully", async () => {
			vi.mocked(noticesApi.getNoticeById).mockResolvedValue(mockDraftNotice);
			vi.mocked(noticesApi.deleteNotice).mockRejectedValue(
				new Error("Delete failed"),
			);

			const user = userEvent.setup();
			renderWithProviders(<NoticeDetailsView noticeId="NTC001" />);

			await waitFor(() => {
				expect(screen.getByText("Eliminar")).toBeInTheDocument();
			});

			await user.click(screen.getByText("Eliminar"));

			await waitFor(() => {
				expect(screen.getByText("Eliminar Aviso")).toBeInTheDocument();
			});

			const dialogButtons = screen.getAllByRole("button", {
				name: /eliminar/i,
			});
			const confirmButton = dialogButtons.find((btn) =>
				btn.className.includes("destructive"),
			);
			await user.click(confirmButton!);

			await waitFor(() => {
				expect(mockToastError).toHaveBeenCalled();
			});
		});
	});
});
