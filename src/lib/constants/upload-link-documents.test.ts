import { describe, expect, it } from "vitest";
import {
	getApiDocumentsForSelection,
	getApiTypesForSelection,
	getDefaultSelectedDocuments,
	getDocumentsForPersonType,
	isDocumentUploaded,
	MORAL_ENTITY_DOCUMENTS,
	PHYSICAL_PERSON_DOCUMENTS,
	TRUST_ENTITY_DOCUMENTS,
} from "./upload-link-documents";
import type { PersonType } from "@/types/client";
import type { ClientDocumentType } from "@/types/client-document";

describe("getDocumentsForPersonType", () => {
	it("returns correct lists", () => {
		expect(getDocumentsForPersonType("physical")).toBe(
			PHYSICAL_PERSON_DOCUMENTS,
		);
		expect(getDocumentsForPersonType("moral")).toBe(MORAL_ENTITY_DOCUMENTS);
		expect(getDocumentsForPersonType("trust")).toBe(TRUST_ENTITY_DOCUMENTS);
	});
	it("defaults to physical when personType does not match switch cases", () => {
		expect(getDocumentsForPersonType("other" as PersonType)).toBe(
			PHYSICAL_PERSON_DOCUMENTS,
		);
	});
});

describe("getApiTypesForSelection", () => {
	it("flattens api types for selected ids", () => {
		const types = getApiTypesForSelection(["official_id"], "physical");
		expect(types).toEqual(["mx_ine_front", "mx_ine_back", "passport"]);
	});
	it("returns empty for unknown ids", () => {
		expect(getApiTypesForSelection(["nope"], "physical")).toEqual([]);
	});
});

describe("getApiDocumentsForSelection", () => {
	it("includes label per api type for ID docs", () => {
		const docs = getApiDocumentsForSelection(["official_id"], "physical");
		expect(docs).toHaveLength(3);
		expect(docs[0]).toMatchObject({
			type: "mx_ine_front",
			label: "Identificación Oficial",
		});
	});
});

describe("getDefaultSelectedDocuments", () => {
	it("returns all required document ids", () => {
		const ids = getDefaultSelectedDocuments("physical");
		expect(ids.length).toBeGreaterThan(0);
		for (const id of ids) {
			const cfg = PHYSICAL_PERSON_DOCUMENTS.find((d) => d.id === id);
			expect(cfg?.isRequired).toBe(true);
		}
	});
});

describe("isDocumentUploaded", () => {
	const doc = PHYSICAL_PERSON_DOCUMENTS[0];
	it("returns true when aml type present", () => {
		expect(
			isDocumentUploaded(doc, [doc.amlDocumentType as ClientDocumentType]),
		).toBe(true);
	});
	it("returns false when missing", () => {
		expect(isDocumentUploaded(doc, [])).toBe(false);
	});
});
