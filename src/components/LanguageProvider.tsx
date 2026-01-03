"use client";

import {
	createContext,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from "react";
import {
	type Language,
	type TranslationKeys,
	translations,
	detectBrowserLanguage,
} from "@/lib/translations";
import { getCookie, setCookie, COOKIE_NAMES } from "@/lib/cookies";

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

	useEffect(() => {
		setMounted(true);
		// If defaultLanguage is set, skip detection (useful for testing)
		if (defaultLanguage) {
			return;
		}
		// Check cookie first, then browser language
		const stored = getCookie(COOKIE_NAMES.LANGUAGE) as Language | undefined;
		if (stored && ["es", "en"].includes(stored)) {
			setLanguageState(stored);
		} else {
			const detected = detectBrowserLanguage();
			setLanguageState(detected);
			setCookie(COOKIE_NAMES.LANGUAGE, detected);
		}
	}, [defaultLanguage]);

	const setLanguage = (lang: Language) => {
		setLanguageState(lang);
		setCookie(COOKIE_NAMES.LANGUAGE, lang);
	};

	const t = (key: TranslationKeys): string => {
		return translations[language][key] || key;
	};

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
