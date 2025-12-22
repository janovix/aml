import fieldDescriptionsData from "./field-descriptions.json";

interface FieldDescription {
	name: string;
	description: string;
}

interface FieldDescriptionsData {
	descriptions: Record<string, FieldDescription>;
	uiMapping: Record<string, string>;
}

const data = fieldDescriptionsData as FieldDescriptionsData;

/**
 * Get field description by UI field name
 */
export function getFieldDescription(uiFieldName: string): string | undefined {
	const xmlTag = data.uiMapping[uiFieldName];
	if (!xmlTag) return undefined;

	const description = data.descriptions[xmlTag];
	return description?.description;
}

/**
 * Get field description by XML tag directly
 */
export function getFieldDescriptionByXmlTag(
	xmlTag: string,
): string | undefined {
	const description = data.descriptions[xmlTag];
	return description?.description;
}

/**
 * Get field name by UI field name
 */
export function getFieldName(uiFieldName: string): string | undefined {
	const xmlTag = data.uiMapping[uiFieldName];
	if (!xmlTag) return undefined;

	const description = data.descriptions[xmlTag];
	return description?.name;
}

// Export the full mapping for advanced use cases
export const fieldDescriptions = data.descriptions;
export const uiFieldMapping = data.uiMapping;
