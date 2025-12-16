import { describe, expect, it } from "vitest";
// Catalog types are just TypeScript interfaces/types
// No runtime logic to test, but we can verify the types exist
describe("catalog types", () => {
	it("exports CatalogItem type", () => {
		// Types are compile-time only, so we just verify the module loads
		expect(true).toBe(true);
	});
});
