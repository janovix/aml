import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ActivityIcon } from "./ActivityIcon";

describe("ActivityIcon", () => {
	it("renders an SVG icon", () => {
		const { container } = render(<ActivityIcon code="VEH" />);
		const svg = container.querySelector("svg");
		expect(svg).toBeInTheDocument();
	});

	it("renders with default md size", () => {
		const { container } = render(<ActivityIcon code="VEH" />);
		// Component should render without errors with default size
		expect(container.querySelector("svg")).toBeInTheDocument();
	});

	it("renders with sm size", () => {
		const { container } = render(<ActivityIcon code="VEH" size="sm" />);
		expect(container.querySelector("svg")).toBeInTheDocument();
	});

	it("renders with lg size", () => {
		const { container } = render(<ActivityIcon code="VEH" size="lg" />);
		expect(container.querySelector("svg")).toBeInTheDocument();
	});

	it("renders different activity codes", () => {
		const codes = ["VEH", "INM", "AVI", "FES", "SPR"] as const;
		for (const code of codes) {
			const { container, unmount } = render(<ActivityIcon code={code} />);
			expect(container.querySelector("svg")).toBeInTheDocument();
			unmount();
		}
	});
});
