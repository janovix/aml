import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { NavBreadcrumb } from "./NavBreadcrumb";
import { renderWithProviders } from "@/lib/testHelpers";
import type { InvoiceEntity } from "@/types/invoice";
import {
	useSetPageStatus,
	type PageStatus,
} from "@/components/PageStatusProvider";

// Mock cookies module to return Spanish language for tests
vi.mock("@/lib/cookies", () => ({
	getCookie: (name: string) => {
		if (name === "janovix-lang") return "es";
		return undefined;
	},
	setCookie: vi.fn(),
	deleteCookie: vi.fn(),
	COOKIE_NAMES: {
		THEME: "janovix-theme",
		LANGUAGE: "janovix-lang",
	},
}));

// Mock usePathname
const mockPathname = vi.fn(() => "/test-org/clients");

vi.mock("next/navigation", () => ({
	usePathname: () => mockPathname(),
	useParams: () => ({ orgSlug: "test-org" }),
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
	}),
}));

vi.mock("@/lib/org-store", () => ({
	useOrgStore: () => ({
		currentOrg: { slug: "test-org", name: "Test Org", id: "1" },
	}),
}));

// Mock getClientById
const mockGetClientById = vi.fn();
vi.mock("@/lib/api/clients", () => ({
	getClientById: (opts: { id: string }) => mockGetClientById(opts),
}));

const mockGetAlertById = vi.fn();
vi.mock("@/lib/api/alerts", () => ({
	getAlertById: (opts: { id: string }) => mockGetAlertById(opts),
}));

const mockGetNoticeById = vi.fn();
vi.mock("@/lib/api/notices", () => ({
	getNoticeById: (opts: { id: string }) => mockGetNoticeById(opts),
}));

const mockGetInvoiceById = vi.fn();
vi.mock("@/lib/api/invoices", () => ({
	getInvoiceById: (opts: { id: string }) => mockGetInvoiceById(opts),
}));

// Mock useJwt to return a valid JWT
vi.mock("@/hooks/useJwt", () => ({
	useJwt: () => ({
		jwt: "mock-jwt-token",
		isLoading: false,
		error: null,
		refetch: vi.fn(),
	}),
}));

describe("NavBreadcrumb", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockPathname.mockReturnValue("/test-org/clients");
		mockGetAlertById.mockResolvedValue({
			id: "ALERT123",
			alertRuleId: "r1",
			clientId: "c1",
			status: "open",
			severity: "high",
			idempotencyKey: "k",
			contextHash: "h",
			metadata: {},
			isManual: false,
			isOverdue: false,
			createdAt: "",
			updatedAt: "",
			alertRule: {
				id: "r1",
				name: "Regla de prueba",
				active: true,
				severity: "high",
				isManualOnly: false,
				activityCode: "VEH",
				createdAt: "",
				updatedAt: "",
			},
		});
		mockGetNoticeById.mockResolvedValue({
			id: "NOTICE1",
			organizationId: "o1",
			name: "Aviso enero",
			status: "draft",
			periodStart: "",
			periodEnd: "",
			reportedMonth: "",
			recordCount: 0,
			amendmentCycle: 0,
			createdAt: "",
			updatedAt: "",
			alertSummary: { total: 0, bySeverity: {}, byStatus: {}, byRule: [] },
			events: [],
			alerts: [],
		});
		mockGetInvoiceById.mockResolvedValue({
			id: "inv-uuid",
			organizationId: "o1",
			uuid: "AAA-BBB",
			version: "4.0",
			series: "A",
			folio: "100",
			issuerRfc: "X",
			issuerName: "X",
			issuerTaxRegimeCode: "601",
			receiverRfc: "Y",
			receiverName: "Y",
			receiverUsageCode: null,
			receiverTaxRegimeCode: null,
			receiverPostalCode: null,
			subtotal: "0",
			discount: null,
			total: "0",
			currencyCode: "MXN",
			exchangeRate: null,
			paymentFormCode: null,
			paymentMethodCode: null,
			voucherTypeCode: "I",
			issueDate: "",
			certificationDate: null,
			exportCode: null,
			tfdUuid: null,
			tfdSatCertificate: null,
			tfdSignature: null,
			tfdStampDate: null,
			xmlContent: null,
			notes: null,
			createdAt: "",
			updatedAt: "",
			deletedAt: null,
			items: [],
		} as InvoiceEntity);
		mockGetClientById.mockResolvedValue({
			id: "CLT123456789",
			personType: "physical",
			firstName: "Juan",
			lastName: "Pérez",
			secondLastName: "García",
			rfc: "PEGJ800101AAA",
			email: "juan@example.com",
			phone: "5551234567",
			country: "MX",
			stateCode: "CMX",
			city: "CDMX",
			municipality: "Cuauhtémoc",
			neighborhood: "Centro",
			street: "Reforma",
			externalNumber: "123",
			postalCode: "06600",
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		});
	});

	it("renders home link", () => {
		renderWithProviders(<NavBreadcrumb />);

		// Should have a link to home (anchor tag, not BreadcrumbPage span with role="link")
		const homeLink = screen.getByRole("link", { name: /inicio/i });
		expect(homeLink).toBeInTheDocument();
		expect(homeLink).toHaveAttribute("href", "/test-org");
	});

	it("renders current page in breadcrumb", () => {
		renderWithProviders(<NavBreadcrumb />);

		// Should show Clientes as the current page
		expect(screen.getByText("Clientes")).toBeInTheDocument();
	});

	it("renders breadcrumb navigation", () => {
		renderWithProviders(<NavBreadcrumb />);

		// Should have breadcrumb navigation
		const nav = screen.getByRole("navigation", { name: /breadcrumb/i });
		expect(nav).toBeInTheDocument();
	});

	it("renders nested route correctly", () => {
		mockPathname.mockReturnValue("/test-org/clients/123/edit");
		renderWithProviders(<NavBreadcrumb />);

		// Should show Clientes, truncated ID, and Editar
		expect(screen.getByText("Clientes")).toBeInTheDocument();
		expect(screen.getByText("Editar")).toBeInTheDocument();
	});

	it("renders operations route", () => {
		mockPathname.mockReturnValue("/test-org/operations");
		renderWithProviders(<NavBreadcrumb />);

		expect(screen.getByText("Operaciones")).toBeInTheDocument();
	});

	it("renders alerts route", () => {
		mockPathname.mockReturnValue("/test-org/alerts");
		renderWithProviders(<NavBreadcrumb />);

		expect(screen.getByText("Alertas")).toBeInTheDocument();
	});

	it("renders reports route", () => {
		mockPathname.mockReturnValue("/test-org/reports");
		renderWithProviders(<NavBreadcrumb />);

		expect(screen.getByText("Reportes")).toBeInTheDocument();
	});

	it("renders activity route", () => {
		mockPathname.mockReturnValue("/test-org/activity");
		renderWithProviders(<NavBreadcrumb />);

		expect(screen.getByText("Actividad")).toBeInTheDocument();
	});

	it("renders risk models route", () => {
		mockPathname.mockReturnValue("/test-org/risk");
		renderWithProviders(<NavBreadcrumb />);

		expect(screen.getByText("Modelos de Riesgo")).toBeInTheDocument();
	});

	it("renders risk methodology nested route", () => {
		mockPathname.mockReturnValue("/test-org/risk/methodology");
		renderWithProviders(<NavBreadcrumb />);

		expect(screen.getByText("Modelos de Riesgo")).toBeInTheDocument();
		expect(screen.getByText("Metodología")).toBeInTheDocument();
	});

	it("renders risk evaluations nested route", () => {
		mockPathname.mockReturnValue("/test-org/risk/evaluations");
		renderWithProviders(<NavBreadcrumb />);

		expect(screen.getByText("Modelos de Riesgo")).toBeInTheDocument();
		expect(screen.getByText("Evaluaciones")).toBeInTheDocument();
	});

	it("renders risk assessment nested route", () => {
		mockPathname.mockReturnValue("/test-org/risk/assessment");
		renderWithProviders(<NavBreadcrumb />);

		expect(screen.getByText("Modelos de Riesgo")).toBeInTheDocument();
		expect(screen.getByText("Evaluación")).toBeInTheDocument();
	});

	it("renders invoice create-operation nested route", () => {
		mockPathname.mockReturnValue(
			"/test-org/invoices/11111111-1111-1111-1111-111111111111/create-operation",
		);
		renderWithProviders(<NavBreadcrumb />);

		expect(screen.getByText("Facturas")).toBeInTheDocument();
		expect(screen.getByText("Crear operación")).toBeInTheDocument();
	});

	it("renders new client route", () => {
		mockPathname.mockReturnValue("/test-org/clients/new");
		renderWithProviders(<NavBreadcrumb />);

		expect(screen.getByText("Clientes")).toBeInTheDocument();
		expect(screen.getByText("Nuevo")).toBeInTheDocument();
	});

	it("renders edit route", () => {
		mockPathname.mockReturnValue("/test-org/operations/abc123/edit");
		renderWithProviders(<NavBreadcrumb />);

		expect(screen.getByText("Operaciones")).toBeInTheDocument();
		expect(screen.getByText("Editar")).toBeInTheDocument();
	});

	it("truncates long IDs", async () => {
		mockPathname.mockReturnValue(
			"/test-org/clients/12345678-1234-1234-1234-123456789012",
		);
		// Reset mock to reject so we test the fallback truncation
		mockGetClientById.mockRejectedValue(new Error("Not found"));
		renderWithProviders(<NavBreadcrumb />);

		// UUID should be truncated - wait for component to stabilize
		await waitFor(() => {
			expect(screen.getByText("12345678…")).toBeInTheDocument();
		});
	});

	it("renders home page when at org root", () => {
		mockPathname.mockReturnValue("/test-org");
		renderWithProviders(<NavBreadcrumb />);

		// Should show just home
		expect(screen.getByText("Inicio")).toBeInTheDocument();
	});

	it("has horizontal scroll container for mobile", () => {
		renderWithProviders(<NavBreadcrumb />);

		// Check for overflow-x-auto class on the breadcrumb list
		const list = document.querySelector('[data-slot="breadcrumb-list"]');
		expect(list).toHaveClass("overflow-x-auto");
	});

	it("renders separators between breadcrumb items", () => {
		mockPathname.mockReturnValue("/test-org/clients/new");
		renderWithProviders(<NavBreadcrumb />);

		// Should have separators
		const separators = document.querySelectorAll(
			'[data-slot="breadcrumb-separator"]',
		);
		expect(separators.length).toBeGreaterThan(0);
	});

	describe("client name fetching", () => {
		it("fetches and displays client name for client detail pages", async () => {
			mockPathname.mockReturnValue("/test-org/clients/CLT123456789");
			renderWithProviders(<NavBreadcrumb />);

			// After fetch completes, should show client name
			await waitFor(() => {
				expect(screen.getByText("JUAN PÉREZ GARCÍA")).toBeInTheDocument();
			});

			// Should have called getClientById with the correct ID
			expect(mockGetClientById).toHaveBeenCalledWith(
				expect.objectContaining({ id: "CLT123456789" }),
			);
		});

		it("displays business name for moral person clients", async () => {
			mockGetClientById.mockResolvedValue({
				id: "CLT987654321",
				personType: "moral",
				businessName: "ACME Corporation S.A. de C.V.",
				rfc: "ACM800101AAA",
				email: "contact@acme.com",
				phone: "5551234567",
				country: "MX",
				stateCode: "CMX",
				city: "CDMX",
				municipality: "Cuauhtémoc",
				neighborhood: "Centro",
				street: "Reforma",
				externalNumber: "456",
				postalCode: "06600",
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
			});

			mockPathname.mockReturnValue("/test-org/clients/CLT987654321");
			renderWithProviders(<NavBreadcrumb />);

			// formatProperNoun converts to uppercase
			await waitFor(() => {
				expect(
					screen.getByText("ACME CORPORATION S.A. DE C.V."),
				).toBeInTheDocument();
			});
		});

		it("keeps showing truncated ID when client fetch fails", async () => {
			mockGetClientById.mockRejectedValue(new Error("Client not found"));

			mockPathname.mockReturnValue("/test-org/clients/CLT123456789");
			renderWithProviders(<NavBreadcrumb />);

			// Wait for fetch to fail
			await waitFor(() => {
				expect(mockGetClientById).toHaveBeenCalled();
			});

			// Should show truncated ID after failed fetch
			await waitFor(() => {
				expect(screen.getByText("CLT12345…")).toBeInTheDocument();
			});
		});

		it("displays client name in edit page breadcrumb", async () => {
			mockPathname.mockReturnValue("/test-org/clients/CLT123456789/edit");
			renderWithProviders(<NavBreadcrumb />);

			// After fetch, should show client name and Edit label
			await waitFor(() => {
				expect(screen.getByText("JUAN PÉREZ GARCÍA")).toBeInTheDocument();
			});
			expect(screen.getByText("Editar")).toBeInTheDocument();
		});

		it("does not fetch client for non-client ID segments", () => {
			mockPathname.mockReturnValue("/test-org/operations/TXN123456789");
			renderWithProviders(<NavBreadcrumb />);

			// Should not call getClientById for operation IDs
			expect(mockGetClientById).not.toHaveBeenCalled();
		});

		it("fetches and displays notice name on notice detail", async () => {
			mockPathname.mockReturnValue("/test-org/notices/NOTICE1");
			renderWithProviders(<NavBreadcrumb />);

			await waitFor(() => {
				expect(screen.getByText("Aviso enero")).toBeInTheDocument();
			});
			expect(mockGetNoticeById).toHaveBeenCalledWith(
				expect.objectContaining({ id: "NOTICE1" }),
			);
		});

		it("fetches and displays alert rule name on alert detail", async () => {
			mockPathname.mockReturnValue("/test-org/alerts/ALERT123");
			renderWithProviders(<NavBreadcrumb />);

			await waitFor(() => {
				expect(screen.getByText("Regla de prueba")).toBeInTheDocument();
			});
			expect(mockGetAlertById).toHaveBeenCalledWith(
				expect.objectContaining({ id: "ALERT123" }),
			);
		});

		it("fetches and displays invoice series-folio on invoice detail", async () => {
			mockPathname.mockReturnValue(
				"/test-org/invoices/11111111-1111-1111-1111-111111111111",
			);
			renderWithProviders(<NavBreadcrumb />);

			await waitFor(() => {
				expect(screen.getByText("A-100")).toBeInTheDocument();
			});
			expect(mockGetInvoiceById).toHaveBeenCalledWith(
				expect.objectContaining({
					id: "11111111-1111-1111-1111-111111111111",
				}),
			);
		});
	});

	describe("page status handling", () => {
		// Note: These tests verify that the breadcrumb responds to page status changes.
		// Since the page status is managed via context, and renderWithProviders
		// includes PageStatusProvider, we need a component wrapper to set the status.

		// Helper component that sets page status and renders NavBreadcrumb
		const StatusSetterWithBreadcrumb = ({ status }: { status: PageStatus }) => {
			useSetPageStatus(status);
			return <NavBreadcrumb />;
		};

		it("displays 'Not Found' when page status is not-found", async () => {
			mockPathname.mockReturnValue("/test-org/invalid-page");

			renderWithProviders(<StatusSetterWithBreadcrumb status="not-found" />);

			await waitFor(() => {
				expect(screen.getByText("No encontrado")).toBeInTheDocument();
			});
		});

		it("displays 'Error' when page status is error", async () => {
			mockPathname.mockReturnValue("/test-org/some-page");

			renderWithProviders(<StatusSetterWithBreadcrumb status="error" />);

			await waitFor(() => {
				expect(screen.getByText("Error")).toBeInTheDocument();
			});
		});

		it("displays 'Forbidden' when page status is forbidden", async () => {
			mockPathname.mockReturnValue("/test-org/restricted");

			renderWithProviders(<StatusSetterWithBreadcrumb status="forbidden" />);

			await waitFor(() => {
				expect(screen.getByText("Prohibido")).toBeInTheDocument();
			});
		});

		it("displays 'Unauthorized' when page status is unauthorized", async () => {
			mockPathname.mockReturnValue("/test-org/private");

			renderWithProviders(<StatusSetterWithBreadcrumb status="unauthorized" />);

			await waitFor(() => {
				expect(screen.getByText("No autorizado")).toBeInTheDocument();
			});
		});

		it("keeps parent segments as links when showing error status", async () => {
			mockPathname.mockReturnValue("/test-org/clients/invalid-id");

			renderWithProviders(<StatusSetterWithBreadcrumb status="not-found" />);

			await waitFor(() => {
				// "Clientes" should be a link, not just text
				const clientsLink = screen.getByRole("link", { name: /clientes/i });
				expect(clientsLink).toBeInTheDocument();
				expect(clientsLink).toHaveAttribute("href", "/test-org/clients");
			});
		});
	});
});
