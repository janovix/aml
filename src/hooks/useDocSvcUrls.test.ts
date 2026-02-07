import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useDocSvcUrls, useDocSvcImageUrl } from "./useDocSvcUrls";
import type { DocumentUrlsResponse } from "@/lib/api/doc-svc";

const mockGetDocumentUrls = vi.fn();
vi.mock("@/lib/api/doc-svc", () => ({
	getDocumentUrls: (...args: unknown[]) => mockGetDocumentUrls(...args),
}));

const mockResponse: DocumentUrlsResponse = {
	pdfUrl: "https://example.com/doc.pdf",
	imageUrls: [
		"https://example.com/page-1.jpg",
		"https://example.com/page-2.jpg",
	],
	expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
};

describe("useDocSvcUrls", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("fetches URLs when documentId and organizationId are provided", async () => {
		mockGetDocumentUrls.mockResolvedValue(mockResponse);

		const { result } = renderHook(() =>
			useDocSvcUrls({
				organizationId: "org-1",
				documentId: "doc-1",
				autoRefresh: false,
			}),
		);

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.pdfUrl).toBe("https://example.com/doc.pdf");
		expect(result.current.imageUrls).toHaveLength(2);
		expect(result.current.expiresAt).toBe(mockResponse.expiresAt);
		expect(result.current.error).toBeNull();
		expect(mockGetDocumentUrls).toHaveBeenCalledWith("org-1", "doc-1", "all");
	});

	it("does not fetch when documentId is null", async () => {
		const { result } = renderHook(() =>
			useDocSvcUrls({
				organizationId: "org-1",
				documentId: null,
				autoRefresh: false,
			}),
		);

		// Should immediately settle without loading
		await waitFor(() => {
			expect(result.current.pdfUrl).toBeNull();
		});

		expect(result.current.imageUrls).toEqual([]);
		expect(mockGetDocumentUrls).not.toHaveBeenCalled();
	});

	it("does not fetch when organizationId is empty", async () => {
		const { result } = renderHook(() =>
			useDocSvcUrls({
				organizationId: "",
				documentId: "doc-1",
				autoRefresh: false,
			}),
		);

		await waitFor(() => {
			expect(result.current.pdfUrl).toBeNull();
		});

		expect(mockGetDocumentUrls).not.toHaveBeenCalled();
	});

	it("handles API errors", async () => {
		mockGetDocumentUrls.mockRejectedValue(new Error("Network error"));

		const { result } = renderHook(() =>
			useDocSvcUrls({
				organizationId: "org-1",
				documentId: "doc-1",
				autoRefresh: false,
			}),
		);

		await waitFor(() => {
			expect(result.current.error).not.toBeNull();
		});

		expect(result.current.error).toBeInstanceOf(Error);
		expect(result.current.error?.message).toBe("Network error");
		expect(result.current.pdfUrl).toBeNull();
		expect(result.current.imageUrls).toEqual([]);
	});

	it("wraps non-Error thrown values", async () => {
		mockGetDocumentUrls.mockRejectedValue("string error");

		const { result } = renderHook(() =>
			useDocSvcUrls({
				organizationId: "org-1",
				documentId: "doc-1",
				autoRefresh: false,
			}),
		);

		await waitFor(() => {
			expect(result.current.error).not.toBeNull();
		});

		expect(result.current.error?.message).toBe("Failed to fetch URLs");
	});

	it("passes type parameter to API", async () => {
		mockGetDocumentUrls.mockResolvedValue(mockResponse);

		renderHook(() =>
			useDocSvcUrls({
				organizationId: "org-1",
				documentId: "doc-1",
				type: "images",
				autoRefresh: false,
			}),
		);

		await waitFor(() => {
			expect(mockGetDocumentUrls).toHaveBeenCalledWith(
				"org-1",
				"doc-1",
				"images",
			);
		});
	});

	it("auto-refreshes at the configured interval", async () => {
		vi.useFakeTimers({ shouldAdvanceTime: true });
		mockGetDocumentUrls.mockResolvedValue(mockResponse);

		renderHook(() =>
			useDocSvcUrls({
				organizationId: "org-1",
				documentId: "doc-1",
				autoRefresh: true,
				refreshInterval: 1000,
			}),
		);

		// Initial fetch
		await waitFor(() => {
			expect(mockGetDocumentUrls).toHaveBeenCalledTimes(1);
		});

		// Advance timer for auto-refresh
		await act(async () => {
			vi.advanceTimersByTime(1000);
		});

		expect(mockGetDocumentUrls).toHaveBeenCalledTimes(2);
		vi.useRealTimers();
	});

	it("cleans up interval on unmount", async () => {
		mockGetDocumentUrls.mockResolvedValue(mockResponse);
		const clearIntervalSpy = vi.spyOn(global, "clearInterval");

		const { unmount } = renderHook(() =>
			useDocSvcUrls({
				organizationId: "org-1",
				documentId: "doc-1",
				autoRefresh: true,
				refreshInterval: 60000,
			}),
		);

		await waitFor(() => {
			expect(mockGetDocumentUrls).toHaveBeenCalledTimes(1);
		});

		unmount();
		expect(clearIntervalSpy).toHaveBeenCalled();
		clearIntervalSpy.mockRestore();
	});

	it("exposes a manual refresh function", async () => {
		mockGetDocumentUrls.mockResolvedValue(mockResponse);

		const { result } = renderHook(() =>
			useDocSvcUrls({
				organizationId: "org-1",
				documentId: "doc-1",
				autoRefresh: false,
			}),
		);

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(mockGetDocumentUrls).toHaveBeenCalledTimes(1);

		await act(async () => {
			await result.current.refresh();
		});

		expect(mockGetDocumentUrls).toHaveBeenCalledTimes(2);
	});

	it("handles response without pdfUrl", async () => {
		mockGetDocumentUrls.mockResolvedValue({
			imageUrls: ["https://example.com/page-1.jpg"],
			expiresAt: mockResponse.expiresAt,
		});

		const { result } = renderHook(() =>
			useDocSvcUrls({
				organizationId: "org-1",
				documentId: "doc-1",
				autoRefresh: false,
			}),
		);

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.pdfUrl).toBeNull();
		expect(result.current.imageUrls).toHaveLength(1);
	});
});

describe("useDocSvcImageUrl", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns the first image URL by default", async () => {
		mockGetDocumentUrls.mockResolvedValue(mockResponse);

		const { result } = renderHook(() =>
			useDocSvcImageUrl({
				organizationId: "org-1",
				documentId: "doc-1",
			}),
		);

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.url).toBe("https://example.com/page-1.jpg");
	});

	it("returns URL at specified index", async () => {
		mockGetDocumentUrls.mockResolvedValue(mockResponse);

		const { result } = renderHook(() =>
			useDocSvcImageUrl({
				organizationId: "org-1",
				documentId: "doc-1",
				imageIndex: 1,
			}),
		);

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.url).toBe("https://example.com/page-2.jpg");
	});

	it("returns null when index is out of bounds", async () => {
		mockGetDocumentUrls.mockResolvedValue(mockResponse);

		const { result } = renderHook(() =>
			useDocSvcImageUrl({
				organizationId: "org-1",
				documentId: "doc-1",
				imageIndex: 99,
			}),
		);

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.url).toBeNull();
	});

	it("returns null when documentId is null", async () => {
		const { result } = renderHook(() =>
			useDocSvcImageUrl({
				organizationId: "org-1",
				documentId: null,
			}),
		);

		await waitFor(() => {
			expect(result.current.url).toBeNull();
		});

		expect(mockGetDocumentUrls).not.toHaveBeenCalled();
	});
});
