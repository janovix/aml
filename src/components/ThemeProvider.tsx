"use client";
import {
	ThemeProvider as NextThemesProvider,
	type ThemeProviderProps,
	useTheme,
} from "next-themes";
import { useEffect, useState } from "react";
import { getCookie, setCookie, COOKIE_NAMES } from "@/lib/cookies";

/**
 * Component that syncs theme changes to cross-subdomain cookies
 */
function ThemeCookieSyncer({ children }: { children: React.ReactNode }) {
	const { theme, setTheme } = useTheme();
	const [initialized, setInitialized] = useState(false);

	// On mount, check if there's a cookie value that differs from current theme
	useEffect(() => {
		const cookieTheme = getCookie(COOKIE_NAMES.THEME);
		if (cookieTheme && cookieTheme !== theme && !initialized) {
			// Cookie has a different value, apply it
			if (["light", "dark", "system"].includes(cookieTheme)) {
				setTheme(cookieTheme);
			}
		}
		setInitialized(true);
	}, [theme, setTheme, initialized]);

	// Sync theme changes to cookie
	useEffect(() => {
		if (initialized && theme) {
			setCookie(COOKIE_NAMES.THEME, theme);
		}
	}, [theme, initialized]);

	return <>{children}</>;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	return (
		<NextThemesProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
			storageKey={COOKIE_NAMES.THEME}
			{...props}
		>
			{mounted ? <ThemeCookieSyncer>{children}</ThemeCookieSyncer> : null}
		</NextThemesProvider>
	);
}
