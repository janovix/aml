import { describe, expect, it } from "vitest";
import { getAmlCoreBaseUrl } from "./config";

const DEFAULT_AML_CORE_URL = "https://aml-svc.janovix.workers.dev";

describe("api/config", () => {
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
