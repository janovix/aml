import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AlertRuleSelector } from "./AlertRuleSelector";
import * as alertsApi from "@/lib/api/alerts";
import type { AlertRule, AlertRulesListResponse } from "@/lib/api/alerts";
import { useIsMobile } from "@/hooks/use-mobile";

// Mock useJwt hook
vi.mock("@/hooks/useJwt", () => ({
	useJwt: () => ({ jwt: "mock-jwt", isLoading: false }),
}));

// Mock use-mobile hook
vi.mock("@/hooks/use-mobile");

const mockUseIsMobile = vi.mocked(useIsMobile);

// Mock the alerts API
vi.mock("@/lib/api/alerts", async (importOriginal) => {
	const original = await importOriginal<typeof alertsApi>();
	return {
		...original,
		listAlertRules: vi.fn(),
	};
});

const mockAlertRules: AlertRule[] = [
	{
		id: "2501",
		name: "El cliente o usuario se rehúsa a proporcionar documentos personales que lo identifiquen",
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
	{
		id: "2502",
		name: "La operación es pagada por terceros sin relación aparente",
		description: "Detecta cuando el pagador no coincide con el comprador",
		active: true,
		severity: "MEDIUM",
		ruleType: "payer_buyer_mismatch",
		isManualOnly: false,
		activityCode: "VEH",
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	},
	{
		id: "9999",
		name: "Otra alerta",
		description: "Otra situación que amerita una alerta",
		active: true,
		severity: "LOW",
		ruleType: null,
		isManualOnly: true,
		activityCode: "VEH",
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	},
];

describe("AlertRuleSelector", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUseIsMobile.mockReturnValue(false); // Default to desktop
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

	it("renders with placeholder", () => {
		render(<AlertRuleSelector placeholder="Select a rule" />);
		expect(screen.getByRole("combobox")).toHaveTextContent("Select a rule");
	});

	it("renders with label", () => {
		render(<AlertRuleSelector label="Alert Rule" />);
		expect(screen.getByText("Alert Rule")).toBeInTheDocument();
	});

	it("shows required indicator when required", () => {
		render(<AlertRuleSelector label="Alert Rule" required />);
		expect(screen.getByText("*")).toBeInTheDocument();
	});

	it("opens popover and shows rules on click", async () => {
		const user = userEvent.setup();
		render(<AlertRuleSelector />);

		const trigger = screen.getByRole("combobox");
		await user.click(trigger);

		await waitFor(() => {
			expect(alertsApi.listAlertRules).toHaveBeenCalled();
		});

		// Wait for rules to appear
		await waitFor(() => {
			expect(screen.getByText(/2501/)).toBeInTheDocument();
		});
	});

	it("calls onChange when a rule is selected", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(<AlertRuleSelector onChange={onChange} />);

		const trigger = screen.getByRole("combobox");
		await user.click(trigger);

		await waitFor(() => {
			expect(screen.getByText(/2501/)).toBeInTheDocument();
		});

		// Click on a rule option
		const option = screen.getByText(/2501/);
		await user.click(option);

		expect(onChange).toHaveBeenCalledWith(mockAlertRules[0]);
	});

	it("calls onValueChange when a rule is selected", async () => {
		const user = userEvent.setup();
		const onValueChange = vi.fn();
		render(<AlertRuleSelector onValueChange={onValueChange} />);

		const trigger = screen.getByRole("combobox");
		await user.click(trigger);

		await waitFor(() => {
			expect(screen.getByText(/2501/)).toBeInTheDocument();
		});

		const option = screen.getByText(/2501/);
		await user.click(option);

		expect(onValueChange).toHaveBeenCalledWith("2501");
	});

	it("shows severity indicator dot for rules", async () => {
		const user = userEvent.setup();
		render(<AlertRuleSelector />);

		const trigger = screen.getByRole("combobox");
		await user.click(trigger);

		await waitFor(() => {
			expect(screen.getByText(/2501/)).toBeInTheDocument();
		});

		// Check that severity dots are rendered
		const dots = document.querySelectorAll(".rounded-full");
		expect(dots.length).toBeGreaterThan(0);
	});

	it("respects disabled prop", () => {
		render(<AlertRuleSelector disabled />);
		const trigger = screen.getByRole("combobox");
		expect(trigger).toBeDisabled();
	});

	it("shows helper text when provided", () => {
		render(
			<AlertRuleSelector helperText="Select an alert rule from the catalog" />,
		);
		expect(
			screen.getByText("Select an alert rule from the catalog"),
		).toBeInTheDocument();
	});

	it("handles API error gracefully", async () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		vi.mocked(alertsApi.listAlertRules).mockRejectedValue(
			new Error("API error"),
		);

		const user = userEvent.setup();
		render(<AlertRuleSelector />);

		const trigger = screen.getByRole("combobox");
		await user.click(trigger);

		await waitFor(() => {
			expect(
				screen.getByText("Error al cargar las reglas de alerta"),
			).toBeInTheDocument();
		});

		consoleSpy.mockRestore();
	});

	it("shows empty state when no rules match", async () => {
		vi.mocked(alertsApi.listAlertRules).mockResolvedValue({
			data: [],
			pagination: {
				page: 1,
				limit: 50,
				total: 0,
				totalPages: 0,
			},
		});

		const user = userEvent.setup();
		render(<AlertRuleSelector emptyState="No rules found" />);

		const trigger = screen.getByRole("combobox");
		await user.click(trigger);

		await waitFor(() => {
			expect(screen.getByText("No rules found")).toBeInTheDocument();
		});
	});

	describe("mobile dialog behavior", () => {
		beforeEach(() => {
			mockUseIsMobile.mockReturnValue(true);
		});

		it("should open fullscreen dialog on mobile when trigger is clicked", async () => {
			const user = userEvent.setup();

			render(<AlertRuleSelector label="Regla de Alerta" />);

			const trigger = screen.getByRole("combobox");
			await user.click(trigger);

			// On mobile, Dialog should render with dialog role
			await waitFor(() => {
				expect(screen.getByRole("dialog")).toBeInTheDocument();
			});

			// Should show the title in the dialog header (h2 element)
			const dialog = screen.getByRole("dialog");
			expect(dialog.querySelector("h2")).toHaveTextContent("Regla de Alerta");
		});

		it("should show search input in mobile dialog", async () => {
			const user = userEvent.setup();

			render(<AlertRuleSelector label="Regla de Alerta" />);

			const trigger = screen.getByRole("combobox");
			await user.click(trigger);

			await waitFor(() => {
				expect(
					screen.getByPlaceholderText("Buscar regla de alerta..."),
				).toBeInTheDocument();
			});
		});

		it("should allow selecting rule in mobile dialog", async () => {
			const user = userEvent.setup();
			const handleChange = vi.fn();

			render(<AlertRuleSelector onChange={handleChange} />);

			const trigger = screen.getByRole("combobox");
			await user.click(trigger);

			await waitFor(() => {
				expect(screen.getByText(/2501/)).toBeInTheDocument();
			});

			const option = screen.getByText(/2501/);
			await user.click(option);

			expect(handleChange).toHaveBeenCalledWith(mockAlertRules[0]);
		});

		it("should close dialog after selection on mobile", async () => {
			const user = userEvent.setup();

			render(<AlertRuleSelector />);

			const trigger = screen.getByRole("combobox");
			await user.click(trigger);

			await waitFor(() => {
				expect(screen.getByText(/2501/)).toBeInTheDocument();
			});

			const option = screen.getByText(/2501/);
			await user.click(option);

			await waitFor(() => {
				expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
			});
		});

		it("should show required indicator in mobile dialog title", async () => {
			const user = userEvent.setup();

			render(<AlertRuleSelector label="Regla de Alerta" required />);

			const trigger = screen.getByRole("combobox");
			await user.click(trigger);

			await waitFor(() => {
				const dialog = screen.getByRole("dialog");
				expect(dialog.querySelector(".text-destructive")).toBeInTheDocument();
			});
		});

		it("should show close button in mobile dialog header", async () => {
			const user = userEvent.setup();

			render(<AlertRuleSelector label="Regla de Alerta" />);

			const trigger = screen.getByRole("combobox");
			await user.click(trigger);

			await waitFor(() => {
				expect(screen.getByRole("dialog")).toBeInTheDocument();
			});

			// Should have a close button with "Cerrar" text
			const closeButton = screen.getByRole("button", { name: /cerrar/i });
			expect(closeButton).toBeInTheDocument();
		});

		it("should close dialog when close button is clicked", async () => {
			const user = userEvent.setup();

			render(<AlertRuleSelector label="Regla de Alerta" />);

			const trigger = screen.getByRole("combobox");
			await user.click(trigger);

			await waitFor(() => {
				expect(screen.getByRole("dialog")).toBeInTheDocument();
			});

			const closeButton = screen.getByRole("button", { name: /cerrar/i });
			await user.click(closeButton);

			await waitFor(() => {
				expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
			});
		});
	});
});
