import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import {
	DocSvcError,
	confirmUpload,
	createUploadLink,
	getUploadLink,
	initiateUpload,
	listUploadLinkDocuments,
	listUploadLinks,
	pollJobUntilComplete,
	subscribeToUploadLinkEvents,
	getDocumentUrls,
	getJobStatus,
	uploadToPresignedUrl,
	getKycBaseUrl,
	getKycSessionUrl,
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
		vi.unstubAllGlobals();
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

	describe("getKycSessionUrl", () => {
		it("appends token path with custom base", () => {
			expect(getKycSessionUrl("tok-1", "https://kyc.example")).toBe(
				"https://kyc.example/kyc/tok-1",
			);
		});
	});

	describe("getKycBaseUrl", () => {
		it("returns configured KYC URL", () => {
			expect(getKycBaseUrl()).toMatch(/^https?:\/\//);
		});
	});

	describe("initiateUpload", () => {
		it("POSTs pageCount and hasPdf and returns result", async () => {
			const result = {
				documentId: "d1",
				uploadUrls: {
					originalPdfs: [],
					originalImages: [],
					rasterizedImages: ["https://u1"],
					finalPdf: "https://fp",
				},
				keys: {
					originalPdfs: [],
					originalImages: [],
					rasterizedImages: ["k1"],
					finalPdf: "kf",
				},
				expiresAt: "2099-01-01",
			};
			const fetchSpy = vi.fn(
				async (_url: RequestInfo | URL, init?: RequestInit) => {
					expect(init?.method).toBe("POST");
					const body = JSON.parse((init?.body as string) ?? "{}");
					expect(body.pageCount).toBe(2);
					expect(body.hasPdf).toBe(true);
					return new Response(JSON.stringify({ success: true, result }), {
						status: 200,
						headers: { "content-type": "application/json" },
					});
				},
			);
			vi.stubGlobal("fetch", fetchSpy);

			const out = await initiateUpload("org-1", "user-1", 2, true);
			expect(out.documentId).toBe("d1");
			expect(fetchSpy.mock.calls[0][0].toString()).toContain(
				"/documents/initiate-upload",
			);
		});

		it("throws DocSvcError when success is false", async () => {
			vi.stubGlobal(
				"fetch",
				vi.fn(async () => {
					return new Response(
						JSON.stringify({ success: false, error: "bad" }),
						{ status: 400, headers: { "content-type": "application/json" } },
					);
				}),
			);
			await expect(initiateUpload("o", "u", 1, false)).rejects.toThrow(
				DocSvcError,
			);
		});
	});

	describe("confirmUpload", () => {
		it("POSTs confirm body and omits empty original arrays", async () => {
			const result = {
				documentId: "d1",
				jobId: "j1",
				status: "PENDING",
			};
			const fetchSpy = vi.fn(
				async (_url: RequestInfo | URL, init?: RequestInit) => {
					const body = JSON.parse((init?.body as string) ?? "{}");
					expect(body.fileName).toBe("f.pdf");
					expect(body.fileSize).toBe(99);
					expect(body.pageCount).toBe(1);
					expect(body.rasterizedImages).toEqual(["r1"]);
					expect(body.finalPdfKey).toBe("fk");
					expect(body.originalPdfs).toBeUndefined();
					expect(body.originalImages).toBeUndefined();
					return new Response(JSON.stringify({ success: true, result }), {
						status: 200,
						headers: { "content-type": "application/json" },
					});
				},
			);
			vi.stubGlobal("fetch", fetchSpy);

			await confirmUpload(
				"org-1",
				"user-1",
				"d1",
				{
					originalPdfs: [],
					originalImages: [],
					rasterizedImages: ["r1"],
					finalPdf: "fk",
				},
				"f.pdf",
				99,
			);
			expect(fetchSpy.mock.calls[0][0].toString()).toContain(
				"/documents/d1/confirm",
			);
		});

		it("includes originalPdfs and originalImages when non-empty", async () => {
			const fetchSpy = vi.fn(
				async (_url: RequestInfo | URL, init?: RequestInit) => {
					const body = JSON.parse((init?.body as string) ?? "{}");
					expect(body.originalPdfs).toEqual(["p1"]);
					expect(body.originalImages).toEqual(["i1"]);
					return new Response(
						JSON.stringify({
							success: true,
							result: { documentId: "d1", jobId: "j1", status: "x" },
						}),
						{ status: 200, headers: { "content-type": "application/json" } },
					);
				},
			);
			vi.stubGlobal("fetch", fetchSpy);

			await confirmUpload(
				"org-1",
				"user-1",
				"d1",
				{
					originalPdfs: ["p1"],
					originalImages: ["i1"],
					rasterizedImages: ["r1"],
					finalPdf: "fk",
				},
				"f.pdf",
				10,
			);
		});
	});

	describe("pollJobUntilComplete", () => {
		it("returns when job reaches COMPLETED", async () => {
			let n = 0;
			vi.stubGlobal(
				"fetch",
				vi.fn(async () => {
					n++;
					const status = n < 2 ? "PROCESSING" : "COMPLETED";
					return new Response(
						JSON.stringify({
							success: true,
							result: {
								id: "job-1",
								documentId: "d1",
								status,
							},
						}),
						{ status: 200, headers: { "content-type": "application/json" } },
					);
				}),
			);

			const progress = vi.fn();
			const out = await pollJobUntilComplete("org-1", "job-1", progress, 1, 10);
			expect(out.status).toBe("COMPLETED");
			expect(progress).toHaveBeenCalled();
		});

		it("returns FAILED status without further polling", async () => {
			vi.stubGlobal(
				"fetch",
				vi.fn(async () => {
					return new Response(
						JSON.stringify({
							success: true,
							result: {
								id: "job-1",
								documentId: "d1",
								status: "FAILED",
							},
						}),
						{ status: 200, headers: { "content-type": "application/json" } },
					);
				}),
			);

			const out = await pollJobUntilComplete("org-1", "job-1", undefined, 1, 5);
			expect(out.status).toBe("FAILED");
		});

		it("throws DocSvcError on timeout", async () => {
			vi.stubGlobal(
				"fetch",
				vi.fn(async () => {
					return new Response(
						JSON.stringify({
							success: true,
							result: {
								id: "job-1",
								documentId: "d1",
								status: "PROCESSING",
							},
						}),
						{ status: 200, headers: { "content-type": "application/json" } },
					);
				}),
			);

			await expect(
				pollJobUntilComplete("org-1", "job-1", undefined, 1, 2),
			).rejects.toMatchObject({
				name: "DocSvcError",
				message: "Job polling timeout",
			});
		});
	});

	describe("createUploadLink", () => {
		it("maps requiredDocuments objects to API body", async () => {
			const fetchSpy = vi.fn(
				async (_url: RequestInfo | URL, init?: RequestInit) => {
					expect(init?.method).toBe("POST");
					const body = JSON.parse((init?.body as string) ?? "{}");
					expect(body.requiredDocuments).toEqual([
						{ type: "passport", label: "P", description: "D" },
					]);
					return new Response(
						JSON.stringify({
							success: true,
							result: {
								id: "L1",
								organizationId: "org",
								requiredDocuments: ["passport"],
								maxUploads: null,
								allowMultipleFiles: true,
								expiresAt: body.expiresAt,
								status: "ACTIVE",
								createdAt: "t",
							},
						}),
						{ status: 200, headers: { "content-type": "application/json" } },
					);
				},
			);
			vi.stubGlobal("fetch", fetchSpy);

			const res = await createUploadLink({
				requiredDocuments: [{ type: "passport", label: "P", description: "D" }],
				expiresInHours: 2,
			});
			expect(res.id).toBe("L1");
			expect(fetchSpy.mock.calls[0][0].toString()).toContain("/upload-links");
		});

		it("maps legacy requiredDocumentTypes", async () => {
			const fetchSpy = vi.fn(
				async (_url: RequestInfo | URL, init?: RequestInit) => {
					const body = JSON.parse((init?.body as string) ?? "{}");
					expect(body.requiredDocuments).toEqual([{ type: "mx_ine_front" }]);
					return new Response(
						JSON.stringify({
							success: true,
							result: {
								id: "L2",
								organizationId: "org",
								requiredDocuments: ["mx_ine_front"],
								maxUploads: null,
								allowMultipleFiles: true,
								expiresAt: body.expiresAt,
								status: "ACTIVE",
								createdAt: "t",
							},
						}),
						{ status: 200, headers: { "content-type": "application/json" } },
					);
				},
			);
			vi.stubGlobal("fetch", fetchSpy);

			await createUploadLink({
				requiredDocumentTypes: ["INE"],
			});
		});

		it("defaults requiredDocuments to other when empty", async () => {
			const fetchSpy = vi.fn(
				async (_url: RequestInfo | URL, init?: RequestInit) => {
					const body = JSON.parse((init?.body as string) ?? "{}");
					expect(body.requiredDocuments).toEqual([{ type: "other" }]);
					return new Response(
						JSON.stringify({
							success: true,
							result: {
								id: "L3",
								organizationId: "org",
								requiredDocuments: ["other"],
								maxUploads: null,
								allowMultipleFiles: true,
								expiresAt: body.expiresAt,
								status: "ACTIVE",
								createdAt: "t",
							},
						}),
						{ status: 200, headers: { "content-type": "application/json" } },
					);
				},
			);
			vi.stubGlobal("fetch", fetchSpy);

			await createUploadLink({});
		});
	});

	describe("getUploadLink", () => {
		it("returns upload link result", async () => {
			const link = {
				id: "lid",
				organizationId: "org",
				requiredDocuments: [],
				uploadedCount: 0,
				maxUploads: 1,
				allowMultipleFiles: false,
				expiresAt: "t",
				status: "ACTIVE" as const,
				createdAt: "t",
			};
			vi.stubGlobal(
				"fetch",
				vi.fn(async (url: RequestInfo | URL) => {
					expect(url.toString()).toContain("/upload-links/lid");
					return new Response(JSON.stringify({ success: true, result: link }), {
						status: 200,
						headers: { "content-type": "application/json" },
					});
				}),
			);

			expect(await getUploadLink("org", "lid")).toEqual(link);
		});
	});

	describe("listUploadLinks", () => {
		it("appends status query when provided", async () => {
			const body = { items: [], total: 0 };
			vi.stubGlobal(
				"fetch",
				vi.fn(async (url: RequestInfo | URL) => {
					const u = new URL(url.toString());
					expect(u.pathname.endsWith("/upload-links")).toBe(true);
					expect(u.searchParams.get("status")).toBe("ACTIVE");
					expect(u.searchParams.get("limit")).toBe("5");
					expect(u.searchParams.get("offset")).toBe("10");
					return new Response(JSON.stringify({ success: true, result: body }), {
						status: 200,
						headers: { "content-type": "application/json" },
					});
				}),
			);

			expect(await listUploadLinks("org", "ACTIVE", 5, 10)).toEqual(body);
		});
	});

	describe("listUploadLinkDocuments", () => {
		it("returns documents array", async () => {
			const docs = [
				{
					id: "doc",
					fileName: "a.pdf",
					fileSize: 1,
					pageCount: 1,
					documentType: null,
					createdAt: "t",
				},
			];
			vi.stubGlobal(
				"fetch",
				vi.fn(async (url: RequestInfo | URL) => {
					expect(url.toString()).toContain("/upload-links/l1/documents");
					return new Response(
						JSON.stringify({ success: true, result: { documents: docs } }),
						{ status: 200, headers: { "content-type": "application/json" } },
					);
				}),
			);

			expect(await listUploadLinkDocuments("l1")).toEqual(docs);
		});
	});

	describe("subscribeToUploadLinkEvents", () => {
		let OriginalEventSource: typeof EventSource;

		beforeEach(() => {
			OriginalEventSource = globalThis.EventSource;
		});

		afterEach(() => {
			globalThis.EventSource = OriginalEventSource;
		});

		it("creates EventSource with token query and returns close cleanup", () => {
			const instances: Array<{ url: string; close: ReturnType<typeof vi.fn> }> =
				[];
			class MockEventSource {
				url: string;
				onmessage: ((ev: MessageEvent) => void) | null = null;
				onerror: ((ev: Event) => void) | null = null;
				close = vi.fn();
				constructor(url: string) {
					this.url = url;
					instances.push(this);
				}
			}
			globalThis.EventSource = MockEventSource as unknown as typeof EventSource;

			const onEvent = vi.fn();
			const cleanup = subscribeToUploadLinkEvents(
				"link-9",
				"tok%20en",
				onEvent,
			);

			expect(instances).toHaveLength(1);
			expect(instances[0].url).toContain("/upload-links/link-9/events?");
			expect(instances[0].url).toContain(encodeURIComponent("tok%20en"));

			const inst = instances[0] as unknown as {
				onmessage: (e: MessageEvent) => void;
			};
			inst.onmessage(
				new MessageEvent("message", {
					data: JSON.stringify({
						type: "keep-alive",
						uploadLinkId: "link-9",
						timestamp: "now",
					}),
				}),
			);
			expect(onEvent).toHaveBeenCalled();

			cleanup();
			expect(instances[0].close).toHaveBeenCalled();
		});
	});
});
