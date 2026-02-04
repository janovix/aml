import { describe, expect, it } from "vitest";
import {
	DEFAULT_API_BASE_URL,
	getUpstreamApiBaseUrl,
	getAmlCoreBaseUrl,
} from "./config";

// TEMPORARY: Using rs-scan preview server for testing
const DEFAULT_AML_CORE_URL = "https://rs-scan-aml-svc.janovix.workers.dev";
const DEFAULT_UMA_SERVICE_URL = "https://uma-aml-svc.janovix.workers.dev";

describe("api/config", () => {
	describe("getUpstreamApiBaseUrl", () => {
		it("prefers ALGTOOLS_API_BASE_URL over NEXT_PUBLIC_ALGTOOLS_API_BASE_URL", () => {
			const prevAlg = process.env.ALGTOOLS_API_BASE_URL;
			const prevPublic = process.env.NEXT_PUBLIC_ALGTOOLS_API_BASE_URL;

			try {
				process.env.ALGTOOLS_API_BASE_URL = "https://server.example";
				process.env.NEXT_PUBLIC_ALGTOOLS_API_BASE_URL =
					"https://public.example";
				expect(getUpstreamApiBaseUrl()).toBe("https://server.example");
			} finally {
				if (prevAlg === undefined) delete process.env.ALGTOOLS_API_BASE_URL;
				else process.env.ALGTOOLS_API_BASE_URL = prevAlg;
				if (prevPublic === undefined)
					delete process.env.NEXT_PUBLIC_ALGTOOLS_API_BASE_URL;
				else process.env.NEXT_PUBLIC_ALGTOOLS_API_BASE_URL = prevPublic;
			}
		});

		it("falls back to DEFAULT_API_BASE_URL when env vars are unset", () => {
			const prevAlg = process.env.ALGTOOLS_API_BASE_URL;
			const prevPublic = process.env.NEXT_PUBLIC_ALGTOOLS_API_BASE_URL;

			try {
				delete process.env.ALGTOOLS_API_BASE_URL;
				delete process.env.NEXT_PUBLIC_ALGTOOLS_API_BASE_URL;
				expect(getUpstreamApiBaseUrl()).toBe(DEFAULT_API_BASE_URL);
			} finally {
				if (prevAlg === undefined) delete process.env.ALGTOOLS_API_BASE_URL;
				else process.env.ALGTOOLS_API_BASE_URL = prevAlg;
				if (prevPublic === undefined)
					delete process.env.NEXT_PUBLIC_ALGTOOLS_API_BASE_URL;
				else process.env.NEXT_PUBLIC_ALGTOOLS_API_BASE_URL = prevPublic;
			}
		});

		it("uses NEXT_PUBLIC_ALGTOOLS_API_BASE_URL when server env var is unset", () => {
			const prevAlg = process.env.ALGTOOLS_API_BASE_URL;
			const prevPublic = process.env.NEXT_PUBLIC_ALGTOOLS_API_BASE_URL;

			try {
				delete process.env.ALGTOOLS_API_BASE_URL;
				process.env.NEXT_PUBLIC_ALGTOOLS_API_BASE_URL =
					"https://public.example";
				expect(getUpstreamApiBaseUrl()).toBe("https://public.example");
			} finally {
				if (prevAlg === undefined) delete process.env.ALGTOOLS_API_BASE_URL;
				else process.env.ALGTOOLS_API_BASE_URL = prevAlg;
				if (prevPublic === undefined)
					delete process.env.NEXT_PUBLIC_ALGTOOLS_API_BASE_URL;
				else process.env.NEXT_PUBLIC_ALGTOOLS_API_BASE_URL = prevPublic;
			}
		});
	});

	describe("getAmlCoreBaseUrl", () => {
		it("uses NEXT_PUBLIC_AML_CORE_URL when set", () => {
			const prev = process.env.NEXT_PUBLIC_AML_CORE_URL;

			try {
				process.env.NEXT_PUBLIC_AML_CORE_URL = "https://aml-core.example.com";
				expect(getAmlCoreBaseUrl()).toBe("https://aml-core.example.com");
			} finally {
				if (prev === undefined) delete process.env.NEXT_PUBLIC_AML_CORE_URL;
				else process.env.NEXT_PUBLIC_AML_CORE_URL = prev;
			}
		});

		it("strips trailing slashes from NEXT_PUBLIC_AML_CORE_URL", () => {
			const prev = process.env.NEXT_PUBLIC_AML_CORE_URL;

			try {
				process.env.NEXT_PUBLIC_AML_CORE_URL = "https://aml-core.example.com/";
				expect(getAmlCoreBaseUrl()).toBe("https://aml-core.example.com");
			} finally {
				if (prev === undefined) delete process.env.NEXT_PUBLIC_AML_CORE_URL;
				else process.env.NEXT_PUBLIC_AML_CORE_URL = prev;
			}
		});

		it("falls back to DEFAULT_AML_CORE_URL when env var is unset", () => {
			const prev = process.env.NEXT_PUBLIC_AML_CORE_URL;

			try {
				delete process.env.NEXT_PUBLIC_AML_CORE_URL;
				expect(getAmlCoreBaseUrl()).toBe(DEFAULT_AML_CORE_URL);
			} finally {
				if (prev === undefined) delete process.env.NEXT_PUBLIC_AML_CORE_URL;
				else process.env.NEXT_PUBLIC_AML_CORE_URL = prev;
			}
		});

		it("falls back to DEFAULT_AML_CORE_URL when env var is empty string", () => {
			const prev = process.env.NEXT_PUBLIC_AML_CORE_URL;

			try {
				process.env.NEXT_PUBLIC_AML_CORE_URL = "";
				expect(getAmlCoreBaseUrl()).toBe(DEFAULT_AML_CORE_URL);
			} finally {
				if (prev === undefined) delete process.env.NEXT_PUBLIC_AML_CORE_URL;
				else process.env.NEXT_PUBLIC_AML_CORE_URL = prev;
			}
		});

		it("falls back to DEFAULT_AML_CORE_URL when env var is whitespace", () => {
			const prev = process.env.NEXT_PUBLIC_AML_CORE_URL;

			try {
				process.env.NEXT_PUBLIC_AML_CORE_URL = "   ";
				expect(getAmlCoreBaseUrl()).toBe(DEFAULT_AML_CORE_URL);
			} finally {
				if (prev === undefined) delete process.env.NEXT_PUBLIC_AML_CORE_URL;
				else process.env.NEXT_PUBLIC_AML_CORE_URL = prev;
			}
		});
	});
});
