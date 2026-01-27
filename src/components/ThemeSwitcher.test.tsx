import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeSwitcher } from "./ThemeSwitcher";
import * as nextThemes from "next-themes";
import { renderWithProviders } from "@/lib/testHelpers";

const mockSetTheme = vi.fn();

vi.mock("next-themes", () => ({
	useTheme: vi.fn(() => ({
		theme: "light",
		setTheme: mockSetTheme,
	})),
}));

describe("ThemeSwitcher", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders all theme option buttons", () => {
		renderWithProviders(<ThemeSwitcher />, { language: "en" });

		expect(screen.getByRole("button", { name: /system/i })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /light/i })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /dark/i })).toBeInTheDocument();
	});

	it("calls setTheme with dark when dark button is clicked", async () => {
		const user = userEvent.setup();
		renderWithProviders(<ThemeSwitcher />, { language: "en" });

		const darkButton = screen.getByRole("button", { name: /dark/i });
		await user.click(darkButton);

		expect(mockSetTheme).toHaveBeenCalledWith("dark");
	});

	it("calls setTheme with light when light button is clicked from dark mode", async () => {
		vi.mocked(nextThemes.useTheme).mockReturnValue({
			theme: "dark",
			setTheme: mockSetTheme,
			themes: [],
			forcedTheme: undefined,
			resolvedTheme: "dark",
			systemTheme: undefined,
		});

		const user = userEvent.setup();
		renderWithProviders(<ThemeSwitcher />, { language: "en" });

		const lightButton = screen.getByRole("button", { name: /light/i });
		await user.click(lightButton);

		expect(mockSetTheme).toHaveBeenCalledWith("light");
	});

	it("calls setTheme with system when system button is clicked", async () => {
		const user = userEvent.setup();
		renderWithProviders(<ThemeSwitcher />, { language: "en" });

		const systemButton = screen.getByRole("button", { name: /system/i });
		await user.click(systemButton);

		expect(mockSetTheme).toHaveBeenCalledWith("system");
	});
});
