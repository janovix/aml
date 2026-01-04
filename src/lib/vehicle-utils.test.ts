import { describe, it, expect } from "vitest";
import { getVehicleBrandCatalogKey } from "./vehicle-utils";
import type { TransactionVehicleType } from "@/types/transaction";

describe("vehicle-utils", () => {
	describe("getVehicleBrandCatalogKey", () => {
		it("returns terrestrial-vehicle-brands for land vehicle type", () => {
			const result = getVehicleBrandCatalogKey("land");
			expect(result).toBe("terrestrial-vehicle-brands");
		});

		it("returns maritime-vehicle-brands for marine vehicle type", () => {
			const result = getVehicleBrandCatalogKey("marine");
			expect(result).toBe("maritime-vehicle-brands");
		});

		it("returns air-vehicle-brands for air vehicle type", () => {
			const result = getVehicleBrandCatalogKey("air");
			expect(result).toBe("air-vehicle-brands");
		});

		it("returns terrestrial-vehicle-brands as fallback for empty string", () => {
			const result = getVehicleBrandCatalogKey("");
			expect(result).toBe("terrestrial-vehicle-brands");
		});

		it("returns terrestrial-vehicle-brands as fallback for invalid vehicle type", () => {
			// TypeScript would prevent this, but we test the runtime behavior
			const result = getVehicleBrandCatalogKey(
				"invalid" as TransactionVehicleType,
			);
			expect(result).toBe("terrestrial-vehicle-brands");
		});

		it("returns terrestrial-vehicle-brands as fallback for undefined", () => {
			// TypeScript would prevent this, but we test the runtime behavior
			const result = getVehicleBrandCatalogKey(
				undefined as unknown as TransactionVehicleType | "",
			);
			expect(result).toBe("terrestrial-vehicle-brands");
		});

		it("returns terrestrial-vehicle-brands as fallback for null", () => {
			// TypeScript would prevent this, but we test the runtime behavior
			const result = getVehicleBrandCatalogKey(
				null as unknown as TransactionVehicleType | "",
			);
			expect(result).toBe("terrestrial-vehicle-brands");
		});

		it("handles all valid vehicle types correctly", () => {
			const vehicleTypes: TransactionVehicleType[] = ["land", "marine", "air"];
			const expectedResults = [
				"terrestrial-vehicle-brands",
				"maritime-vehicle-brands",
				"air-vehicle-brands",
			];

			vehicleTypes.forEach((type, index) => {
				const result = getVehicleBrandCatalogKey(type);
				expect(result).toBe(expectedResults[index]);
			});
		});
	});
});
