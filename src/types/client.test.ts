import { describe, it, expect } from "vitest";
import { getClientDisplayName } from "./client";
import type { Client } from "./client";

describe("Client Types", () => {
	describe("getClientDisplayName", () => {
		it("returns full name for FISICA person type", () => {
			const client: Client = {
				id: "1",
				rfc: "TEST123456",
				personType: "FISICA",
				firstName: "Juan",
				lastName: "Pérez",
				secondLastName: "García",
				email: "test@test.com",
				phone: "1234567890",
				riskLevel: "BAJO",
				status: "ACTIVO",
				reviewStatus: "APROBADO",
				lastReview: "2024-01-01",
				alertCount: 0,
			};

			expect(getClientDisplayName(client)).toBe("Juan Pérez García");
		});

		it("returns business name for MORAL person type", () => {
			const client: Client = {
				id: "1",
				rfc: "TEST123456",
				personType: "MORAL",
				businessName: "Empresa Test S.A. de C.V.",
				email: "test@test.com",
				phone: "1234567890",
				riskLevel: "BAJO",
				status: "ACTIVO",
				reviewStatus: "APROBADO",
				lastReview: "2024-01-01",
				alertCount: 0,
			};

			expect(getClientDisplayName(client)).toBe("Empresa Test S.A. de C.V.");
		});

		it("handles missing secondLastName", () => {
			const client: Client = {
				id: "1",
				rfc: "TEST123456",
				personType: "FISICA",
				firstName: "Juan",
				lastName: "Pérez",
				email: "test@test.com",
				phone: "1234567890",
				riskLevel: "BAJO",
				status: "ACTIVO",
				reviewStatus: "APROBADO",
				lastReview: "2024-01-01",
				alertCount: 0,
			};

			expect(getClientDisplayName(client)).toBe("Juan Pérez");
		});
	});
});
