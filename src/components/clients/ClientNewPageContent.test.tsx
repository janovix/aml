import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ClientNewPageContent } from "./ClientNewPageContent";
import { LanguageProvider } from "@/components/LanguageProvider";

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

// Wrapper component with providers
const renderWithProviders = (ui: React.ReactElement) => {
	return render(ui, {
		wrapper: ({ children }) => <LanguageProvider>{children}</LanguageProvider>,
	});
};

const mockPush = vi.fn();
const mockToast = vi.fn();

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: mockPush,
	}),
}));

vi.mock("@/hooks/use-toast", () => ({
	useToast: () => ({
		toast: mockToast,
		toasts: [],
	}),
}));

describe("ClientNewPageContent", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders new client form", () => {
		renderWithProviders(<ClientNewPageContent />);

		expect(screen.getByText("Nuevo Cliente")).toBeInTheDocument();
		expect(screen.getByLabelText("RFC *")).toBeInTheDocument();
	});

	it("renders all form sections", () => {
		renderWithProviders(<ClientNewPageContent />);

		const basicInfoElements = screen.getAllByText("Información Básica");
		const addressElements = screen.getAllByText("Dirección");
		expect(basicInfoElements.length).toBeGreaterThan(0);
		expect(addressElements.length).toBeGreaterThan(0);
	});

	it("renders all required form fields", () => {
		renderWithProviders(<ClientNewPageContent />);

		expect(screen.getByLabelText("RFC *")).toBeInTheDocument();
		expect(screen.getByLabelText("Tipo de Persona *")).toBeInTheDocument();
		expect(screen.getByLabelText("Email *")).toBeInTheDocument();
		expect(screen.getByLabelText("Teléfono *")).toBeInTheDocument();
	});

	it("renders cancel and create buttons", () => {
		renderWithProviders(<ClientNewPageContent />);

		const cancelButtons = screen.getAllByText("Cancelar");
		const createButtons = screen.getAllByText("Crear Cliente");
		expect(cancelButtons.length).toBeGreaterThan(0);
		expect(createButtons.length).toBeGreaterThan(0);
	});

	it("renders address fields", () => {
		renderWithProviders(<ClientNewPageContent />);

		expect(screen.getByLabelText("Calle")).toBeInTheDocument();
		expect(screen.getByLabelText("Número Exterior")).toBeInTheDocument();
		expect(screen.getByLabelText("Ciudad")).toBeInTheDocument();
	});

	it("navigates to clients page when cancel is clicked", async () => {
		const user = userEvent.setup();
		renderWithProviders(<ClientNewPageContent />);

		const cancelButtons = screen.getAllByRole("button", { name: /cancelar/i });
		await user.click(cancelButtons[0]);

		expect(mockPush).toHaveBeenCalledWith("/clients");
	});

	it("navigates to clients page when back button is clicked", async () => {
		const user = userEvent.setup();
		renderWithProviders(<ClientNewPageContent />);

		const backButton = screen.getByRole("button", { name: /volver/i });
		await user.click(backButton);

		expect(mockPush).toHaveBeenCalledWith("/clients");
	});

	it("updates form fields when user types", async () => {
		const user = userEvent.setup();
		renderWithProviders(<ClientNewPageContent />);

		const rfcInput = screen.getByLabelText("RFC *");
		await user.type(rfcInput, "ABC123456789");

		expect(rfcInput).toHaveValue("ABC123456789");
	});

	it("updates email field when user types", async () => {
		const user = userEvent.setup();
		renderWithProviders(<ClientNewPageContent />);

		const emailInput = screen.getByLabelText("Email *");
		await user.type(emailInput, "test@example.com");

		expect(emailInput).toHaveValue("test@example.com");
	});

	it("updates phone field when user types", async () => {
		const user = userEvent.setup();
		renderWithProviders(<ClientNewPageContent />);

		const phoneInput = screen.getByLabelText("Teléfono *");
		await user.type(phoneInput, "1234567890");

		// Phone input component formats the value with spaces and country code
		// Check that the typed digits are present (ignoring spaces)
		const inputValue = (phoneInput as HTMLInputElement).value.replace(
			/\s/g,
			"",
		);
		expect(inputValue).toContain("1234567890");
	});

	it("shows physical person name fields when physical person type is selected", async () => {
		const user = userEvent.setup();
		renderWithProviders(<ClientNewPageContent />);

		// Initially, name fields should not be visible
		expect(screen.queryByLabelText("Nombre *")).not.toBeInTheDocument();

		// Select physical person type
		const personTypeSelect = screen.getByLabelText("Tipo de Persona *");
		await user.click(personTypeSelect);
		await user.click(screen.getByRole("option", { name: "Persona Física" }));

		// Now name fields should be visible
		expect(screen.getByLabelText("Nombre *")).toBeInTheDocument();
		expect(screen.getByLabelText("Apellido Paterno *")).toBeInTheDocument();
		expect(screen.getByLabelText("Apellido Materno")).toBeInTheDocument();
	});

	it("shows business name field when moral person type is selected", async () => {
		const user = userEvent.setup();
		renderWithProviders(<ClientNewPageContent />);

		// Select moral person type
		const personTypeSelect = screen.getByLabelText("Tipo de Persona *");
		await user.click(personTypeSelect);
		await user.click(screen.getByRole("option", { name: "Persona Moral" }));

		// Business name field should be visible
		expect(screen.getByLabelText("Razón Social *")).toBeInTheDocument();
		// Individual name fields should not be visible
		expect(screen.queryByLabelText("Nombre *")).not.toBeInTheDocument();
	});

	it("shows business name field when trust person type is selected", async () => {
		const user = userEvent.setup();
		renderWithProviders(<ClientNewPageContent />);

		// Select trust person type
		const personTypeSelect = screen.getByLabelText("Tipo de Persona *");
		await user.click(personTypeSelect);
		await user.click(screen.getByRole("option", { name: "Fideicomiso" }));

		// Business name field should be visible
		expect(screen.getByLabelText("Razón Social *")).toBeInTheDocument();
	});

	it("allows entering first name for physical person", async () => {
		const user = userEvent.setup();
		renderWithProviders(<ClientNewPageContent />);

		// Select physical person type
		const personTypeSelect = screen.getByLabelText("Tipo de Persona *");
		await user.click(personTypeSelect);
		await user.click(screen.getByRole("option", { name: "Persona Física" }));

		// Enter name
		const firstNameInput = screen.getByLabelText("Nombre *");
		await user.type(firstNameInput, "Juan");

		expect(firstNameInput).toHaveValue("Juan");
	});

	it("allows entering last names for physical person", async () => {
		const user = userEvent.setup();
		renderWithProviders(<ClientNewPageContent />);

		// Select physical person type
		const personTypeSelect = screen.getByLabelText("Tipo de Persona *");
		await user.click(personTypeSelect);
		await user.click(screen.getByRole("option", { name: "Persona Física" }));

		// Enter last names
		const lastNameInput = screen.getByLabelText("Apellido Paterno *");
		await user.type(lastNameInput, "Perez");

		const secondLastNameInput = screen.getByLabelText("Apellido Materno");
		await user.type(secondLastNameInput, "Garcia");

		expect(lastNameInput).toHaveValue("Perez");
		expect(secondLastNameInput).toHaveValue("Garcia");
	});

	it("allows entering business name for moral person", async () => {
		const user = userEvent.setup();
		renderWithProviders(<ClientNewPageContent />);

		// Select moral person type
		const personTypeSelect = screen.getByLabelText("Tipo de Persona *");
		await user.click(personTypeSelect);
		await user.click(screen.getByRole("option", { name: "Persona Moral" }));

		// Enter business name
		const businessNameInput = screen.getByLabelText("Razón Social *");
		await user.type(businessNameInput, "Empresa S.A. de C.V.");

		expect(businessNameInput).toHaveValue("Empresa S.A. de C.V.");
	});

	it("allows entering address fields", async () => {
		const user = userEvent.setup();
		renderWithProviders(<ClientNewPageContent />);

		const streetInput = screen.getByLabelText("Calle");
		await user.type(streetInput, "Av. Reforma");

		const extNumberInput = screen.getByLabelText("Número Exterior");
		await user.type(extNumberInput, "123");

		const intNumberInput = screen.getByLabelText("Número Interior");
		await user.type(intNumberInput, "4A");

		const neighborhoodInput = screen.getByLabelText("Colonia");
		await user.type(neighborhoodInput, "Centro");

		const cityInput = screen.getByLabelText("Ciudad");
		await user.type(cityInput, "Ciudad de México");

		const zipCodeInput = screen.getByLabelText("Código Postal");
		await user.type(zipCodeInput, "06600");

		const stateInput = screen.getByLabelText("Estado");
		await user.type(stateInput, "CDMX");

		expect(streetInput).toHaveValue("Av. Reforma");
		expect(extNumberInput).toHaveValue("123");
		expect(intNumberInput).toHaveValue("4A");
		expect(neighborhoodInput).toHaveValue("Centro");
		expect(cityInput).toHaveValue("Ciudad de México");
		expect(zipCodeInput).toHaveValue("06600");
		expect(stateInput).toHaveValue("CDMX");
	});

	it("submits form and shows success toast", async () => {
		const user = userEvent.setup();
		renderWithProviders(<ClientNewPageContent />);

		// Click the submit button
		const createButtons = screen.getAllByRole("button", {
			name: /crear cliente/i,
		});
		await user.click(createButtons[0]);

		// Wait for submission to complete
		await waitFor(() => {
			expect(mockToast).toHaveBeenCalledWith(
				expect.objectContaining({
					title: "Cliente creado",
					description: "El cliente se ha creado exitosamente.",
				}),
			);
		});

		// Should redirect to clients page
		await waitFor(() => {
			expect(mockPush).toHaveBeenCalledWith("/clients");
		});
	});

	it("shows loading state during form submission", async () => {
		const user = userEvent.setup();
		renderWithProviders(<ClientNewPageContent />);

		// Click the submit button
		const createButtons = screen.getAllByRole("button", {
			name: /crear cliente/i,
		});
		await user.click(createButtons[0]);

		// Should show loading text
		await waitFor(() => {
			expect(screen.getByText("Creando...")).toBeInTheDocument();
		});
	});

	it("submits form via form submit event", async () => {
		const user = userEvent.setup();
		renderWithProviders(<ClientNewPageContent />);

		// Fill in a required field and submit via the form
		const rfcInput = screen.getByLabelText("RFC *");
		await user.type(rfcInput, "ABC123456789{enter}");

		// Wait for submission to complete
		await waitFor(() => {
			expect(mockToast).toHaveBeenCalled();
		});
	});
});
