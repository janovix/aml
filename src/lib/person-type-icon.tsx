import { User, Building2, Landmark } from "lucide-react";
import type { PersonType } from "@/types/client";
import type { LucideIcon } from "lucide-react";

/**
 * Person type styling configuration
 */
export interface PersonTypeStyle {
	icon: LucideIcon;
	label: string;
	description: string;
	bgColor: string;
	iconColor: string;
	borderColor: string;
	badgeBg: string;
}

const PERSON_TYPE_STYLES: Record<PersonType, PersonTypeStyle> = {
	physical: {
		icon: User,
		label: "Persona Física",
		description: "Individuo o persona natural",
		bgColor: "bg-sky-500/10",
		iconColor: "text-sky-500",
		borderColor: "border-sky-500/30",
		badgeBg: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
	},
	moral: {
		icon: Building2,
		label: "Persona Moral",
		description: "Empresa o sociedad mercantil",
		bgColor: "bg-violet-500/10",
		iconColor: "text-violet-500",
		borderColor: "border-violet-500/30",
		badgeBg: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
	},
	trust: {
		icon: Landmark,
		label: "Fideicomiso",
		description: "Contrato de administración fiduciaria",
		bgColor: "bg-amber-500/10",
		iconColor: "text-amber-500",
		borderColor: "border-amber-500/30",
		badgeBg: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
	},
};

/**
 * Returns the appropriate icon component for a person type
 */
export function getPersonTypeIcon(personType: PersonType): LucideIcon {
	return PERSON_TYPE_STYLES[personType]?.icon ?? User;
}

/**
 * Returns the complete styling configuration for a person type
 */
export function getPersonTypeStyle(personType: PersonType): PersonTypeStyle {
	return (
		PERSON_TYPE_STYLES[personType] ?? {
			icon: User,
			label: "Desconocido",
			description: "Tipo de persona no identificado",
			bgColor: "bg-muted",
			iconColor: "text-muted-foreground",
			borderColor: "border-muted",
			badgeBg: "bg-muted text-muted-foreground",
		}
	);
}
