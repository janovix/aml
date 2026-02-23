import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ActivityBadge } from "./ActivityBadge";

describe("ActivityBadge", () => {
	it("renders activity code by default", () => {
		render(<ActivityBadge code="VEH" />);
		expect(screen.getByText("VEH")).toBeInTheDocument();
	});

	it("renders short label when variant is short", () => {
		render(<ActivityBadge code="VEH" variant="short" />);
		expect(screen.getByText("Vehículos")).toBeInTheDocument();
	});

	it("renders full label when variant is full", () => {
		render(<ActivityBadge code="VEH" variant="full" />);
		expect(
			screen.getByText(/Distribución y comercialización de vehículos/),
		).toBeInTheDocument();
	});

	it("applies opacity for disabled activities", () => {
		const { container } = render(<ActivityBadge code="FES" />);
		const badge = container.querySelector("span");
		expect(badge?.className).toContain("opacity-50");
	});

	it("does not apply opacity for enabled activities", () => {
		const { container } = render(<ActivityBadge code="VEH" />);
		const badge = container.querySelector("span");
		expect(badge?.className).not.toContain("opacity-50");
	});

	it("applies custom className", () => {
		const { container } = render(
			<ActivityBadge code="VEH" className="custom-class" />,
		);
		const badge = container.querySelector("span");
		expect(badge?.className).toContain("custom-class");
	});

	it("renders different activity codes correctly", () => {
		const codes = ["INM", "AVI", "MJR", "SPR"] as const;
		for (const code of codes) {
			const { unmount } = render(<ActivityBadge code={code} />);
			expect(screen.getByText(code)).toBeInTheDocument();
			unmount();
		}
	});
});
