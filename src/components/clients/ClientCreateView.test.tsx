import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClientCreateView } from "./ClientCreateView";

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: vi.fn(),
	}),
	usePathname: () => "/clients/new",
}));

describe("ClientCreateView", () => {
	it("renders create client header and submit button", () => {
		render(<ClientCreateView />);

		expect(screen.getByText("Nuevo Cliente")).toBeInTheDocument();
		expect(
			screen.getAllByRole("button", { name: /crear cliente/i }).length,
		).toBeGreaterThan(0);
	});
});
