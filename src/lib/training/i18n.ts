import type { TranslationKeys } from "@/lib/translations";

/** Resolve localized string from API i18n blobs */
export function pickTrainingTitle(
	titleI18n: unknown,
	lang: "es" | "en",
): string {
	if (typeof titleI18n === "object" && titleI18n !== null) {
		const o = titleI18n as Record<string, string>;
		return o[lang] ?? o.es ?? o.en ?? "";
	}
	return "";
}

/** Map enrollment status code to translation key */
export function pickEnrollmentStatusKey(
	status: string,
):
	| "trainingStatusAssigned"
	| "trainingStatusInProgress"
	| "trainingStatusCompleted"
	| "trainingStatusExpired"
	| "trainingStatusFailed"
	| "trainingStatusLabel" {
	switch (status) {
		case "ASSIGNED":
			return "trainingStatusAssigned";
		case "IN_PROGRESS":
			return "trainingStatusInProgress";
		case "COMPLETED":
			return "trainingStatusCompleted";
		case "EXPIRED":
			return "trainingStatusExpired";
		case "FAILED":
			return "trainingStatusFailed";
		default:
			return "trainingStatusLabel";
	}
}

/** Training module `kind` → UI translation key */
export function pickTrainingModuleKindKey(kind: string): TranslationKeys {
	switch (kind) {
		case "VIDEO":
			return "trainingModuleKindVideo";
		case "PDF":
			return "trainingModuleKindPdf";
		case "IMAGE":
			return "trainingModuleKindImage";
		case "TEXT":
			return "trainingModuleKindText";
		default:
			return "trainingModuleKindUnknown";
	}
}
