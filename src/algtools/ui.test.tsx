import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Spinner } from "@algtools/ui";

describe("@algtools/ui shim", () => {
	it("renders Spinner", () => {
		render(<Spinner />);
		expect(screen.getByRole("status")).toBeInTheDocument();
	});
});
