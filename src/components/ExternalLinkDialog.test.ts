import { describe, expect, it } from "vitest";
import {
	ensureProtocol,
	extractHostname,
	looksLikeUrl,
} from "./ExternalLinkDialog";

describe("looksLikeUrl", () => {
	it("detects http(s) URLs", () => {
		expect(looksLikeUrl("https://example.com/path")).toBe(true);
		expect(looksLikeUrl("HTTP://EXAMPLE.COM")).toBe(true);
	});
	it("detects bare domains", () => {
		expect(looksLikeUrl("mx.linkedin.com")).toBe(true);
		expect(looksLikeUrl("sub.example.co.uk/foo ")).toBe(true);
	});
	it("rejects plain text", () => {
		expect(looksLikeUrl("not a url")).toBe(false);
	});
});

describe("ensureProtocol", () => {
	it("leaves existing protocol", () => {
		expect(ensureProtocol("https://a.com")).toBe("https://a.com");
		expect(ensureProtocol("http://a.com")).toBe("http://a.com");
	});
	it("prefixes https for bare host", () => {
		expect(ensureProtocol(" example.com ")).toBe("https://example.com");
	});
});

describe("extractHostname", () => {
	it("parses hostname from URL and bare domain", () => {
		expect(extractHostname("https://www.bank.com/x")).toBe("www.bank.com");
		expect(extractHostname("bank.com")).toBe("bank.com");
	});
});
