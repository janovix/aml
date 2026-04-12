import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { fetchCatalogEntries } from "@/lib/catalogs";
import type { CatalogItem } from "@/types/catalog";

vi.mock("@/lib/catalogs", () => ({
	fetchCatalogEntries: vi.fn(),
}));

const usdItem: CatalogItem = {
	id: "cur-usd",
	catalogId: "currencies",
	name: "US Dollar",
	normalizedName: "usd",
	active: true,
	metadata: { shortName: "USD", country: "United States" },
	createdAt: "2024-01-01",
	updatedAt: "2024-01-01",
};

function catalogResponse(data: CatalogItem[]) {
	return {
		catalog: { id: "cat-1", key: "currencies", name: "Currencies" },
		data,
		pagination: { page: 1, pageSize: 200, total: data.length, totalPages: 1 },
	};
}

describe("useCurrencies", () => {
	beforeEach(() => {
		vi.resetModules();
		vi.mocked(fetchCatalogEntries).mockReset();
	});

	it("loads currencies and supports getByCode and filter", async () => {
		vi.mocked(fetchCatalogEntries).mockResolvedValue(
			catalogResponse([usdItem]),
		);
		const { useCurrencies } = await import("./useCurrencies");
		const { result } = renderHook(() => useCurrencies());
		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.currencies).toHaveLength(1);
		expect(result.current.getByCode("USD")?.name).toBe("US Dollar");
		expect(result.current.filter("dollar")).toHaveLength(1);
		expect(result.current.filter("united")).toHaveLength(1);
		expect(result.current.filter("")).toHaveLength(1);
	});
});
