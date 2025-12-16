import { describe, expect, it } from "vitest";
import { getClientDisplayName, type Client } from "./client";

describe("client types", () => {
	describe("getClientDisplayName", () => {
		it("returns business name for MORAL person type", () => {
			const client: Client = {
				id: "1",
				rfc: "ABC123456",
				personType: "MORAL",
				businessName: "Empresa S.A. de C.V.",
				email: "test@example.com",
				phone: "+52 1234567890",
				riskLevel: "BAJO",
				status: "ACTIVO",
				reviewStatus: "APROBADO",
				lastReview: "2024-01-01",
				alertCount: 0,
			};

			expect(getClientDisplayName(client)).toBe("Empresa S.A. de C.V.");
		});

		it("returns full name for FISICA person type", () => {
			const client: Client = {
				id: "1",
				rfc: "ABC123456",
				personType: "FISICA",
				firstName: "Juan",
				lastName: "Pérez",
				secondLastName: "García",
				email: "test@example.com",
				phone: "+52 1234567890",
				riskLevel: "BAJO",
				status: "ACTIVO",
				reviewStatus: "APROBADO",
				lastReview: "2024-01-01",
				alertCount: 0,
			};

			expect(getClientDisplayName(client)).toBe("Juan Pérez García");
		});

		it("handles FISICA without secondLastName", () => {
			const client: Client = {
				id: "1",
				rfc: "ABC123456",
				personType: "FISICA",
				firstName: "María",
				lastName: "López",
				email: "test@example.com",
				phone: "+52 1234567890",
				riskLevel: "BAJO",
				status: "ACTIVO",
				reviewStatus: "APROBADO",
				lastReview: "2024-01-01",
				alertCount: 0,
			};

			expect(getClientDisplayName(client)).toBe("María López");
		});

		it("handles empty businessName for MORAL", () => {
			const client: Client = {
				id: "1",
				rfc: "ABC123456",
				personType: "MORAL",
				businessName: "",
				email: "test@example.com",
				phone: "+52 1234567890",
				riskLevel: "BAJO",
				status: "ACTIVO",
				reviewStatus: "APROBADO",
				lastReview: "2024-01-01",
				alertCount: 0,
			};

			expect(getClientDisplayName(client)).toBe("");
		});
	});
});
