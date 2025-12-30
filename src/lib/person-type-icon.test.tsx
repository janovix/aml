import { describe, expect, it } from "vitest";
import { getPersonTypeIcon } from "./person-type-icon";
import { User, Building2, Shield } from "lucide-react";

describe("getPersonTypeIcon", () => {
	it("returns User icon for physical person type", () => {
		const Icon = getPersonTypeIcon("physical");
		expect(Icon).toBe(User);
	});

	it("returns Building2 icon for moral person type", () => {
		const Icon = getPersonTypeIcon("moral");
		expect(Icon).toBe(Building2);
	});

	it("returns Shield icon for trust person type", () => {
		const Icon = getPersonTypeIcon("trust");
		expect(Icon).toBe(Shield);
	});
});
