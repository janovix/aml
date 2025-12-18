import { describe, expect, it, vi } from "vitest";
import {
	createClientDocument,
	deleteClientDocument,
	listClientDocuments,
	patchClientDocument,
	updateClientDocument,
} from "./client-documents";
import type {
	ClientDocument,
	ClientDocumentCreateRequest,
	ClientDocumentPatchRequest,
} from "@/types/client-document";

describe("api/client-documents", () => {
	it("listClientDocuments requests /api/v1/clients/:clientId/documents", async () => {
		const mockDocuments: ClientDocument[] = [
			{
				id: "DOC1",
				clientId: "CLIENT123",
				documentType: "NATIONAL_ID",
				documentNumber: "12345678",
				status: "VERIFIED",
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
			},
		];

		const fetchSpy = vi.fn(
			async (url: RequestInfo | URL, init?: RequestInit) => {
				expect((init?.method ?? "GET").toUpperCase()).toBe("GET");
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.origin + u.pathname).toBe(
					"https://example.com/api/v1/clients/CLIENT123/documents",
				);
				return new Response(JSON.stringify({ data: mockDocuments }), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			},
		);
		vi.stubGlobal("fetch", fetchSpy);

		const res = await listClientDocuments({
			clientId: "CLIENT123",
			baseUrl: "https://example.com",
		});
		expect(res.data).toHaveLength(1);
		expect(res.data[0].id).toBe("DOC1");
	});

	it("createClientDocument sends POST with correct body", async () => {
		const mockDocument: ClientDocument = {
			id: "DOC1",
			clientId: "CLIENT123",
			documentType: "NATIONAL_ID",
			documentNumber: "12345678",
			status: "PENDING",
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};

		const input: ClientDocumentCreateRequest = {
			documentType: "NATIONAL_ID",
			documentNumber: "12345678",
			status: "PENDING",
		};

		const fetchSpy = vi.fn(
			async (url: RequestInfo | URL, init?: RequestInit) => {
				expect((init?.method ?? "POST").toUpperCase()).toBe("POST");
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.origin + u.pathname).toBe(
					"https://example.com/api/v1/clients/CLIENT123/documents",
				);
				expect(init?.headers).toMatchObject({
					"content-type": "application/json",
				});
				const body = JSON.parse(init?.body as string);
				expect(body.documentType).toBe("NATIONAL_ID");
				expect(body.documentNumber).toBe("12345678");
				return new Response(JSON.stringify(mockDocument), {
					status: 201,
					headers: { "content-type": "application/json" },
				});
			},
		);
		vi.stubGlobal("fetch", fetchSpy);

		const res = await createClientDocument({
			clientId: "CLIENT123",
			input,
			baseUrl: "https://example.com",
		});
		expect(res.id).toBe("DOC1");
	});

	it("updateClientDocument sends PUT with correct body", async () => {
		const mockDocument: ClientDocument = {
			id: "DOC1",
			clientId: "CLIENT123",
			documentType: "PASSPORT",
			documentNumber: "P123456",
			status: "VERIFIED",
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};

		const input: ClientDocumentCreateRequest = {
			documentType: "PASSPORT",
			documentNumber: "P123456",
			status: "VERIFIED",
		};

		const fetchSpy = vi.fn(
			async (url: RequestInfo | URL, init?: RequestInit) => {
				expect((init?.method ?? "PUT").toUpperCase()).toBe("PUT");
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.origin + u.pathname).toBe(
					"https://example.com/api/v1/clients/CLIENT123/documents/DOC1",
				);
				expect(init?.headers).toMatchObject({
					"content-type": "application/json",
				});
				return new Response(JSON.stringify(mockDocument), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			},
		);
		vi.stubGlobal("fetch", fetchSpy);

		const res = await updateClientDocument({
			clientId: "CLIENT123",
			documentId: "DOC1",
			input,
			baseUrl: "https://example.com",
		});
		expect(res.documentType).toBe("PASSPORT");
	});

	it("patchClientDocument sends PATCH with correct body", async () => {
		const mockDocument: ClientDocument = {
			id: "DOC1",
			clientId: "CLIENT123",
			documentType: "NATIONAL_ID",
			documentNumber: "12345678",
			status: "VERIFIED",
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};

		const input: ClientDocumentPatchRequest = {
			status: "VERIFIED",
		};

		const fetchSpy = vi.fn(
			async (url: RequestInfo | URL, init?: RequestInit) => {
				expect((init?.method ?? "PATCH").toUpperCase()).toBe("PATCH");
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.origin + u.pathname).toBe(
					"https://example.com/api/v1/clients/CLIENT123/documents/DOC1",
				);
				expect(init?.headers).toMatchObject({
					"content-type": "application/json",
				});
				const body = JSON.parse(init?.body as string);
				expect(body).toEqual(input);
				return new Response(JSON.stringify(mockDocument), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			},
		);
		vi.stubGlobal("fetch", fetchSpy);

		const res = await patchClientDocument({
			clientId: "CLIENT123",
			documentId: "DOC1",
			input,
			baseUrl: "https://example.com",
		});
		expect(res.status).toBe("VERIFIED");
	});

	it("deleteClientDocument requests DELETE /api/v1/clients/:clientId/documents/:documentId", async () => {
		const fetchSpy = vi.fn(
			async (url: RequestInfo | URL, init?: RequestInit) => {
				expect((init?.method ?? "DELETE").toUpperCase()).toBe("DELETE");
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.origin + u.pathname).toBe(
					"https://example.com/api/v1/clients/CLIENT123/documents/DOC1",
				);
				return new Response(null, {
					status: 204,
				});
			},
		);
		vi.stubGlobal("fetch", fetchSpy);

		await deleteClientDocument({
			clientId: "CLIENT123",
			documentId: "DOC1",
			baseUrl: "https://example.com",
		});
		expect(fetchSpy).toHaveBeenCalledTimes(1);
	});
});
