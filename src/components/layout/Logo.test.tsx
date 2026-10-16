import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Logo } from "./Logo";

describe("Logo", () => {
	it("renders logo variant by default", () => {
		render(<Logo />);
		expect(screen.getByText("Yenio")).toBeInTheDocument();
		expect(
			document.querySelector('svg[viewBox="0 0 183 147"]'),
		).toBeInTheDocument();
	});

	it("renders icon variant when specified", () => {
		const { container } = render(<Logo variant="icon" />);
		expect(
			container.querySelector('svg[viewBox="0 0 183 147"]'),
		).toBeInTheDocument();
		expect(container.querySelector("span")).toBeNull();
	});

	it("applies custom className", () => {
		const { container } = render(<Logo className="custom-class" />);
		expect(container.querySelector(".custom-class")).toBeInTheDocument();
	});

	it("applies custom width and height", () => {
		render(<Logo width={150} height={24} />);
		const logoSvg = document.querySelector("svg");
		expect(logoSvg).toHaveAttribute("width", "150");
		expect(logoSvg).toHaveAttribute("height", "24");
	});

	it("uses currentColor for the isotype", () => {
		const { container } = render(<Logo />);
		const svg = container.querySelector("svg");
		expect(svg?.innerHTML).toContain('fill="currentColor"');
	});
});
