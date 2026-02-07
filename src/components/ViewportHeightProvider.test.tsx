import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { ViewportHeightProvider } from "./ViewportHeightProvider";

vi.mock("@/hooks/use-viewport-height", () => ({
	useViewportHeight: vi.fn(() => ({ height: 800, offsetTop: 0 })),
}));

vi.mock("@/hooks/use-ios-keyboard-fix", () => ({
	useIOSKeyboardFix: vi.fn(),
}));

describe("ViewportHeightProvider", () => {
	it("renders children", () => {
		const { getByText } = render(
			<ViewportHeightProvider>
				<div>Test Content</div>
			</ViewportHeightProvider>,
		);
		expect(getByText("Test Content")).toBeInTheDocument();
	});

	it("sets CSS custom properties on document root", () => {
		render(
			<ViewportHeightProvider>
				<div>Content</div>
			</ViewportHeightProvider>,
		);

		const root = document.documentElement;
		expect(root.style.getPropertyValue("--viewport-height")).toBe("800px");
		expect(root.style.getPropertyValue("--viewport-offset-top")).toBe("0px");
		expect(root.style.getPropertyValue("--keyboard-open")).toBe("0");
	});

	it("sets keyboard-open to 1 when offsetTop > 0", async () => {
		const { useViewportHeight } = await import("@/hooks/use-viewport-height");
		vi.mocked(useViewportHeight).mockReturnValue({
			height: 500,
			offsetTop: 100,
		});

		render(
			<ViewportHeightProvider>
				<div>Content</div>
			</ViewportHeightProvider>,
		);

		const root = document.documentElement;
		expect(root.style.getPropertyValue("--keyboard-open")).toBe("1");
		expect(root.style.getPropertyValue("--viewport-height")).toBe("500px");
	});
});
