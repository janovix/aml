import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import { fetchWatchlistConfig, getQueryResults } from "./watchlist";

vi.mock("@/lib/auth/tokenCache", () => ({
	tokenCache: {
		getCachedToken: vi.fn(),
	},
}));

import { tokenCache } from "@/lib/auth/tokenCache";

describe("fetchWatchlistConfig", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("returns features from successful /config response", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async (url: RequestInfo | URL) => {
				const u = typeof url === "string" ? url : url.toString();
				expect(u).toContain("/config");
				return new Response(
					JSON.stringify({
						success: true,
						result: {
							features: {
								pepSearch: false,
								pepGrok: true,
								adverseMedia: false,
							},
						},
					}),
					{ status: 200, headers: { "content-type": "application/json" } },
				);
			}),
		);

		const cfg = await fetchWatchlistConfig();
		expect(cfg.pepSearch).toBe(false);
		expect(cfg.pepGrok).toBe(true);
	});

	it("returns defaults when /config is not ok", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => new Response("", { status: 500 })),
		);
		const cfg = await fetchWatchlistConfig();
		expect(cfg.pepSearch).toBe(true);
		expect(cfg.adverseMedia).toBe(true);
	});

	it("returns defaults on network error", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => Promise.reject(new Error("net"))),
		);
		const cfg = await fetchWatchlistConfig();
		expect(cfg.pepSearch).toBe(true);
	});
});

describe("getQueryResults", () => {
	beforeEach(() => {
		vi.mocked(tokenCache.getCachedToken).mockResolvedValue("jwt-1");
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("returns result when success", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async (url: RequestInfo | URL) => {
				const u = typeof url === "string" ? url : url.toString();
				expect(u).toContain("/queries/q1");
				return new Response(
					JSON.stringify({
						success: true,
						result: { id: "q1", organizationId: "o1" },
					}),
					{ status: 200, headers: { "content-type": "application/json" } },
				);
			}),
		);

		const r = await getQueryResults("q1");
		expect(r?.id).toBe("q1");
	});

	it("returns null when response not ok", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => new Response("", { status: 404 })),
		);
		expect(await getQueryResults("q1")).toBeNull();
	});
});
