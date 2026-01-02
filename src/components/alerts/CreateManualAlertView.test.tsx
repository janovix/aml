import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateManualAlertView } from "./CreateManualAlertView";
import * as alertsApi from "@/lib/api/alerts";
import type { AlertRule, AlertRulesListResponse } from "@/lib/api/alerts";

// Mock Next.js navigation
const mockNavigateTo = vi.fn();
const mockOrgPath = vi.fn((path: string) => `/org-1${path}`);
vi.mock("@/hooks/useOrgNavigation", () => ({
	useOrgNavigation: () => ({
		navigateTo: mockNavigateTo,
		orgPath: mockOrgPath,
	}),
}));

// Mock useSearchParams
vi.mock("next/navigation", () => ({
	useSearchParams: () => new URLSearchParams(),
}));

// Mock useJwt hook
vi.mock("@/hooks/useJwt", () => ({
	useJwt: () => ({ jwt: "mock-jwt", isLoading: false }),
}));

// Mock use-mobile hook
vi.mock("@/hooks/use-mobile", () => ({
	useIsMobile: () => false,
}));

// Mock the alerts API
vi.mock("@/lib/api/alerts", async (importOriginal) => {
	const original = await importOriginal<typeof alertsApi>();
	return {
		...original,
		listAlertRules: vi.fn(),
		createManualAlert: vi.fn(),
	};
});

// Mock the clients API
vi.mock("@/lib/api/clients", () => ({
	listClients: vi.fn().mockResolvedValue({
		data: [],
		pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
	}),
	getClientById: vi.fn(),
}));

const mockAlertRules: AlertRule[] = [
	{
		id: "2501",
		name: "El cliente se rehúsa a proporcionar documentos",
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
];

describe("CreateManualAlertView", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(alertsApi.listAlertRules).mockResolvedValue({
			data: mockAlertRules,
			pagination: {
				page: 1,
				limit: 50,
				total: mockAlertRules.length,
				totalPages: 1,
			},
		} as AlertRulesListResponse);
	});

	it("renders the page title and form", () => {
		render(<CreateManualAlertView />);
		expect(screen.getByText("Nueva Alerta Manual")).toBeInTheDocument();
		expect(screen.getByText("Información de la Alerta")).toBeInTheDocument();
	});

	it("renders the alert rule selector", () => {
		render(<CreateManualAlertView />);
		expect(screen.getByText("Regla de Alerta")).toBeInTheDocument();
	});

	it("renders the severity selector", () => {
		render(<CreateManualAlertView />);
		expect(screen.getByText("Severidad")).toBeInTheDocument();
	});

	it("renders notes textarea", () => {
		render(<CreateManualAlertView />);
		expect(screen.getByText("Notas")).toBeInTheDocument();
		expect(
			screen.getByPlaceholderText(/Describe el motivo/),
		).toBeInTheDocument();
	});

	it("renders cancel and submit buttons", () => {
		render(<CreateManualAlertView />);
		expect(
			screen.getByRole("button", { name: /Cancelar/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /Crear Alerta/i }),
		).toBeInTheDocument();
	});

	it("submit button is disabled initially", () => {
		render(<CreateManualAlertView />);
		const submitButton = screen.getByRole("button", { name: /Crear Alerta/i });
		expect(submitButton).toBeDisabled();
	});

	it("navigates back when cancel is clicked", async () => {
		const user = userEvent.setup();
		render(<CreateManualAlertView />);

		const cancelButton = screen.getByRole("button", { name: /Cancelar/i });
		await user.click(cancelButton);

		expect(mockNavigateTo).toHaveBeenCalledWith("/alerts");
	});

	it("updates notes field on input", async () => {
		const user = userEvent.setup();
		render(<CreateManualAlertView />);

		const notesInput = screen.getByPlaceholderText(/Describe el motivo/);
		await user.type(notesInput, "Test notes");

		expect(notesInput).toHaveValue("Test notes");
	});

	it("shows character count for notes", async () => {
		const user = userEvent.setup();
		render(<CreateManualAlertView />);

		const notesInput = screen.getByPlaceholderText(/Describe el motivo/);
		await user.type(notesInput, "Test notes");

		expect(screen.getByText("10/1000 caracteres")).toBeInTheDocument();
	});

	it("shows severity options when selector is opened", async () => {
		const user = userEvent.setup();
		render(<CreateManualAlertView />);

		// Find the severity trigger by its data-slot attribute (select-trigger)
		const severityTrigger = document.querySelector(
			'[data-slot="select-trigger"]',
		);
		expect(severityTrigger).not.toBeNull();
		await user.click(severityTrigger as HTMLElement);

		await waitFor(() => {
			expect(screen.getByText("Baja")).toBeInTheDocument();
			expect(screen.getByText("Media")).toBeInTheDocument();
			expect(screen.getByText("Alta")).toBeInTheDocument();
			expect(screen.getByText("Crítica")).toBeInTheDocument();
		});
	});

	it("renders helper text for fields", () => {
		render(<CreateManualAlertView />);
		expect(
			screen.getByText(
				"Selecciona el tipo de alerta a generar según el catálogo LFPIORPI",
			),
		).toBeInTheDocument();
	});
});
