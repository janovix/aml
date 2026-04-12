import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { OrgMitigantsList } from "./OrgMitigantsList";
import type { OrgMitigant } from "@/lib/api/risk";

describe("OrgMitigantsList", () => {
	it("sorts mitigants with exists=true first and shows effectiveness", () => {
		const mitigants: OrgMitigant[] = [
			{
				mitigantKey: "a",
				mitigantName: "Missing",
				exists: false,
				effectivenessScore: 0.5,
				riskEffect: -0.1,
			},
			{
				mitigantKey: "b",
				mitigantName: "Present",
				exists: true,
				effectivenessScore: 0.8,
				riskEffect: 0.2,
			},
		];

		render(<OrgMitigantsList mitigants={mitigants} language="es" />);

		const names = screen.getAllByText(/Present|Missing/);
		expect(names[0]?.textContent).toBe("Present");
		expect(screen.getByText(/Efectividad/i)).toBeInTheDocument();
	});
});
