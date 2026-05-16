import type { ReactElement } from "react";
import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageProvider } from "@/components/LanguageProvider";
import { CompletenessIndicator } from "./CompletenessIndicator";
import type {
	CompletenessResult,
	FieldRequirement,
} from "@/types/completeness";

function makeField(
	overrides: Partial<FieldRequirement> = {},
): FieldRequirement {
	return {
		fieldPath: "client.nombre",
		tier: "sat_required",
		label: "Nombre",
		...overrides,
	};
}

function makeResult(
	overrides?: Partial<CompletenessResult>,
): CompletenessResult {
	return {
		satReady: true,
		alertReady: true,
		fullyEnriched: true,
		missing: [],
		summary: {
			red: { total: 5, filled: 5, missing: 0 },
			yellow: { total: 3, filled: 3, missing: 0 },
			grey: { total: 4, filled: 4, missing: 0 },
			total: 12,
			filled: 12,
		},
		...overrides,
	};
}

function renderWithLang(ui: ReactElement) {
	return render(<LanguageProvider defaultLanguage="es">{ui}</LanguageProvider>);
}

describe("CompletenessIndicator", () => {
	it("renders Listo when all tiers and flags are complete", () => {
		renderWithLang(<CompletenessIndicator result={makeResult()} />);
		expect(
			screen.getByRole("button", { name: /Listo\. Completitud del registro/ }),
		).toBeInTheDocument();
	});

	it("shows Faltan N para SAT when SAT tier incomplete", () => {
		renderWithLang(
			<CompletenessIndicator
				result={makeResult({
					satReady: false,
					alertReady: false,
					fullyEnriched: false,
					summary: {
						red: { total: 5, filled: 3, missing: 2 },
						yellow: { total: 3, filled: 3, missing: 0 },
						grey: { total: 4, filled: 4, missing: 0 },
						total: 12,
						filled: 10,
					},
				})}
			/>,
		);
		expect(
			screen.getByRole("button", { name: /Faltan 2 para SAT/ }),
		).toBeInTheDocument();
	});

	it("shows Parcial when SAT ok but enrichment incomplete", () => {
		renderWithLang(
			<CompletenessIndicator
				result={makeResult({
					satReady: true,
					alertReady: true,
					fullyEnriched: false,
					summary: {
						red: { total: 5, filled: 5, missing: 0 },
						yellow: { total: 3, filled: 3, missing: 0 },
						grey: { total: 4, filled: 2, missing: 2 },
						total: 12,
						filled: 10,
					},
				})}
			/>,
		);
		expect(screen.getByRole("button", { name: /Parcial/ })).toBeInTheDocument();
	});

	it("renders no-data em dash when no fields are tracked in any tier", () => {
		const result = makeResult({
			satReady: false,
			summary: {
				red: { total: 0, filled: 0, missing: 0 },
				yellow: { total: 0, filled: 0, missing: 0 },
				grey: { total: 0, filled: 0, missing: 0 },
				total: 0,
				filled: 0,
			},
		});
		renderWithLang(<CompletenessIndicator result={result} />);
		const status = screen.getByRole("status");
		expect(status).toHaveTextContent("—");
	});

	it("opens popover and shows tier breakdown and progress", async () => {
		const user = userEvent.setup();
		renderWithLang(<CompletenessIndicator result={makeResult()} />);
		await user.click(
			screen.getByRole("button", { name: /Listo\. Completitud del registro/ }),
		);
		expect(
			await screen.findByText("Completitud del registro"),
		).toBeInTheDocument();
		expect(screen.getByText("SAT requerido")).toBeInTheDocument();
		expect(screen.getByText("Alertas")).toBeInTheDocument();
		expect(screen.getByText("KYC complementario")).toBeInTheDocument();
		const progressbars = screen.getAllByRole("progressbar");
		expect(progressbars).toHaveLength(3);
	});

	it("lists missing fields in the popover", async () => {
		const user = userEvent.setup();
		const result = makeResult({
			satReady: false,
			alertReady: false,
			fullyEnriched: false,
			summary: {
				red: { total: 5, filled: 3, missing: 2 },
				yellow: { total: 3, filled: 3, missing: 0 },
				grey: { total: 4, filled: 4, missing: 0 },
				total: 12,
				filled: 10,
			},
			missing: [
				{
					field: makeField({ fieldPath: "a", label: "Campo A" }),
					value: undefined,
				},
				{
					field: makeField({ fieldPath: "b", label: "Campo B" }),
					value: undefined,
				},
			],
		});
		renderWithLang(<CompletenessIndicator result={result} />);
		await user.click(screen.getByRole("button", { name: /Faltan/ }));
		await waitFor(() => {
			expect(screen.getByText("Campos faltantes (2)")).toBeInTheDocument();
		});
		expect(screen.getByText("Campo A")).toBeInTheDocument();
		expect(screen.getByText("Campo B")).toBeInTheDocument();
	});

	it("offers Ver todos when more than 5 fields are missing", async () => {
		const user = userEvent.setup();
		const missing = Array.from({ length: 7 }, (_, i) => ({
			field: makeField({
				fieldPath: `f${i}`,
				label: `Field ${i}`,
			}),
			value: undefined as undefined,
		}));
		const result = makeResult({
			satReady: false,
			alertReady: false,
			fullyEnriched: false,
			summary: {
				red: { total: 7, filled: 0, missing: 7 },
				yellow: { total: 0, filled: 0, missing: 0 },
				grey: { total: 0, filled: 0, missing: 0 },
				total: 7,
				filled: 0,
			},
			missing,
		});
		renderWithLang(<CompletenessIndicator result={result} />);
		await user.click(screen.getByRole("button", { name: /Faltan/ }));
		const showAll = await screen.findByRole("button", { name: /Ver todos/ });
		expect(showAll).toHaveTextContent("2 más");
		await user.click(showAll);
		expect(screen.getByText("Field 5")).toBeInTheDocument();
	});

	it("applies custom className", () => {
		const { container } = renderWithLang(
			<CompletenessIndicator result={makeResult()} className="my-class" />,
		);
		const wrapper = container.querySelector(".my-class");
		expect(wrapper).toBeInTheDocument();
	});
});
