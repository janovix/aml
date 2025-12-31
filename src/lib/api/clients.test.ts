import { describe, expect, it, vi } from "vitest";
import {
	createClient,
	deleteClient,
	getClientByRfc,
	listClients,
	patchClient,
	updateClient,
} from "./clients";
import type {
	Client,
	ClientCreateRequest,
	ClientsListResponse,
} from "@/types/client";

describe("api/clients", () => {
	it("listClients omits query params when not provided", async () => {
		const fetchSpy = vi.fn(async (url: RequestInfo | URL) => {
			const u = new URL(typeof url === "string" ? url : url.toString());
			expect(u.origin + u.pathname).toBe("https://example.com/api/v1/clients");
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

		const res = await listClients({ baseUrl: "https://example.com" });
		expect(res.data).toEqual([]);
		expect(res.pagination.page).toBe(1);
	});

	it("listClients builds query params correctly", async () => {
		const fetchSpy = vi.fn(
			async (url: RequestInfo | URL, init?: RequestInit) => {
				expect((init?.method ?? "GET").toUpperCase()).toBe("GET");
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.origin + u.pathname).toBe(
					"https://example.com/api/v1/clients",
				);
				expect(u.searchParams.get("page")).toBe("2");
				expect(u.searchParams.get("limit")).toBe("20");
				expect(u.searchParams.get("search")).toBe("test");
				expect(u.searchParams.get("rfc")).toBe("ABC123456789");
				expect(u.searchParams.get("personType")).toBe("physical");
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

		const res = await listClients({
			baseUrl: "https://example.com",
			page: 2,
			limit: 20,
			search: "test",
			rfc: "ABC123456789",
			personType: "physical",
		});
		expect(res.pagination.page).toBe(2);
		expect(res.pagination.limit).toBe(20);
	});

	it("getClientByRfc searches /api/v1/clients with rfc query param", async () => {
		const mockClient: Client = {
			id: "test-id",
			rfc: "ABC123456789",
			personType: "physical",
			firstName: "John",
			lastName: "Doe",
			email: "john@example.com",
			phone: "+1234567890",
			country: "México",
			stateCode: "NL",
			city: "Monterrey",
			municipality: "Monterrey",
			neighborhood: "Centro",
			street: "Av. Constitución",
			externalNumber: "123",
			postalCode: "64000",
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};

		const fetchSpy = vi.fn(
			async (url: RequestInfo | URL, init?: RequestInit) => {
				expect((init?.method ?? "GET").toUpperCase()).toBe("GET");
				expect(typeof url === "string" ? url : url.toString()).toBe(
					"https://example.com/api/v1/clients?rfc=ABC123456789&limit=1",
				);
				// Returns a list response with the matching client
				return new Response(JSON.stringify({ data: [mockClient], total: 1 }), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			},
		);
		vi.stubGlobal("fetch", fetchSpy);

		const res = await getClientByRfc({
			baseUrl: "https://example.com",
			rfc: "ABC123456789",
		});
		expect(res.rfc).toBe("ABC123456789");
		expect(res.firstName).toBe("John");
	});

	it("createClient sends POST with JSON body", async () => {
		const input: ClientCreateRequest = {
			personType: "physical",
			rfc: "PECJ850615E56",
			firstName: "Juan",
			lastName: "Pérez",
			birthDate: "1985-06-15",
			curp: "PECJ850615HDFRRN09",
			email: "juan@example.com",
			phone: "+525512345678",
			country: "México",
			stateCode: "CDMX",
			city: "Ciudad de México",
			municipality: "Benito Juárez",
			neighborhood: "Del Valle",
			street: "Av. Insurgentes Sur",
			externalNumber: "1234",
			postalCode: "03100",
		};

		const mockClient: Client = {
			id: "new-id",
			...input,
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};

		const fetchSpy = vi.fn(
			async (_url: RequestInfo | URL, init?: RequestInit) => {
				expect((init?.method ?? "").toUpperCase()).toBe("POST");
				expect((init?.headers as Record<string, string>)["content-type"]).toBe(
					"application/json",
				);
				const body = JSON.parse(String(init?.body));
				expect(body.personType).toBe("physical");
				expect(body.rfc).toBe("PECJ850615E56");
				return new Response(JSON.stringify(mockClient), {
					status: 201,
					headers: { "content-type": "application/json" },
				});
			},
		);
		vi.stubGlobal("fetch", fetchSpy);

		const res = await createClient({
			baseUrl: "https://example.com",
			input,
		});
		expect(res.rfc).toBe("PECJ850615E56");
		expect(res.firstName).toBe("Juan");
	});

	it("updateClient sends PUT with JSON body", async () => {
		const input: ClientCreateRequest = {
			personType: "moral",
			rfc: "EMP850101AAA",
			businessName: "Empresa S.A. de C.V.",
			incorporationDate: "1985-01-01T00:00:00Z",
			email: "contacto@empresa.com",
			phone: "+525512345678",
			country: "México",
			stateCode: "CDMX",
			city: "Ciudad de México",
			municipality: "Benito Juárez",
			neighborhood: "Del Valle",
			street: "Av. Insurgentes Sur",
			externalNumber: "1234",
			postalCode: "03100",
		};

		const mockClient: Client = {
			id: "updated-id",
			...input,
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-02T00:00:00Z",
		};

		const fetchSpy = vi.fn(
			async (url: RequestInfo | URL, init?: RequestInit) => {
				expect(typeof url === "string" ? url : url.toString()).toBe(
					"https://example.com/api/v1/clients/EMP850101AAA",
				);
				expect((init?.method ?? "").toUpperCase()).toBe("PUT");
				expect(JSON.parse(String(init?.body))).toEqual(input);
				return new Response(JSON.stringify(mockClient), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			},
		);
		vi.stubGlobal("fetch", fetchSpy);

		const res = await updateClient({
			baseUrl: "https://example.com",
			id: "EMP850101AAA",
			input,
		});
		expect(res.rfc).toBe("EMP850101AAA");
		expect(res.businessName).toBe("Empresa S.A. de C.V.");
	});

	it("patchClient sends PATCH with JSON body", async () => {
		const partialInput = {
			email: "newemail@example.com",
			phone: "+525598765432",
		};

		const mockClient: Client = {
			id: "patched-id",
			rfc: "ABC123456789",
			personType: "physical",
			firstName: "John",
			lastName: "Doe",
			email: "newemail@example.com",
			phone: "+525598765432",
			country: "México",
			stateCode: "NL",
			city: "Monterrey",
			municipality: "Monterrey",
			neighborhood: "Centro",
			street: "Av. Constitución",
			externalNumber: "123",
			postalCode: "64000",
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-02T00:00:00Z",
		};

		const fetchSpy = vi.fn(
			async (url: RequestInfo | URL, init?: RequestInit) => {
				expect(typeof url === "string" ? url : url.toString()).toBe(
					"https://example.com/api/v1/clients/ABC123456789",
				);
				expect((init?.method ?? "").toUpperCase()).toBe("PATCH");
				const body = JSON.parse(String(init?.body));
				expect(body.email).toBe("newemail@example.com");
				expect(body.phone).toBe("+525598765432");
				return new Response(JSON.stringify(mockClient), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			},
		);
		vi.stubGlobal("fetch", fetchSpy);

		const res = await patchClient({
			baseUrl: "https://example.com",
			id: "ABC123456789",
			input: partialInput,
		});
		expect(res.email).toBe("newemail@example.com");
		expect(res.phone).toBe("+525598765432");
	});

	it("deleteClient requests DELETE /api/v1/clients/:rfc", async () => {
		const fetchSpy = vi.fn(
			async (url: RequestInfo | URL, init?: RequestInit) => {
				expect(typeof url === "string" ? url : url.toString()).toBe(
					"https://example.com/api/v1/clients/ABC123456789",
				);
				expect((init?.method ?? "").toUpperCase()).toBe("DELETE");
				return new Response(null, {
					status: 204,
				});
			},
		);
		vi.stubGlobal("fetch", fetchSpy);

		await deleteClient({
			baseUrl: "https://example.com",
			id: "ABC123456789",
		});
		// Should not throw
	});

	it("uses getAmlCoreBaseUrl when baseUrl not provided", async () => {
		const prev = process.env.NEXT_PUBLIC_AML_CORE_URL;
		process.env.NEXT_PUBLIC_AML_CORE_URL = "https://aml-core.example.com";

		const fetchSpy = vi.fn(async (url: RequestInfo | URL) => {
			expect(typeof url === "string" ? url : url.toString()).toBe(
				"https://aml-core.example.com/api/v1/clients",
			);
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

		await listClients();

		if (prev === undefined) delete process.env.NEXT_PUBLIC_AML_CORE_URL;
		else process.env.NEXT_PUBLIC_AML_CORE_URL = prev;
	});
});
