import { describe, it, expect, vi, afterEach } from "vitest";
import { downloadFile } from "./download";

describe("api/download", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("downloads a file and triggers browser download", async () => {
		const mockBlob = new Blob(["pdf content"], { type: "application/pdf" });
		const mockUrl = "blob:http://localhost/fake-blob-url";

		vi.stubGlobal(
			"fetch",
			vi.fn(
				async () =>
					new Response(mockBlob, {
						status: 200,
						headers: {
							"Content-Disposition": 'attachment; filename="report.pdf"',
						},
					}),
			),
		);

		const createObjectURLSpy = vi
			.spyOn(URL, "createObjectURL")
			.mockReturnValue(mockUrl);
		const revokeObjectURLSpy = vi
			.spyOn(URL, "revokeObjectURL")
			.mockImplementation(() => {});

		const clickSpy = vi.fn();
		const appendChildSpy = vi
			.spyOn(document.body, "appendChild")
			.mockImplementation((node) => {
				// Spy on click before it's called
				(node as HTMLAnchorElement).click = clickSpy;
				return node;
			});
		const removeChildSpy = vi
			.spyOn(document.body, "removeChild")
			.mockImplementation((node) => node);

		await downloadFile({
			url: "/api/v1/reports/1/download",
			defaultFileName: "default.pdf",
			baseUrl: "https://example.com",
		});

		expect(appendChildSpy).toHaveBeenCalled();
		expect(clickSpy).toHaveBeenCalled();
		expect(removeChildSpy).toHaveBeenCalled();
		expect(revokeObjectURLSpy).toHaveBeenCalledWith(mockUrl);
		createObjectURLSpy.mockRestore();
	});

	it("uses filename from Content-Disposition header", async () => {
		const mockBlob = new Blob(["data"]);

		vi.stubGlobal(
			"fetch",
			vi.fn(
				async () =>
					new Response(mockBlob, {
						status: 200,
						headers: {
							"Content-Disposition": 'attachment; filename="custom-name.xlsx"',
						},
					}),
			),
		);

		vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:url");
		vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

		let capturedLink: HTMLAnchorElement | undefined;
		vi.spyOn(document.body, "appendChild").mockImplementation((node) => {
			capturedLink = node as HTMLAnchorElement;
			capturedLink.click = vi.fn();
			return node;
		});
		vi.spyOn(document.body, "removeChild").mockImplementation((node) => node);

		await downloadFile({
			url: "https://example.com/file",
			defaultFileName: "fallback.xlsx",
		});

		expect(capturedLink).toBeDefined();
		expect(capturedLink!.download).toBe("custom-name.xlsx");
	});

	it("uses default filename when no Content-Disposition header", async () => {
		const mockBlob = new Blob(["data"]);

		vi.stubGlobal(
			"fetch",
			vi.fn(async () => new Response(mockBlob, { status: 200 })),
		);

		vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:url");
		vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

		let capturedLink: HTMLAnchorElement | undefined;
		vi.spyOn(document.body, "appendChild").mockImplementation((node) => {
			capturedLink = node as HTMLAnchorElement;
			capturedLink.click = vi.fn();
			return node;
		});
		vi.spyOn(document.body, "removeChild").mockImplementation((node) => node);

		await downloadFile({
			url: "https://example.com/file",
			defaultFileName: "fallback.pdf",
		});

		expect(capturedLink).toBeDefined();
		expect(capturedLink!.download).toBe("fallback.pdf");
	});

	it("throws on non-OK response with JSON error", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(
				async () =>
					new Response(JSON.stringify({ message: "Not authorized" }), {
						status: 403,
						headers: { "content-type": "application/json" },
					}),
			),
		);

		await expect(
			downloadFile({
				url: "https://example.com/file",
				defaultFileName: "file.pdf",
			}),
		).rejects.toThrow("Not authorized");
	});

	it("throws on non-OK response without JSON", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(
				async () =>
					new Response("Server Error", {
						status: 500,
						statusText: "Internal Server Error",
					}),
			),
		);

		await expect(
			downloadFile({
				url: "https://example.com/file",
				defaultFileName: "file.pdf",
			}),
		).rejects.toThrow("Download failed: 500 Internal Server Error");
	});

	it("passes JWT as Authorization header", async () => {
		const mockBlob = new Blob(["data"]);
		vi.stubGlobal(
			"fetch",
			vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
				const headers = init?.headers as Record<string, string>;
				expect(headers.Authorization).toBe("Bearer jwt-123");
				return new Response(mockBlob, { status: 200 });
			}),
		);

		vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:url");
		vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
		vi.spyOn(document.body, "appendChild").mockImplementation((node) => {
			(node as HTMLAnchorElement).click = vi.fn();
			return node;
		});
		vi.spyOn(document.body, "removeChild").mockImplementation((node) => node);

		await downloadFile({
			url: "https://example.com/file",
			defaultFileName: "file.pdf",
			jwt: "jwt-123",
		});
	});

	it("handles absolute URLs directly without baseUrl", async () => {
		const mockBlob = new Blob(["data"]);
		vi.stubGlobal(
			"fetch",
			vi.fn(async (url: RequestInfo | URL) => {
				expect(url).toBe("https://cdn.example.com/downloads/file.pdf");
				return new Response(mockBlob, { status: 200 });
			}),
		);

		vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:url");
		vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
		vi.spyOn(document.body, "appendChild").mockImplementation((node) => {
			(node as HTMLAnchorElement).click = vi.fn();
			return node;
		});
		vi.spyOn(document.body, "removeChild").mockImplementation((node) => node);

		await downloadFile({
			url: "https://cdn.example.com/downloads/file.pdf",
			defaultFileName: "file.pdf",
		});
	});
});
