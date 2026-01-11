import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
	detectEnvironment,
	getCookieDomain,
	setCookie,
	getCookie,
	deleteCookie,
	COOKIE_NAMES,
} from "./cookies";

describe("cookies utilities", () => {
	describe("detectEnvironment", () => {
		const originalWindow = global.window;

		afterEach(() => {
			Object.defineProperty(global, "window", {
				value: originalWindow,
				writable: true,
				configurable: true,
			});
		});

		it("returns local when window is undefined (SSR)", () => {
			// @ts-expect-error - simulating SSR
			global.window = undefined;
			expect(detectEnvironment()).toBe("local");
		});

		it("returns local for localhost", () => {
			Object.defineProperty(global, "window", {
				value: {
					location: { hostname: "localhost" },
				},
				writable: true,
				configurable: true,
			});
			expect(detectEnvironment()).toBe("local");
		});

		it("returns local for 127.0.0.1", () => {
			Object.defineProperty(global, "window", {
				value: {
					location: { hostname: "127.0.0.1" },
				},
				writable: true,
				configurable: true,
			});
			expect(detectEnvironment()).toBe("local");
		});

		it("returns production for janovix.com", () => {
			Object.defineProperty(global, "window", {
				value: {
					location: { hostname: "aml.janovix.com" },
				},
				writable: true,
				configurable: true,
			});
			expect(detectEnvironment()).toBe("production");
		});

		it("returns dev for janovix.workers.dev", () => {
			Object.defineProperty(global, "window", {
				value: {
					location: { hostname: "aml.janovix.workers.dev" },
				},
				writable: true,
				configurable: true,
			});
			expect(detectEnvironment()).toBe("dev");
		});

		it("returns preview for PR deployments", () => {
			Object.defineProperty(global, "window", {
				value: {
					location: { hostname: "pr-123-aml.janovix.workers.dev" },
				},
				writable: true,
				configurable: true,
			});
			expect(detectEnvironment()).toBe("preview");
		});
	});

	describe("getCookieDomain", () => {
		afterEach(() => {
			vi.restoreAllMocks();
		});

		it("returns undefined for local environment", () => {
			Object.defineProperty(global, "window", {
				value: {
					location: { hostname: "localhost" },
				},
				writable: true,
				configurable: true,
			});
			expect(getCookieDomain()).toBeUndefined();
		});

		it("returns .janovix.workers.dev for dev environment", () => {
			Object.defineProperty(global, "window", {
				value: {
					location: { hostname: "aml.janovix.workers.dev" },
				},
				writable: true,
				configurable: true,
			});
			expect(getCookieDomain()).toBe(".janovix.workers.dev");
		});

		it("returns .janovix.com for production environment", () => {
			Object.defineProperty(global, "window", {
				value: {
					location: { hostname: "aml.janovix.com" },
				},
				writable: true,
				configurable: true,
			});
			expect(getCookieDomain()).toBe(".janovix.com");
		});
	});

	describe("setCookie and getCookie", () => {
		const originalDocument = global.document;

		beforeEach(() => {
			// Mock document.cookie
			let cookies = "";
			Object.defineProperty(global, "document", {
				value: {
					get cookie() {
						return cookies;
					},
					set cookie(value: string) {
						// Parse and store the cookie
						const [nameValue] = value.split(";");
						const [name, val] = nameValue.split("=");
						if (val === "" || value.includes("max-age=0")) {
							// Delete cookie
							const regex = new RegExp(`${name}=[^;]*;?\\s*`);
							cookies = cookies.replace(regex, "");
						} else {
							// Add/update cookie
							const regex = new RegExp(`${name}=[^;]*`);
							if (regex.test(cookies)) {
								cookies = cookies.replace(regex, `${name}=${val}`);
							} else {
								cookies = cookies
									? `${cookies}; ${name}=${val}`
									: `${name}=${val}`;
							}
						}
					},
				},
				writable: true,
				configurable: true,
			});

			// Mock window for local environment
			Object.defineProperty(global, "window", {
				value: {
					location: { hostname: "localhost" },
				},
				writable: true,
				configurable: true,
			});
		});

		afterEach(() => {
			Object.defineProperty(global, "document", {
				value: originalDocument,
				writable: true,
				configurable: true,
			});
		});

		it("sets and gets a cookie", () => {
			setCookie("test-cookie", "test-value");
			expect(getCookie("test-cookie")).toBe("test-value");
		});

		it("returns undefined for non-existent cookie", () => {
			expect(getCookie("non-existent")).toBeUndefined();
		});

		it("overwrites existing cookie", () => {
			setCookie("test-cookie", "value1");
			setCookie("test-cookie", "value2");
			expect(getCookie("test-cookie")).toBe("value2");
		});
	});

	describe("deleteCookie", () => {
		const originalDocument = global.document;

		beforeEach(() => {
			let cookies = "existing=value";
			Object.defineProperty(global, "document", {
				value: {
					get cookie() {
						return cookies;
					},
					set cookie(value: string) {
						if (value.includes("max-age=0")) {
							const [nameValue] = value.split(";");
							const [name] = nameValue.split("=");
							const regex = new RegExp(`${name}=[^;]*;?\\s*`);
							cookies = cookies.replace(regex, "").trim();
						}
					},
				},
				writable: true,
				configurable: true,
			});

			Object.defineProperty(global, "window", {
				value: {
					location: { hostname: "localhost" },
				},
				writable: true,
				configurable: true,
			});
		});

		afterEach(() => {
			Object.defineProperty(global, "document", {
				value: originalDocument,
				writable: true,
				configurable: true,
			});
		});

		it("deletes a cookie", () => {
			expect(getCookie("existing")).toBe("value");
			deleteCookie("existing");
			expect(getCookie("existing")).toBeUndefined();
		});
	});

	describe("COOKIE_NAMES", () => {
		it("has correct cookie names", () => {
			expect(COOKIE_NAMES.THEME).toBe("janovix-theme");
			expect(COOKIE_NAMES.LANGUAGE).toBe("janovix-lang");
		});
	});

	describe("additional branch coverage", () => {
		const originalDocument = global.document;
		const originalWindow = global.window;

		afterEach(() => {
			Object.defineProperty(global, "document", {
				value: originalDocument,
				writable: true,
				configurable: true,
			});
			Object.defineProperty(global, "window", {
				value: originalWindow,
				writable: true,
				configurable: true,
			});
		});

		it("returns production for bare janovix.com domain", () => {
			Object.defineProperty(global, "window", {
				value: {
					location: { hostname: "janovix.com" },
				},
				writable: true,
				configurable: true,
			});
			expect(detectEnvironment()).toBe("production");
		});

		it("returns local for unknown hostname", () => {
			Object.defineProperty(global, "window", {
				value: {
					location: { hostname: "unknown.example.com" },
				},
				writable: true,
				configurable: true,
			});
			expect(detectEnvironment()).toBe("local");
		});

		it("setCookie does nothing when document is undefined", () => {
			// @ts-expect-error - simulating SSR
			global.document = undefined;
			// Should not throw
			expect(() => setCookie("test", "value")).not.toThrow();
		});

		it("getCookie returns undefined when document is undefined", () => {
			// @ts-expect-error - simulating SSR
			global.document = undefined;
			expect(getCookie("test")).toBeUndefined();
		});

		it("deleteCookie does nothing when document is undefined", () => {
			// @ts-expect-error - simulating SSR
			global.document = undefined;
			// Should not throw
			expect(() => deleteCookie("test")).not.toThrow();
		});

		it("setCookie adds domain for production environment", () => {
			let setCookieValue = "";
			Object.defineProperty(global, "document", {
				value: {
					get cookie() {
						return "";
					},
					set cookie(value: string) {
						setCookieValue = value;
					},
				},
				writable: true,
				configurable: true,
			});

			Object.defineProperty(global, "window", {
				value: {
					location: { hostname: "aml.janovix.com" },
				},
				writable: true,
				configurable: true,
			});

			setCookie("test-cookie", "test-value");
			expect(setCookieValue).toContain("domain=.janovix.com");
			expect(setCookieValue).toContain("secure");
		});

		it("deleteCookie adds domain for production environment", () => {
			let setCookieValue = "";
			Object.defineProperty(global, "document", {
				value: {
					get cookie() {
						return "";
					},
					set cookie(value: string) {
						setCookieValue = value;
					},
				},
				writable: true,
				configurable: true,
			});

			Object.defineProperty(global, "window", {
				value: {
					location: { hostname: "aml.janovix.com" },
				},
				writable: true,
				configurable: true,
			});

			deleteCookie("test-cookie");
			expect(setCookieValue).toContain("domain=.janovix.com");
		});

		it("setCookie with custom options", () => {
			let setCookieValue = "";
			Object.defineProperty(global, "document", {
				value: {
					get cookie() {
						return "";
					},
					set cookie(value: string) {
						setCookieValue = value;
					},
				},
				writable: true,
				configurable: true,
			});

			Object.defineProperty(global, "window", {
				value: {
					location: { hostname: "localhost" },
				},
				writable: true,
				configurable: true,
			});

			setCookie("test-cookie", "test-value", {
				maxAge: 3600,
				path: "/app",
				sameSite: "strict",
				secure: true,
			});

			expect(setCookieValue).toContain("max-age=3600");
			expect(setCookieValue).toContain("path=/app");
			expect(setCookieValue).toContain("samesite=strict");
			expect(setCookieValue).toContain("secure");
		});

		it("getCookie handles empty cookie value", () => {
			Object.defineProperty(global, "document", {
				value: {
					get cookie() {
						return "test=";
					},
				},
				writable: true,
				configurable: true,
			});

			expect(getCookie("test")).toBe("");
		});
	});
});
