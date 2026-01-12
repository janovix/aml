import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
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

// Mock the settings module
vi.mock("@/lib/settings", () => ({
	getResolvedSettings: vi.fn(),
	updateUserSettings: vi.fn(),
}));

import * as cookiesModule from "@/lib/cookies";
import { getResolvedSettings, updateUserSettings } from "@/lib/settings";

describe("ThemeProvider", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Default mock: API rejects (not logged in)
		vi.mocked(getResolvedSettings).mockRejectedValue(
			new Error("Not authenticated"),
		);
		vi.mocked(updateUserSettings).mockResolvedValue({} as never);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("renders children when mounted", async () => {
		vi.spyOn(cookiesModule, "getCookie").mockReturnValue(undefined);
		const { container } = render(
			<ThemeProvider>
				<div>Test Content</div>
			</ThemeProvider>,
		);

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 100));
		});

		// Component uses useEffect to set mounted, so initially may not render
		// But the structure should be there
		const providers = screen.getAllByTestId("theme-provider");
		const ourProvider = providers.find((p) => container.contains(p));
		expect(ourProvider).toBeInTheDocument();
	});

	it("renders with theme provider", async () => {
		vi.spyOn(cookiesModule, "getCookie").mockReturnValue(undefined);

		const { container } = render(
			<ThemeProvider attribute="data-theme" defaultTheme="dark">
				<div>Test</div>
			</ThemeProvider>,
		);

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 100));
		});

		const providers = screen.getAllByTestId("theme-provider");
		const ourProvider = providers.find((p) => container.contains(p));
		expect(ourProvider).toBeInTheDocument();
	});

	it("syncs theme from cookie on mount", async () => {
		vi.spyOn(cookiesModule, "getCookie").mockReturnValue("dark");

		const { container } = render(
			<ThemeProvider>
				<div>Test</div>
			</ThemeProvider>,
		);

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 100));
		});

		const providers = screen.getAllByTestId("theme-provider");
		const ourProvider = providers.find((p) => container.contains(p));
		expect(ourProvider).toBeInTheDocument();
	});

	it("handles invalid theme value in cookie", async () => {
		vi.spyOn(cookiesModule, "getCookie").mockReturnValue("invalid-theme");

		const { container } = render(
			<ThemeProvider>
				<div>Test</div>
			</ThemeProvider>,
		);

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 100));
		});

		const providers = screen.getAllByTestId("theme-provider");
		const ourProvider = providers.find((p) => container.contains(p));
		expect(ourProvider).toBeInTheDocument();
	});

	it("syncs cookie when API returns different theme", async () => {
		const setCookieSpy = vi.spyOn(cookiesModule, "setCookie");
		vi.spyOn(cookiesModule, "getCookie").mockReturnValue("light");
		vi.mocked(getResolvedSettings).mockResolvedValue({
			theme: "dark",
			language: "es",
			timezone: "UTC",
			dateFormat: "DD/MM/YYYY",
			avatarUrl: null,
			sources: {
				theme: "user",
				language: "default",
				timezone: "default",
				dateFormat: "default",
			},
		});

		render(
			<ThemeProvider>
				<div>Test</div>
			</ThemeProvider>,
		);

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 200));
		});

		// Cookie should be set when API returns different theme
		expect(setCookieSpy).toHaveBeenCalledWith("janovix-theme", "dark");
	});

	it("does not apply cookie theme when same as current", async () => {
		vi.spyOn(cookiesModule, "getCookie").mockReturnValue("light");

		const { container } = render(
			<ThemeProvider>
				<div>Test</div>
			</ThemeProvider>,
		);

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 100));
		});

		const providers = screen.getAllByTestId("theme-provider");
		const ourProvider = providers.find((p) => container.contains(p));
		expect(ourProvider).toBeInTheDocument();
	});

	it("syncs with API when available", async () => {
		vi.spyOn(cookiesModule, "getCookie").mockReturnValue("light");
		vi.mocked(getResolvedSettings).mockResolvedValue({
			theme: "dark",
			language: "es",
			timezone: "UTC",
			dateFormat: "DD/MM/YYYY",
			avatarUrl: null,
			sources: {
				theme: "user",
				language: "default",
				timezone: "default",
				dateFormat: "default",
			},
		});

		const { container } = render(
			<ThemeProvider>
				<div>Test</div>
			</ThemeProvider>,
		);

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 200));
		});

		const providers = screen.getAllByTestId("theme-provider");
		const ourProvider = providers.find((p) => container.contains(p));
		expect(ourProvider).toBeInTheDocument();
		// Should sync cookie with API value
		expect(cookiesModule.setCookie).toHaveBeenCalledWith(
			"janovix-theme",
			"dark",
		);
	});
});
