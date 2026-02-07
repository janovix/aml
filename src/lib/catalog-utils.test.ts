import { describe, it, expect } from "vitest";
import { getCatalogCode } from "./catalog-utils";
import type { CatalogItem } from "@/types/catalog";

describe("getCatalogCode", () => {
	it("returns metadata.code when available", () => {
		const item: CatalogItem = {
			id: "00000000-0000-0000-0000-000000000001",
			catalogId: "pld-payment-forms",
			name: "Efectivo",
			normalizedName: "efectivo",
			active: true,
			metadata: { code: "01" },
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};

		expect(getCatalogCode(item)).toBe("01");
	});

	it("returns item.id when metadata.code is not available", () => {
		const item: CatalogItem = {
			id: "brand-toyota-123",
			catalogId: "vehicle-brands",
			name: "Toyota",
			normalizedName: "toyota",
			active: true,
			metadata: { originCountry: "JP" },
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};

		expect(getCatalogCode(item)).toBe("brand-toyota-123");
	});

	it("returns item.id when metadata is undefined", () => {
		const item: CatalogItem = {
			id: "another-id-789",
			catalogId: "test-catalog",
			name: "Another Item",
			normalizedName: "another item",
			active: true,
			metadata: undefined,
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};

		expect(getCatalogCode(item)).toBe("another-id-789");
	});

	it("returns item.id when metadata has no code property", () => {
		const item: CatalogItem = {
			id: "some-id-456",
			catalogId: "test-catalog",
			name: "Test Item",
			normalizedName: "test item",
			active: true,
			metadata: { someOtherProperty: "value" },
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};

		expect(getCatalogCode(item)).toBe("some-id-456");
	});

	it("handles numeric codes correctly", () => {
		const item: CatalogItem = {
			id: "00000000-0000-0000-0000-000000000100",
			catalogId: "pld-alert-types",
			name: "Inusual",
			normalizedName: "inusual",
			active: true,
			metadata: { code: "100" },
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};

		expect(getCatalogCode(item)).toBe("100");
	});

	it("handles short codes correctly", () => {
		const item: CatalogItem = {
			id: "00000000-0000-0000-0000-000000000003",
			catalogId: "currencies",
			name: "Peso Mexicano",
			normalizedName: "peso mexicano",
			active: true,
			metadata: { code: "3", shortName: "MXN" },
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};

		expect(getCatalogCode(item)).toBe("3");
	});
});
