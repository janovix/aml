import { User, Building2, Landmark } from "lucide-react";
import type { PersonType } from "@/types/client";
import type { LucideIcon } from "lucide-react";
import type { TranslationKeys } from "@/lib/translations";

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

// Color and icon configuration (non-translatable)
const PERSON_TYPE_CONFIG: Record<
	PersonType,
	Omit<PersonTypeStyle, "label" | "description">
> = {
	physical: {
		icon: User,
		bgColor: "bg-sky-500/10",
		iconColor: "text-sky-500",
		borderColor: "border-sky-500/30",
		badgeBg: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
	},
	moral: {
		icon: Building2,
		bgColor: "bg-violet-500/10",
		iconColor: "text-violet-500",
		borderColor: "border-violet-500/30",
		badgeBg: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
	},
	trust: {
		icon: Landmark,
		bgColor: "bg-amber-500/10",
		iconColor: "text-amber-500",
		borderColor: "border-amber-500/30",
		badgeBg: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
	},
};

// Translation keys mapping for person type labels and descriptions
const PERSON_TYPE_TRANSLATION_KEYS: Record<
	PersonType,
	{ label: TranslationKeys; description: TranslationKeys }
> = {
	physical: {
		label: "clientPersonPhysical",
		description: "clientPersonPhysicalDesc",
	},
	moral: {
		label: "clientPersonMoral",
		description: "clientPersonMoralDesc",
	},
	trust: {
		label: "clientTrust",
		description: "clientTrustDesc",
	},
};

/**
 * Returns the appropriate icon component for a person type
 */
export function getPersonTypeIcon(personType: PersonType): LucideIcon {
	return PERSON_TYPE_CONFIG[personType]?.icon ?? User;
}

/**
 * Returns the complete styling configuration for a person type with translated labels
 */
export function getPersonTypeStyle(
	personType: PersonType,
	t: (key: TranslationKeys) => string = (key) => key,
): PersonTypeStyle {
	const config = PERSON_TYPE_CONFIG[personType];
	const keys = PERSON_TYPE_TRANSLATION_KEYS[personType];

	if (!config || !keys) {
		return {
			icon: User,
			label: "Unknown",
			description: "Unknown person type",
			bgColor: "bg-muted",
			iconColor: "text-muted-foreground",
			borderColor: "border-muted",
			badgeBg: "bg-muted text-muted-foreground",
		};
	}

	return {
		...config,
		label: t(keys.label),
		description: t(keys.description),
	};
}
