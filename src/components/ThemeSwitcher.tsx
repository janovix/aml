"use client";

import { useTheme } from "next-themes";
import { ThemeSwitcher as ThemeSwitcherUI } from "@/components/ui/shadcn-io/theme-switcher";

export function ThemeSwitcher() {
	const { theme, setTheme } = useTheme();

	return (
		<ThemeSwitcherUI
			value={theme as "light" | "dark" | "system" | undefined}
			onChange={setTheme}
		/>
	);
}
