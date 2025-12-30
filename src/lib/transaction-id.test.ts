import { describe, expect, it } from "vitest";
import { generateShortTransactionId } from "./transaction-id";

describe("generateShortTransactionId", () => {
	it("generates a short ID in the correct format", () => {
		const fullId = "TRX-2024-001-abc123def456";
		const shortId = generateShortTransactionId(fullId);

		// Should be in format YYYYMMDD-XXXX
		expect(shortId).toMatch(/^\d{8}-[A-Z0-9]{4}$/);
	});

	it("extracts date from ID with date pattern", () => {
		const fullId = "TRX-2024-01-15-abc123";
		const shortId = generateShortTransactionId(fullId);

		// Should start with 20240115
		expect(shortId).toMatch(/^20240115-/);
	});

	it("extracts year from ID with year pattern", () => {
		const fullId = "TRX-2024-001";
		const shortId = generateShortTransactionId(fullId);

		// Should start with 2024
		expect(shortId).toMatch(/^2024/);
	});

	it("uses current date when no date pattern found", () => {
		const fullId = "some-random-id-123";
		const shortId = generateShortTransactionId(fullId);

		// Should still be in correct format
		expect(shortId).toMatch(/^\d{8}-[A-Z0-9]{4}$/);
	});

	it("generates different codes for different IDs", () => {
		const id1 = "TRX-2024-001-abc";
		const id2 = "TRX-2024-002-def";

		const shortId1 = generateShortTransactionId(id1);
		const shortId2 = generateShortTransactionId(id2);

		// The hash part should be different
		const code1 = shortId1.split("-")[1];
		const code2 = shortId2.split("-")[1];

		expect(code1).not.toBe(code2);
	});

	it("generates consistent IDs for same input", () => {
		const fullId = "TRX-2024-001-abc123";

		const shortId1 = generateShortTransactionId(fullId);
		const shortId2 = generateShortTransactionId(fullId);

		expect(shortId1).toBe(shortId2);
	});

	it("generates IDs without ambiguous characters", () => {
		const fullId = "TRX-2024-001";
		const shortId = generateShortTransactionId(fullId);

		// Should not contain I, O, 0, or 1 in the code part
		const code = shortId.split("-")[1];
		expect(code).not.toMatch(/[IO01]/);
	});
});
