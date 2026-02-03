import { describe, it, expect, vi, beforeEach } from "vitest";
import { getProxiedFileUrl, getProxiedFileUrls } from "./file-proxy";
import * as config from "@/lib/api/config";

// Mock the config module
vi.mock("@/lib/api/config", () => ({
	getAmlCoreBaseUrl: vi.fn(),
}));

describe("file-proxy", () => {
	const mockBaseUrl = "https://aml-svc.example.com";

	beforeEach(() => {
		vi.mocked(config.getAmlCoreBaseUrl).mockReturnValue(mockBaseUrl);
	});

	describe("getProxiedFileUrl", () => {
		it("should return undefined for undefined input", () => {
			const result = getProxiedFileUrl(undefined);
			expect(result).toBeUndefined();
		});

		it("should return undefined for null input", () => {
			const result = getProxiedFileUrl(null);
			expect(result).toBeUndefined();
		});

		it("should return undefined for empty string", () => {
			const result = getProxiedFileUrl("");
			expect(result).toBeUndefined();
		});

		it("should return proxied URL for aml-svc file URL", () => {
			const fileUrl = `${mockBaseUrl}/api/v1/files/123/document.pdf`;
			const result = getProxiedFileUrl(fileUrl);

			expect(result).toBe(`/api/proxy-file?url=${encodeURIComponent(fileUrl)}`);
		});

		it("should return original URL for non-aml-svc URL", () => {
			const fileUrl = "https://other-service.example.com/file.pdf";
			const result = getProxiedFileUrl(fileUrl);

			expect(result).toBe(fileUrl);
		});

		it("should handle URLs with special characters", () => {
			const fileUrl = `${mockBaseUrl}/api/v1/files/123/document with spaces & special.pdf`;
			const result = getProxiedFileUrl(fileUrl);

			expect(result).toBe(`/api/proxy-file?url=${encodeURIComponent(fileUrl)}`);
			expect(result).toContain("document%20with%20spaces");
		});

		it("should handle URLs with query parameters", () => {
			const fileUrl = `${mockBaseUrl}/api/v1/files/123/doc.pdf?version=2&type=final`;
			const result = getProxiedFileUrl(fileUrl);

			expect(result).toBe(`/api/proxy-file?url=${encodeURIComponent(fileUrl)}`);
		});
	});

	describe("getProxiedFileUrls", () => {
		it("should return empty array for empty input", () => {
			const result = getProxiedFileUrls([]);
			expect(result).toEqual([]);
		});

		it("should handle array with undefined and null values", () => {
			const result = getProxiedFileUrls([undefined, null, ""]);
			expect(result).toEqual([undefined, undefined, undefined]);
		});

		it("should proxy multiple aml-svc URLs", () => {
			const fileUrls = [
				`${mockBaseUrl}/api/v1/files/123/doc1.pdf`,
				`${mockBaseUrl}/api/v1/files/456/doc2.pdf`,
				`${mockBaseUrl}/api/v1/files/789/doc3.pdf`,
			];

			const result = getProxiedFileUrls(fileUrls);

			expect(result).toHaveLength(3);
			result.forEach((url, index) => {
				expect(url).toBe(
					`/api/proxy-file?url=${encodeURIComponent(fileUrls[index])}`,
				);
			});
		});

		it("should handle mixed aml-svc and external URLs", () => {
			const fileUrls = [
				`${mockBaseUrl}/api/v1/files/123/doc.pdf`,
				"https://external.com/image.jpg",
				`${mockBaseUrl}/api/v1/files/456/report.pdf`,
			];

			const result = getProxiedFileUrls(fileUrls);

			expect(result[0]).toBe(
				`/api/proxy-file?url=${encodeURIComponent(fileUrls[0])}`,
			);
			expect(result[1]).toBe("https://external.com/image.jpg");
			expect(result[2]).toBe(
				`/api/proxy-file?url=${encodeURIComponent(fileUrls[2])}`,
			);
		});

		it("should handle array with mix of valid and invalid values", () => {
			const fileUrls = [
				`${mockBaseUrl}/api/v1/files/123/doc.pdf`,
				undefined,
				"https://external.com/image.jpg",
				null,
				`${mockBaseUrl}/api/v1/files/456/report.pdf`,
			];

			const result = getProxiedFileUrls(fileUrls);

			expect(result).toHaveLength(5);
			expect(result[0]).toBe(
				`/api/proxy-file?url=${encodeURIComponent(fileUrls[0] as string)}`,
			);
			expect(result[1]).toBeUndefined();
			expect(result[2]).toBe("https://external.com/image.jpg");
			expect(result[3]).toBeUndefined();
			expect(result[4]).toBe(
				`/api/proxy-file?url=${encodeURIComponent(fileUrls[4] as string)}`,
			);
		});
	});
});
