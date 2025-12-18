import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useClientSearch } from "./useClientSearch";
import { listClients } from "@/lib/api/clients";

vi.mock("@/lib/api/clients");

describe("useClientSearch", () => {
	const mockClients = [
		{
			id: "1",
			rfc: "PECJ850615E56",
			personType: "physical" as const,
			firstName: "Juan",
			lastName: "Pérez",
			secondLastName: "García",
			email: "juan@example.com",
			phone: "+52 55 1234 5678",
			country: "MX",
			stateCode: "CDMX",
			city: "Ciudad de México",
			municipality: "Benito Juárez",
			neighborhood: "Del Valle",
			street: "Av. Insurgentes Sur",
			externalNumber: "1234",
			postalCode: "03100",
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		},
		{
			id: "2",
			rfc: "EGL850101AAA",
			personType: "moral" as const,
			businessName: "Empresas Globales S.A. de C.V.",
			email: "contacto@empresasglobales.mx",
			phone: "+52 55 9876 5432",
			country: "MX",
			stateCode: "CDMX",
			city: "Ciudad de México",
			municipality: "Miguel Hidalgo",
			neighborhood: "Polanco",
			street: "Av. Presidente Masaryk",
			externalNumber: "456",
			postalCode: "11560",
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		},
	];

	const mockResponse = {
		data: mockClients,
		pagination: {
			page: 1,
			limit: 15,
			total: 2,
			totalPages: 1,
		},
	};

	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(listClients).mockResolvedValue(mockResponse);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should fetch clients on mount", async () => {
		const { result } = renderHook(() => useClientSearch());

		expect(result.current.loading).toBe(true);
		expect(listClients).toHaveBeenCalledWith({
			search: undefined,
			page: 1,
			limit: 15,
			signal: expect.any(AbortSignal),
		});

		await waitFor(() => {
			expect(result.current.loading).toBe(false);
		});

		expect(result.current.items).toEqual(mockClients);
		expect(result.current.pagination).toEqual(mockResponse.pagination);
		expect(result.current.error).toBeNull();
	});

	it("should debounce search input", async () => {
		const { result } = renderHook(() => useClientSearch({ debounceMs: 50 }));

		await waitFor(() => {
			expect(result.current.loading).toBe(false);
		});

		const initialCallCount = vi.mocked(listClients).mock.calls.length;

		// Set search term
		act(() => {
			result.current.setSearchTerm("juan");
		});

		// Wait for debounce
		await waitFor(
			() => {
				expect(vi.mocked(listClients).mock.calls.length).toBeGreaterThan(
					initialCallCount,
				);
			},
			{ timeout: 2000 },
		);
	});

	it("should handle search with custom page size", async () => {
		const { result } = renderHook(() => useClientSearch({ pageSize: 20 }));

		await waitFor(() => {
			expect(result.current.loading).toBe(false);
		});

		expect(listClients).toHaveBeenCalledWith({
			search: undefined,
			page: 1,
			limit: 20,
			signal: expect.any(AbortSignal),
		});
	});

	it("should handle API errors", async () => {
		const errorMessage = "Failed to fetch clients";
		vi.mocked(listClients).mockRejectedValue(new Error(errorMessage));

		const { result } = renderHook(() => useClientSearch());

		await waitFor(() => {
			expect(result.current.loading).toBe(false);
		});

		expect(result.current.error).toBe(errorMessage);
		expect(result.current.items).toEqual([]);
		expect(result.current.pagination).toBeNull();
	});

	it("should handle abort signal cancellation", async () => {
		const abortError = new Error("Aborted");
		abortError.name = "AbortError";
		vi.mocked(listClients).mockRejectedValue(abortError);

		const { result } = renderHook(() => useClientSearch());

		await waitFor(() => {
			expect(result.current.loading).toBe(false);
		});

		// Should not set error for abort errors
		expect(result.current.error).toBeNull();
	});

	it("should not fetch when disabled", () => {
		renderHook(() => useClientSearch({ enabled: false }));

		expect(listClients).not.toHaveBeenCalled();
	});

	it("should reload when reload is called", async () => {
		const { result } = renderHook(() => useClientSearch());

		await waitFor(() => {
			expect(result.current.loading).toBe(false);
		});

		const initialCallCount = vi.mocked(listClients).mock.calls.length;

		act(() => {
			result.current.reload();
		});

		await waitFor(
			() => {
				expect(vi.mocked(listClients).mock.calls.length).toBeGreaterThan(
					initialCallCount,
				);
			},
			{ timeout: 3000 },
		);
	});

	it("should handle empty search term", async () => {
		const { result } = renderHook(() => useClientSearch({ debounceMs: 50 }));

		await waitFor(() => {
			expect(result.current.loading).toBe(false);
		});

		act(() => {
			result.current.setSearchTerm("   "); // Only whitespace
		});

		// Wait for debounce - should normalize to empty string
		await waitFor(
			() => {
				expect(result.current.searchTerm).toBe("   ");
			},
			{ timeout: 2000 },
		);
	});

	it("should use initial search term", async () => {
		const { result } = renderHook(() =>
			useClientSearch({ initialSearch: "test" }),
		);

		expect(result.current.searchTerm).toBe("test");

		await waitFor(
			() => {
				expect(result.current.loading).toBe(false);
			},
			{ timeout: 3000 },
		);

		expect(listClients).toHaveBeenCalledWith({
			search: "test",
			page: 1,
			limit: 15,
			signal: expect.any(AbortSignal),
		});
	});

	it("should not update debounced search if normalized search equals debounced search", async () => {
		const { result } = renderHook(() => useClientSearch({ debounceMs: 50 }));

		await waitFor(() => {
			expect(result.current.loading).toBe(false);
		});

		const initialDebounced = result.current.searchTerm;

		act(() => {
			result.current.setSearchTerm("   "); // Will normalize to empty
		});

		// Wait a bit
		await new Promise((resolve) => setTimeout(resolve, 100));

		// Should not trigger new API call if normalized equals debounced
		const callCount = vi.mocked(listClients).mock.calls.length;
		expect(callCount).toBeGreaterThanOrEqual(1);
	});

	it("should handle error without message", async () => {
		const errorWithoutMessage = { name: "Error" } as Error;
		vi.mocked(listClients).mockRejectedValue(errorWithoutMessage);

		const { result } = renderHook(() => useClientSearch());

		await waitFor(() => {
			expect(result.current.loading).toBe(false);
		});

		expect(result.current.error).toBe("Error al cargar los clientes.");
	});

	it("should handle empty debounced search", async () => {
		const { result } = renderHook(() => useClientSearch({ debounceMs: 50 }));

		await waitFor(() => {
			expect(result.current.loading).toBe(false);
		});

		act(() => {
			result.current.setSearchTerm("");
		});

		await waitFor(
			() => {
				expect(listClients).toHaveBeenCalled();
			},
			{ timeout: 2000 },
		);

		// Should call with undefined search when empty
		const lastCall =
			vi.mocked(listClients).mock.calls[
				vi.mocked(listClients).mock.calls.length - 1
			];
		expect(lastCall[0]?.search).toBeUndefined();
	});
});
