import { describe, expect, it, vi, afterEach } from "vitest";
import { ApiError, fetchJson } from "./http";

describe("api/http fetchJson", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});
	it("returns parsed JSON for ok responses", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => {
				return new Response(JSON.stringify({ ok: true }), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			}),
		);

		const res = await fetchJson<{ ok: boolean }>("https://example.com");
		expect(res.status).toBe(200);
		expect(res.json).toEqual({ ok: true });
	});

	it("returns null when JSON parsing fails but response is ok", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => {
				return new Response("not json", {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			}),
		);

		const res = await fetchJson<unknown>("https://example.com");
		expect(res.json).toBeNull();
	});

	it("returns text when content-type is not JSON", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => {
				return new Response("ok", {
					status: 200,
					headers: { "content-type": "text/plain" },
				});
			}),
		);

		const res = await fetchJson<string>("https://example.com");
		expect(res.json).toBe("ok");
	});

	it("throws ApiError and includes parsed body on non-2xx JSON responses", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => {
				return new Response(JSON.stringify({ message: "bad" }), {
					status: 400,
					statusText: "Bad Request",
					headers: { "content-type": "application/json" },
				});
			}),
		);

		await expect(fetchJson("https://example.com")).rejects.toBeInstanceOf(
			ApiError,
		);

		try {
			await fetchJson("https://example.com");
		} catch (e) {
			const err = e as ApiError;
			expect(err.status).toBe(400);
			expect(err.body).toEqual({ message: "bad" });
		}
	});

	it("throws ApiError and includes text body on non-2xx non-JSON responses", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => {
				return new Response("oops", {
					status: 500,
					statusText: "Internal Server Error",
					headers: { "content-type": "text/plain" },
				});
			}),
		);

		try {
			await fetchJson("https://example.com");
			throw new Error("expected to throw");
		} catch (e) {
			const err = e as ApiError;
			expect(err.status).toBe(500);
			expect(err.body).toBe("oops");
		}
	});

	it("includes Authorization header when jwt option is provided", async () => {
		const mockFetch = vi.fn(async () => {
			return new Response(JSON.stringify({ ok: true }), {
				status: 200,
				headers: { "content-type": "application/json" },
			});
		});
		vi.stubGlobal("fetch", mockFetch);

		await fetchJson("https://example.com", { jwt: "test-token-123" });

		expect(mockFetch).toHaveBeenCalledWith(
			"https://example.com",
			expect.objectContaining({
				headers: expect.objectContaining({
					Authorization: "Bearer test-token-123",
				}),
			}),
		);
	});

	it("does not include Authorization header when jwt is null", async () => {
		const mockFetch = vi.fn(async () => {
			return new Response(JSON.stringify({ ok: true }), {
				status: 200,
				headers: { "content-type": "application/json" },
			});
		});
		vi.stubGlobal("fetch", mockFetch);

		await fetchJson("https://example.com", { jwt: null });

		expect(mockFetch).toHaveBeenCalledWith(
			"https://example.com",
			expect.objectContaining({
				headers: expect.not.objectContaining({
					Authorization: expect.any(String),
				}),
			}),
		);
	});

	it("does not auto-fetch JWT in test environment when jwt is undefined", async () => {
		const mockFetch = vi.fn(async () => {
			return new Response(JSON.stringify({ ok: true }), {
				status: 200,
				headers: { "content-type": "application/json" },
			});
		});
		vi.stubGlobal("fetch", mockFetch);

		// In test environment, JWT should not be auto-fetched
		await fetchJson("https://example.com");

		// Authorization header should not be present
		expect(mockFetch).toHaveBeenCalledWith(
			"https://example.com",
			expect.objectContaining({
				headers: expect.not.objectContaining({
					Authorization: expect.any(String),
				}),
			}),
		);
	});

	it("passes request options through to fetch", async () => {
		const mockFetch = vi.fn(async () => {
			return new Response(JSON.stringify({ ok: true }), {
				status: 200,
				headers: { "content-type": "application/json" },
			});
		});
		vi.stubGlobal("fetch", mockFetch);

		const controller = new AbortController();
		await fetchJson("https://example.com", {
			method: "POST",
			body: JSON.stringify({ test: true }),
			signal: controller.signal,
		});

		expect(mockFetch).toHaveBeenCalledWith(
			"https://example.com",
			expect.objectContaining({
				method: "POST",
				body: JSON.stringify({ test: true }),
				signal: controller.signal,
			}),
		);
	});

	it("merges custom headers with accept header", async () => {
		const mockFetch = vi.fn(async () => {
			return new Response(JSON.stringify({ ok: true }), {
				status: 200,
				headers: { "content-type": "application/json" },
			});
		});
		vi.stubGlobal("fetch", mockFetch);

		await fetchJson("https://example.com", {
			headers: { "content-type": "application/json" },
		});

		expect(mockFetch).toHaveBeenCalledWith(
			"https://example.com",
			expect.objectContaining({
				headers: expect.objectContaining({
					accept: "application/json",
					"content-type": "application/json",
				}),
			}),
		);
	});

	it("handles missing content-type header gracefully", async () => {
		const mockFetch = vi.fn(async () => {
			return new Response("ok", {
				status: 200,
				// No content-type header
			});
		});
		vi.stubGlobal("fetch", mockFetch);

		const res = await fetchJson<string>("https://example.com");
		expect(res.json).toBe("ok");
	});

	it("handles null content-type header gracefully", async () => {
		const mockFetch = vi.fn(async () => {
			const response = new Response("ok", {
				status: 200,
			});
			// Mock headers.get to return null
			vi.spyOn(response.headers, "get").mockReturnValue(null);
			return response;
		});
		vi.stubGlobal("fetch", mockFetch);

		const res = await fetchJson<string>("https://example.com");
		expect(res.json).toBe("ok");
	});
});
