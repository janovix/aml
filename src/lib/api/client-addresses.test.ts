import { describe, expect, it, vi } from "vitest";
import {
	createClientAddress,
	deleteClientAddress,
	listClientAddresses,
	patchClientAddress,
	updateClientAddress,
} from "./client-addresses";
import type {
	ClientAddress,
	ClientAddressCreateRequest,
	ClientAddressPatchRequest,
} from "@/types/client-address";

describe("api/client-addresses", () => {
	it("listClientAddresses requests /api/v1/clients/:clientId/addresses", async () => {
		const mockAddresses: ClientAddress[] = [
			{
				id: "ADDR1",
				clientId: "CLIENT123",
				addressType: "RESIDENTIAL",
				street1: "123 Main St",
				city: "Monterrey",
				country: "México",
				isPrimary: true,
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
			},
		];

		const fetchSpy = vi.fn(
			async (url: RequestInfo | URL, init?: RequestInit) => {
				expect((init?.method ?? "GET").toUpperCase()).toBe("GET");
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.origin + u.pathname).toBe(
					"https://example.com/api/v1/clients/CLIENT123/addresses",
				);
				return new Response(JSON.stringify({ data: mockAddresses }), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			},
		);
		vi.stubGlobal("fetch", fetchSpy);

		const res = await listClientAddresses({
			clientId: "CLIENT123",
			baseUrl: "https://example.com",
		});
		expect(res.data).toHaveLength(1);
		expect(res.data[0].id).toBe("ADDR1");
	});

	it("createClientAddress sends POST with correct body", async () => {
		const mockAddress: ClientAddress = {
			id: "ADDR1",
			clientId: "CLIENT123",
			addressType: "RESIDENTIAL",
			street1: "123 Main St",
			city: "Monterrey",
			country: "México",
			isPrimary: true,
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};

		const input: ClientAddressCreateRequest = {
			street1: "123 Main St",
			city: "Monterrey",
			country: "México",
			isPrimary: true,
		};

		const fetchSpy = vi.fn(
			async (url: RequestInfo | URL, init?: RequestInit) => {
				expect((init?.method ?? "POST").toUpperCase()).toBe("POST");
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.origin + u.pathname).toBe(
					"https://example.com/api/v1/clients/CLIENT123/addresses",
				);
				expect(init?.headers).toMatchObject({
					"content-type": "application/json",
				});
				const body = JSON.parse(init?.body as string);
				expect(body.street1).toBe("123 Main St");
				expect(body.city).toBe("Monterrey");
				return new Response(JSON.stringify(mockAddress), {
					status: 201,
					headers: { "content-type": "application/json" },
				});
			},
		);
		vi.stubGlobal("fetch", fetchSpy);

		const res = await createClientAddress({
			clientId: "CLIENT123",
			input,
			baseUrl: "https://example.com",
		});
		expect(res.id).toBe("ADDR1");
	});

	it("updateClientAddress sends PUT with correct body", async () => {
		const mockAddress: ClientAddress = {
			id: "ADDR1",
			clientId: "CLIENT123",
			addressType: "BUSINESS",
			street1: "456 Business Ave",
			city: "Guadalajara",
			country: "México",
			isPrimary: false,
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};

		const input: ClientAddressCreateRequest = {
			addressType: "BUSINESS",
			street1: "456 Business Ave",
			city: "Guadalajara",
			country: "México",
			isPrimary: false,
		};

		const fetchSpy = vi.fn(
			async (url: RequestInfo | URL, init?: RequestInit) => {
				expect((init?.method ?? "PUT").toUpperCase()).toBe("PUT");
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.origin + u.pathname).toBe(
					"https://example.com/api/v1/clients/CLIENT123/addresses/ADDR1",
				);
				expect(init?.headers).toMatchObject({
					"content-type": "application/json",
				});
				return new Response(JSON.stringify(mockAddress), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			},
		);
		vi.stubGlobal("fetch", fetchSpy);

		const res = await updateClientAddress({
			clientId: "CLIENT123",
			addressId: "ADDR1",
			input,
			baseUrl: "https://example.com",
		});
		expect(res.addressType).toBe("BUSINESS");
	});

	it("patchClientAddress sends PATCH with correct body", async () => {
		const mockAddress: ClientAddress = {
			id: "ADDR1",
			clientId: "CLIENT123",
			addressType: "RESIDENTIAL",
			street1: "123 Main St",
			city: "Monterrey",
			country: "México",
			isPrimary: false,
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};

		const input: ClientAddressPatchRequest = {
			isPrimary: false,
		};

		const fetchSpy = vi.fn(
			async (url: RequestInfo | URL, init?: RequestInit) => {
				expect((init?.method ?? "PATCH").toUpperCase()).toBe("PATCH");
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.origin + u.pathname).toBe(
					"https://example.com/api/v1/clients/CLIENT123/addresses/ADDR1",
				);
				expect(init?.headers).toMatchObject({
					"content-type": "application/json",
				});
				const body = JSON.parse(init?.body as string);
				expect(body).toEqual(input);
				return new Response(JSON.stringify(mockAddress), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			},
		);
		vi.stubGlobal("fetch", fetchSpy);

		const res = await patchClientAddress({
			clientId: "CLIENT123",
			addressId: "ADDR1",
			input,
			baseUrl: "https://example.com",
		});
		expect(res.isPrimary).toBe(false);
	});

	it("deleteClientAddress requests DELETE /api/v1/clients/:clientId/addresses/:addressId", async () => {
		const fetchSpy = vi.fn(
			async (url: RequestInfo | URL, init?: RequestInit) => {
				expect((init?.method ?? "DELETE").toUpperCase()).toBe("DELETE");
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.origin + u.pathname).toBe(
					"https://example.com/api/v1/clients/CLIENT123/addresses/ADDR1",
				);
				return new Response(null, {
					status: 204,
				});
			},
		);
		vi.stubGlobal("fetch", fetchSpy);

		await deleteClientAddress({
			clientId: "CLIENT123",
			addressId: "ADDR1",
			baseUrl: "https://example.com",
		});
		expect(fetchSpy).toHaveBeenCalledTimes(1);
	});

	it("uses getAmlCoreBaseUrl when baseUrl not provided for listClientAddresses", async () => {
		const prev = process.env.NEXT_PUBLIC_AML_CORE_URL;
		process.env.NEXT_PUBLIC_AML_CORE_URL = "https://aml-core.example.com";

		const fetchSpy = vi.fn(async (url: RequestInfo | URL) => {
			const u = new URL(typeof url === "string" ? url : url.toString());
			expect(u.origin + u.pathname).toBe(
				"https://aml-core.example.com/api/v1/clients/CLIENT123/addresses",
			);
			return new Response(JSON.stringify({ data: [] }), {
				status: 200,
				headers: { "content-type": "application/json" },
			});
		});
		vi.stubGlobal("fetch", fetchSpy);

		await listClientAddresses({ clientId: "CLIENT123" });

		if (prev === undefined) delete process.env.NEXT_PUBLIC_AML_CORE_URL;
		else process.env.NEXT_PUBLIC_AML_CORE_URL = prev;
	});

	it("uses getAmlCoreBaseUrl when baseUrl not provided for createClientAddress", async () => {
		const prev = process.env.NEXT_PUBLIC_AML_CORE_URL;
		process.env.NEXT_PUBLIC_AML_CORE_URL = "https://aml-core.example.com";

		const mockAddress: ClientAddress = {
			id: "ADDR1",
			clientId: "CLIENT123",
			addressType: "RESIDENTIAL",
			street1: "123 Main St",
			city: "Monterrey",
			country: "México",
			isPrimary: true,
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};

		const fetchSpy = vi.fn(async (url: RequestInfo | URL) => {
			const u = new URL(typeof url === "string" ? url : url.toString());
			expect(u.origin + u.pathname).toBe(
				"https://aml-core.example.com/api/v1/clients/CLIENT123/addresses",
			);
			return new Response(JSON.stringify(mockAddress), {
				status: 201,
				headers: { "content-type": "application/json" },
			});
		});
		vi.stubGlobal("fetch", fetchSpy);

		await createClientAddress({
			clientId: "CLIENT123",
			input: {
				street1: "123 Main St",
				city: "Monterrey",
				country: "México",
				isPrimary: true,
			},
		});

		if (prev === undefined) delete process.env.NEXT_PUBLIC_AML_CORE_URL;
		else process.env.NEXT_PUBLIC_AML_CORE_URL = prev;
	});

	it("uses getAmlCoreBaseUrl when baseUrl not provided for updateClientAddress", async () => {
		const prev = process.env.NEXT_PUBLIC_AML_CORE_URL;
		process.env.NEXT_PUBLIC_AML_CORE_URL = "https://aml-core.example.com";

		const mockAddress: ClientAddress = {
			id: "ADDR1",
			clientId: "CLIENT123",
			addressType: "BUSINESS",
			street1: "456 Business Ave",
			city: "Guadalajara",
			country: "México",
			isPrimary: false,
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};

		const fetchSpy = vi.fn(async (url: RequestInfo | URL) => {
			const u = new URL(typeof url === "string" ? url : url.toString());
			expect(u.origin + u.pathname).toBe(
				"https://aml-core.example.com/api/v1/clients/CLIENT123/addresses/ADDR1",
			);
			return new Response(JSON.stringify(mockAddress), {
				status: 200,
				headers: { "content-type": "application/json" },
			});
		});
		vi.stubGlobal("fetch", fetchSpy);

		await updateClientAddress({
			clientId: "CLIENT123",
			addressId: "ADDR1",
			input: {
				addressType: "BUSINESS",
				street1: "456 Business Ave",
				city: "Guadalajara",
				country: "México",
				isPrimary: false,
			},
		});

		if (prev === undefined) delete process.env.NEXT_PUBLIC_AML_CORE_URL;
		else process.env.NEXT_PUBLIC_AML_CORE_URL = prev;
	});

	it("uses getAmlCoreBaseUrl when baseUrl not provided for patchClientAddress", async () => {
		const prev = process.env.NEXT_PUBLIC_AML_CORE_URL;
		process.env.NEXT_PUBLIC_AML_CORE_URL = "https://aml-core.example.com";

		const mockAddress: ClientAddress = {
			id: "ADDR1",
			clientId: "CLIENT123",
			addressType: "RESIDENTIAL",
			street1: "123 Main St",
			city: "Monterrey",
			country: "México",
			isPrimary: false,
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};

		const fetchSpy = vi.fn(async (url: RequestInfo | URL) => {
			const u = new URL(typeof url === "string" ? url : url.toString());
			expect(u.origin + u.pathname).toBe(
				"https://aml-core.example.com/api/v1/clients/CLIENT123/addresses/ADDR1",
			);
			return new Response(JSON.stringify(mockAddress), {
				status: 200,
				headers: { "content-type": "application/json" },
			});
		});
		vi.stubGlobal("fetch", fetchSpy);

		await patchClientAddress({
			clientId: "CLIENT123",
			addressId: "ADDR1",
			input: { isPrimary: false },
		});

		if (prev === undefined) delete process.env.NEXT_PUBLIC_AML_CORE_URL;
		else process.env.NEXT_PUBLIC_AML_CORE_URL = prev;
	});

	it("uses getAmlCoreBaseUrl when baseUrl not provided for deleteClientAddress", async () => {
		const prev = process.env.NEXT_PUBLIC_AML_CORE_URL;
		process.env.NEXT_PUBLIC_AML_CORE_URL = "https://aml-core.example.com";

		const fetchSpy = vi.fn(async (url: RequestInfo | URL) => {
			const u = new URL(typeof url === "string" ? url : url.toString());
			expect(u.origin + u.pathname).toBe(
				"https://aml-core.example.com/api/v1/clients/CLIENT123/addresses/ADDR1",
			);
			return new Response(null, {
				status: 204,
			});
		});
		vi.stubGlobal("fetch", fetchSpy);

		await deleteClientAddress({
			clientId: "CLIENT123",
			addressId: "ADDR1",
		});

		if (prev === undefined) delete process.env.NEXT_PUBLIC_AML_CORE_URL;
		else process.env.NEXT_PUBLIC_AML_CORE_URL = prev;
	});
});
