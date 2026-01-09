import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
	isVanityModeAvailable,
	getCurrentOrgSlug,
	getOrgUrl,
	getShareableOrgUrl,
	parseOrgUrl,
} from "./org-url";

describe("org-url", () => {
	const originalWindow = global.window;
	const originalProcessEnv = process.env;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		global.window = originalWindow;
		process.env = originalProcessEnv;
		vi.restoreAllMocks();
	});

	describe("isVanityModeAvailable", () => {
		it("returns false on server-side when not in production", () => {
			// @ts-expect-error - simulating server-side
			delete global.window;
			// @ts-expect-error - NODE_ENV is read-only but we need to test different values
			process.env.NODE_ENV = "development";

			expect(isVanityModeAvailable()).toBe(false);
		});

		it("returns true on server-side when in production", () => {
			// @ts-expect-error - simulating server-side
			delete global.window;
			// @ts-expect-error - NODE_ENV is read-only but we need to test different values
			process.env.NODE_ENV = "production";

			expect(isVanityModeAvailable()).toBe(true);
		});

		it("returns false for workers.dev domains", () => {
			Object.defineProperty(window, "location", {
				value: {
					hostname: "aml.janovix.workers.dev",
				},
				writable: true,
			});

			expect(isVanityModeAvailable()).toBe(false);
		});

		it("returns false for any workers.dev subdomain", () => {
			Object.defineProperty(window, "location", {
				value: {
					hostname: "rs-improvements-aml.janovix.workers.dev",
				},
				writable: true,
			});

			expect(isVanityModeAvailable()).toBe(false);
		});

		it("returns false for localhost", () => {
			Object.defineProperty(window, "location", {
				value: {
					hostname: "localhost",
				},
				writable: true,
			});

			expect(isVanityModeAvailable()).toBe(false);
		});

		it("returns false for 127.0.0.1", () => {
			Object.defineProperty(window, "location", {
				value: {
					hostname: "127.0.0.1",
				},
				writable: true,
			});

			expect(isVanityModeAvailable()).toBe(false);
		});

		it("returns false for reserved subdomain 'app'", () => {
			Object.defineProperty(window, "location", {
				value: {
					hostname: "app.janovix.com",
				},
				writable: true,
			});

			expect(isVanityModeAvailable()).toBe(false);
		});

		it("returns false for reserved subdomain 'aml'", () => {
			Object.defineProperty(window, "location", {
				value: {
					hostname: "aml.janovix.com",
				},
				writable: true,
			});

			expect(isVanityModeAvailable()).toBe(false);
		});

		it("returns false for reserved subdomain 'www'", () => {
			Object.defineProperty(window, "location", {
				value: {
					hostname: "www.janovix.com",
				},
				writable: true,
			});

			expect(isVanityModeAvailable()).toBe(false);
		});

		it("returns true for vanity domain with org subdomain", () => {
			Object.defineProperty(window, "location", {
				value: {
					hostname: "acme.janovix.com",
				},
				writable: true,
			});

			expect(isVanityModeAvailable()).toBe(true);
		});

		it("returns false for non-vanity domain", () => {
			Object.defineProperty(window, "location", {
				value: {
					hostname: "example.com",
				},
				writable: true,
			});

			expect(isVanityModeAvailable()).toBe(false);
		});
	});

	describe("getCurrentOrgSlug", () => {
		it("returns null on server-side", () => {
			// @ts-expect-error - simulating server-side
			delete global.window;

			expect(getCurrentOrgSlug()).toBeNull();
		});

		it("extracts org slug from path for workers.dev domains", () => {
			Object.defineProperty(window, "location", {
				value: {
					hostname: "aml.janovix.workers.dev",
					pathname: "/acme/clients",
				},
				writable: true,
			});

			expect(getCurrentOrgSlug()).toBe("acme");
		});

		it("returns null when path is empty for workers.dev", () => {
			Object.defineProperty(window, "location", {
				value: {
					hostname: "aml.janovix.workers.dev",
					pathname: "/",
				},
				writable: true,
			});

			expect(getCurrentOrgSlug()).toBeNull();
		});

		it("extracts org slug from path for localhost", () => {
			Object.defineProperty(window, "location", {
				value: {
					hostname: "localhost",
					pathname: "/test-org/clients",
				},
				writable: true,
			});

			expect(getCurrentOrgSlug()).toBe("test-org");
		});

		it("extracts org slug from path for 127.0.0.1", () => {
			Object.defineProperty(window, "location", {
				value: {
					hostname: "127.0.0.1",
					pathname: "/my-org/settings",
				},
				writable: true,
			});

			expect(getCurrentOrgSlug()).toBe("my-org");
		});

		it("extracts org slug from path for reserved subdomain", () => {
			Object.defineProperty(window, "location", {
				value: {
					hostname: "app.janovix.com",
					pathname: "/org-slug/alerts",
				},
				writable: true,
			});

			expect(getCurrentOrgSlug()).toBe("org-slug");
		});

		it("extracts org slug from subdomain in vanity mode", () => {
			Object.defineProperty(window, "location", {
				value: {
					hostname: "acme.janovix.com",
					pathname: "/clients",
				},
				writable: true,
			});

			expect(getCurrentOrgSlug()).toBe("acme");
		});

		it("handles subdomain case insensitivity", () => {
			Object.defineProperty(window, "location", {
				value: {
					hostname: "ACME.janovix.com",
					pathname: "/clients",
				},
				writable: true,
			});

			expect(getCurrentOrgSlug()).toBe("acme");
		});
	});

	describe("getOrgUrl", () => {
		beforeEach(() => {
			Object.defineProperty(window, "location", {
				value: {
					hostname: "localhost",
					origin: "http://localhost:3000",
				},
				writable: true,
			});
		});

		it("generates path-based URL by default", () => {
			const url = getOrgUrl("acme", "/clients");
			expect(url).toBe("/acme/clients");
		});

		it("normalizes path to start with /", () => {
			const url = getOrgUrl("acme", "clients");
			expect(url).toBe("/acme/clients");
		});

		it("handles empty path", () => {
			const url = getOrgUrl("acme", "");
			expect(url).toBe("/acme/");
		});

		it("generates vanity URL when forceVanity is true", () => {
			const url = getOrgUrl("acme", "/clients", { forceVanity: true });
			expect(url).toBe("https://acme.janovix.com/clients");
		});

		it("generates absolute URL when absolute is true", () => {
			const url = getOrgUrl("acme", "/clients", { absolute: true });
			expect(url).toBe("http://localhost:3000/acme/clients");
		});

		it("generates vanity URL when vanity mode is available", () => {
			Object.defineProperty(window, "location", {
				value: {
					hostname: "acme.janovix.com",
				},
				writable: true,
			});

			const url = getOrgUrl("acme", "/clients");
			expect(url).toBe("https://acme.janovix.com/clients");
		});

		it("generates vanity URL with absolute when both options are set", () => {
			const url = getOrgUrl("acme", "/clients", {
				absolute: true,
				forceVanity: true,
			});
			expect(url).toBe("https://acme.janovix.com/clients");
		});

		it("handles complex paths", () => {
			const url = getOrgUrl("acme", "/clients/123/edit");
			expect(url).toBe("/acme/clients/123/edit");
		});
	});

	describe("getShareableOrgUrl", () => {
		beforeEach(() => {
			Object.defineProperty(window, "location", {
				value: {
					hostname: "localhost",
					origin: "http://localhost:3000",
				},
				writable: true,
			});
		});

		it("generates vanity URL with absolute", () => {
			const url = getShareableOrgUrl("acme", "/clients");
			expect(url).toBe("https://acme.janovix.com/clients");
		});

		it("handles empty path", () => {
			const url = getShareableOrgUrl("acme", "");
			expect(url).toBe("https://acme.janovix.com/");
		});
	});

	describe("parseOrgUrl", () => {
		it("parses vanity URL correctly", () => {
			const result = parseOrgUrl("https://acme.janovix.com/clients");
			expect(result.orgSlug).toBe("acme");
			expect(result.path).toBe("/clients");
		});

		it("parses vanity URL with nested path", () => {
			const result = parseOrgUrl("https://acme.janovix.com/clients/123/edit");
			expect(result.orgSlug).toBe("acme");
			expect(result.path).toBe("/clients/123/edit");
		});

		it("parses vanity URL with root path", () => {
			const result = parseOrgUrl("https://acme.janovix.com/");
			expect(result.orgSlug).toBe("acme");
			expect(result.path).toBe("/");
		});

		it("does not parse reserved subdomain as org slug in vanity mode", () => {
			const result = parseOrgUrl("https://app.janovix.com/clients");
			// Reserved subdomains are treated as path-based, so the first path segment becomes org slug
			expect(result.orgSlug).toBe("clients");
			expect(result.path).toBe("/");
		});

		it("parses path-based URL correctly", () => {
			const result = parseOrgUrl("https://example.com/acme/clients");
			expect(result.orgSlug).toBe("acme");
			expect(result.path).toBe("/clients");
		});

		it("parses path-based URL with nested path", () => {
			const result = parseOrgUrl("https://example.com/acme/clients/123/edit");
			expect(result.orgSlug).toBe("acme");
			expect(result.path).toBe("/clients/123/edit");
		});

		it("parses path-based URL with only org slug", () => {
			const result = parseOrgUrl("https://example.com/acme");
			expect(result.orgSlug).toBe("acme");
			expect(result.path).toBe("/");
		});

		it("handles URL without org slug in path", () => {
			const result = parseOrgUrl("https://example.com/");
			expect(result.orgSlug).toBeNull();
			expect(result.path).toBe("/");
		});

		it("handles relative path-based URL", () => {
			const result = parseOrgUrl("/acme/clients");
			expect(result.orgSlug).toBe("acme");
			expect(result.path).toBe("/clients");
		});

		it("handles invalid URL gracefully", () => {
			const result = parseOrgUrl("not-a-valid-url");
			// When URL parsing fails, it falls back to path-based parsing
			// The invalid URL gets parsed as a relative path, so "not-a-valid-url" becomes the org slug
			expect(result.orgSlug).toBe("not-a-valid-url");
			expect(result.path).toBe("/");
		});

		it("handles empty string", () => {
			const result = parseOrgUrl("");
			expect(result.orgSlug).toBeNull();
			expect(result.path).toBe("/");
		});

		it("handles case-insensitive subdomain", () => {
			const result = parseOrgUrl("https://ACME.janovix.com/clients");
			expect(result.orgSlug).toBe("acme");
			expect(result.path).toBe("/clients");
		});
	});
});
