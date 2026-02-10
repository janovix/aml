import { describe, it, expect } from "vitest";
import {
	getCatalogCode,
	getCurrencyCode,
	getCatalogName,
} from "./catalog-utils";
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
			metadata: { code: "MXN", shortName: "MXN", decimal_places: 2 },
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};

		expect(getCatalogCode(item)).toBe("MXN");
	});
});

describe("getCurrencyCode", () => {
	it("returns metadata.shortName when available", () => {
		const item: CatalogItem = {
			id: "00000000-0000-0000-0000-000000000003",
			catalogId: "currencies",
			name: "Peso Mexicano",
			normalizedName: "peso mexicano",
			active: true,
			metadata: { code: "MXN", shortName: "MXN", decimal_places: 2 },
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};

		expect(getCurrencyCode(item)).toBe("MXN");
	});

	it("returns item.id when metadata.shortName is not available", () => {
		const item: CatalogItem = {
			id: "currency-unknown-123",
			catalogId: "currencies",
			name: "Unknown Currency",
			normalizedName: "unknown currency",
			active: true,
			metadata: { code: "UNK" },
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};

		expect(getCurrencyCode(item)).toBe("currency-unknown-123");
	});

	it("returns item.id when metadata is undefined", () => {
		const item: CatalogItem = {
			id: "currency-id-789",
			catalogId: "currencies",
			name: "Test Currency",
			normalizedName: "test currency",
			active: true,
			metadata: undefined,
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};

		expect(getCurrencyCode(item)).toBe("currency-id-789");
	});

	it("handles USD correctly", () => {
		const item: CatalogItem = {
			id: "00000000-0000-0000-0000-000000000001",
			catalogId: "currencies",
			name: "Dólar estadounidense",
			normalizedName: "dolar estadounidense",
			active: true,
			metadata: { code: "USD", shortName: "USD", decimal_places: 2 },
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};

		expect(getCurrencyCode(item)).toBe("USD");
	});

	it("handles EUR correctly", () => {
		const item: CatalogItem = {
			id: "00000000-0000-0000-0000-000000000002",
			catalogId: "currencies",
			name: "Euro",
			normalizedName: "euro",
			active: true,
			metadata: { code: "EUR", shortName: "EUR", decimal_places: 2 },
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};

		expect(getCurrencyCode(item)).toBe("EUR");
	});
});

describe("getCatalogName", () => {
	it("returns the name of the catalog item", () => {
		const item: CatalogItem = {
			id: "00000000-0000-0000-0000-000000000615",
			catalogId: "banks",
			name: "BBVA MEXICO",
			normalizedName: "bbva mexico",
			active: true,
			metadata: { code: "40012" },
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};

		expect(getCatalogName(item)).toBe("BBVA MEXICO");
	});

	it("returns the name even when metadata has other fields", () => {
		const item: CatalogItem = {
			id: "00000000-0000-0000-0000-000000000133",
			catalogId: "banks",
			name: "ACTINVER",
			normalizedName: "actinver",
			active: true,
			metadata: { code: "40133" },
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};

		expect(getCatalogName(item)).toBe("ACTINVER");
	});

	it("handles items with special characters in name", () => {
		const item: CatalogItem = {
			id: "bank-custom-123",
			catalogId: "banks",
			name: "Banco de México S.A.",
			normalizedName: "banco de mexico sa",
			active: true,
			metadata: undefined,
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};

		expect(getCatalogName(item)).toBe("Banco de México S.A.");
	});

	it("works for any catalog type", () => {
		const item: CatalogItem = {
			id: "country-mx",
			catalogId: "countries",
			name: "México",
			normalizedName: "mexico",
			active: true,
			metadata: { code: "MX" },
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};

		expect(getCatalogName(item)).toBe("México");
	});
});
