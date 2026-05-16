import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
	fetchTrainingModuleImageBlob,
	IMAGE_FETCH_FAILED,
	IMAGE_INVALID_CONTENT_TYPE,
	IMAGE_SESSION_EXPIRED,
	mapTrainingModuleImageError,
} from "./fetchTrainingModulePdf";

describe("fetchTrainingModuleImageBlob", () => {
	beforeEach(() => {
		vi.stubGlobal("fetch", vi.fn());
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("throws AbortError when signal is already aborted", async () => {
		const ac = new AbortController();
		ac.abort();

		await expect(
			fetchTrainingModuleImageBlob("https://api.example.com/asset", ac.signal),
		).rejects.toMatchObject({ name: "AbortError" });
		expect(fetch).not.toHaveBeenCalled();
	});

	it("throws IMAGE_SESSION_EXPIRED on 401", async () => {
		vi.mocked(fetch).mockResolvedValueOnce(new Response("", { status: 401 }));

		await expect(
			fetchTrainingModuleImageBlob(
				"https://api.example.com/asset",
				new AbortController().signal,
			),
		).rejects.toThrow(IMAGE_SESSION_EXPIRED);
	});

	it("throws IMAGE_SESSION_EXPIRED on 403", async () => {
		vi.mocked(fetch).mockResolvedValueOnce(new Response("", { status: 403 }));

		await expect(
			fetchTrainingModuleImageBlob(
				"https://api.example.com/asset",
				new AbortController().signal,
			),
		).rejects.toThrow(IMAGE_SESSION_EXPIRED);
	});

	it("throws IMAGE_FETCH_FAILED on other non-OK statuses", async () => {
		vi.mocked(fetch).mockResolvedValueOnce(new Response("", { status: 500 }));

		await expect(
			fetchTrainingModuleImageBlob(
				"https://api.example.com/asset",
				new AbortController().signal,
			),
		).rejects.toThrow(IMAGE_FETCH_FAILED);
	});

	it("throws IMAGE_INVALID_CONTENT_TYPE when Content-Type is not image/*", async () => {
		vi.mocked(fetch).mockResolvedValueOnce(
			new Response(new Blob(["not-image"]), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			}),
		);

		await expect(
			fetchTrainingModuleImageBlob(
				"https://api.example.com/asset",
				new AbortController().signal,
			),
		).rejects.toThrow(IMAGE_INVALID_CONTENT_TYPE);
	});

	it("returns a Blob when Content-Type is image/*", async () => {
		vi.mocked(fetch).mockResolvedValueOnce(
			new Response(new Blob([Uint8Array.from([137, 80])]), {
				status: 200,
				headers: { "Content-Type": "image/png" },
			}),
		);

		const blob = await fetchTrainingModuleImageBlob(
			"https://api.example.com/asset",
			new AbortController().signal,
		);

		expect(blob.type).toMatch(/^image\//);
	});

	it("mapTrainingModuleImageError maps session expiry and abort", () => {
		expect(mapTrainingModuleImageError(new Error(IMAGE_SESSION_EXPIRED))).toBe(
			"trainingImageSessionExpired",
		);
		expect(
			mapTrainingModuleImageError(new DOMException("Aborted", "AbortError")),
		).toBe("trainingImageLoadFailed");
		expect(mapTrainingModuleImageError(new Error(IMAGE_FETCH_FAILED))).toBe(
			"trainingImageLoadFailed",
		);
	});
});
