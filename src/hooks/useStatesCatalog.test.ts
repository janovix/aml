import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

// Mock useJwt
vi.mock("./useJwt", () => ({
	useJwt: vi.fn(() => ({ jwt: "mock-jwt", isLoading: false })),
}));

const mockListCatalogItems = vi.fn();
vi.mock("@/lib/api/catalogs", () => ({
	listCatalogItems: (...args: unknown[]) => mockListCatalogItems(...args),
}));

// Must be imported AFTER mocks
// We need to reset the module-level cache between tests
describe("useStatesCatalog", () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		// Reset module cache to clear the statesCache / cachePromise module-level variables
		vi.resetModules();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("fetches states catalog on mount", async () => {
		const mockStates = [
			{
				id: "1",
				catalogId: "states",
				name: "Nuevo León",
				normalizedName: "nuevo leon",
				active: true,
				metadata: { code: "NL" },
				createdAt: "2024-01-01",
				updatedAt: "2024-01-01",
			},
			{
				id: "2",
				catalogId: "states",
				name: "Jalisco",
				normalizedName: "jalisco",
				active: true,
				metadata: { code: "JAL" },
				createdAt: "2024-01-01",
				updatedAt: "2024-01-01",
			},
		];

		mockListCatalogItems.mockResolvedValue({ data: mockStates });

		const { useStatesCatalog } = await import("./useStatesCatalog");
		const { result } = renderHook(() => useStatesCatalog());

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.states).toHaveLength(2);
		expect(result.current.error).toBeNull();
		expect(mockListCatalogItems).toHaveBeenCalledWith({
			catalogKey: "states",
			activeOnly: true,
			pageSize: 100,
			jwt: "mock-jwt",
		});
	});

	it("getStateName returns state name for a valid code", async () => {
		const mockStates = [
			{
				id: "1",
				catalogId: "states",
				name: "Nuevo León",
				normalizedName: "nuevo leon",
				active: true,
				metadata: { code: "NL" },
				createdAt: "2024-01-01",
				updatedAt: "2024-01-01",
			},
		];

		mockListCatalogItems.mockResolvedValue({ data: mockStates });

		const { useStatesCatalog } = await import("./useStatesCatalog");
		const { result } = renderHook(() => useStatesCatalog());

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.getStateName("NL")).toBe("Nuevo León");
	});

	it("getStateName returns the code when state is not found", async () => {
		mockListCatalogItems.mockResolvedValue({ data: [] });

		const { useStatesCatalog } = await import("./useStatesCatalog");
		const { result } = renderHook(() => useStatesCatalog());

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.getStateName("UNKNOWN")).toBe("UNKNOWN");
	});

	it("getStateName returns empty string for null/undefined", async () => {
		mockListCatalogItems.mockResolvedValue({ data: [] });

		const { useStatesCatalog } = await import("./useStatesCatalog");
		const { result } = renderHook(() => useStatesCatalog());

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.getStateName(null)).toBe("");
		expect(result.current.getStateName(undefined)).toBe("");
	});

	it("handles API errors", async () => {
		mockListCatalogItems.mockRejectedValue(new Error("API Error"));
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		const { useStatesCatalog } = await import("./useStatesCatalog");
		const { result } = renderHook(() => useStatesCatalog());

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.error).toBeInstanceOf(Error);
		expect(result.current.states).toEqual([]);
		consoleSpy.mockRestore();
	});

	it("does not fetch without JWT", async () => {
		const { useJwt } = await import("./useJwt");
		vi.mocked(useJwt).mockReturnValue({
			jwt: null,
			isLoading: false,
		} as ReturnType<typeof useJwt>);

		const { useStatesCatalog } = await import("./useStatesCatalog");
		renderHook(() => useStatesCatalog());

		// Small delay to ensure useEffect has run
		await new Promise((r) => setTimeout(r, 50));

		expect(mockListCatalogItems).not.toHaveBeenCalled();
	});
});
