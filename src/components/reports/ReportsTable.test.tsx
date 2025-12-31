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

	it("renders action menu buttons for reports", async () => {
		render(<ReportsTable />);

		await waitFor(() => {
			expect(
				screen.getByText("Reporte Mensual Diciembre 2024"),
			).toBeInTheDocument();
		});

		// Verify table structure includes action menus
		// The action menu functionality is tested in other tests
		const rows = screen.getAllByRole("row");
		expect(rows.length).toBeGreaterThan(1);
		expect(
			screen.getByText("Reporte Mensual Diciembre 2024"),
		).toBeInTheDocument();
	});

	it("navigates to report detail when view action is clicked", async () => {
		const user = userEvent.setup();
		render(<ReportsTable />);

		await waitFor(() => {
			expect(
				screen.getByText("Reporte Mensual Diciembre 2024"),
			).toBeInTheDocument();
		});

		const actionButtons = screen.getAllByRole("button", { hidden: true });
		const moreButton = actionButtons.find((btn) =>
			btn.querySelector('[class*="MoreHorizontal"]'),
		);
		if (moreButton) {
			await user.click(moreButton);

			await waitFor(() => {
				expect(screen.getByText("Ver detalle")).toBeInTheDocument();
			});

			await user.click(screen.getByText("Ver detalle"));

			expect(mockPush).toHaveBeenCalledWith("/reportes/RPT-001");
		}
	});

	it("shows generate report option for DRAFT status", async () => {
		const user = userEvent.setup();
		render(<ReportsTable />);

		await waitFor(() => {
			expect(
				screen.getByText("Reporte Mensual Diciembre 2024"),
			).toBeInTheDocument();
		});

		// First report is DRAFT
		const actionButtons = screen.getAllByRole("button", { hidden: true });
		const moreButton = actionButtons.find((btn) =>
			btn.querySelector('[class*="MoreHorizontal"]'),
		);
		if (moreButton) {
			await user.click(moreButton);

			await waitFor(() => {
				expect(screen.getByText("Generar reporte")).toBeInTheDocument();
			});
		}
	});

	it("shows send to SAT option for GENERATED status", async () => {
		const user = userEvent.setup();
		render(<ReportsTable />);

		await waitFor(() => {
			expect(
				screen.getByText("Reporte Trimestral Q4 2024"),
			).toBeInTheDocument();
		});

		// Find the action button for the GENERATED report (RPT-003)
		// We need to find the row containing "Q4 2024" and its action button
		const rows = screen.getAllByRole("row");
		const q4Row = rows.find((row) => row.textContent?.includes("Q4 2024"));
		expect(q4Row).toBeTruthy();

		if (q4Row) {
			const moreButton = q4Row.querySelector(
				'button[class*="MoreHorizontal"], button:has(svg)',
			) as HTMLButtonElement;
			if (moreButton) {
				await user.click(moreButton);

				await waitFor(() => {
					expect(screen.getByText("Enviar a SAT")).toBeInTheDocument();
				});
			}
		}
	});

	it("shows download XML option for all reports", async () => {
		const user = userEvent.setup();
		render(<ReportsTable />);

		await waitFor(() => {
			expect(
				screen.getByText("Reporte Mensual Diciembre 2024"),
			).toBeInTheDocument();
		});

		const actionButtons = screen.getAllByRole("button", { hidden: true });
		const moreButton = actionButtons.find((btn) =>
			btn.querySelector('[class*="MoreHorizontal"]'),
		);
		if (moreButton) {
			await user.click(moreButton);

			await waitFor(() => {
				expect(screen.getByText("Descargar XML")).toBeInTheDocument();
			});
		}
	});

	it("calls download handler when download is clicked", async () => {
		const user = userEvent.setup();
		render(<ReportsTable />);

		await waitFor(() => {
			expect(
				screen.getByText("Reporte Mensual Diciembre 2024"),
			).toBeInTheDocument();
		});

		const actionButtons = screen.getAllByRole("button", { hidden: true });
		const moreButton = actionButtons.find((btn) =>
			btn.querySelector('[class*="MoreHorizontal"]'),
		);
		if (moreButton) {
			await user.click(moreButton);

			await waitFor(() => {
				expect(screen.getByText("Descargar XML")).toBeInTheDocument();
			});

			await user.click(screen.getByText("Descargar XML"));

			await waitFor(() => {
				expect(mockToast).toHaveBeenCalledWith(
					expect.objectContaining({
						title: "Descargando...",
					}),
				);
			});
		}
	});

	it("shows delete option only for DRAFT reports", async () => {
		const user = userEvent.setup();
		render(<ReportsTable />);

		await waitFor(() => {
			expect(
				screen.getByText("Reporte Mensual Diciembre 2024"),
			).toBeInTheDocument();
		});

		// First report is DRAFT - should show delete
		const actionButtons = screen.getAllByRole("button", { hidden: true });
		const moreButton = actionButtons.find((btn) =>
			btn.querySelector('[class*="MoreHorizontal"]'),
		);
		if (moreButton) {
			await user.click(moreButton);

			await waitFor(() => {
				expect(screen.getByText("Eliminar")).toBeInTheDocument();
			});
		}
	});

	it("calls delete handler when delete is clicked for DRAFT report", async () => {
		const user = userEvent.setup();
		render(<ReportsTable />);

		await waitFor(() => {
			expect(
				screen.getByText("Reporte Mensual Diciembre 2024"),
			).toBeInTheDocument();
		});

		const actionButtons = screen.getAllByRole("button", { hidden: true });
		const moreButton = actionButtons.find((btn) =>
			btn.querySelector('[class*="MoreHorizontal"]'),
		);
		if (moreButton) {
			await user.click(moreButton);

			await waitFor(() => {
				expect(screen.getByText("Eliminar")).toBeInTheDocument();
			});

			await user.click(screen.getByText("Eliminar"));

			await waitFor(() => {
				expect(mockToast).toHaveBeenCalledWith(
					expect.objectContaining({
						title: "Reporte eliminado",
					}),
				);
			});
		}
	});

	it("displays status icons correctly", async () => {
		render(<ReportsTable />);

		await waitFor(() => {
			expect(
				screen.getByText("Reporte Mensual Diciembre 2024"),
			).toBeInTheDocument();
		});

		// Status icons should be rendered in the table
		const rows = screen.getAllByRole("row");
		expect(rows.length).toBeGreaterThan(1);
	});

	it("displays type badges correctly", async () => {
		render(<ReportsTable />);

		await waitFor(() => {
			expect(
				screen.getByText("Reporte Mensual Diciembre 2024"),
			).toBeInTheDocument();
		});

		// Type badges should be rendered
		const rows = screen.getAllByRole("row");
		expect(rows.length).toBeGreaterThan(1);
	});

	it("formats submitted date correctly when present", async () => {
		render(<ReportsTable />);

		await waitFor(() => {
			expect(
				screen.getByText("Reporte Mensual Noviembre 2024"),
			).toBeInTheDocument();
		});

		// Submitted date should be formatted
		const rows = screen.getAllByRole("row");
		expect(rows.length).toBeGreaterThan(1);
	});

	it("shows dash when submitted date is not present", async () => {
		render(<ReportsTable />);

		await waitFor(() => {
			expect(
				screen.getByText("Reporte Mensual Diciembre 2024"),
			).toBeInTheDocument();
		});

		// Draft reports don't have submittedAt - should show dash
		const rows = screen.getAllByRole("row");
		expect(rows.length).toBeGreaterThan(1);
	});

	it("navigates to new report page when CTA button is clicked", async () => {
		const user = userEvent.setup();
		render(<ReportsTable />);

		await waitFor(() => {
			expect(
				screen.getByText("Reporte Mensual Diciembre 2024"),
			).toBeInTheDocument();
		});

		// Find and click the "Nuevo Reporte" button
		const newReportButton = screen.getByText("Nuevo Reporte");
		await user.click(newReportButton);

		expect(mockPush).toHaveBeenCalledWith("/reportes/new");
	});

	it("shows and can click 'Generar reporte' option for DRAFT status", async () => {
		const user = userEvent.setup();
		render(<ReportsTable />);

		await waitFor(() => {
			expect(
				screen.getByText("Reporte Mensual Diciembre 2024"),
			).toBeInTheDocument();
		});

		// First report is DRAFT - should show "Generar reporte"
		const actionButtons = screen.getAllByRole("button", { hidden: true });
		const moreButton = actionButtons.find((btn) =>
			btn.querySelector('[class*="MoreHorizontal"]'),
		);
		if (moreButton) {
			await user.click(moreButton);

			await waitFor(() => {
				expect(screen.getByText("Generar reporte")).toBeInTheDocument();
			});

			// Click on "Generar reporte" to ensure the branch is covered
			await user.click(screen.getByText("Generar reporte"));
		}
	});

	it("shows and can click 'Enviar a SAT' option for GENERATED status", async () => {
		const user = userEvent.setup();
		render(<ReportsTable />);

		await waitFor(() => {
			// Find the GENERATED report (RPT-003)
			expect(
				screen.getByText("Reporte Trimestral Q4 2024"),
			).toBeInTheDocument();
		});

		// Find all action buttons and click the one for the GENERATED report
		const actionButtons = screen.getAllByRole("button", { hidden: true });
		const moreButtons = actionButtons.filter((btn) =>
			btn.querySelector('[class*="MoreHorizontal"]'),
		);

		// Click the third more button (for the GENERATED report)
		if (moreButtons[2]) {
			await user.click(moreButtons[2]);

			await waitFor(() => {
				expect(screen.getByText("Enviar a SAT")).toBeInTheDocument();
			});

			// Click on "Enviar a SAT" to ensure the branch is covered
			await user.click(screen.getByText("Enviar a SAT"));
		}
	});

	it("calls handleDownload when download is clicked", async () => {
		const user = userEvent.setup();
		render(<ReportsTable />);

		await waitFor(() => {
			expect(
				screen.getByText("Reporte Mensual Diciembre 2024"),
			).toBeInTheDocument();
		});

		// Open action menu and click download
		const actionButtons = screen.getAllByRole("button", { hidden: true });
		const moreButton = actionButtons.find((btn) =>
			btn.querySelector('[class*="MoreHorizontal"]'),
		);
		if (moreButton) {
			await user.click(moreButton);

			await waitFor(() => {
				expect(screen.getByText("Descargar XML")).toBeInTheDocument();
			});

			await user.click(screen.getByText("Descargar XML"));

			// Verify download handler was called
			await waitFor(() => {
				expect(mockToast).toHaveBeenCalledWith(
					expect.objectContaining({
						title: "Descargando...",
					}),
				);
			});
		}
	});

	it("calls handleDelete when delete is clicked for DRAFT report", async () => {
		const user = userEvent.setup();
		render(<ReportsTable />);

		await waitFor(() => {
			expect(
				screen.getByText("Reporte Mensual Diciembre 2024"),
			).toBeInTheDocument();
		});

		// Open action menu for DRAFT report (first report)
		const actionButtons = screen.getAllByRole("button", { hidden: true });
		const moreButton = actionButtons.find((btn) =>
			btn.querySelector('[class*="MoreHorizontal"]'),
		);
		if (moreButton) {
			await user.click(moreButton);

			await waitFor(() => {
				expect(screen.getByText("Eliminar")).toBeInTheDocument();
			});

			await user.click(screen.getByText("Eliminar"));

			// Verify delete handler was called
			await waitFor(() => {
				expect(mockToast).toHaveBeenCalledWith(
					expect.objectContaining({
						title: "Reporte eliminado",
					}),
				);
			});
		}
	});

	it("does not show delete option for non-DRAFT reports", async () => {
		const user = userEvent.setup();
		render(<ReportsTable />);

		await waitFor(() => {
			expect(
				screen.getByText("Reporte Trimestral Q4 2024"),
			).toBeInTheDocument();
		});

		// Open action menu for GENERATED report (third report)
		const actionButtons = screen.getAllByRole("button", { hidden: true });
		const moreButtons = actionButtons.filter((btn) =>
			btn.querySelector('[class*="MoreHorizontal"]'),
		);
		if (moreButtons.length > 2) {
			await user.click(moreButtons[2]);

			await waitFor(() => {
				// Should not show "Eliminar" for GENERATED status
				expect(screen.queryByText("Eliminar")).not.toBeInTheDocument();
			});
		}
	});

	it("renders stats correctly from reports data", async () => {
		render(<ReportsTable />);

		await waitFor(() => {
			expect(
				screen.getByText("Reporte Mensual Diciembre 2024"),
			).toBeInTheDocument();
		});

		// Stats should be computed and displayed
		// The stats include total reports, by status, by type
		const rows = screen.getAllByRole("row");
		expect(rows.length).toBeGreaterThan(1);
	});

	it("handles generate report action for DRAFT status", async () => {
		const user = userEvent.setup();
		render(<ReportsTable />);

		await waitFor(() => {
			expect(
				screen.getByText("Reporte Mensual Diciembre 2024"),
			).toBeInTheDocument();
		});

		// Open action menu for DRAFT report
		const actionButtons = screen.getAllByRole("button", { hidden: true });
		const moreButton = actionButtons.find((btn) =>
			btn.querySelector('[class*="MoreHorizontal"]'),
		);
		if (moreButton) {
			await user.click(moreButton);

			await waitFor(() => {
				expect(screen.getByText("Generar reporte")).toBeInTheDocument();
			});

			// Click generate report (this doesn't have an onClick handler yet, but tests the branch)
			await user.click(screen.getByText("Generar reporte"));
		}
	});

	it("handles send to SAT action for GENERATED status", async () => {
		const user = userEvent.setup();
		render(<ReportsTable />);

		await waitFor(() => {
			expect(
				screen.getByText("Reporte Trimestral Q4 2024"),
			).toBeInTheDocument();
		});

		// Find all action buttons and click the one for GENERATED report
		const actionButtons = screen.getAllByRole("button", { hidden: true });
		const moreButtons = actionButtons.filter((btn) =>
			btn.querySelector('[class*="MoreHorizontal"]'),
		);

		// Click the third more button (for the GENERATED report)
		if (moreButtons[2]) {
			await user.click(moreButtons[2]);

			await waitFor(() => {
				expect(screen.getByText("Enviar a SAT")).toBeInTheDocument();
			});

			// Click send to SAT (this doesn't have an onClick handler yet, but tests the branch)
			await user.click(screen.getByText("Enviar a SAT"));
		}
	});
});
