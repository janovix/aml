import { describe, expect, it } from "vitest";

import { pickTrainingTitle, pickEnrollmentStatusKey } from "./i18n";

describe("pickTrainingTitle", () => {
	it("prefers requested language then falls back", () => {
		expect(pickTrainingTitle({ es: "Hola", en: "Hi" }, "en")).toBe("Hi");
		expect(pickTrainingTitle({ es: "Hola" }, "en")).toBe("Hola");
		expect(pickTrainingTitle(null, "es")).toBe("");
	});
});

describe("pickEnrollmentStatusKey", () => {
	it("returns correct translation keys for each status", () => {
		expect(pickEnrollmentStatusKey("ASSIGNED")).toBe("trainingStatusAssigned");
		expect(pickEnrollmentStatusKey("IN_PROGRESS")).toBe(
			"trainingStatusInProgress",
		);
		expect(pickEnrollmentStatusKey("COMPLETED")).toBe(
			"trainingStatusCompleted",
		);
		expect(pickEnrollmentStatusKey("EXPIRED")).toBe("trainingStatusExpired");
		expect(pickEnrollmentStatusKey("FAILED")).toBe("trainingStatusFailed");
		expect(pickEnrollmentStatusKey("UNKNOWN")).toBe("trainingStatusLabel");
	});
});
