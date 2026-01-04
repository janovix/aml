import { describe, it, expect } from "vitest";
import { getClientDisplayName } from "./client";
import type { Client } from "./client";

describe("Client Types", () => {
	describe("getClientDisplayName", () => {
		it("returns full name for physical person type", () => {
			const client: Client = {
				id: "1",
				rfc: "TEST123456789",
				personType: "physical",
				firstName: "Juan",
				lastName: "Pérez",
				secondLastName: "García",
				email: "test@test.com",
				phone: "1234567890",
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

			// formatProperNoun converts names to uppercase
			expect(getClientDisplayName(client)).toBe("JUAN PÉREZ GARCÍA");
		});

		it("returns business name for moral person type", () => {
			const client: Client = {
				id: "1",
				rfc: "TEST12345678",
				personType: "moral",
				businessName: "Empresa Test S.A. de C.V.",
				email: "test@test.com",
				phone: "1234567890",
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

			// formatProperNoun converts business names to uppercase
			expect(getClientDisplayName(client)).toBe("EMPRESA TEST S.A. DE C.V.");
		});

		it("handles missing secondLastName", () => {
			const client: Client = {
				id: "1",
				rfc: "TEST123456789",
				personType: "physical",
				firstName: "Juan",
				lastName: "Pérez",
				email: "test@test.com",
				phone: "1234567890",
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

			// formatProperNoun converts names to uppercase
			expect(getClientDisplayName(client)).toBe("JUAN PÉREZ");
		});
	});
});
