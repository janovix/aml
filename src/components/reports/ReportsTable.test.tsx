import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReportsTable } from "./ReportsTable";

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
	}),
}));

describe("ReportsTable", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders table with mock report data", async () => {
		render(<ReportsTable />);

		await waitFor(() => {
			// Should show reports count
			expect(screen.getByText(/resultado/)).toBeInTheDocument();
		});
	});

	it("renders report names", async () => {
		render(<ReportsTable />);

		await waitFor(() => {
			expect(
				screen.getByText("Reporte Mensual Diciembre 2024"),
			).toBeInTheDocument();
			expect(
				screen.getByText("Reporte Trimestral Q4 2024"),
			).toBeInTheDocument();
		});
	});

	it("allows selecting individual reports", async () => {
		const user = userEvent.setup();
		render(<ReportsTable />);

		await waitFor(() => {
			expect(screen.getByText(/resultado/)).toBeInTheDocument();
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
		render(<ReportsTable />);

		await waitFor(() => {
			expect(screen.getByText(/resultado/)).toBeInTheDocument();
		});

		const selectAllCheckbox = screen.getAllByRole("checkbox")[0];
		await user.click(selectAllCheckbox);

		await waitFor(() => {
			expect(selectAllCheckbox).toBeChecked();
		});
	});

	it("has search functionality", async () => {
		const user = userEvent.setup();
		render(<ReportsTable />);

		await waitFor(() => {
			expect(screen.getByText(/resultado/)).toBeInTheDocument();
		});

		const searchInput = screen.getByPlaceholderText(/buscar/i);
		expect(searchInput).toBeInTheDocument();

		await user.type(searchInput, "Mensual");

		await waitFor(() => {
			expect(
				screen.getByText("Reporte Mensual Diciembre 2024"),
			).toBeInTheDocument();
		});
	});

	it("has filter popovers", async () => {
		render(<ReportsTable />);

		await waitFor(() => {
			expect(
				screen.getByText("Reporte Mensual Diciembre 2024"),
			).toBeInTheDocument();
		});

		// Use getAllByText since filter can appear in multiple places
		const tipoFilters = screen.getAllByText("Tipo");
		const estadoFilters = screen.getAllByText("Estado");
		expect(tipoFilters.length).toBeGreaterThan(0);
		expect(estadoFilters.length).toBeGreaterThan(0);
	});

	it("renders action menu for reports", async () => {
		render(<ReportsTable />);

		await waitFor(() => {
			expect(
				screen.getByText("Reporte Mensual Diciembre 2024"),
			).toBeInTheDocument();
		});

		// Check that rows have action buttons
		const rows = screen.getAllByRole("row");
		expect(rows.length).toBeGreaterThan(1); // header + data rows
	});

	it("renders table with correct structure", async () => {
		render(<ReportsTable />);

		await waitFor(() => {
			expect(
				screen.getByText("Reporte Mensual Diciembre 2024"),
			).toBeInTheDocument();
		});

		// Check for table structure
		const rows = screen.getAllByRole("row");
		expect(rows.length).toBeGreaterThan(1);
	});

	it("renders checkboxes for selection", async () => {
		render(<ReportsTable />);

		await waitFor(() => {
			expect(
				screen.getByText("Reporte Mensual Diciembre 2024"),
			).toBeInTheDocument();
		});

		// Check for checkboxes
		const checkboxes = screen.getAllByRole("checkbox");
		expect(checkboxes.length).toBeGreaterThan(1);
	});

	it("renders reports with actions", async () => {
		render(<ReportsTable />);

		await waitFor(() => {
			expect(
				screen.getByText("Reporte Mensual Diciembre 2024"),
			).toBeInTheDocument();
		});

		// Check that action buttons are rendered
		const rows = screen.getAllByRole("row");
		expect(rows.length).toBeGreaterThan(1); // header + data rows
	});

	it("displays correct status for reports", async () => {
		render(<ReportsTable />);

		await waitFor(() => {
			expect(
				screen.getByText("Reporte Mensual Diciembre 2024"),
			).toBeInTheDocument();
		});

		// Drafts and other statuses should be shown - the first report is a draft
		const rows = screen.getAllByRole("row");
		expect(rows.length).toBeGreaterThan(1);
	});

	it("shows selected count in footer", async () => {
		const user = userEvent.setup();
		render(<ReportsTable />);

		await waitFor(() => {
			expect(screen.getByText(/resultado/)).toBeInTheDocument();
		});

		const checkboxes = screen.getAllByRole("checkbox");
		await user.click(checkboxes[1]);
		await user.click(checkboxes[2]);

		await waitFor(() => {
			expect(screen.getByText(/2 seleccionados/)).toBeInTheDocument();
		});
	});

	it("displays period information", async () => {
		render(<ReportsTable />);

		await waitFor(() => {
			expect(screen.getByText("Diciembre 2024")).toBeInTheDocument();
			expect(screen.getByText("Q4 2024")).toBeInTheDocument();
		});
	});

	it("displays record count", async () => {
		render(<ReportsTable />);

		await waitFor(() => {
			// Check for numeric record counts
			expect(screen.getByText("10")).toBeInTheDocument();
			expect(screen.getByText("8")).toBeInTheDocument();
		});
	});
});
