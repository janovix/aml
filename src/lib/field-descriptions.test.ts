import { describe, expect, it } from "vitest";
import {
	fieldDescriptions,
	getFieldDescription,
	getFieldDescriptionByXmlTag,
	getFieldName,
	uiFieldMapping,
} from "./field-descriptions";

describe("field-descriptions helpers", () => {
	it("returns a description when UI field has a mapping", () => {
		const description = getFieldDescription("firstName");

		expect(description).toContain(
			"Ingresa el nombre o nombres de la persona física",
		);
	});

	it("returns undefined for unmapped UI fields", () => {
		expect(getFieldDescription("nonExistentField")).toBeUndefined();
		expect(getFieldName("nonExistentField")).toBeUndefined();
	});

	it("returns the XML description and field name directly", () => {
		expect(getFieldDescriptionByXmlTag("nombre")).toContain("nombre o nombres");
		expect(getFieldName("firstName")).toBe("Nombre(s)");
	});

	it("exposes the raw mapping data for advanced usages", () => {
		expect(uiFieldMapping.firstName).toBe("nombre");
		expect(fieldDescriptions.nombre?.name).toBe("Nombre(s)");
	});

	it("handles multiple field mappings", () => {
		expect(getFieldDescription("lastName")).toBeDefined();
		expect(getFieldDescription("email")).toBeDefined();
		expect(getFieldDescription("phone")).toBeDefined();
		expect(getFieldDescription("rfc")).toBeDefined();
	});

	it("returns field name for various fields", () => {
		expect(getFieldName("firstName")).toBe("Nombre(s)");
		expect(getFieldName("lastName")).toBeDefined();
		expect(getFieldName("email")).toBeDefined();
	});
});
