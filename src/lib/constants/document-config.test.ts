import { describe, expect, it } from "vitest";
import {
	AVAILABLE_DOCUMENTS,
	DOCUMENT_TYPE_CONFIG,
	getDocumentDescription,
	getDocumentLabel,
	hasIdDocument,
	ID_DOCUMENT_TYPES,
	REQUIRED_DOCUMENTS,
	requiresUBOs,
	validateDocumentFile,
} from "./document-config";
import type { ClientDocumentType } from "@/types/client-document";

describe("getDocumentLabel", () => {
	it("returns configured label for known types", () => {
		expect(getDocumentLabel("NATIONAL_ID")).toBe("INE/IFE");
	});
	it("returns raw string for unknown types", () => {
		expect(getDocumentLabel("UNKNOWN_TYPE")).toBe("UNKNOWN_TYPE");
	});
});

describe("getDocumentDescription", () => {
	it("returns description for known types", () => {
		expect(getDocumentDescription("PASSPORT")).toContain("Pasaporte");
	});
	it("returns empty string for unknown types", () => {
		expect(getDocumentDescription("NOT_REAL" as ClientDocumentType)).toBe("");
	});
});

describe("requiresUBOs", () => {
	it("is true for moral and trust only", () => {
		expect(requiresUBOs("moral")).toBe(true);
		expect(requiresUBOs("trust")).toBe(true);
		expect(requiresUBOs("physical")).toBe(false);
	});
});

describe("hasIdDocument", () => {
	it("detects ID document types", () => {
		expect(
			hasIdDocument([
				{ documentType: "NATIONAL_ID" },
				{ documentType: "TAX_ID" },
			]),
		).toBe(true);
		expect(hasIdDocument([{ documentType: "TAX_ID" }])).toBe(false);
	});
});

describe("DOCUMENT_TYPE_CONFIG", () => {
	it("has entries for all ID types", () => {
		for (const t of ID_DOCUMENT_TYPES) {
			expect(DOCUMENT_TYPE_CONFIG[t]).toBeDefined();
		}
	});
});

describe("REQUIRED_DOCUMENTS / AVAILABLE_DOCUMENTS", () => {
	it("moral requires more base docs than physical", () => {
		expect(REQUIRED_DOCUMENTS.moral.length).toBeGreaterThan(
			REQUIRED_DOCUMENTS.physical.length,
		);
	});
	it("lists include core types per person type", () => {
		expect(AVAILABLE_DOCUMENTS.physical).toContain("NATIONAL_ID");
		expect(AVAILABLE_DOCUMENTS.moral).toContain("ACTA_CONSTITUTIVA");
		expect(AVAILABLE_DOCUMENTS.trust).toContain("TRUST_AGREEMENT");
	});
});

describe("validateDocumentFile", () => {
	it("rejects oversized files", () => {
		const file = new File(["x"], "a.pdf", { type: "application/pdf" });
		Object.defineProperty(file, "size", { value: 11 * 1024 * 1024 });
		expect(validateDocumentFile(file)).toContain("tamaño máximo");
	});
	it("rejects invalid MIME types", () => {
		const file = new File(["x"], "a.exe", { type: "application/octet-stream" });
		Object.defineProperty(file, "size", { value: 100 });
		expect(validateDocumentFile(file)).toContain("PDF o imágenes");
	});
	it("accepts pdf and images", () => {
		const pdf = new File(["x"], "a.pdf", { type: "application/pdf" });
		Object.defineProperty(pdf, "size", { value: 100 });
		expect(validateDocumentFile(pdf)).toBeNull();
		const img = new File(["x"], "a.png", { type: "image/png" });
		Object.defineProperty(img, "size", { value: 100 });
		expect(validateDocumentFile(img)).toBeNull();
	});
});
