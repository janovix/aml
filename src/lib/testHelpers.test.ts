import { describe, expect, it } from "vitest";
import { PointerEvent } from "./testHelpers";

describe("testHelpers", () => {
	it("PointerEvent assigns common properties", () => {
		const evt = new PointerEvent("pointerdown", { button: 1, ctrlKey: true });
		expect(evt.button).toBe(1);
		expect(evt.ctrlKey).toBe(true);
	});
});
