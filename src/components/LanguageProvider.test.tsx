import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { LanguageProvider, useLanguage } from "./LanguageProvider";

// Mock the cookies module
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

import { getCookie, setCookie } from "@/lib/cookies";
import { getResolvedSettings, updateUserSettings } from "@/lib/settings";

// Test component that uses the hook
function TestComponent() {
	const { language, setLanguage, t } = useLanguage();
	return (
		<div>
			<span data-testid="language">{language}</span>
			<span data-testid="translation">{t("loading")}</span>
			<button onClick={() => setLanguage("en")}>Set English</button>
			<button onClick={() => setLanguage("es")}>Set Spanish</button>
		</div>
	);
}

describe("LanguageProvider", () => {
	const originalNavigator = global.navigator;

	beforeEach(() => {
		document.body.innerHTML = "";
		vi.clearAllMocks();

		Object.defineProperty(global, "navigator", {
			value: {
				language: "es-MX",
			},
			writable: true,
			configurable: true,
		});

		// Default mock: API rejects (not logged in)
		vi.mocked(getResolvedSettings).mockRejectedValue(
			new Error("Not authenticated"),
		);
		vi.mocked(updateUserSettings).mockResolvedValue({} as never);
	});

	afterEach(() => {
		Object.defineProperty(global, "navigator", {
			value: originalNavigator,
			writable: true,
			configurable: true,
		});
		vi.restoreAllMocks();
	});

	it("should provide default language context during SSR", () => {
		vi.mocked(getCookie).mockReturnValue(undefined);

		render(
			<LanguageProvider>
				<TestComponent />
			</LanguageProvider>,
		);

		expect(screen.getByTestId("language")).toHaveTextContent("es");
	});

	it("should load language from cookie if available", async () => {
		vi.mocked(getCookie).mockReturnValue("en");

		const { container } = render(
			<LanguageProvider>
				<TestComponent />
			</LanguageProvider>,
		);

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 100));
		});

		const languageElement = container.querySelector('[data-testid="language"]');
		expect(languageElement).toHaveTextContent("en");
	});

	it("should detect browser language if cookie is empty", async () => {
		vi.mocked(getCookie).mockReturnValue(undefined);

		Object.defineProperty(global, "navigator", {
			value: {
				language: "en-US",
			},
			writable: true,
			configurable: true,
		});

		const { container } = render(
			<LanguageProvider>
				<TestComponent />
			</LanguageProvider>,
		);

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 100));
		});

		const languageElement = container.querySelector('[data-testid="language"]');
		expect(languageElement).toHaveTextContent("en");
	});

	it("should update language when setLanguage is called", async () => {
		vi.mocked(getCookie).mockReturnValue(undefined);

		const { container } = render(
			<LanguageProvider>
				<TestComponent />
			</LanguageProvider>,
		);

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 100));
		});

		const englishButtons = screen.getAllByText("Set English");
		await act(async () => {
			fireEvent.click(englishButtons[0]);
		});

		const languageElement = container.querySelector('[data-testid="language"]');
		expect(languageElement).toHaveTextContent("en");
		expect(setCookie).toHaveBeenCalledWith("janovix-lang", "en");
	});

	it("should provide translation function with correct translations", async () => {
		vi.mocked(getCookie).mockReturnValue("es");

		const { container } = render(
			<LanguageProvider>
				<TestComponent />
			</LanguageProvider>,
		);

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 100));
		});

		const translationElement = container.querySelector(
			'[data-testid="translation"]',
		);
		expect(translationElement).toHaveTextContent("Cargando...");
	});

	it("should return English translations when language is en", async () => {
		vi.mocked(getCookie).mockReturnValue("en");

		const { container } = render(
			<LanguageProvider>
				<TestComponent />
			</LanguageProvider>,
		);

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 100));
		});

		const translationElement = container.querySelector(
			'[data-testid="translation"]',
		);
		expect(translationElement).toHaveTextContent("Loading...");
	});

	it("should throw error when useLanguage is used outside provider", () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		expect(() => {
			render(<TestComponent />);
		}).toThrow("useLanguage must be used within a LanguageProvider");

		consoleSpy.mockRestore();
	});

	it("should sync with API when available", async () => {
		vi.mocked(getCookie).mockReturnValue("es");
		vi.mocked(getResolvedSettings).mockResolvedValue({
			language: "en",
			theme: "light",
			timezone: "UTC",
			dateFormat: "DD/MM/YYYY",
			clockFormat: "12h",
			avatarUrl: null,
			sources: {
				language: "user",
				theme: "default",
				timezone: "default",
				dateFormat: "default",
				clockFormat: "default",
			},
		});

		const { container } = render(
			<LanguageProvider>
				<TestComponent />
			</LanguageProvider>,
		);

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 200));
		});

		// Should update to API value
		const languageElement = container.querySelector('[data-testid="language"]');
		expect(languageElement).toHaveTextContent("en");
		// Should sync cookie with API value
		expect(setCookie).toHaveBeenCalledWith("janovix-lang", "en");
	});

	it("should call API when language changes after sync", async () => {
		vi.mocked(getCookie).mockReturnValue("es");
		vi.mocked(getResolvedSettings).mockResolvedValue({
			language: "es",
			theme: "light",
			timezone: "UTC",
			dateFormat: "DD/MM/YYYY",
			clockFormat: "12h",
			avatarUrl: null,
			sources: {
				language: "user",
				theme: "default",
				timezone: "default",
				dateFormat: "default",
				clockFormat: "default",
			},
		});

		render(
			<LanguageProvider>
				<TestComponent />
			</LanguageProvider>,
		);

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 200));
		});

		const englishButton = screen.getByText("Set English");
		await act(async () => {
			fireEvent.click(englishButton);
		});

		expect(updateUserSettings).toHaveBeenCalledWith({ language: "en" });
	});
});
