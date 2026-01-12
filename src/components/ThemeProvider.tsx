"use client";
import {
	ThemeProvider as NextThemesProvider,
	type ThemeProviderProps,
	useTheme,
} from "next-themes";
import { useEffect, useState, useRef } from "react";
import { getCookie, setCookie, COOKIE_NAMES } from "@/lib/cookies";
import {
	getResolvedSettings,
	updateUserSettings,
	type Theme,
} from "@/lib/settings";

/**
 * Component that syncs theme changes to cross-subdomain cookies and auth-svc API
 */
function ThemeSettingsSyncer({ children }: { children: React.ReactNode }) {
	const { theme, setTheme } = useTheme();
	const [initialized, setInitialized] = useState(false);
	const [settingsSynced, setSettingsSynced] = useState(false);
	const previousTheme = useRef<string | undefined>(undefined);

	// On mount: sync from cookie first (instant), then verify with API
	useEffect(() => {
		if (initialized) return;

		// Step 1: Check cookie value (instant, no flash)
		const cookieTheme = getCookie(COOKIE_NAMES.THEME);
		if (cookieTheme && ["light", "dark", "system"].includes(cookieTheme)) {
			if (cookieTheme !== theme) {
				setTheme(cookieTheme);
			}
		}
		setInitialized(true);
		previousTheme.current = cookieTheme || theme;

		// Step 2: Fetch from API to verify/sync
		getResolvedSettings()
			.then((settings) => {
				const apiTheme = settings.theme;
				if (apiTheme && ["light", "dark", "system"].includes(apiTheme)) {
					setTheme(apiTheme);
					setCookie(COOKIE_NAMES.THEME, apiTheme);
					previousTheme.current = apiTheme;
				}
				setSettingsSynced(true);
			})
			.catch((error) => {
				// API unavailable, keep using cookie/browser value
				console.debug("Settings API unavailable:", error);
				setSettingsSynced(true);
			});
	}, [initialized, theme, setTheme]);

	// Sync theme changes to cookie and API
	useEffect(() => {
		if (!initialized || !theme) return;

		// Only update if theme actually changed
		if (theme === previousTheme.current) return;
		previousTheme.current = theme;

		// Update cookie immediately for cross-app sync
		setCookie(COOKIE_NAMES.THEME, theme);

		// Update API in background (only if we've already synced with API)
		if (settingsSynced) {
			updateUserSettings({ theme: theme as Theme }).catch((error) => {
				console.debug("Failed to update theme in API:", error);
			});
		}
	}, [theme, initialized, settingsSynced]);

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
			{mounted ? <ThemeSettingsSyncer>{children}</ThemeSettingsSyncer> : null}
		</NextThemesProvider>
	);
}
