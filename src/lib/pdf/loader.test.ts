import { describe, expect, it, afterEach, vi } from "vitest";

describe("pdf/loader", () => {
	afterEach(() => {
		delete (window as unknown as { pdfjsLib?: unknown }).pdfjsLib;
		vi.resetModules();
	});

	it("isPdfJsLoaded and getPdfJsInstance reflect window.pdfjsLib", async () => {
		const { isPdfJsLoaded, getPdfJsInstance } = await import("./loader");
		expect(isPdfJsLoaded()).toBe(false);
		expect(getPdfJsInstance()).toBeNull();

		(window as unknown as { pdfjsLib: { getDocument: () => void } }).pdfjsLib =
			{ getDocument: () => {} };

		expect(isPdfJsLoaded()).toBe(true);
		expect(getPdfJsInstance()).toBe(
			(window as unknown as { pdfjsLib: unknown }).pdfjsLib,
		);
	});

	it("loadPdfJs returns existing global without fetching CDN", async () => {
		(window as unknown as { pdfjsLib: { getDocument: () => void } }).pdfjsLib =
			{ getDocument: () => {} };

		const { loadPdfJs } = await import("./loader");
		const lib = await loadPdfJs();
		expect(lib.getDocument).toBeTypeOf("function");
	});
});
