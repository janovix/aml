import { describe, it, expect, vi, afterEach } from "vitest";
import {
	DocSvcError,
	getDocumentUrls,
	getJobStatus,
	uploadToPresignedUrl,
	getUploadLinkUrl,
} from "./doc-svc";

// Mock the tokenCache
vi.mock("@/lib/auth/tokenCache", () => ({
	tokenCache: {
		getCachedToken: vi.fn().mockResolvedValue("mock-token"),
	},
}));

describe("api/doc-svc", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("DocSvcError", () => {
		it("creates error with message and status", () => {
			const err = new DocSvcError("Not found", 404);
			expect(err.message).toBe("Not found");
			expect(err.status).toBe(404);
			expect(err.name).toBe("DocSvcError");
		});
	});

	describe("getDocumentUrls", () => {
		it("fetches document URLs successfully", async () => {
			const mockResult = {
				pdfUrl: "https://r2.example.com/doc.pdf",
				imageUrls: ["https://r2.example.com/page-1.jpg"],
				expiresAt: "2024-12-31T23:59:59Z",
			};

			vi.stubGlobal(
				"fetch",
				vi.fn(async (url: RequestInfo | URL) => {
					const u = typeof url === "string" ? url : url.toString();
					expect(u).toContain("/documents/doc-1/urls?type=all");
					return new Response(
						JSON.stringify({ success: true, result: mockResult }),
						{ status: 200, headers: { "content-type": "application/json" } },
					);
				}),
			);

			const result = await getDocumentUrls("org-1", "doc-1", "all");
			expect(result.pdfUrl).toBe("https://r2.example.com/doc.pdf");
			expect(result.imageUrls).toHaveLength(1);
		});

		it("throws DocSvcError on failure", async () => {
			vi.stubGlobal(
				"fetch",
				vi.fn(
					async () =>
						new Response(
							JSON.stringify({ success: false, error: "Document not found" }),
							{ status: 404 },
						),
				),
			);

			await expect(getDocumentUrls("org-1", "doc-1")).rejects.toThrow(
				DocSvcError,
			);
		});
	});

	describe("getJobStatus", () => {
		it("fetches job status successfully", async () => {
			const mockResult = {
				id: "job-1",
				documentId: "doc-1",
				status: "COMPLETED",
				decision: "APPROVED",
			};

			vi.stubGlobal(
				"fetch",
				vi.fn(async (url: RequestInfo | URL) => {
					const u = typeof url === "string" ? url : url.toString();
					expect(u).toContain("/jobs/job-1");
					return new Response(
						JSON.stringify({ success: true, result: mockResult }),
						{ status: 200, headers: { "content-type": "application/json" } },
					);
				}),
			);

			const result = await getJobStatus("org-1", "job-1");
			expect(result.status).toBe("COMPLETED");
			expect(result.decision).toBe("APPROVED");
		});

		it("throws DocSvcError on failure", async () => {
			vi.stubGlobal(
				"fetch",
				vi.fn(
					async () =>
						new Response(
							JSON.stringify({ success: false, error: "Job not found" }),
							{ status: 404 },
						),
				),
			);

			await expect(getJobStatus("org-1", "job-1")).rejects.toThrow(DocSvcError);
		});
	});

	describe("uploadToPresignedUrl", () => {
		it("uploads blob to presigned URL with PUT", async () => {
			vi.stubGlobal(
				"fetch",
				vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
					expect(url).toBe("https://r2.example.com/upload");
					expect(init?.method).toBe("PUT");
					expect(
						(init?.headers as Record<string, string>)["Content-Type"],
					).toBe("image/jpeg");
					return new Response(null, { status: 200 });
				}),
			);

			const blob = new Blob(["image data"], { type: "image/jpeg" });
			await uploadToPresignedUrl(
				"https://r2.example.com/upload",
				blob,
				"image/jpeg",
			);
		});

		it("throws DocSvcError on upload failure", async () => {
			vi.stubGlobal(
				"fetch",
				vi.fn(async () => new Response(null, { status: 403 })),
			);

			const blob = new Blob(["data"]);
			await expect(
				uploadToPresignedUrl(
					"https://r2.example.com/upload",
					blob,
					"image/jpeg",
				),
			).rejects.toThrow(DocSvcError);
		});
	});

	describe("getUploadLinkUrl", () => {
		it("generates correct URL with default base", () => {
			const url = getUploadLinkUrl("link-123");
			expect(url).toContain("link-123");
		});

		it("generates correct URL with custom base", () => {
			const url = getUploadLinkUrl("link-123", "https://scan.test.com");
			expect(url).toBe("https://scan.test.com/link-123");
		});
	});
});
