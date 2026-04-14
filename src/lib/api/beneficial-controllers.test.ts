import { describe, expect, it, vi, afterEach } from "vitest";
import {
	createBeneficialController,
	deleteBeneficialController,
	getBeneficialControllerById,
	listClientBeneficialControllers,
	patchBeneficialController,
	updateBeneficialController,
} from "./beneficial-controllers";
import type { BeneficialControllerCreateRequest } from "@/types/beneficial-controller";

describe("api/beneficial-controllers", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("listClientBeneficialControllers builds query string", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async (url: RequestInfo | URL) => {
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.pathname).toBe("/api/v1/clients/c1/beneficial-controllers");
				expect(u.searchParams.get("bcType")).toBe("SHAREHOLDER");
				expect(u.searchParams.get("shareholderId")).toBe("sh1");
				return new Response(JSON.stringify({ data: [], total: 0 }), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			}),
		);

		const res = await listClientBeneficialControllers({
			clientId: "c1",
			baseUrl: "https://aml.example",
			bcType: "SHAREHOLDER",
			shareholderId: "sh1",
		});
		expect(res.total).toBe(0);
	});

	it("getBeneficialControllerById hits single resource", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async (url: RequestInfo | URL) => {
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.pathname).toBe(
					"/api/v1/clients/c1/beneficial-controllers/bc1",
				);
				return new Response(JSON.stringify({ id: "bc1", clientId: "c1" }), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			}),
		);

		const bc = await getBeneficialControllerById({
			clientId: "c1",
			bcId: "bc1",
			baseUrl: "https://aml.example",
		});
		expect(bc.id).toBe("bc1");
	});

	it("createBeneficialController POSTs JSON body", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
				expect(init?.method?.toUpperCase()).toBe("POST");
				expect(JSON.parse(String(init?.body))).toMatchObject({
					firstName: "A",
				});
				return new Response(JSON.stringify({ id: "new", clientId: "c1" }), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			}),
		);

		const input: BeneficialControllerCreateRequest = {
			bcType: "SHAREHOLDER",
			identificationCriteria: "BENEFIT",
			isLegalRepresentative: false,
			firstName: "A",
			lastName: "B",
		};
		const created = await createBeneficialController({
			clientId: "c1",
			baseUrl: "https://aml.example",
			input,
		});
		expect(created.id).toBe("new");
	});

	it("updateBeneficialController sends PUT", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.pathname).toBe(
					"/api/v1/clients/c1/beneficial-controllers/bc1",
				);
				expect(init?.method?.toUpperCase()).toBe("PUT");
				return new Response(JSON.stringify({ id: "bc1", clientId: "c1" }), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			}),
		);

		const input: BeneficialControllerCreateRequest = {
			bcType: "SHAREHOLDER",
			identificationCriteria: "BENEFIT",
			isLegalRepresentative: false,
			firstName: "X",
			lastName: "Y",
		};
		const bc = await updateBeneficialController({
			clientId: "c1",
			bcId: "bc1",
			baseUrl: "https://aml.example",
			input,
		});
		expect(bc.id).toBe("bc1");
	});

	it("patchBeneficialController sends PATCH", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
				expect(init?.method?.toUpperCase()).toBe("PATCH");
				return new Response(JSON.stringify({ id: "bc1", clientId: "c1" }), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			}),
		);

		const bc = await patchBeneficialController({
			clientId: "c1",
			bcId: "bc1",
			baseUrl: "https://aml.example",
			input: { firstName: "Pat" },
		});
		expect(bc.id).toBe("bc1");
	});

	it("deleteBeneficialController sends DELETE", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.pathname).toBe(
					"/api/v1/clients/c1/beneficial-controllers/bc1",
				);
				expect(init?.method?.toUpperCase()).toBe("DELETE");
				return new Response(null, { status: 204 });
			}),
		);

		await deleteBeneficialController({
			clientId: "c1",
			bcId: "bc1",
			baseUrl: "https://aml.example",
		});
	});
});
