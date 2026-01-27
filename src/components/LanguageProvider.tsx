"use client";

import {
	createContext,
	useContext,
	useEffect,
	useState,
	useCallback,
	type ReactNode,
} from "react";
import {
	type Language,
	type TranslationKeys,
	translations,
	detectBrowserLanguage,
} from "@/lib/translations";
import { getCookie, setCookie, COOKIE_NAMES } from "@/lib/cookies";
import {
	getResolvedSettings,
	updateUserSettings,
	type LanguageCode,
} from "@/lib/settings";

interface LanguageContextType {
	language: Language;
	setLanguage: (lang: Language) => void;
	t: (key: TranslationKeys) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
	undefined,
);

interface LanguageProviderProps {
	children: ReactNode;
	/** Force a specific language (useful for testing) */
	defaultLanguage?: Language;
}

export function LanguageProvider({
	children,
	defaultLanguage,
}: LanguageProviderProps) {
	const [language, setLanguageState] = useState<Language>(
		defaultLanguage ?? "es",
	);
	const [mounted, setMounted] = useState(false);
	const [settingsSynced, setSettingsSynced] = useState(false);

	// Initialize from cookies (instant), then sync with API
	useEffect(() => {
		setMounted(true);
		// If defaultLanguage is set, skip detection (useful for testing)
		if (defaultLanguage) {
			return;
		}

		// Step 1: Read from cookie first for instant render (no flash)
		const stored = getCookie(COOKIE_NAMES.LANGUAGE) as Language | undefined;
		if (stored && ["es", "en"].includes(stored)) {
			setLanguageState(stored);
		} else {
			const detected = detectBrowserLanguage();
			setLanguageState(detected);
			setCookie(COOKIE_NAMES.LANGUAGE, detected);
		}

		// Step 2: Fetch from API to verify/sync
		getResolvedSettings()
			.then((settings) => {
				const apiLanguage = settings.language as Language;
				if (apiLanguage && ["es", "en"].includes(apiLanguage)) {
					setLanguageState(apiLanguage);
					setCookie(COOKIE_NAMES.LANGUAGE, apiLanguage);
				}
				setSettingsSynced(true);
			})
			.catch((error) => {
				// API unavailable, keep using cookie/browser value
				console.debug("Settings API unavailable:", error);
				setSettingsSynced(true);
			});
	}, [defaultLanguage]);

	// Update both cookie and API when language changes
	const setLanguage = useCallback(
		(lang: Language) => {
			setLanguageState(lang);
			// Update cookie immediately for cross-app sync
			setCookie(COOKIE_NAMES.LANGUAGE, lang);

			// Update API in background (only if we've already synced with API)
			if (settingsSynced) {
				updateUserSettings({ language: lang as LanguageCode }).catch(
					(error) => {
						console.debug("Failed to update language in API:", error);
					},
				);
			}
		},
		[settingsSynced],
	);

	const t = useCallback(
		(key: TranslationKeys): string => {
			return translations[language][key] || key;
		},
		[language],
	);

	// Return default context during SSR
	if (!mounted) {
		const ssrLanguage = defaultLanguage ?? "es";
		return (
			<LanguageContext.Provider
				value={{
					language: ssrLanguage,
					setLanguage: () => {},
					t: (key) => translations[ssrLanguage][key] || key,
				}}
			>
				{children}
			</LanguageContext.Provider>
		);
	}

	return (
		<LanguageContext.Provider value={{ language, setLanguage, t }}>
			{children}
		</LanguageContext.Provider>
	);
}

export function useLanguage() {
	const context = useContext(LanguageContext);
	if (!context) {
		throw new Error("useLanguage must be used within a LanguageProvider");
	}
	return context;
}
