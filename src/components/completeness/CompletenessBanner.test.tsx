import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CompletenessBanner } from "./CompletenessBanner";
import type { CompletenessResult } from "@/types/completeness";

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

describe("CompletenessBanner", () => {
	it("shows green success when SAT and alert are ready", () => {
		render(<CompletenessBanner result={makeResult()} />);
		expect(
			screen.getByText("Datos completos para aviso SAT y detección de alertas"),
		).toBeInTheDocument();
	});

	it("shows optional KYC count when not fully enriched", () => {
		const result = makeResult({
			fullyEnriched: false,
			summary: {
				red: { total: 5, filled: 5, missing: 0 },
				yellow: { total: 3, filled: 3, missing: 0 },
				grey: { total: 4, filled: 2, missing: 2 },
				total: 12,
				filled: 10,
			},
		});

		render(<CompletenessBanner result={result} />);
		expect(
			screen.getByText("2 campos opcionales KYC pendientes"),
		).toBeInTheDocument();
	});

	it("shows red urgent banner when SAT fields are missing", () => {
		const result = makeResult({
			satReady: false,
			summary: {
				red: { total: 5, filled: 3, missing: 2 },
				yellow: { total: 3, filled: 3, missing: 0 },
				grey: { total: 4, filled: 4, missing: 0 },
				total: 12,
				filled: 10,
			},
		});

		render(<CompletenessBanner result={result} />);
		expect(
			screen.getByText("No se puede presentar aviso ante la SHCP"),
		).toBeInTheDocument();
		expect(
			screen.getByText(/Faltan 2 campos obligatorios del XSD/),
		).toBeInTheDocument();
	});

	it("shows combined red and yellow warnings when both missing", () => {
		const result = makeResult({
			satReady: false,
			alertReady: false,
			summary: {
				red: { total: 5, filled: 3, missing: 2 },
				yellow: { total: 3, filled: 1, missing: 2 },
				grey: { total: 4, filled: 4, missing: 0 },
				total: 12,
				filled: 8,
			},
		});

		render(<CompletenessBanner result={result} />);
		expect(
			screen.getByText("No se puede presentar aviso ante la SHCP"),
		).toBeInTheDocument();
		expect(
			screen.getByText(/Detección automática de alertas limitada/),
		).toBeInTheDocument();
	});

	it("shows yellow warning when only alert fields are missing", () => {
		const result = makeResult({
			satReady: true,
			alertReady: false,
			summary: {
				red: { total: 5, filled: 5, missing: 0 },
				yellow: { total: 3, filled: 1, missing: 2 },
				grey: { total: 4, filled: 4, missing: 0 },
				total: 12,
				filled: 10,
			},
		});

		render(<CompletenessBanner result={result} />);
		expect(
			screen.getByText("Detección automática de alertas limitada"),
		).toBeInTheDocument();
		expect(screen.getByText(/Faltan 2 campos necesarios/)).toBeInTheDocument();
	});

	it("handles singular field count", () => {
		const result = makeResult({
			satReady: false,
			summary: {
				red: { total: 5, filled: 4, missing: 1 },
				yellow: { total: 3, filled: 3, missing: 0 },
				grey: { total: 4, filled: 4, missing: 0 },
				total: 12,
				filled: 11,
			},
		});

		render(<CompletenessBanner result={result} />);
		expect(
			screen.getByText(/Faltan 1 campo obligatorio del XSD/),
		).toBeInTheDocument();
	});
});
