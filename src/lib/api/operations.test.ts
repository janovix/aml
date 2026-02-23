import { describe, it, expect, vi, afterEach } from "vitest";
import {
	listOperations,
	getOperationById,
	createOperation,
	updateOperation,
	deleteOperation,
	getActivities,
	getActivityFields,
} from "./operations";

describe("api/operations", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("listOperations omits query params when not provided", async () => {
		const fetchSpy = vi.fn(async (url: RequestInfo | URL) => {
			const u = new URL(typeof url === "string" ? url : url.toString());
			expect(u.origin + u.pathname).toBe(
				"https://example.com/api/v1/operations",
			);
			expect(u.search).toBe("");
			return new Response(
				JSON.stringify({
					data: [],
					pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
				}),
				{ status: 200, headers: { "content-type": "application/json" } },
			);
		});
		vi.stubGlobal("fetch", fetchSpy);

		const res = await listOperations({ baseUrl: "https://example.com" });
		expect(res.data).toEqual([]);
	});

	it("listOperations builds query params correctly", async () => {
		const fetchSpy = vi.fn(async (url: RequestInfo | URL) => {
			const u = new URL(typeof url === "string" ? url : url.toString());
			expect(u.searchParams.get("page")).toBe("2");
			expect(u.searchParams.get("limit")).toBe("20");
			expect(u.searchParams.get("clientId")).toBe("client-1");
			expect(u.searchParams.get("invoiceId")).toBe("inv-1");
			expect(u.searchParams.get("activityCode")).toBe("VEH");
			expect(u.searchParams.get("operationTypeCode")).toBe("COMPRA");
			expect(u.searchParams.get("branchPostalCode")).toBe("64000");
			expect(u.searchParams.get("alertTypeCode")).toBe("THRESHOLD");
			expect(u.searchParams.get("watchlistStatus")).toBe("MATCH");
			expect(u.searchParams.get("startDate")).toBe("2024-01-01");
			expect(u.searchParams.get("endDate")).toBe("2024-12-31");
			expect(u.searchParams.get("minAmount")).toBe("1000");
			expect(u.searchParams.get("maxAmount")).toBe("50000");
			return new Response(
				JSON.stringify({
					data: [],
					pagination: { page: 2, limit: 20, total: 0, totalPages: 0 },
				}),
				{ status: 200, headers: { "content-type": "application/json" } },
			);
		});
		vi.stubGlobal("fetch", fetchSpy);

		await listOperations({
			baseUrl: "https://example.com",
			page: 2,
			limit: 20,
			clientId: "client-1",
			invoiceId: "inv-1",
			activityCode: "VEH",
			operationTypeCode: "COMPRA",
			branchPostalCode: "64000",
			alertTypeCode: "THRESHOLD",
			watchlistStatus: "MATCH",
			startDate: "2024-01-01",
			endDate: "2024-12-31",
			minAmount: "1000",
			maxAmount: "50000",
		});

		expect(fetchSpy).toHaveBeenCalledTimes(1);
	});

	it("getOperationById calls correct URL", async () => {
		const mockOperation = { id: "op-1", clientId: "c-1", amount: 1000 };
		vi.stubGlobal(
			"fetch",
			vi.fn(
				async () =>
					new Response(JSON.stringify(mockOperation), {
						status: 200,
						headers: { "content-type": "application/json" },
					}),
			),
		);

		const res = await getOperationById({
			id: "op-1",
			baseUrl: "https://example.com",
		});
		expect(res).toEqual(mockOperation);

		const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
		expect(calledUrl).toBe("https://example.com/api/v1/operations/op-1");
	});

	it("createOperation sends POST with body", async () => {
		const input = { clientId: "c-1", amount: 5000, activityCode: "VEH" };
		const mockResponse = { id: "op-new", ...input };

		vi.stubGlobal(
			"fetch",
			vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
				expect(init?.method).toBe("POST");
				expect(init?.headers).toEqual(
					expect.objectContaining({ "content-type": "application/json" }),
				);
				const body = JSON.parse(init?.body as string);
				expect(body.clientId).toBe("c-1");
				return new Response(JSON.stringify(mockResponse), {
					status: 201,
					headers: { "content-type": "application/json" },
				});
			}),
		);

		const res = await createOperation({
			input: input as never,
			baseUrl: "https://example.com",
		});
		expect(res.id).toBe("op-new");
	});

	it("updateOperation sends PUT with body", async () => {
		const input = { amount: 7000 };
		const mockResponse = { id: "op-1", amount: 7000 };

		vi.stubGlobal(
			"fetch",
			vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
				expect(init?.method).toBe("PUT");
				return new Response(JSON.stringify(mockResponse), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			}),
		);

		const res = await updateOperation({
			id: "op-1",
			input: input as never,
			baseUrl: "https://example.com",
		});
		expect(res.amount).toBe(7000);
	});

	it("deleteOperation sends DELETE", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
				expect(init?.method).toBe("DELETE");
				return new Response(JSON.stringify({}), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			}),
		);

		await deleteOperation({
			id: "op-1",
			baseUrl: "https://example.com",
		});

		const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
		expect(calledUrl).toBe("https://example.com/api/v1/operations/op-1");
	});

	it("getActivities calls correct endpoint", async () => {
		const mockActivities = [
			{ code: "VEH", name: "Vehículos" },
			{ code: "INM", name: "Inmuebles" },
		];
		vi.stubGlobal(
			"fetch",
			vi.fn(
				async () =>
					new Response(JSON.stringify(mockActivities), {
						status: 200,
						headers: { "content-type": "application/json" },
					}),
			),
		);

		const res = await getActivities({ baseUrl: "https://example.com" });
		expect(res).toEqual(mockActivities);

		const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
		expect(calledUrl).toBe("https://example.com/api/v1/operations/activities");
	});

	it("getActivityFields calls correct endpoint with code", async () => {
		const mockFields = [{ field: "brand", type: "string", required: true }];
		vi.stubGlobal(
			"fetch",
			vi.fn(
				async () =>
					new Response(JSON.stringify(mockFields), {
						status: 200,
						headers: { "content-type": "application/json" },
					}),
			),
		);

		const res = await getActivityFields({
			code: "VEH",
			baseUrl: "https://example.com",
		});
		expect(res).toEqual(mockFields);

		const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
		expect(calledUrl).toBe(
			"https://example.com/api/v1/operations/activities/VEH/fields",
		);
	});

	it("listOperations passes JWT header", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
				const headers = init?.headers as Record<string, string> | undefined;
				expect(headers?.Authorization).toBe("Bearer test-jwt");
				return new Response(
					JSON.stringify({
						data: [],
						pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
					}),
					{ status: 200, headers: { "content-type": "application/json" } },
				);
			}),
		);

		await listOperations({
			baseUrl: "https://example.com",
			jwt: "test-jwt",
		});
	});

	it("listOperations passes abort signal", async () => {
		const controller = new AbortController();
		vi.stubGlobal(
			"fetch",
			vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
				expect(init?.signal).toBe(controller.signal);
				return new Response(
					JSON.stringify({
						data: [],
						pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
					}),
					{ status: 200, headers: { "content-type": "application/json" } },
				);
			}),
		);

		await listOperations({
			baseUrl: "https://example.com",
			signal: controller.signal,
		});
	});
});
