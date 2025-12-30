import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClientDetailPageContent } from "./ClientDetailPageContent";
import { mockClients } from "@/data/mockClients";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: mockPush,
	}),
	usePathname: () => `/clients/test-id`,
}));

describe("ClientDetailPageContent", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders client not found message when client doesn't exist", () => {
		render(<ClientDetailPageContent clientId="non-existent" />);

		expect(screen.getByText("Cliente no encontrado")).toBeInTheDocument();
		expect(
			screen.getByText(/El cliente con ID non-existent no existe/),
		).toBeInTheDocument();
	});

	it("renders client details when client exists", () => {
		const client = mockClients[0];
		render(<ClientDetailPageContent clientId={client.rfc} />);

		if (client.personType === "physical") {
			const nameElements = screen.getAllByText(
				new RegExp(`${client.firstName}.*${client.lastName}`, "i"),
			);
			expect(nameElements.length).toBeGreaterThan(0);
		} else {
			const businessNameElements = screen.getAllByText(
				client.businessName || "",
			);
			expect(businessNameElements.length).toBeGreaterThan(0);
		}
	});

	it("displays client RFC", () => {
		const client = mockClients[0];
		render(<ClientDetailPageContent clientId={client.rfc} />);

		const rfcElements = screen.getAllByText(new RegExp(client.rfc));
		expect(rfcElements.length).toBeGreaterThan(0);
	});

	it("displays client email and phone", () => {
		const client = mockClients[0];
		render(<ClientDetailPageContent clientId={client.rfc} />);

		const emailElements = screen.getAllByText(client.email);
		const phoneElements = screen.getAllByText(client.phone);
		expect(emailElements.length).toBeGreaterThan(0);
		expect(phoneElements.length).toBeGreaterThan(0);
	});

	it("displays client dates", () => {
		const client = mockClients[0];
		render(<ClientDetailPageContent clientId={client.rfc} />);

		const dateElements = screen.getAllByText(
			/Fecha de creación|Última actualización/,
		);
		expect(dateElements.length).toBeGreaterThan(0);
	});

	it("displays edit button", () => {
		const client = mockClients[0];
		render(<ClientDetailPageContent clientId={client.rfc} />);

		const editButtons = screen.getAllByText("Editar");
		expect(editButtons.length).toBeGreaterThan(0);
	});
});
