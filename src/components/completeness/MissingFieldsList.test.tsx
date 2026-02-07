import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MissingFieldsList } from "./MissingFieldsList";
import type { CompletenessResult } from "@/types/completeness";

function makeResult(
	overrides?: Partial<CompletenessResult>,
): CompletenessResult {
	return {
		satReady: false,
		alertReady: false,
		fullyEnriched: false,
		missing: [
			{
				field: {
					fieldPath: "client.firstName",
					tier: "sat_required",
					label: "Nombre",
				},
				value: undefined,
			},
			{
				field: {
					fieldPath: "client.rfc",
					tier: "alert_required",
					label: "RFC",
				},
				value: undefined,
			},
			{
				field: {
					fieldPath: "client.occupation",
					tier: "kyc_optional",
					label: "Ocupación",
				},
				value: undefined,
			},
		],
		summary: {
			red: { total: 5, filled: 4, missing: 1 },
			yellow: { total: 3, filled: 2, missing: 1 },
			grey: { total: 4, filled: 3, missing: 1 },
			total: 12,
			filled: 9,
		},
		...overrides,
	};
}

describe("MissingFieldsList", () => {
	it("returns null when no missing fields", () => {
		const result = makeResult({
			missing: [],
		});
		const { container } = render(<MissingFieldsList result={result} />);
		expect(container.firstChild).toBeNull();
	});

	it("shows collapsed state with count", () => {
		render(<MissingFieldsList result={makeResult()} />);
		expect(screen.getByText("Campos faltantes (3)")).toBeInTheDocument();
	});

	it("expands to show fields when clicked", async () => {
		const user = userEvent.setup();
		render(<MissingFieldsList result={makeResult()} />);

		await user.click(screen.getByText("Campos faltantes (3)"));

		expect(screen.getByText("Nombre")).toBeInTheDocument();
		expect(screen.getByText("RFC")).toBeInTheDocument();
		expect(screen.getByText("Ocupación")).toBeInTheDocument();
	});

	it("starts expanded when defaultOpen is true", () => {
		render(<MissingFieldsList result={makeResult()} defaultOpen />);
		expect(screen.getByText("Nombre")).toBeInTheDocument();
	});

	it("groups fields by tier", async () => {
		const user = userEvent.setup();
		render(<MissingFieldsList result={makeResult()} />);

		await user.click(screen.getByText("Campos faltantes (3)"));

		expect(
			screen.getByText("Requerido para aviso SAT (1)"),
		).toBeInTheDocument();
		expect(screen.getByText("Necesario para alertas (1)")).toBeInTheDocument();
		expect(screen.getByText("KYC complementario (1)")).toBeInTheDocument();
	});

	it("shows 'Llenar' button when onFieldClick is provided", async () => {
		const user = userEvent.setup();
		const onFieldClick = vi.fn();
		render(
			<MissingFieldsList
				result={makeResult()}
				onFieldClick={onFieldClick}
				defaultOpen
			/>,
		);

		const buttons = screen.getAllByText("Llenar");
		expect(buttons.length).toBe(3);

		await user.click(buttons[0]);
		expect(onFieldClick).toHaveBeenCalledWith("client.firstName");
	});

	it("does not show 'Llenar' button when onFieldClick is not provided", () => {
		render(<MissingFieldsList result={makeResult()} defaultOpen />);
		expect(screen.queryByText("Llenar")).not.toBeInTheDocument();
	});

	it("collapses when clicked again", async () => {
		const user = userEvent.setup();
		render(<MissingFieldsList result={makeResult()} defaultOpen />);

		expect(screen.getByText("Nombre")).toBeInTheDocument();

		await user.click(screen.getByText("Campos faltantes (3)"));

		expect(screen.queryByText("Nombre")).not.toBeInTheDocument();
	});
});
