import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClientEditView } from "./ClientEditView";

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: vi.fn(),
	}),
	usePathname: () => "/clients/1/edit",
}));

describe("ClientEditView", () => {
	it("renders edit client header", () => {
		render(<ClientEditView clientId="1" />);
		expect(screen.getByText("Editar Cliente")).toBeInTheDocument();
	});
});
