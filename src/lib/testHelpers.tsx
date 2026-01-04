import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement } from "react";
import React from "react";
import { LanguageProvider } from "@/components/LanguageProvider";
import { translations, type Language, type TranslationKeys } from "./translations";

/**
 * Lightweight helper for component rendering in tests.
 *
 * The upstream reference app runs axe-core a11y checks here, but this repo
 * intentionally does not depend on axe-core/jest-axe.
 */
export async function checkAccessibility(ui: ReactElement) {
	const { container } = render(ui);
	return { container };
}

/**
 * Renders a component with all the necessary providers for testing.
 * Uses Spanish by default since detectBrowserLanguage() defaults to "es" in Node.js.
 */
export function renderWithProviders(
	ui: ReactElement,
	options?: Omit<RenderOptions, "wrapper"> & { language?: Language },
) {
	const { language = "es", ...renderOptions } = options ?? {};
	return render(ui, {
		wrapper: ({ children }) => (
			<LanguageProvider defaultLanguage={language}>{children}</LanguageProvider>
		),
		...renderOptions,
	});
}

/**
 * Translation helper for test assertions.
 * Uses Spanish translations since detectBrowserLanguage() defaults to "es" in Node.js.
 */
export function t(key: TranslationKeys, language: Language = "es"): string {
	return translations[language][key];
}

export class PointerEvent extends Event {
	// @ts-expect-error This is part of PointerEvent but not defined in the type
	button: number;
	// @ts-expect-error This is part of PointerEvent but not defined in the type
	ctrlKey: boolean;
	constructor(type: string, props: Record<string, unknown>) {
		super(type, props);
		if (props.button != null) {
			this.button = props.button as number;
		}
		if (props.ctrlKey != null) {
			this.ctrlKey = props.ctrlKey as boolean;
		}
	}
}
