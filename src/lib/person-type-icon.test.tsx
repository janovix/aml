import { describe, expect, it } from "vitest";
import { getPersonTypeIcon } from "./person-type-icon";
import { User, Building2, Shield } from "lucide-react";
import type { PersonType } from "@/types/client";

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

	it("returns User icon as default for unknown type", () => {
		// TypeScript will prevent invalid types, but we test the default case
		// by using type assertion to simulate an invalid value
		const Icon = getPersonTypeIcon("unknown" as PersonType);
		expect(Icon).toBe(User);
	});
});
