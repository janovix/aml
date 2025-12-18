import { describe, expect, it, vi } from "vitest";
import {
	createTransaction,
	deleteTransaction,
	getTransactionById,
	listTransactions,
	updateTransaction,
} from "./transactions";
import type {
	Transaction,
	TransactionCreateRequest,
	TransactionListResponse,
	TransactionUpdateRequest,
} from "@/types/transaction";

describe("api/transactions", () => {
	it("listTransactions omits query params when not provided", async () => {
		const fetchSpy = vi.fn(async (url: RequestInfo | URL) => {
			const u = new URL(typeof url === "string" ? url : url.toString());
			expect(u.origin + u.pathname).toBe(
				"https://example.com/api/v1/transactions",
			);
			expect(u.search).toBe("");
			return new Response(
				JSON.stringify({
					data: [],
					pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
				}),
				{
					status: 200,
					headers: { "content-type": "application/json" },
				},
			);
		});
		vi.stubGlobal("fetch", fetchSpy);

		const res = await listTransactions({ baseUrl: "https://example.com" });
		expect(res.data).toEqual([]);
		expect(res.pagination.page).toBe(1);
	});

	it("listTransactions builds query params correctly", async () => {
		const fetchSpy = vi.fn(
			async (url: RequestInfo | URL, init?: RequestInit) => {
				expect((init?.method ?? "GET").toUpperCase()).toBe("GET");
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.origin + u.pathname).toBe(
					"https://example.com/api/v1/transactions",
				);
				expect(u.searchParams.get("page")).toBe("2");
				expect(u.searchParams.get("limit")).toBe("20");
				expect(u.searchParams.get("clientId")).toBe("CLIENT123");
				expect(u.searchParams.get("operationType")).toBe("purchase");
				expect(u.searchParams.get("vehicleType")).toBe("land");
				expect(u.searchParams.get("branchPostalCode")).toBe("64000");
				expect(u.searchParams.get("startDate")).toBe("2024-01-01T00:00:00Z");
				expect(u.searchParams.get("endDate")).toBe("2024-12-31T23:59:59Z");
				return new Response(
					JSON.stringify({
						data: [],
						pagination: { page: 2, limit: 20, total: 0, totalPages: 0 },
					}),
					{
						status: 200,
						headers: { "content-type": "application/json" },
					},
				);
			},
		);
		vi.stubGlobal("fetch", fetchSpy);

		const res = await listTransactions({
			baseUrl: "https://example.com",
			page: 2,
			limit: 20,
			clientId: "CLIENT123",
			operationType: "purchase",
			vehicleType: "land",
			branchPostalCode: "64000",
			startDate: "2024-01-01T00:00:00Z",
			endDate: "2024-12-31T23:59:59Z",
		});
		expect(res.pagination.page).toBe(2);
		expect(res.pagination.limit).toBe(20);
	});

	it("getTransactionById requests /api/v1/transactions/:id", async () => {
		const mockTransaction: Transaction = {
			id: "TXN123",
			clientId: "CLIENT123",
			operationDate: "2024-01-15T10:00:00Z",
			operationType: "purchase",
			branchPostalCode: "64000",
			vehicleType: "land",
			brandId: "BRAND1",
			model: "Model X",
			year: 2024,
			serialNumber: "SN123456",
			amount: "350000.00",
			currency: "MXN",
			paymentMethod: "TRANSFERENCIA",
			paymentDate: "2024-01-15T10:00:00Z",
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};

		const fetchSpy = vi.fn(
			async (url: RequestInfo | URL, init?: RequestInit) => {
				expect((init?.method ?? "GET").toUpperCase()).toBe("GET");
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.origin + u.pathname).toBe(
					"https://example.com/api/v1/transactions/TXN123",
				);
				return new Response(JSON.stringify(mockTransaction), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			},
		);
		vi.stubGlobal("fetch", fetchSpy);

		const res = await getTransactionById({
			id: "TXN123",
			baseUrl: "https://example.com",
		});
		expect(res.id).toBe("TXN123");
		expect(res.clientId).toBe("CLIENT123");
	});

	it("createTransaction sends POST with correct body", async () => {
		const mockTransaction: Transaction = {
			id: "TXN123",
			clientId: "CLIENT123",
			operationDate: "2024-01-15T10:00:00Z",
			operationType: "purchase",
			branchPostalCode: "64000",
			vehicleType: "land",
			brandId: "BRAND1",
			model: "Model X",
			year: 2024,
			serialNumber: "SN123456",
			amount: "350000.00",
			currency: "MXN",
			paymentMethod: "TRANSFERENCIA",
			paymentDate: "2024-01-15T10:00:00Z",
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};

		const input: TransactionCreateRequest = {
			clientId: "CLIENT123",
			operationDate: "2024-01-15T10:00:00Z",
			operationType: "purchase",
			branchPostalCode: "64000",
			vehicleType: "land",
			brandId: "BRAND1",
			model: "Model X",
			year: 2024,
			serialNumber: "SN123456",
			amount: "350000.00",
			currency: "MXN",
			paymentMethod: "TRANSFERENCIA",
			paymentDate: "2024-01-15T10:00:00Z",
		};

		const fetchSpy = vi.fn(
			async (url: RequestInfo | URL, init?: RequestInit) => {
				expect((init?.method ?? "POST").toUpperCase()).toBe("POST");
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.origin + u.pathname).toBe(
					"https://example.com/api/v1/transactions",
				);
				expect(init?.headers).toMatchObject({
					"content-type": "application/json",
				});
				const body = JSON.parse(init?.body as string);
				expect(body).toEqual(input);
				return new Response(JSON.stringify(mockTransaction), {
					status: 201,
					headers: { "content-type": "application/json" },
				});
			},
		);
		vi.stubGlobal("fetch", fetchSpy);

		const res = await createTransaction({
			input,
			baseUrl: "https://example.com",
		});
		expect(res.id).toBe("TXN123");
	});

	it("updateTransaction sends PUT with correct body", async () => {
		const mockTransaction: Transaction = {
			id: "TXN123",
			clientId: "CLIENT123",
			operationDate: "2024-01-15T10:00:00Z",
			operationType: "sale",
			branchPostalCode: "64000",
			vehicleType: "land",
			brandId: "BRAND1",
			model: "Model Y",
			year: 2024,
			serialNumber: "SN123456",
			amount: "400000.00",
			currency: "MXN",
			paymentMethod: "EFECTIVO",
			paymentDate: "2024-01-15T10:00:00Z",
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};

		const input: TransactionUpdateRequest = {
			operationDate: "2024-01-15T10:00:00Z",
			operationType: "sale",
			branchPostalCode: "64000",
			vehicleType: "land",
			brandId: "BRAND1",
			model: "Model Y",
			year: 2024,
			serialNumber: "SN123456",
			amount: "400000.00",
			currency: "MXN",
			paymentMethod: "EFECTIVO",
			paymentDate: "2024-01-15T10:00:00Z",
		};

		const fetchSpy = vi.fn(
			async (url: RequestInfo | URL, init?: RequestInit) => {
				expect((init?.method ?? "PUT").toUpperCase()).toBe("PUT");
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.origin + u.pathname).toBe(
					"https://example.com/api/v1/transactions/TXN123",
				);
				expect(init?.headers).toMatchObject({
					"content-type": "application/json",
				});
				const body = JSON.parse(init?.body as string);
				expect(body).toEqual(input);
				return new Response(JSON.stringify(mockTransaction), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			},
		);
		vi.stubGlobal("fetch", fetchSpy);

		const res = await updateTransaction({
			id: "TXN123",
			input,
			baseUrl: "https://example.com",
		});
		expect(res.id).toBe("TXN123");
		expect(res.operationType).toBe("sale");
	});

	it("deleteTransaction requests DELETE /api/v1/transactions/:id", async () => {
		const fetchSpy = vi.fn(
			async (url: RequestInfo | URL, init?: RequestInit) => {
				expect((init?.method ?? "DELETE").toUpperCase()).toBe("DELETE");
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.origin + u.pathname).toBe(
					"https://example.com/api/v1/transactions/TXN123",
				);
				return new Response(null, {
					status: 204,
				});
			},
		);
		vi.stubGlobal("fetch", fetchSpy);

		await deleteTransaction({
			id: "TXN123",
			baseUrl: "https://example.com",
		});
		expect(fetchSpy).toHaveBeenCalledTimes(1);
	});
});
