import { describe, it, expect } from "vitest";
import { parseDataEnvironmentCookie } from "./environment-store";

describe("parseDataEnvironmentCookie", () => {
	it("returns staging and development verbatim", () => {
		expect(parseDataEnvironmentCookie("staging")).toBe("staging");
		expect(parseDataEnvironmentCookie("development")).toBe("development");
	});

	it("defaults invalid or missing values to production", () => {
		expect(parseDataEnvironmentCookie(undefined)).toBe("production");
		expect(parseDataEnvironmentCookie("")).toBe("production");
		expect(parseDataEnvironmentCookie("prod")).toBe("production");
	});
});
