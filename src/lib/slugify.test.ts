import { describe, expect, it } from "vitest";
import { slugify } from "./slugify";

describe("slugify", () => {
	it("converts text to lowercase", () => {
		expect(slugify("HELLO WORLD")).toBe("hello-world");
	});

	it("trims whitespace", () => {
		expect(slugify("  hello  ")).toBe("hello");
	});

	it("removes quotes", () => {
		expect(slugify("hello'world")).toBe("helloworld");
		expect(slugify('hello"world')).toBe("helloworld");
	});

	it("replaces non-alphanumeric with hyphens", () => {
		expect(slugify("hello world")).toBe("hello-world");
		expect(slugify("hello.world")).toBe("hello-world");
		expect(slugify("hello_world")).toBe("hello-world");
	});

	it("collapses multiple hyphens", () => {
		expect(slugify("hello---world")).toBe("hello-world");
		expect(slugify("hello   world")).toBe("hello-world");
	});

	it("removes leading and trailing hyphens", () => {
		expect(slugify("-hello-")).toBe("hello");
		expect(slugify("---hello---")).toBe("hello");
	});

	it("handles complex strings", () => {
		expect(slugify("Hello, World! This is a test.")).toBe(
			"hello-world-this-is-a-test",
		);
	});

	it("handles empty strings", () => {
		expect(slugify("")).toBe("");
	});
});
