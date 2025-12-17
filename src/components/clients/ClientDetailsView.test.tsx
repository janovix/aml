import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClientDetailsView } from "./ClientDetailsView";

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: vi.fn(),
	}),
	usePathname: () => "/clients/1",
}));

describe("ClientDetailsView", () => {
	it("renders client details header", () => {
		render(<ClientDetailsView clientId="1" />);
		expect(screen.getByText("Detalles del Cliente")).toBeInTheDocument();
	});
});
