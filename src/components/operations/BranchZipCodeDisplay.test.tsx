import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BranchZipCodeDisplay } from "./BranchZipCodeDisplay";

const lookup = vi.fn();
vi.mock("@/hooks/useZipCodeLookup", () => ({
	useZipCodeLookup: () => ({
		lookup,
		loading: false,
	}),
}));

describe("BranchZipCodeDisplay", () => {
	it("returns null for invalid zip", () => {
		const { container } = render(<BranchZipCodeDisplay zipCode="12" />);
		expect(container.firstChild).toBeNull();
	});

	it("shows city and state when lookup succeeds", async () => {
		lookup.mockResolvedValue({
			municipality: "Benito Juárez",
			state: "CDMX",
			city: "Ciudad de México",
		});

		render(<BranchZipCodeDisplay zipCode="03100" />);

		await waitFor(() => {
			expect(screen.getByText("Ciudad de México, CDMX")).toBeInTheDocument();
		});
		expect(screen.getByText("Benito Juárez")).toBeInTheDocument();
	});
});
