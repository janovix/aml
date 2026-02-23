import { describe, it, expect, vi, afterEach } from "vitest";
import {
	listInvoices,
	getInvoiceById,
	getInvoiceByUuid,
	createInvoice,
	parseInvoiceXml,
	deleteInvoice,
} from "./invoices";

describe("api/invoices", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("listInvoices omits query params when not provided", async () => {
		const fetchSpy = vi.fn(async (url: RequestInfo | URL) => {
			const u = new URL(typeof url === "string" ? url : url.toString());
			expect(u.origin + u.pathname).toBe("https://example.com/api/v1/invoices");
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

		const res = await listInvoices({ baseUrl: "https://example.com" });
		expect(res.data).toEqual([]);
	});

	it("listInvoices builds all query params", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async (url: RequestInfo | URL) => {
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.searchParams.get("page")).toBe("3");
				expect(u.searchParams.get("limit")).toBe("25");
				expect(u.searchParams.get("issuerRfc")).toBe("XAXX010101000");
				expect(u.searchParams.get("receiverRfc")).toBe("XBXX010101000");
				expect(u.searchParams.get("uuid")).toBe("uuid-123");
				expect(u.searchParams.get("voucherTypeCode")).toBe("I");
				expect(u.searchParams.get("currencyCode")).toBe("MXN");
				expect(u.searchParams.get("startDate")).toBe("2024-01-01");
				expect(u.searchParams.get("endDate")).toBe("2024-12-31");
				expect(u.searchParams.get("minAmount")).toBe("100");
				expect(u.searchParams.get("maxAmount")).toBe("999999");
				return new Response(
					JSON.stringify({
						data: [],
						pagination: { page: 3, limit: 25, total: 0, totalPages: 0 },
					}),
					{ status: 200, headers: { "content-type": "application/json" } },
				);
			}),
		);

		await listInvoices({
			baseUrl: "https://example.com",
			page: 3,
			limit: 25,
			issuerRfc: "XAXX010101000",
			receiverRfc: "XBXX010101000",
			uuid: "uuid-123",
			voucherTypeCode: "I",
			currencyCode: "MXN",
			startDate: "2024-01-01",
			endDate: "2024-12-31",
			minAmount: "100",
			maxAmount: "999999",
		});
	});

	it("getInvoiceById calls correct endpoint", async () => {
		const mockInvoice = { id: "inv-1", uuid: "abc-123" };
		vi.stubGlobal(
			"fetch",
			vi.fn(
				async () =>
					new Response(JSON.stringify(mockInvoice), {
						status: 200,
						headers: { "content-type": "application/json" },
					}),
			),
		);

		const res = await getInvoiceById({
			id: "inv-1",
			baseUrl: "https://example.com",
		});
		expect(res).toEqual(mockInvoice);

		const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
		expect(calledUrl).toBe("https://example.com/api/v1/invoices/inv-1");
	});

	it("getInvoiceByUuid calls correct endpoint", async () => {
		const mockInvoice = { id: "inv-1", uuid: "abc-123" };
		vi.stubGlobal(
			"fetch",
			vi.fn(
				async () =>
					new Response(JSON.stringify(mockInvoice), {
						status: 200,
						headers: { "content-type": "application/json" },
					}),
			),
		);

		const res = await getInvoiceByUuid({
			uuid: "abc-123",
			baseUrl: "https://example.com",
		});
		expect(res).toEqual(mockInvoice);

		const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
		expect(calledUrl).toBe("https://example.com/api/v1/invoices/uuid/abc-123");
	});

	it("createInvoice sends POST", async () => {
		const mockInvoice = { id: "inv-new" };
		vi.stubGlobal(
			"fetch",
			vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
				expect(init?.method).toBe("POST");
				return new Response(JSON.stringify(mockInvoice), {
					status: 201,
					headers: { "content-type": "application/json" },
				});
			}),
		);

		const res = await createInvoice({
			input: { xmlContent: "<xml/>" } as never,
			baseUrl: "https://example.com",
		});
		expect(res).toEqual(mockInvoice);
	});

	it("parseInvoiceXml sends POST to parse-xml endpoint", async () => {
		const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		const mockResult = { parsed: true };
		vi.stubGlobal(
			"fetch",
			vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.pathname).toBe("/api/v1/invoices/parse-xml");
				expect(init?.method).toBe("POST");
				return new Response(JSON.stringify(mockResult), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			}),
		);

		const res = await parseInvoiceXml({
			input: { xmlContent: "<xml/>" } as never,
			baseUrl: "https://example.com",
		});
		expect(res).toEqual(mockResult);
		consoleSpy.mockRestore();
	});

	it("deleteInvoice sends DELETE", async () => {
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

		await deleteInvoice({
			id: "inv-1",
			baseUrl: "https://example.com",
		});

		const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
		expect(calledUrl).toBe("https://example.com/api/v1/invoices/inv-1");
	});

	it("listInvoices passes JWT", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
				const headers = init?.headers as Record<string, string> | undefined;
				expect(headers?.Authorization).toBe("Bearer my-token");
				return new Response(
					JSON.stringify({
						data: [],
						pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
					}),
					{ status: 200, headers: { "content-type": "application/json" } },
				);
			}),
		);

		await listInvoices({ baseUrl: "https://example.com", jwt: "my-token" });
	});
});
