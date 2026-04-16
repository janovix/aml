import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { OperationsPageContent } from "./OperationsPageContent";
import { renderWithProviders, t } from "@/lib/testHelpers";

vi.mock("@/lib/api/operations", () => ({
	listOperations: vi.fn().mockResolvedValue({
		data: [],
		pagination: { page: 1, totalPages: 1, total: 66, limit: 1 },
	}),
}));

vi.mock("@/lib/api/stats", () => ({
	getOperationStats: vi.fn().mockResolvedValue({
		operationsToday: 5,
		suspiciousOperations: 2,
		totalVolume: "1000000.00",
		totalOperations: 66,
		completeCount: 50,
		incompleteCount: 16,
	}),
}));

vi.mock("@/lib/org-store", () => ({
	useOrgStore: () => ({
		currentOrg: { id: "org-123", slug: "test-org", name: "Test Org" },
		organizations: [],
		setCurrentOrg: vi.fn(),
	}),
}));

vi.mock("@/hooks/useJwt", () => ({
	useJwt: () => ({
		jwt: "mock-jwt-token",
		isLoading: false,
		error: null,
		refetch: vi.fn(),
	}),
}));

const mockNavigateTo = vi.fn();
vi.mock("@/hooks/useOrgNavigation", () => ({
	useOrgNavigation: () => ({ navigateTo: mockNavigateTo }),
}));

vi.mock("@/components/operations/OperationsTable", () => ({
	OperationsTable: () => (
		<div data-testid="operations-table">OperationsTable</div>
	),
}));

vi.mock("@/components/import/CreateImportDialog", () => ({
	CreateImportDialog: ({
		open,
		onOpenChange,
		onSuccess,
	}: {
		open: boolean;
		onOpenChange: (open: boolean) => void;
		onSuccess?: () => void;
	}) => (
		<div data-testid="create-import-dialog">
			<span>{open ? "open" : "closed"}</span>
			<button type="button" onClick={() => onOpenChange(false)}>
				Close
			</button>
			{onSuccess && (
				<button type="button" onClick={() => onSuccess()}>
					Simulate import success
				</button>
			)}
		</div>
	),
}));

vi.mock("@/lib/toast-utils", () => ({
	showFetchError: vi.fn(),
}));

describe("OperationsPageContent", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders page title and subtitle", () => {
		renderWithProviders(<OperationsPageContent />);

		expect(screen.getByText("Operaciones")).toBeInTheDocument();
		expect(
			screen.getByText("Gestiona las operaciones de tu actividad vulnerable"),
		).toBeInTheDocument();
	});

	it("shows total operaciones from list API", async () => {
		renderWithProviders(<OperationsPageContent />);

		await waitFor(() => {
			expect(screen.getByText("66")).toBeInTheDocument();
		});
	});

	it("shows Operaciones completas and Requieren atención from stats API", async () => {
		const { getOperationStats } = await import("@/lib/api/stats");
		renderWithProviders(<OperationsPageContent />);

		await waitFor(() => {
			expect(getOperationStats).toHaveBeenCalled();
		});

		await waitFor(() => {
			expect(screen.getByText("50")).toBeInTheDocument();
			expect(screen.getByText("16")).toBeInTheDocument();
		});
	});

	it("renders Nueva operación and import actions", () => {
		renderWithProviders(<OperationsPageContent />);

		const newOpsButtons = screen.getAllByRole("button", {
			name: new RegExp(t("opNewOperation"), "i"),
		});
		const importButtons = screen.getAllByRole("button", {
			name: new RegExp(t("importTransactions"), "i"),
		});
		expect(newOpsButtons.length).toBeGreaterThan(0);
		expect(importButtons.length).toBeGreaterThan(0);
	});
});
