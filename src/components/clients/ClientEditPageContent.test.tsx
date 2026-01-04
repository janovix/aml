import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ClientEditPageContent } from "./ClientEditPageContent";
import { mockClients } from "@/data/mockClients";
import { renderWithProviders } from "@/lib/testHelpers";

// Mock cookies module to return Spanish language for tests
vi.mock("@/lib/cookies", () => ({
	getCookie: (name: string) => {
		if (name === "janovix-lang") return "es";
		return undefined;
	},
	setCookie: vi.fn(),
	deleteCookie: vi.fn(),
	COOKIE_NAMES: {
		THEME: "janovix-theme",
		LANGUAGE: "janovix-lang",
	},
}));

const mockPush = vi.fn();
const mockToast = vi.fn();

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: mockPush,
		replace: vi.fn(),
	}),
	usePathname: () => `/test-org/clients/test-id/edit`,
	useSearchParams: () => new URLSearchParams(),
	useParams: () => ({ orgSlug: "test-org", id: "test-id" }),
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
		renderWithProviders(<ClientEditPageContent clientId="non-existent" />);

		expect(screen.getByText("Cliente no encontrado")).toBeInTheDocument();
	});

	it("renders edit form when client exists", () => {
		const client = mockClients[0];
		renderWithProviders(<ClientEditPageContent clientId={client.rfc} />);

		expect(screen.getByText("Editar Cliente")).toBeInTheDocument();
		expect(screen.getByLabelText("RFC *")).toBeInTheDocument();
	});

	it("displays client data in form fields", () => {
		const client = mockClients[0];
		renderWithProviders(<ClientEditPageContent clientId={client.rfc} />);

		const rfcInput = screen.getByLabelText("RFC *") as HTMLInputElement;
		expect(rfcInput.value).toBe(client.rfc);
	});

	it("renders all form sections", () => {
		const client = mockClients[0];
		renderWithProviders(<ClientEditPageContent clientId={client.rfc} />);

		const basicInfoElements = screen.getAllByText("Información Básica");
		const addressElements = screen.getAllByText("Dirección");
		expect(basicInfoElements.length).toBeGreaterThan(0);
		expect(addressElements.length).toBeGreaterThan(0);
	});

	it("renders person type specific fields for physical", () => {
		const client = mockClients.find((c) => c.personType === "physical");
		if (client) {
			renderWithProviders(<ClientEditPageContent clientId={client.rfc} />);

			expect(screen.getByLabelText("Nombre *")).toBeInTheDocument();
			expect(screen.getByLabelText("Apellido Paterno *")).toBeInTheDocument();
		}
	});

	it("renders business name field for moral", () => {
		const client = mockClients.find((c) => c.personType === "moral");
		if (client) {
			renderWithProviders(<ClientEditPageContent clientId={client.rfc} />);

			expect(screen.getByLabelText("Razón Social *")).toBeInTheDocument();
		}
	});

	it("renders all required form fields", () => {
		const client = mockClients[0];
		renderWithProviders(<ClientEditPageContent clientId={client.rfc} />);

		expect(screen.getByLabelText("RFC *")).toBeInTheDocument();
		expect(screen.getByLabelText("Email *")).toBeInTheDocument();
		expect(screen.getByLabelText("Teléfono *")).toBeInTheDocument();
	});

	it("shows person type as a read-only indicator", () => {
		const client = mockClients[0];
		renderWithProviders(<ClientEditPageContent clientId={client.rfc} />);

		expect(screen.getByText("Persona Moral")).toBeInTheDocument();
		expect(
			screen.getByText(
				"Este valor se define al dar de alta al cliente y no se puede modificar desde esta vista.",
			),
		).toBeInTheDocument();
		// Note: We can't check for no combobox because phone input has a country selector combobox
		// Instead, verify person type is displayed as text, not as a select/combobox for person type
		expect(
			screen.queryByRole("combobox", { name: /tipo de persona/i }),
		).not.toBeInTheDocument();
	});

	it("renders cancel and save buttons", () => {
		const client = mockClients[0];
		renderWithProviders(<ClientEditPageContent clientId={client.rfc} />);

		const cancelButtons = screen.getAllByText("Cancelar");
		const saveButtons = screen.getAllByText("Guardar Cambios");
		expect(cancelButtons.length).toBeGreaterThan(0);
		expect(saveButtons.length).toBeGreaterThan(0);
	});

	it("renders form with submit button", () => {
		const client = mockClients[0];
		renderWithProviders(<ClientEditPageContent clientId={client.rfc} />);

		const saveButtons = screen.getAllByText("Guardar Cambios");
		expect(saveButtons.length).toBeGreaterThan(0);
	});

	it("navigates back to client detail when cancel is clicked", async () => {
		const user = userEvent.setup();
		const client = mockClients[0];
		renderWithProviders(<ClientEditPageContent clientId={client.rfc} />);

		const cancelButtons = screen.getAllByRole("button", { name: /cancelar/i });
		await user.click(cancelButtons[0]);

		expect(mockPush).toHaveBeenCalledWith(`/clients/${client.rfc}`);
	});

	it("navigates back to client detail when back button is clicked", async () => {
		const user = userEvent.setup();
		const client = mockClients[0];
		renderWithProviders(<ClientEditPageContent clientId={client.rfc} />);

		const backButton = screen.getByRole("button", { name: /volver/i });
		await user.click(backButton);

		expect(mockPush).toHaveBeenCalledWith(`/clients/${client.rfc}`);
	});

	it("navigates to clients list when back button is clicked on not found page", async () => {
		const user = userEvent.setup();
		renderWithProviders(<ClientEditPageContent clientId="non-existent" />);

		const backButton = screen.getByRole("button", {
			name: /volver a clientes/i,
		});
		await user.click(backButton);

		expect(mockPush).toHaveBeenCalledWith("/clients");
	});

	it("allows updating RFC field", async () => {
		const user = userEvent.setup();
		const client = mockClients[0];
		renderWithProviders(<ClientEditPageContent clientId={client.rfc} />);

		const rfcInput = screen.getByLabelText("RFC *");
		await user.clear(rfcInput);
		await user.type(rfcInput, "NEWRFC123456");

		expect(rfcInput).toHaveValue("NEWRFC123456");
	});

	it("allows updating email field", async () => {
		const user = userEvent.setup();
		const client = mockClients[0];
		renderWithProviders(<ClientEditPageContent clientId={client.rfc} />);

		const emailInput = screen.getByLabelText("Email *");
		await user.clear(emailInput);
		await user.type(emailInput, "newemail@example.com");

		expect(emailInput).toHaveValue("newemail@example.com");
	});

	it("allows updating phone field", async () => {
		const user = userEvent.setup();
		const client = mockClients[0];
		renderWithProviders(<ClientEditPageContent clientId={client.rfc} />);

		const phoneInput = screen.getByLabelText("Teléfono *");
		await user.clear(phoneInput);
		await user.type(phoneInput, "9999999999");

		// Phone input component formats the value with spaces and country code
		// Check that the typed digits are present (ignoring spaces)
		const inputValue = (phoneInput as HTMLInputElement).value.replace(
			/\s/g,
			"",
		);
		expect(inputValue).toContain("9999999999");
	});

	it("allows updating business name for moral person", async () => {
		const user = userEvent.setup();
		const client = mockClients.find((c) => c.personType === "moral");
		if (!client) return;

		renderWithProviders(<ClientEditPageContent clientId={client.rfc} />);

		const businessNameInput = screen.getByLabelText("Razón Social *");
		await user.clear(businessNameInput);
		await user.type(businessNameInput, "New Company Name");

		expect(businessNameInput).toHaveValue("New Company Name");
	});

	it("allows updating address fields", async () => {
		const user = userEvent.setup();
		const client = mockClients[0];
		renderWithProviders(<ClientEditPageContent clientId={client.rfc} />);

		const streetInput = screen.getByLabelText("Calle");
		await user.clear(streetInput);
		await user.type(streetInput, "Nueva Calle");

		expect(streetInput).toHaveValue("Nueva Calle");
	});

	it("allows updating city field", async () => {
		const user = userEvent.setup();
		const client = mockClients[0];
		renderWithProviders(<ClientEditPageContent clientId={client.rfc} />);

		const cityInput = screen.getByLabelText("Ciudad");
		await user.clear(cityInput);
		await user.type(cityInput, "Nueva Ciudad");

		expect(cityInput).toHaveValue("Nueva Ciudad");
	});

	it("allows updating postal code field", async () => {
		const user = userEvent.setup();
		const client = mockClients[0];
		renderWithProviders(<ClientEditPageContent clientId={client.rfc} />);

		const postalCodeInput = screen.getByLabelText("Código Postal");
		await user.clear(postalCodeInput);
		await user.type(postalCodeInput, "12345");

		expect(postalCodeInput).toHaveValue("12345");
	});

	it("allows updating exterior number field", async () => {
		const user = userEvent.setup();
		const client = mockClients[0];
		renderWithProviders(<ClientEditPageContent clientId={client.rfc} />);

		const extNumberInput = screen.getByLabelText("Número Exterior");
		await user.clear(extNumberInput);
		await user.type(extNumberInput, "999");

		expect(extNumberInput).toHaveValue("999");
	});

	it("allows updating interior number field", async () => {
		const user = userEvent.setup();
		const client = mockClients[0];
		renderWithProviders(<ClientEditPageContent clientId={client.rfc} />);

		const intNumberInput = screen.getByLabelText("Número Interior");
		await user.clear(intNumberInput);
		await user.type(intNumberInput, "B2");

		expect(intNumberInput).toHaveValue("B2");
	});

	it("allows updating neighborhood field", async () => {
		const user = userEvent.setup();
		const client = mockClients[0];
		renderWithProviders(<ClientEditPageContent clientId={client.rfc} />);

		const neighborhoodInput = screen.getByLabelText("Colonia");
		await user.clear(neighborhoodInput);
		await user.type(neighborhoodInput, "Nueva Colonia");

		expect(neighborhoodInput).toHaveValue("Nueva Colonia");
	});

	it("allows updating state field", async () => {
		const user = userEvent.setup();
		const client = mockClients[0];
		renderWithProviders(<ClientEditPageContent clientId={client.rfc} />);

		const stateInput = screen.getByLabelText("Estado");
		await user.clear(stateInput);
		await user.type(stateInput, "JAL");

		expect(stateInput).toHaveValue("JAL");
	});

	it("submits form and shows success toast", async () => {
		const user = userEvent.setup();
		const client = mockClients[0];
		renderWithProviders(<ClientEditPageContent clientId={client.rfc} />);

		// Click the submit button
		const saveButtons = screen.getAllByRole("button", {
			name: /guardar cambios/i,
		});
		await user.click(saveButtons[0]);

		// Wait for submission to complete
		await waitFor(() => {
			expect(mockToast).toHaveBeenCalledWith(
				expect.objectContaining({
					title: "Cliente actualizado",
					description: "Los cambios se han guardado exitosamente.",
				}),
			);
		});

		// Should redirect to client detail page
		await waitFor(() => {
			expect(mockPush).toHaveBeenCalledWith(`/clients/${client.rfc}`);
		});
	});

	it("shows loading state during form submission", async () => {
		const user = userEvent.setup();
		const client = mockClients[0];
		renderWithProviders(<ClientEditPageContent clientId={client.rfc} />);

		// Click the submit button
		const saveButtons = screen.getAllByRole("button", {
			name: /guardar cambios/i,
		});
		await user.click(saveButtons[0]);

		// Should show loading text
		await waitFor(() => {
			expect(screen.getByText("Guardando...")).toBeInTheDocument();
		});
	});

	it("allows updating first name for physical person", async () => {
		const user = userEvent.setup();
		const client = mockClients.find((c) => c.personType === "physical");
		if (!client) return;

		renderWithProviders(<ClientEditPageContent clientId={client.rfc} />);

		const firstNameInput = screen.getByLabelText("Nombre *");
		await user.clear(firstNameInput);
		await user.type(firstNameInput, "Nuevo Nombre");

		expect(firstNameInput).toHaveValue("Nuevo Nombre");
	});

	it("allows updating last name for physical person", async () => {
		const user = userEvent.setup();
		const client = mockClients.find((c) => c.personType === "physical");
		if (!client) return;

		renderWithProviders(<ClientEditPageContent clientId={client.rfc} />);

		const lastNameInput = screen.getByLabelText("Apellido Paterno *");
		await user.clear(lastNameInput);
		await user.type(lastNameInput, "Nuevo Apellido");

		expect(lastNameInput).toHaveValue("Nuevo Apellido");
	});

	it("allows updating second last name for physical person", async () => {
		const user = userEvent.setup();
		const client = mockClients.find((c) => c.personType === "physical");
		if (!client) return;

		renderWithProviders(<ClientEditPageContent clientId={client.rfc} />);

		const secondLastNameInput = screen.getByLabelText("Apellido Materno");
		await user.clear(secondLastNameInput);
		await user.type(secondLastNameInput, "Segundo Apellido");

		expect(secondLastNameInput).toHaveValue("Segundo Apellido");
	});
});
