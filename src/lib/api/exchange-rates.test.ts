import { describe, expect, it, vi, afterEach } from "vitest";
import { fetchExchangeRate } from "./exchange-rates";

describe("fetchExchangeRate", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("returns parsed JSON on success", async () => {
		const payload = {
			from: "USD",
			to: "MXN",
			rate: 18.5,
			timestamp: 1,
		};
		vi.stubGlobal(
			"fetch",
			vi.fn(async (url: RequestInfo | URL) => {
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.pathname).toContain("/api/v1/exchange-rates");
				expect(u.searchParams.get("from")).toBe("USD");
				expect(u.searchParams.get("to")).toBe("MXN");
				return new Response(JSON.stringify(payload), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			}),
		);

		const out = await fetchExchangeRate("USD", "MXN", {
			baseUrl: "https://aml.example",
		});
		expect(out).toEqual(payload);
	});

	it("returns null when fetchJson throws", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => {
				return new Response("{}", {
					status: 503,
					statusText: "Unavailable",
					headers: { "content-type": "application/json" },
				});
			}),
		);

		const out = await fetchExchangeRate("USD", "MXN", {
			baseUrl: "https://aml.example",
		});
		expect(out).toBeNull();
	});
});
