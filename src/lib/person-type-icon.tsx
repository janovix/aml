import { User, Building2, Shield } from "lucide-react";
import type { PersonType } from "@/types/client";
import type { LucideIcon } from "lucide-react";

/**
 * Returns the appropriate icon component for a person type
 */
export function getPersonTypeIcon(personType: PersonType): LucideIcon {
	switch (personType) {
		case "physical":
			return User;
		case "moral":
			return Building2;
		case "trust":
			return Shield;
		default:
			return User;
	}
}
