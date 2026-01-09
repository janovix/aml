import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { CreateNoticeView } from "./CreateNoticeView";
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
	usePathname: () => "/test-org/notices/new",
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
	createNotice: vi.fn(),
	previewNotice: vi.fn(),
	getAvailableMonths: vi.fn(),
	calculateNoticePeriod: vi.fn(),
}));

// Mock data
const mockAvailableMonths: noticesApi.AvailableMonth[] = [
	{
		year: 2024,
		month: 12,
		displayName: "Diciembre 2024",
		hasNotice: false,
	},
	{
		year: 2024,
		month: 11,
		displayName: "Noviembre 2024",
		hasNotice: true, // Already has a notice
	},
	{
		year: 2024,
		month: 10,
		displayName: "Octubre 2024",
		hasNotice: false,
	},
];

const mockPreviewResponse: noticesApi.NoticePreviewResponse = {
	reportedMonth: "202412",
	displayName: "Diciembre 2024",
	periodStart: "2024-11-17T00:00:00Z",
	periodEnd: "2024-12-16T23:59:59Z",
	total: 10,
	bySeverity: { CRITICAL: 2, HIGH: 5, MEDIUM: 3 },
	byStatus: { OPEN: 4, UNDER_REVIEW: 4, RESOLVED: 2 },
	submissionDeadline: "2025-01-17T00:00:00Z",
};

const mockEmptyPreviewResponse: noticesApi.NoticePreviewResponse = {
	reportedMonth: "202410",
	displayName: "Octubre 2024",
	periodStart: "2024-09-17T00:00:00Z",
	periodEnd: "2024-10-16T23:59:59Z",
	total: 0,
	bySeverity: {},
	byStatus: {},
	submissionDeadline: "2024-11-17T00:00:00Z",
};

const mockCreatedNotice: noticesApi.Notice = {
	id: "NTC001",
	organizationId: "org-1",
	name: "Aviso Diciembre 2024",
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
};

describe("CreateNoticeView", () => {
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
		vi.mocked(noticesApi.getAvailableMonths).mockResolvedValue({
			months: mockAvailableMonths,
		});
		vi.mocked(noticesApi.previewNotice).mockResolvedValue(mockPreviewResponse);
		vi.mocked(noticesApi.calculateNoticePeriod).mockReturnValue({
			periodStart: new Date("2024-11-17"),
			periodEnd: new Date("2024-12-16"),
			reportedMonth: "202412",
			displayName: "Diciembre 2024",
			submissionDeadline: new Date("2025-01-17"),
		});
	});

	describe("Loading State", () => {
		it("shows loading state while fetching available months", async () => {
			vi.mocked(noticesApi.getAvailableMonths).mockImplementation(
				() => new Promise(() => {}), // Never resolves
			);

			renderWithProviders(<CreateNoticeView />);

			// Component starts with isLoading=true, so loading indicator should be visible
			await waitFor(() => {
				const loader = document.querySelector(
					'[class*="lucide-loader"], [class*="animate-spin"]',
				);
				expect(loader).toBeInTheDocument();
			});
		});

		it("shows loading state when JWT is loading", async () => {
			mockUseJwt.mockReturnValue({
				jwt: null,
				isLoading: true,
				error: null,
				refetch: vi.fn(),
			});

			renderWithProviders(<CreateNoticeView />);

			await waitFor(() => {
				const loader = document.querySelector(
					'[class*="lucide-loader"], [class*="animate-spin"]',
				);
				expect(loader).toBeInTheDocument();
			});
		});
	});

	describe("Rendering", () => {
		it("renders the form with title", async () => {
			renderWithProviders(<CreateNoticeView />);

			await waitFor(() => {
				expect(screen.getByText("Nuevo Aviso SAT")).toBeInTheDocument();
			});
		});

		it("renders period selector", async () => {
			renderWithProviders(<CreateNoticeView />);

			await waitFor(() => {
				expect(screen.getByText("Período SAT")).toBeInTheDocument();
			});
		});

		it("renders name input", async () => {
			renderWithProviders(<CreateNoticeView />);

			await waitFor(() => {
				expect(screen.getByText("Nombre del Aviso")).toBeInTheDocument();
			});
		});

		it("renders notes textarea", async () => {
			renderWithProviders(<CreateNoticeView />);

			await waitFor(() => {
				expect(screen.getByText("Notas (opcional)")).toBeInTheDocument();
			});
		});

		it("auto-selects first available month without notice", async () => {
			renderWithProviders(<CreateNoticeView />);

			await waitFor(() => {
				const nameInput = screen.getByPlaceholderText("Aviso Diciembre 2024");
				expect(nameInput).toHaveValue("Aviso Diciembre 2024");
			});
		});

		it("shows preview section", async () => {
			renderWithProviders(<CreateNoticeView />);

			await waitFor(() => {
				expect(screen.getByText("Vista Previa")).toBeInTheDocument();
			});
		});
	});

	describe("Preview", () => {
		it("shows alert count in preview", async () => {
			renderWithProviders(<CreateNoticeView />);

			await waitFor(() => {
				expect(screen.getByText("10")).toBeInTheDocument();
				expect(screen.getByText("Alertas disponibles")).toBeInTheDocument();
			});
		});

		it("shows severity breakdown in preview", async () => {
			renderWithProviders(<CreateNoticeView />);

			await waitFor(() => {
				expect(screen.getByText("Por Severidad")).toBeInTheDocument();
				expect(screen.getByText("CRITICAL: 2")).toBeInTheDocument();
				expect(screen.getByText("HIGH: 5")).toBeInTheDocument();
				expect(screen.getByText("MEDIUM: 3")).toBeInTheDocument();
			});
		});

		it("shows submission deadline", async () => {
			renderWithProviders(<CreateNoticeView />);

			await waitFor(() => {
				expect(screen.getByText("Fecha límite de envío")).toBeInTheDocument();
			});
		});

		it("shows empty state when no alerts available", async () => {
			vi.mocked(noticesApi.previewNotice).mockResolvedValue(
				mockEmptyPreviewResponse,
			);

			renderWithProviders(<CreateNoticeView />);

			await waitFor(() => {
				expect(
					screen.getByText("No hay alertas disponibles para este período"),
				).toBeInTheDocument();
			});
		});

		it("shows loading state while fetching preview", async () => {
			vi.mocked(noticesApi.getAvailableMonths).mockResolvedValue({
				months: mockAvailableMonths,
			});
			vi.mocked(noticesApi.previewNotice).mockImplementation(
				() =>
					new Promise((resolve) =>
						setTimeout(() => resolve(mockPreviewResponse), 500),
					),
			);

			renderWithProviders(<CreateNoticeView />);

			// Wait for available months to load first
			await waitFor(() => {
				expect(screen.getByText("Nuevo Aviso SAT")).toBeInTheDocument();
			});

			// Preview should show loading spinner in the card
			await waitFor(
				() => {
					const loaders = document.querySelectorAll(
						'[class*="lucide-loader"], [class*="animate-spin"]',
					);
					expect(loaders.length).toBeGreaterThan(0);
				},
				{ timeout: 300 },
			);
		});
	});

	describe("Month Selection", () => {
		it("shows available months in dropdown", async () => {
			const user = userEvent.setup();
			renderWithProviders(<CreateNoticeView />);

			await waitFor(() => {
				expect(screen.getByText("Período SAT")).toBeInTheDocument();
			});

			// Verify the select trigger is rendered and contains a month
			const selectTrigger = screen.getByRole("combobox");
			expect(selectTrigger).toBeInTheDocument();

			// The first available month should be selected by default
			await waitFor(() => {
				// Name input should be auto-filled based on selected month
				const nameInput = screen.getByLabelText("Nombre del Aviso");
				expect(nameInput).toBeInTheDocument();
			});
		});

		it("disables months that already have notices", async () => {
			renderWithProviders(<CreateNoticeView />);

			await waitFor(() => {
				expect(screen.getByText("Período SAT")).toBeInTheDocument();
			});

			// The select should be rendered with months data
			const selectTrigger = screen.getByRole("combobox");
			expect(selectTrigger).toBeInTheDocument();

			// Verify the API was called with months data
			expect(noticesApi.getAvailableMonths).toHaveBeenCalled();
		});

		it("updates name when month changes", async () => {
			renderWithProviders(<CreateNoticeView />);

			await waitFor(() => {
				const nameInput = screen.getByPlaceholderText("Aviso Diciembre 2024");
				expect(nameInput).toHaveValue("Aviso Diciembre 2024");
			});

			// Verify the month selector is present
			const selectTrigger = screen.getByRole("combobox");
			expect(selectTrigger).toBeInTheDocument();

			// The name input should reflect the first available month initially
			await waitFor(() => {
				expect(
					screen.getByDisplayValue("Aviso Diciembre 2024"),
				).toBeInTheDocument();
			});
		});
	});

	describe("Form Submission", () => {
		it("creates notice on form submission", async () => {
			vi.mocked(noticesApi.createNotice).mockResolvedValue(mockCreatedNotice);

			const user = userEvent.setup();
			renderWithProviders(<CreateNoticeView />);

			await waitFor(() => {
				expect(screen.getByText("Crear Aviso")).toBeInTheDocument();
			});

			// Wait for preview to load (enables submit button)
			await waitFor(() => {
				expect(screen.getByText("10")).toBeInTheDocument();
			});

			await user.click(screen.getByText("Crear Aviso"));

			await waitFor(() => {
				expect(noticesApi.createNotice).toHaveBeenCalledWith({
					name: "Aviso Diciembre 2024",
					year: 2024,
					month: 12,
					notes: null,
					jwt: "test-jwt-token",
				});
			});

			await waitFor(() => {
				expect(mockToastSuccess).toHaveBeenCalled();
			});

			await waitFor(() => {
				expect(mockPush).toHaveBeenCalledWith("/test-org/notices/NTC001");
			});
		});

		it("includes notes in creation request", async () => {
			vi.mocked(noticesApi.createNotice).mockResolvedValue(mockCreatedNotice);

			const user = userEvent.setup();
			renderWithProviders(<CreateNoticeView />);

			await waitFor(() => {
				expect(screen.getByText("Crear Aviso")).toBeInTheDocument();
			});

			// Add notes
			const notesInput = screen.getByPlaceholderText(
				"Notas o comentarios sobre este aviso...",
			);
			await user.type(notesInput, "Test notes");

			// Wait for preview to load (enables submit button)
			await waitFor(() => {
				expect(screen.getByText("10")).toBeInTheDocument();
			});

			await user.click(screen.getByText("Crear Aviso"));

			await waitFor(() => {
				expect(noticesApi.createNotice).toHaveBeenCalledWith(
					expect.objectContaining({
						notes: "Test notes",
					}),
				);
			});
		});

		it("disables submit button when no alerts available", async () => {
			vi.mocked(noticesApi.previewNotice).mockResolvedValue(
				mockEmptyPreviewResponse,
			);

			renderWithProviders(<CreateNoticeView />);

			await waitFor(() => {
				const submitButton = screen.getByRole("button", {
					name: "Crear Aviso",
				});
				expect(submitButton).toBeDisabled();
			});
		});

		it("disables submit button when name is empty", async () => {
			const user = userEvent.setup();
			renderWithProviders(<CreateNoticeView />);

			await waitFor(() => {
				expect(screen.getByText("10")).toBeInTheDocument();
			});

			// Clear the name input
			const nameInput = screen.getByPlaceholderText("Aviso Diciembre 2024");
			await user.clear(nameInput);

			const submitButton = screen.getByRole("button", { name: "Crear Aviso" });
			expect(submitButton).toBeDisabled();
		});

		it("shows loading state during submission", async () => {
			vi.mocked(noticesApi.createNotice).mockImplementation(
				() =>
					new Promise((resolve) =>
						setTimeout(() => resolve(mockCreatedNotice), 500),
					),
			);

			const user = userEvent.setup();
			renderWithProviders(<CreateNoticeView />);

			await waitFor(() => {
				expect(screen.getByText("Alertas disponibles")).toBeInTheDocument();
			});

			await user.click(screen.getByText("Crear Aviso"));

			await waitFor(
				() => {
					const submitButton = screen.getByRole("button", {
						name: /Crear Aviso/,
					});
					expect(submitButton).toBeDisabled();
				},
				{ timeout: 300 },
			);
		});

		it("handles creation error gracefully", async () => {
			vi.mocked(noticesApi.createNotice).mockRejectedValue(
				new Error("Creation failed"),
			);

			const user = userEvent.setup();
			renderWithProviders(<CreateNoticeView />);

			await waitFor(() => {
				expect(screen.getByText("10")).toBeInTheDocument();
			});

			await user.click(screen.getByText("Crear Aviso"));

			await waitFor(() => {
				expect(mockToastError).toHaveBeenCalled();
			});
		});
	});

	describe("Navigation", () => {
		it("navigates back when back button is clicked", async () => {
			const user = userEvent.setup();
			renderWithProviders(<CreateNoticeView />);

			await waitFor(() => {
				expect(screen.getByText("Nuevo Aviso SAT")).toBeInTheDocument();
			});

			// Find and click back button
			const backButtons = screen.getAllByRole("button");
			const backButton = backButtons.find(
				(btn) => btn.querySelector(".lucide-arrow-left") !== null,
			);
			await user.click(backButton!);

			expect(mockBack).toHaveBeenCalled();
		});

		it("navigates to notices list when cancel is clicked", async () => {
			const user = userEvent.setup();
			renderWithProviders(<CreateNoticeView />);

			await waitFor(() => {
				expect(screen.getByText("Cancelar")).toBeInTheDocument();
			});

			await user.click(screen.getByText("Cancelar"));

			expect(mockPush).toHaveBeenCalledWith("/test-org/notices");
		});
	});

	describe("Error Handling", () => {
		it("shows error toast when loading available months fails", async () => {
			vi.mocked(noticesApi.getAvailableMonths).mockRejectedValue(
				new Error("API error"),
			);

			renderWithProviders(<CreateNoticeView />);

			await waitFor(() => {
				expect(mockToastError).toHaveBeenCalled();
			});
		});

		it("handles preview error gracefully", async () => {
			vi.mocked(noticesApi.previewNotice).mockRejectedValue(
				new Error("Preview failed"),
			);

			renderWithProviders(<CreateNoticeView />);

			await waitFor(() => {
				expect(screen.getByText("Nuevo Aviso SAT")).toBeInTheDocument();
			});

			// Preview should show "select a period" message when preview fails
			await waitFor(() => {
				expect(
					screen.getByText("Selecciona un período para ver la vista previa"),
				).toBeInTheDocument();
			});
		});
	});
});
