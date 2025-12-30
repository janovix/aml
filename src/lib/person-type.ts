import type { PersonType } from "@/types/client";

const PERSON_TYPE_LABELS: Record<PersonType, string> = {
	physical: "Persona Física",
	moral: "Persona Moral",
	trust: "Fideicomiso",
};

const PERSON_TYPE_LOCK_HELPER =
	"Este valor se define al dar de alta al cliente y no se puede modificar desde esta vista.";

interface PersonTypeDisplay {
	label: string;
	helper: string;
}

export function getPersonTypeDisplay(
	type?: PersonType | null,
): PersonTypeDisplay {
	if (!type) {
		return {
			label: "Tipo no disponible",
			helper:
				"No se pudo determinar el tipo de persona del cliente. Vuelve a cargar la página o contacta a soporte.",
		};
	}

	return {
		label: PERSON_TYPE_LABELS[type],
		helper: PERSON_TYPE_LOCK_HELPER,
	};
}

export function getPersonTypeLabel(type?: PersonType | null): string {
	return type ? PERSON_TYPE_LABELS[type] : "Tipo no disponible";
}
