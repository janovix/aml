import type { TransactionVehicleType } from "@/types/transaction";

export function getVehicleBrandCatalogKey(
	vehicleType: TransactionVehicleType | "",
): string {
	switch (vehicleType) {
		case "land":
			return "terrestrial-vehicle-brands";
		case "marine":
			return "maritime-vehicle-brands";
		case "air":
			return "air-vehicle-brands";
		default:
			return "terrestrial-vehicle-brands"; // Fallback; selector is disabled when vehicleType is empty
	}
}
