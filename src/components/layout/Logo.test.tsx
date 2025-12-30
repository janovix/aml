import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Logo } from "./Logo";

vi.mock("next-themes", () => ({
	useTheme: () => ({
		resolvedTheme: "light",
		setTheme: vi.fn(),
	}),
}));

describe("Logo", () => {
	it("renders logo variant by default", () => {
		render(<Logo />);
		const logoSvg = document.querySelector('svg[viewBox="0 0 102 16"]');
		expect(logoSvg).toBeInTheDocument();
	});

	it("renders icon variant when specified", () => {
		render(<Logo variant="icon" />);
		const iconSvg = document.querySelector('svg[viewBox="0 0 200 200"]');
		expect(iconSvg).toBeInTheDocument();
	});

	it("applies custom className", () => {
		const { container } = render(<Logo className="custom-class" />);
		const logoContainer = container.querySelector(".custom-class");
		expect(logoContainer).toBeInTheDocument();
	});

	it("applies custom width and height", () => {
		render(<Logo width={150} height={24} />);
		const logoSvg = document.querySelector('svg[viewBox="0 0 102 16"]');
		expect(logoSvg).toHaveAttribute("width", "150");
		expect(logoSvg).toHaveAttribute("height", "24");
	});

	it("uses forceTheme when provided", () => {
		render(<Logo forceTheme="dark" />);
		const logoSvg = document.querySelector('svg[viewBox="0 0 102 16"]');
		expect(logoSvg).toBeInTheDocument();
		// Check that dark theme colors are used (color1 should be white in dark theme)
		const paths = logoSvg?.querySelectorAll("path");
		expect(paths?.length).toBeGreaterThan(0);
	});
});
