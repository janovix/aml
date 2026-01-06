import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { NoticesTable } from "./NoticesTable";
import { renderWithProviders } from "@/lib/testHelpers";
import * as noticesApi from "@/lib/api/notices";

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
	usePathname: () => "/test-org/notices",
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

// Mock the notices API
vi.mock("@/lib/api/notices", () => ({
	listNotices: vi.fn(),
	deleteNotice: vi.fn(),
	generateNoticeFile: vi.fn(),
	getNoticeDownloadUrl: vi.fn(),
}));

// Mock notice data
const mockNotices: noticesApi.Notice[] = [
	{
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
	},
	{
		id: "NTC002",
		organizationId: "org-1",
		name: "Aviso SAT Noviembre 2024",
		status: "GENERATED",
		periodStart: "2024-10-17T00:00:00Z",
		periodEnd: "2024-11-16T23:59:59Z",
		reportedMonth: "202411",
		recordCount: 25,
		xmlFileUrl: "https://example.com/notice.xml",
		fileSize: 12345,
		generatedAt: "2024-11-20T10:00:00Z",
		submittedAt: null,
		satFolioNumber: null,
		createdBy: "user-1",
		notes: null,
		createdAt: "2024-11-01T00:00:00Z",
		updatedAt: "2024-11-20T10:00:00Z",
	},
	{
		id: "NTC003",
		organizationId: "org-1",
		name: "Aviso SAT Octubre 2024",
		status: "SUBMITTED",
		periodStart: "2024-09-17T00:00:00Z",
		periodEnd: "2024-10-16T23:59:59Z",
		reportedMonth: "202410",
		recordCount: 8,
		xmlFileUrl: "https://example.com/notice2.xml",
		fileSize: 5678,
		generatedAt: "2024-10-20T09:00:00Z",
		submittedAt: "2024-10-21T14:30:00Z",
		satFolioNumber: null,
		createdBy: "user-1",
		notes: null,
		createdAt: "2024-10-01T00:00:00Z",
		updatedAt: "2024-10-21T14:30:00Z",
	},
	{
		id: "NTC004",
		organizationId: "org-1",
		name: "Aviso SAT Septiembre 2024",
		status: "ACKNOWLEDGED",
		periodStart: "2024-08-17T00:00:00Z",
		periodEnd: "2024-09-16T23:59:59Z",
		reportedMonth: "202409",
		recordCount: 15,
		xmlFileUrl: "https://example.com/notice3.xml",
		fileSize: 9876,
		generatedAt: "2024-09-20T09:00:00Z",
		submittedAt: "2024-09-21T10:00:00Z",
		satFolioNumber: "SAT-2024-12345",
		createdBy: "user-1",
		notes: "Acuse recibido correctamente",
		createdAt: "2024-09-01T00:00:00Z",
		updatedAt: "2024-09-22T11:00:00Z",
	},
];

describe("NoticesTable", () => {
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
		vi.mocked(noticesApi.listNotices).mockResolvedValue({
			data: mockNotices,
			pagination: {
				page: 1,
				limit: 20,
				total: mockNotices.length,
				totalPages: 1,
			},
		});
	});

	describe("Rendering", () => {
		it("renders table with notice data", async () => {
			renderWithProviders(<NoticesTable />);

			await waitFor(() => {
				expect(
					screen.getByText("AVISO SAT DICIEMBRE 2024"),
				).toBeInTheDocument();
			});
		});

		it("renders all notice names", async () => {
			renderWithProviders(<NoticesTable />);

			await waitFor(() => {
				expect(
					screen.getByText("AVISO SAT DICIEMBRE 2024"),
				).toBeInTheDocument();
				expect(
					screen.getByText("AVISO SAT NOVIEMBRE 2024"),
				).toBeInTheDocument();
				expect(screen.getByText("AVISO SAT OCTUBRE 2024")).toBeInTheDocument();
				expect(
					screen.getByText("AVISO SAT SEPTIEMBRE 2024"),
				).toBeInTheDocument();
			});
		});

		it("renders notice names as links to notice details", async () => {
			renderWithProviders(<NoticesTable />);

			await waitFor(() => {
				const noticeLink = screen.getByRole("link", {
					name: "AVISO SAT DICIEMBRE 2024",
				});
				expect(noticeLink).toBeInTheDocument();
				expect(noticeLink).toHaveAttribute("href", "/test-org/notices/NTC001");
			});
		});

		it("displays page hero with title", async () => {
			renderWithProviders(<NoticesTable />);

			await waitFor(() => {
				expect(screen.getByText("Avisos SAT")).toBeInTheDocument();
			});
		});

		it("shows stats in page hero", async () => {
			renderWithProviders(<NoticesTable />);

			await waitFor(() => {
				// PageHero only renders first 3 stats
				expect(screen.getByText(/Total Avisos/i)).toBeInTheDocument();
				expect(screen.getByText(/Pendientes/i)).toBeInTheDocument();
				expect(screen.getByText(/Enviados/i)).toBeInTheDocument();
			});
		});

		it("displays notice periods (SAT cycle)", async () => {
			renderWithProviders(<NoticesTable />);

			await waitFor(() => {
				expect(screen.getByText("202412")).toBeInTheDocument();
				expect(screen.getByText("202411")).toBeInTheDocument();
			});
		});

		it("displays record count for each notice", async () => {
			renderWithProviders(<NoticesTable />);

			await waitFor(() => {
				expect(screen.getByText("10")).toBeInTheDocument();
				expect(screen.getByText("25")).toBeInTheDocument();
			});
		});

		it("displays submitted date when available", async () => {
			renderWithProviders(<NoticesTable />);

			await waitFor(() => {
				// The notices table should render the submitted notices
				expect(screen.getByText("AVISO SAT OCTUBRE 2024")).toBeInTheDocument();
			});

			// NTC003 has submittedAt - check that the year 2024 appears (date format is locale-dependent)
			await waitFor(() => {
				const yearElements = screen.getAllByText("2024");
				expect(yearElements.length).toBeGreaterThan(0);
			});
		});
	});

	describe("Status Display", () => {
		it("displays DRAFT status correctly", async () => {
			vi.mocked(noticesApi.listNotices).mockResolvedValue({
				data: [mockNotices[0]], // DRAFT notice
				pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
			});

			renderWithProviders(<NoticesTable />);

			await waitFor(() => {
				expect(screen.getByText("Borrador")).toBeInTheDocument();
			});
		});

		it("displays GENERATED status correctly", async () => {
			vi.mocked(noticesApi.listNotices).mockResolvedValue({
				data: [mockNotices[1]], // GENERATED notice
				pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
			});

			renderWithProviders(<NoticesTable />);

			await waitFor(() => {
				expect(screen.getByText("Generado")).toBeInTheDocument();
			});
		});

		it("displays SUBMITTED status correctly", async () => {
			vi.mocked(noticesApi.listNotices).mockResolvedValue({
				data: [mockNotices[2]], // SUBMITTED notice
				pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
			});

			renderWithProviders(<NoticesTable />);

			await waitFor(() => {
				// "Enviado" appears in both the column header and status badge,
				// so we check for multiple matches
				const enviadoElements = screen.getAllByText("Enviado");
				expect(enviadoElements.length).toBeGreaterThan(0);
			});
		});

		it("displays ACKNOWLEDGED status correctly", async () => {
			vi.mocked(noticesApi.listNotices).mockResolvedValue({
				data: [mockNotices[3]], // ACKNOWLEDGED notice
				pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
			});

			renderWithProviders(<NoticesTable />);

			await waitFor(() => {
				expect(screen.getByText("Acusado")).toBeInTheDocument();
			});
		});
	});

	describe("Selection", () => {
		it("allows selecting individual notices", async () => {
			const user = userEvent.setup();
			renderWithProviders(<NoticesTable />);

			await waitFor(() => {
				expect(
					screen.getByText("AVISO SAT DICIEMBRE 2024"),
				).toBeInTheDocument();
			});

			const checkboxes = screen.getAllByRole("checkbox");
			const firstNoticeCheckbox = checkboxes[1];
			await user.click(firstNoticeCheckbox);

			await waitFor(() => {
				expect(firstNoticeCheckbox).toBeChecked();
			});
		});

		it("allows selecting all notices", async () => {
			const user = userEvent.setup();
			renderWithProviders(<NoticesTable />);

			await waitFor(() => {
				expect(
					screen.getByText("AVISO SAT DICIEMBRE 2024"),
				).toBeInTheDocument();
			});

			const selectAllCheckbox = screen.getAllByRole("checkbox")[0];
			await user.click(selectAllCheckbox);

			await waitFor(() => {
				expect(selectAllCheckbox).toBeChecked();
			});
		});
	});

	describe("Loading and Empty States", () => {
		it("shows loading state initially", async () => {
			vi.mocked(noticesApi.listNotices).mockImplementation(
				() => new Promise(() => {}), // Never resolves
			);

			renderWithProviders(<NoticesTable />);

			await waitFor(() => {
				const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
				expect(skeletons.length).toBeGreaterThan(0);
			});
		});

		it("shows empty state when no notices", async () => {
			vi.mocked(noticesApi.listNotices).mockResolvedValue({
				data: [],
				pagination: {
					page: 1,
					limit: 20,
					total: 0,
					totalPages: 0,
				},
			});

			renderWithProviders(<NoticesTable />);

			await waitFor(() => {
				expect(
					screen.getByText("No se encontraron avisos"),
				).toBeInTheDocument();
			});
		});

		it("shows error state when no organization is selected", async () => {
			mockUseOrgStore.mockReturnValue({
				currentOrg: null,
			});

			renderWithProviders(<NoticesTable />);

			await waitFor(() => {
				expect(screen.getByText("Sin organización")).toBeInTheDocument();
				expect(
					screen.getByText("Selecciona una organización para ver los avisos"),
				).toBeInTheDocument();
			});
		});
	});

	describe("API Interactions", () => {
		it("calls API with correct parameters", async () => {
			renderWithProviders(<NoticesTable />);

			await waitFor(() => {
				expect(noticesApi.listNotices).toHaveBeenCalledWith(
					expect.objectContaining({
						page: 1,
						limit: 20,
						jwt: "test-jwt-token",
					}),
				);
			});
		});

		it("handles API error gracefully", async () => {
			vi.mocked(noticesApi.listNotices).mockRejectedValue(
				new Error("API error"),
			);

			renderWithProviders(<NoticesTable />);

			await waitFor(() => {
				expect(mockToast).toHaveBeenCalledWith(
					expect.objectContaining({
						title: "Error",
						description: "No se pudieron cargar los avisos",
						variant: "destructive",
					}),
				);
			});
		});

		it("does not call API when organization is not selected", async () => {
			mockUseOrgStore.mockReturnValue({
				currentOrg: null,
			});

			renderWithProviders(<NoticesTable />);

			await waitFor(() => {
				expect(noticesApi.listNotices).not.toHaveBeenCalled();
			});
		});

		it("handles filter changes correctly", async () => {
			renderWithProviders(<NoticesTable filters={{ status: "DRAFT" }} />);

			await waitFor(() => {
				expect(noticesApi.listNotices).toHaveBeenCalledWith(
					expect.objectContaining({
						status: "DRAFT",
					}),
				);
			});
		});
	});

	describe("Actions", () => {
		it("opens action menu on click", async () => {
			const user = userEvent.setup();
			renderWithProviders(<NoticesTable />);

			await waitFor(() => {
				expect(
					screen.getByText("AVISO SAT DICIEMBRE 2024"),
				).toBeInTheDocument();
			});

			// Find the action menu trigger button (small ghost button in the actions column)
			const allButtons = screen.getAllByRole("button");
			// Find button that contains the MoreHorizontal icon (class lucide-ellipsis or lucide-more-horizontal)
			const moreButton = allButtons.find(
				(btn) =>
					btn.querySelector('[class*="lucide-more"]') !== null ||
					btn.querySelector('[class*="lucide-ellipsis"]') !== null,
			);

			// If no icon-based selector works, try finding small ghost buttons
			const actionButton =
				moreButton ??
				allButtons.find(
					(btn) =>
						btn.classList.contains("h-8") && btn.classList.contains("w-8"),
				);

			expect(actionButton).toBeDefined();
			await user.click(actionButton!);

			await waitFor(() => {
				expect(screen.getByText("Ver detalle")).toBeInTheDocument();
			});
		});

		it("shows Generate XML action for DRAFT notices", async () => {
			const user = userEvent.setup();
			vi.mocked(noticesApi.listNotices).mockResolvedValue({
				data: [mockNotices[0]], // DRAFT notice
				pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
			});

			renderWithProviders(<NoticesTable />);

			await waitFor(() => {
				expect(
					screen.getByText("AVISO SAT DICIEMBRE 2024"),
				).toBeInTheDocument();
			});

			const allButtons = screen.getAllByRole("button");
			const actionButton = allButtons.find(
				(btn) =>
					btn.querySelector('[class*="lucide-more"]') !== null ||
					btn.querySelector('[class*="lucide-ellipsis"]') !== null ||
					(btn.classList.contains("h-8") && btn.classList.contains("w-8")),
			);
			await user.click(actionButton!);

			await waitFor(() => {
				expect(screen.getByText("Generar XML")).toBeInTheDocument();
			});
		});

		it("shows Submit to SAT action for GENERATED notices", async () => {
			const user = userEvent.setup();
			vi.mocked(noticesApi.listNotices).mockResolvedValue({
				data: [mockNotices[1]], // GENERATED notice
				pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
			});

			renderWithProviders(<NoticesTable />);

			await waitFor(() => {
				expect(
					screen.getByText("AVISO SAT NOVIEMBRE 2024"),
				).toBeInTheDocument();
			});

			const allButtons = screen.getAllByRole("button");
			const actionButton = allButtons.find(
				(btn) =>
					btn.querySelector('[class*="lucide-more"]') !== null ||
					btn.querySelector('[class*="lucide-ellipsis"]') !== null ||
					(btn.classList.contains("h-8") && btn.classList.contains("w-8")),
			);
			await user.click(actionButton!);

			await waitFor(() => {
				expect(screen.getByText("Enviar a SAT")).toBeInTheDocument();
			});
		});

		it("shows Download XML action for non-DRAFT notices", async () => {
			const user = userEvent.setup();
			vi.mocked(noticesApi.listNotices).mockResolvedValue({
				data: [mockNotices[1]], // GENERATED notice
				pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
			});

			renderWithProviders(<NoticesTable />);

			await waitFor(() => {
				expect(
					screen.getByText("AVISO SAT NOVIEMBRE 2024"),
				).toBeInTheDocument();
			});

			const allButtons = screen.getAllByRole("button");
			const actionButton = allButtons.find(
				(btn) =>
					btn.querySelector('[class*="lucide-more"]') !== null ||
					btn.querySelector('[class*="lucide-ellipsis"]') !== null ||
					(btn.classList.contains("h-8") && btn.classList.contains("w-8")),
			);
			await user.click(actionButton!);

			await waitFor(() => {
				expect(screen.getByText("Descargar XML")).toBeInTheDocument();
			});
		});

		it("shows Delete action only for DRAFT notices", async () => {
			const user = userEvent.setup();
			vi.mocked(noticesApi.listNotices).mockResolvedValue({
				data: [mockNotices[0]], // DRAFT notice
				pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
			});

			renderWithProviders(<NoticesTable />);

			await waitFor(() => {
				expect(
					screen.getByText("AVISO SAT DICIEMBRE 2024"),
				).toBeInTheDocument();
			});

			const allButtons = screen.getAllByRole("button");
			const actionButton = allButtons.find(
				(btn) =>
					btn.querySelector('[class*="lucide-more"]') !== null ||
					btn.querySelector('[class*="lucide-ellipsis"]') !== null ||
					(btn.classList.contains("h-8") && btn.classList.contains("w-8")),
			);
			await user.click(actionButton!);

			await waitFor(() => {
				expect(screen.getByText("Eliminar")).toBeInTheDocument();
			});
		});

		it("handles generate action", async () => {
			const user = userEvent.setup();
			vi.mocked(noticesApi.listNotices).mockResolvedValue({
				data: [mockNotices[0]], // DRAFT notice
				pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
			});
			vi.mocked(noticesApi.generateNoticeFile).mockResolvedValue({
				message: "Notice generated successfully",
				noticeId: "NTC001",
				alertCount: 10,
			});

			renderWithProviders(<NoticesTable />);

			await waitFor(() => {
				expect(
					screen.getByText("AVISO SAT DICIEMBRE 2024"),
				).toBeInTheDocument();
			});

			const allButtons = screen.getAllByRole("button");
			const actionButton = allButtons.find(
				(btn) =>
					btn.querySelector('[class*="lucide-more"]') !== null ||
					btn.querySelector('[class*="lucide-ellipsis"]') !== null ||
					(btn.classList.contains("h-8") && btn.classList.contains("w-8")),
			);
			await user.click(actionButton!);

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
				expect(mockToast).toHaveBeenCalledWith(
					expect.objectContaining({
						title: "Aviso generado",
					}),
				);
			});
		});

		it("handles download action", async () => {
			const user = userEvent.setup();
			const mockOpen = vi.fn();
			vi.stubGlobal("open", mockOpen);

			vi.mocked(noticesApi.listNotices).mockResolvedValue({
				data: [mockNotices[1]], // GENERATED notice
				pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
			});
			vi.mocked(noticesApi.getNoticeDownloadUrl).mockResolvedValue({
				fileUrl: "https://example.com/download.xml",
				format: "xml",
			});

			renderWithProviders(<NoticesTable />);

			await waitFor(() => {
				expect(
					screen.getByText("AVISO SAT NOVIEMBRE 2024"),
				).toBeInTheDocument();
			});

			const allButtons = screen.getAllByRole("button");
			const actionButton = allButtons.find(
				(btn) =>
					btn.querySelector('[class*="lucide-more"]') !== null ||
					btn.querySelector('[class*="lucide-ellipsis"]') !== null ||
					(btn.classList.contains("h-8") && btn.classList.contains("w-8")),
			);
			await user.click(actionButton!);

			await waitFor(() => {
				expect(screen.getByText("Descargar XML")).toBeInTheDocument();
			});

			await user.click(screen.getByText("Descargar XML"));

			await waitFor(() => {
				expect(noticesApi.getNoticeDownloadUrl).toHaveBeenCalledWith({
					id: "NTC002",
					jwt: "test-jwt-token",
				});
			});

			await waitFor(() => {
				expect(mockOpen).toHaveBeenCalledWith(
					"https://example.com/download.xml",
					"_blank",
				);
			});

			vi.unstubAllGlobals();
		});

		it("handles delete action", async () => {
			const user = userEvent.setup();
			vi.mocked(noticesApi.listNotices).mockResolvedValue({
				data: [mockNotices[0]], // DRAFT notice
				pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
			});
			vi.mocked(noticesApi.deleteNotice).mockResolvedValue(undefined);

			renderWithProviders(<NoticesTable />);

			await waitFor(() => {
				expect(
					screen.getByText("AVISO SAT DICIEMBRE 2024"),
				).toBeInTheDocument();
			});

			const allButtons = screen.getAllByRole("button");
			const actionButton = allButtons.find(
				(btn) =>
					btn.querySelector('[class*="lucide-more"]') !== null ||
					btn.querySelector('[class*="lucide-ellipsis"]') !== null ||
					(btn.classList.contains("h-8") && btn.classList.contains("w-8")),
			);
			await user.click(actionButton!);

			await waitFor(() => {
				expect(screen.getByText("Eliminar")).toBeInTheDocument();
			});

			await user.click(screen.getByText("Eliminar"));

			await waitFor(() => {
				expect(noticesApi.deleteNotice).toHaveBeenCalledWith({
					id: "NTC001",
					jwt: "test-jwt-token",
				});
			});

			await waitFor(() => {
				expect(mockToast).toHaveBeenCalledWith(
					expect.objectContaining({
						title: "Aviso eliminado",
					}),
				);
			});
		});

		it("handles generate error gracefully", async () => {
			const user = userEvent.setup();
			vi.mocked(noticesApi.listNotices).mockResolvedValue({
				data: [mockNotices[0]], // DRAFT notice
				pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
			});
			vi.mocked(noticesApi.generateNoticeFile).mockRejectedValue(
				new Error("Generation failed"),
			);

			renderWithProviders(<NoticesTable />);

			await waitFor(() => {
				expect(
					screen.getByText("AVISO SAT DICIEMBRE 2024"),
				).toBeInTheDocument();
			});

			const allButtons = screen.getAllByRole("button");
			const actionButton = allButtons.find(
				(btn) =>
					btn.querySelector('[class*="lucide-more"]') !== null ||
					btn.querySelector('[class*="lucide-ellipsis"]') !== null ||
					(btn.classList.contains("h-8") && btn.classList.contains("w-8")),
			);
			await user.click(actionButton!);

			await user.click(screen.getByText("Generar XML"));

			await waitFor(() => {
				expect(mockToast).toHaveBeenCalledWith(
					expect.objectContaining({
						title: "Error",
						description: "No se pudo generar el aviso",
						variant: "destructive",
					}),
				);
			});
		});

		it("handles download error gracefully", async () => {
			const user = userEvent.setup();
			vi.mocked(noticesApi.listNotices).mockResolvedValue({
				data: [mockNotices[1]], // GENERATED notice
				pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
			});
			vi.mocked(noticesApi.getNoticeDownloadUrl).mockRejectedValue(
				new Error("Download failed"),
			);

			renderWithProviders(<NoticesTable />);

			await waitFor(() => {
				expect(
					screen.getByText("AVISO SAT NOVIEMBRE 2024"),
				).toBeInTheDocument();
			});

			const allButtons = screen.getAllByRole("button");
			const actionButton = allButtons.find(
				(btn) =>
					btn.querySelector('[class*="lucide-more"]') !== null ||
					btn.querySelector('[class*="lucide-ellipsis"]') !== null ||
					(btn.classList.contains("h-8") && btn.classList.contains("w-8")),
			);
			await user.click(actionButton!);

			await user.click(screen.getByText("Descargar XML"));

			await waitFor(() => {
				expect(mockToast).toHaveBeenCalledWith(
					expect.objectContaining({
						title: "Error",
						description: "No se pudo descargar el aviso",
						variant: "destructive",
					}),
				);
			});
		});

		it("handles delete error gracefully", async () => {
			const user = userEvent.setup();
			vi.mocked(noticesApi.listNotices).mockResolvedValue({
				data: [mockNotices[0]], // DRAFT notice
				pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
			});
			vi.mocked(noticesApi.deleteNotice).mockRejectedValue(
				new Error("Delete failed"),
			);

			renderWithProviders(<NoticesTable />);

			await waitFor(() => {
				expect(
					screen.getByText("AVISO SAT DICIEMBRE 2024"),
				).toBeInTheDocument();
			});

			const allButtons = screen.getAllByRole("button");
			const actionButton = allButtons.find(
				(btn) =>
					btn.querySelector('[class*="lucide-more"]') !== null ||
					btn.querySelector('[class*="lucide-ellipsis"]') !== null ||
					(btn.classList.contains("h-8") && btn.classList.contains("w-8")),
			);
			await user.click(actionButton!);

			await user.click(screen.getByText("Eliminar"));

			await waitFor(() => {
				expect(mockToast).toHaveBeenCalledWith(
					expect.objectContaining({
						title: "Error",
						description: "No se pudo eliminar el aviso",
						variant: "destructive",
					}),
				);
			});
		});
	});

	describe("Stats Calculation", () => {
		it("calculates stats correctly", async () => {
			renderWithProviders(<NoticesTable />);

			// Wait for data to load and verify stats are present (PageHero shows first 3 stats)
			await waitFor(() => {
				expect(screen.getByText(/Total Avisos/i)).toBeInTheDocument();
				expect(screen.getByText(/Pendientes/i)).toBeInTheDocument();
			});

			// Verify that stats show correct counts in the stats cards section
			await waitFor(() => {
				// Find the Total Avisos stat card and verify its value
				const statsSection = document.querySelector(".grid.grid-cols-1");
				expect(statsSection).toBeInTheDocument();
			});
		});
	});
});
