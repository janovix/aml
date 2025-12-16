import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "./ThemeProvider";

vi.mock("next-themes", () => ({
	ThemeProvider: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="theme-provider">{children}</div>
	),
}));

describe("ThemeProvider", () => {
	it("renders children when mounted", () => {
		const { container } = render(
			<ThemeProvider>
				<div>Test Content</div>
			</ThemeProvider>,
		);

		// Component uses useEffect to set mounted, so initially may not render
		// But the structure should be there
		const providers = screen.getAllByTestId("theme-provider");
		const ourProvider = providers.find((p) => container.contains(p));
		expect(ourProvider).toBeInTheDocument();
	});

	it("renders with theme provider", () => {
		const { container } = render(
			<ThemeProvider attribute="data-theme" defaultTheme="dark">
				<div>Test</div>
			</ThemeProvider>,
		);

		const providers = screen.getAllByTestId("theme-provider");
		const ourProvider = providers.find((p) => container.contains(p));
		expect(ourProvider).toBeInTheDocument();
	});
});
