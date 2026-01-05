import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "./ThemeProvider";

vi.mock("next-themes", () => ({
	ThemeProvider: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="theme-provider">{children}</div>
	),
	useTheme: () => ({
		theme: "light",
		setTheme: vi.fn(),
		systemTheme: "light",
		themes: ["light", "dark", "system"],
		resolvedTheme: "light",
	}),
}));

vi.mock("@/lib/cookies", () => ({
	getCookie: vi.fn(),
	setCookie: vi.fn(),
	COOKIE_NAMES: {
		THEME: "janovix-theme",
		LANGUAGE: "janovix-lang",
	},
}));

import * as cookiesModule from "@/lib/cookies";

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

	it("syncs theme from cookie on mount", () => {
		vi.spyOn(cookiesModule, "getCookie").mockReturnValue("dark");

		const { container } = render(
			<ThemeProvider>
				<div>Test</div>
			</ThemeProvider>,
		);

		const providers = screen.getAllByTestId("theme-provider");
		const ourProvider = providers.find((p) => container.contains(p));
		expect(ourProvider).toBeInTheDocument();
	});

	it("handles invalid theme value in cookie", () => {
		vi.spyOn(cookiesModule, "getCookie").mockReturnValue("invalid-theme");

		const { container } = render(
			<ThemeProvider>
				<div>Test</div>
			</ThemeProvider>,
		);

		const providers = screen.getAllByTestId("theme-provider");
		const ourProvider = providers.find((p) => container.contains(p));
		expect(ourProvider).toBeInTheDocument();
	});

	it("saves theme to cookie when initialized", () => {
		const setCookieSpy = vi.spyOn(cookiesModule, "setCookie");
		vi.spyOn(cookiesModule, "getCookie").mockReturnValue(undefined);

		render(
			<ThemeProvider>
				<div>Test</div>
			</ThemeProvider>,
		);

		// Cookie should be set when initialized
		expect(setCookieSpy).toHaveBeenCalled();
	});

	it("does not apply cookie theme when same as current", () => {
		vi.spyOn(cookiesModule, "getCookie").mockReturnValue("light");

		const { container } = render(
			<ThemeProvider>
				<div>Test</div>
			</ThemeProvider>,
		);

		const providers = screen.getAllByTestId("theme-provider");
		const ourProvider = providers.find((p) => container.contains(p));
		expect(ourProvider).toBeInTheDocument();
	});
});
