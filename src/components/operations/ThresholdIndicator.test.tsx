import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThresholdIndicator } from "./ThresholdIndicator";

describe("ThresholdIndicator", () => {
	const UMA = 113.14;

	it("shows green 'Bajo umbral' when below identification threshold", () => {
		// VEH identification = 3210 UMA => 363,179 MXN
		render(<ThresholdIndicator code="VEH" amountMxn={1000} umaValue={UMA} />);
		expect(screen.getByText("Bajo umbral")).toBeInTheDocument();
	});

	it("shows yellow 'Supera identificación' when above identification but below notice", () => {
		// VEH identification = 3210 UMA, notice = 6420 UMA
		// 400k exceeds identification (~363k) but not notice (~726k)
		render(
			<ThresholdIndicator code="VEH" amountMxn={400_000} umaValue={UMA} />,
		);
		expect(screen.getByText("Supera identificación")).toBeInTheDocument();
	});

	it("shows red 'Sujeta a aviso' when above notice threshold", () => {
		// 800k exceeds notice threshold (~726k)
		render(
			<ThresholdIndicator code="VEH" amountMxn={800_000} umaValue={UMA} />,
		);
		expect(screen.getByText("Sujeta a aviso")).toBeInTheDocument();
	});

	it("shows red for ALWAYS-threshold activities regardless of amount", () => {
		// SPR has ALWAYS for both thresholds
		render(<ThresholdIndicator code="SPR" amountMxn={100} umaValue={UMA} />);
		expect(screen.getByText("Sujeta a aviso")).toBeInTheDocument();
	});

	it("renders colored dot indicator", () => {
		const { container } = render(
			<ThresholdIndicator code="VEH" amountMxn={1000} umaValue={UMA} />,
		);
		const dot = container.querySelector(".rounded-full");
		expect(dot).toBeInTheDocument();
		expect(dot?.className).toContain("bg-green-500");
	});

	it("applies custom className", () => {
		const { container } = render(
			<ThresholdIndicator
				code="VEH"
				amountMxn={1000}
				umaValue={UMA}
				className="custom"
			/>,
		);
		const customEl = container.querySelector(".custom");
		expect(customEl).toBeInTheDocument();
	});
});
