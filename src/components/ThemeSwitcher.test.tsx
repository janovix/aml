import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeSwitcher } from "./ThemeSwitcher";

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

	it("renders theme toggle button", () => {
		render(<ThemeSwitcher />);

		const buttons = screen.getAllByRole("button", { name: /toggle theme/i });
		expect(buttons.length).toBeGreaterThan(0);
	});

	it("calls setTheme when clicked", async () => {
		const user = userEvent.setup();
		render(<ThemeSwitcher />);

		const buttons = screen.getAllByRole("button", { name: /toggle theme/i });
		await user.click(buttons[0]);

		expect(mockSetTheme).toHaveBeenCalledWith("dark");
	});
});
