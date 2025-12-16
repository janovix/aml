import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ClientLayout from "./ClientLayout";

vi.mock("./ThemeProvider", () => ({
	ThemeProvider: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="theme-provider">{children}</div>
	),
}));

vi.mock("./ThemeSwitcher", () => ({
	ThemeSwitcher: () => <div data-testid="theme-switcher">Theme Switcher</div>,
}));

describe("ClientLayout", () => {
	it("renders children", () => {
		render(
			<ClientLayout>
				<div>Test Content</div>
			</ClientLayout>,
		);

		expect(screen.getByText("Test Content")).toBeInTheDocument();
	});

	it("renders ThemeProvider", () => {
		const { container } = render(
			<ClientLayout>
				<div>Test</div>
			</ClientLayout>,
		);

		const providers = screen.getAllByTestId("theme-provider");
		const ourProvider = providers.find((p) => container.contains(p));
		expect(ourProvider).toBeInTheDocument();
	});

	it("renders ThemeSwitcher", () => {
		const { container } = render(
			<ClientLayout>
				<div>Test</div>
			</ClientLayout>,
		);

		const switchers = screen.getAllByTestId("theme-switcher");
		const ourSwitcher = switchers.find((s) => container.contains(s));
		expect(ourSwitcher).toBeInTheDocument();
	});
});
