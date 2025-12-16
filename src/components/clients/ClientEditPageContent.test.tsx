import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ClientEditPageContent } from "./ClientEditPageContent";
import { mockClients } from "@/data/mockClients";

const mockPush = vi.fn();
const mockToast = vi.fn();

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: mockPush,
	}),
	usePathname: () => `/clients/test-id/edit`,
}));

vi.mock("@/hooks/use-toast", () => ({
	useToast: () => ({
		toast: mockToast,
		toasts: [],
	}),
}));

describe("ClientEditPageContent", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders client not found message when client doesn't exist", () => {
		render(<ClientEditPageContent clientId="non-existent" />);

		expect(screen.getByText("Cliente no encontrado")).toBeInTheDocument();
	});

	it("renders edit form when client exists", () => {
		const client = mockClients[0];
		render(<ClientEditPageContent clientId={client.id} />);

		expect(screen.getByText("Editar Cliente")).toBeInTheDocument();
		expect(screen.getByLabelText("RFC *")).toBeInTheDocument();
	});

	it("displays client data in form fields", () => {
		const client = mockClients[0];
		render(<ClientEditPageContent clientId={client.id} />);

		const rfcInput = screen.getByLabelText("RFC *") as HTMLInputElement;
		expect(rfcInput.value).toBe(client.rfc);
	});

	it("renders all form sections", () => {
		const client = mockClients[0];
		render(<ClientEditPageContent clientId={client.id} />);

		const basicInfoElements = screen.getAllByText("Información Básica");
		const addressElements = screen.getAllByText("Dirección");
		const statusElements = screen.getAllByText("Estado y Riesgo");
		expect(basicInfoElements.length).toBeGreaterThan(0);
		expect(addressElements.length).toBeGreaterThan(0);
		expect(statusElements.length).toBeGreaterThan(0);
	});

	it("renders person type specific fields for FISICA", () => {
		const client = mockClients.find((c) => c.personType === "FISICA");
		if (client) {
			render(<ClientEditPageContent clientId={client.id} />);

			expect(screen.getByLabelText("Nombre *")).toBeInTheDocument();
			expect(screen.getByLabelText("Apellido Paterno *")).toBeInTheDocument();
		}
	});

	it("renders business name field for MORAL", () => {
		const client = mockClients.find((c) => c.personType === "MORAL");
		if (client) {
			render(<ClientEditPageContent clientId={client.id} />);

			expect(screen.getByLabelText("Razón Social *")).toBeInTheDocument();
		}
	});

	it("renders all required form fields", () => {
		const client = mockClients[0];
		render(<ClientEditPageContent clientId={client.id} />);

		expect(screen.getByLabelText("RFC *")).toBeInTheDocument();
		expect(screen.getByLabelText("Email *")).toBeInTheDocument();
		expect(screen.getByLabelText("Teléfono *")).toBeInTheDocument();
		expect(screen.getByLabelText("Nivel de Riesgo *")).toBeInTheDocument();
		expect(screen.getByLabelText("Estado *")).toBeInTheDocument();
	});

	it("renders cancel and save buttons", () => {
		const client = mockClients[0];
		render(<ClientEditPageContent clientId={client.id} />);

		const cancelButtons = screen.getAllByText("Cancelar");
		const saveButtons = screen.getAllByText("Guardar Cambios");
		expect(cancelButtons.length).toBeGreaterThan(0);
		expect(saveButtons.length).toBeGreaterThan(0);
	});

	it("renders form with submit button", () => {
		const client = mockClients[0];
		render(<ClientEditPageContent clientId={client.id} />);

		const saveButtons = screen.getAllByText("Guardar Cambios");
		expect(saveButtons.length).toBeGreaterThan(0);
	});
});
