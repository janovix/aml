import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CompletenessIndicator } from "./CompletenessIndicator";
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

describe("CompletenessIndicator", () => {
	it("renders three dots", () => {
		const { container } = render(
			<CompletenessIndicator result={makeResult()} />,
		);
		const dots = container.querySelectorAll(".rounded-full");
		expect(dots).toHaveLength(3);
	});

	it("shows filled dots when all fields are complete", () => {
		const { container } = render(
			<CompletenessIndicator result={makeResult()} />,
		);
		const dots = container.querySelectorAll(".rounded-full");
		// All dots should use filled classes
		expect(dots[0].className).toContain("bg-red-500");
		expect(dots[1].className).toContain("bg-yellow-500");
		expect(dots[2].className).toContain("bg-gray-500");
	});

	it("shows empty dot for incomplete tier", () => {
		const result = makeResult({
			summary: {
				red: { total: 5, filled: 3, missing: 2 },
				yellow: { total: 3, filled: 3, missing: 0 },
				grey: { total: 4, filled: 4, missing: 0 },
				total: 12,
				filled: 10,
			},
		});

		const { container } = render(<CompletenessIndicator result={result} />);
		const dots = container.querySelectorAll(".rounded-full");
		// Red dot should show empty state
		expect(dots[0].className).toContain("bg-red-200");
	});

	it("includes tooltip text with counts", () => {
		const result = makeResult();
		const { container } = render(<CompletenessIndicator result={result} />);
		const wrapper = container.querySelector("[aria-label]");
		expect(wrapper?.getAttribute("aria-label")).toContain("SAT: 5/5");
		expect(wrapper?.getAttribute("aria-label")).toContain("Alertas: 3/3");
		expect(wrapper?.getAttribute("aria-label")).toContain("KYC: 4/4");
	});

	it("handles zero total fields gracefully", () => {
		const result = makeResult({
			summary: {
				red: { total: 0, filled: 0, missing: 0 },
				yellow: { total: 0, filled: 0, missing: 0 },
				grey: { total: 0, filled: 0, missing: 0 },
				total: 0,
				filled: 0,
			},
		});

		const { container } = render(<CompletenessIndicator result={result} />);
		// Should still render 3 dots (100% for 0/0)
		const dots = container.querySelectorAll(".rounded-full");
		expect(dots).toHaveLength(3);
	});

	it("applies custom className", () => {
		const { container } = render(
			<CompletenessIndicator result={makeResult()} className="my-class" />,
		);
		const wrapper = container.querySelector(".my-class");
		expect(wrapper).toBeInTheDocument();
	});
});
