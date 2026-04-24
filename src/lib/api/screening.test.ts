import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import {
	getClientScreeningHistory,
	getBeneficialControllerScreeningHistory,
} from "./screening";

describe("screening API", () => {
	const originalFetch = global.fetch;
	beforeEach(() => {
		vi.clearAllMocks();
	});
	afterEach(() => {
		global.fetch = originalFetch;
	});

	it("getClientScreeningHistory requests screening-history path", async () => {
		const mockJson = { items: [], pagination: { limit: 20, offset: 0, total: 0, hasMore: false } };
		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => mockJson,
			headers: { get: (n: string) => (n === "content-type" ? "application/json" : null) },
		});

		await getClientScreeningHistory("c1", {
			jwt: "j",
			baseUrl: "https://aml.test",
		});
		const url = String(vi.mocked(global.fetch).mock.calls[0][0]);
		expect(url).toMatch(/\/api\/v1\/clients\/c1\/screening-history/);
	});

	it("getBeneficialControllerScreeningHistory includes bc segment", async () => {
		const mockJson = { items: [], pagination: { limit: 20, offset: 0, total: 0, hasMore: false } };
		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => mockJson,
			headers: { get: (n: string) => (n === "content-type" ? "application/json" : null) },
		});

		await getBeneficialControllerScreeningHistory("c1", "bc1", {
			jwt: "j",
			baseUrl: "https://aml.test",
		});
		const url = String(vi.mocked(global.fetch).mock.calls[0][0]);
		expect(url).toMatch(
			/\/api\/v1\/clients\/c1\/beneficial-controllers\/bc1\/screening-history/,
		);
	});
});
