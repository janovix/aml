import { describe, it, expect, afterEach } from "vitest";
import { getLocaleForLanguage, detectBrowserLanguage } from "./translations";

describe("translations utilities", () => {
	describe("getLocaleForLanguage", () => {
		it("returns es-ES for Spanish", () => {
			expect(getLocaleForLanguage("es")).toBe("es-ES");
		});

		it("returns en-US for English", () => {
			expect(getLocaleForLanguage("en")).toBe("en-US");
		});
	});

	describe("detectBrowserLanguage", () => {
		const originalNavigator = global.navigator;

		afterEach(() => {
			Object.defineProperty(global, "navigator", {
				value: originalNavigator,
				writable: true,
				configurable: true,
			});
		});

		it("returns es when navigator is undefined (SSR)", () => {
			// @ts-expect-error - simulating SSR
			global.navigator = undefined;
			expect(detectBrowserLanguage()).toBe("es");
		});

		it("returns en for English browser language", () => {
			Object.defineProperty(global, "navigator", {
				value: { language: "en-US" },
				writable: true,
				configurable: true,
			});
			expect(detectBrowserLanguage()).toBe("en");
		});

		it("returns es for Spanish browser language", () => {
			Object.defineProperty(global, "navigator", {
				value: { language: "es-MX" },
				writable: true,
				configurable: true,
			});
			expect(detectBrowserLanguage()).toBe("es");
		});

		it("returns es for unsupported browser language", () => {
			Object.defineProperty(global, "navigator", {
				value: { language: "fr-FR" },
				writable: true,
				configurable: true,
			});
			expect(detectBrowserLanguage()).toBe("es");
		});

		it("handles lowercase en variant", () => {
			Object.defineProperty(global, "navigator", {
				value: { language: "en-gb" },
				writable: true,
				configurable: true,
			});
			expect(detectBrowserLanguage()).toBe("en");
		});

		it("handles lowercase es variant", () => {
			Object.defineProperty(global, "navigator", {
				value: { language: "es-ar" },
				writable: true,
				configurable: true,
			});
			expect(detectBrowserLanguage()).toBe("es");
		});
	});
});
