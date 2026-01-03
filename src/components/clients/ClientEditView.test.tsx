import {
	describe,
	expect,
	it,
	vi,
	beforeEach,
	beforeAll,
	afterAll,
} from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ClientEditView } from "./ClientEditView";
import type { Client, PersonType } from "../../types/client";
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
const mockGetClientById = vi.fn();
const mockUpdateClient = vi.fn();
const originalRequestSubmit = HTMLFormElement.prototype.requestSubmit;

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: mockPush,
		replace: vi.fn(),
	}),
	usePathname: () => "/test-org/clients/1/edit",
	useSearchParams: () => new URLSearchParams(),
	useParams: () => ({ orgSlug: "test-org", id: "1" }),
}));

vi.mock("../../hooks/use-toast", () => ({
	useToast: () => ({
		toast: mockToast,
		toasts: [],
	}),
}));

vi.mock("../../hooks/useJwt", () => ({
	useJwt: () => ({
		jwt: "jwt-token",
		isLoading: false,
		error: null,
		refetch: vi.fn(),
	}),
}));

vi.mock("../../lib/api/clients", () => ({
	getClientById: (...args: unknown[]) => mockGetClientById(...args),
	updateClient: (...args: unknown[]) => mockUpdateClient(...args),
}));

vi.mock("../catalogs/CatalogSelector", () => ({
	CatalogSelector: ({ label }: { label: string }) => (
		<div data-testid={`catalog-${label}`} />
	),
}));

const buildClient = (overrides?: Partial<Client>): Client => ({
	id: "client-123",
	personType: "moral",
	businessName: "Empresas Globales",
	rfc: "EGL850101AAA",
	email: "contacto@egl.com.mx",
	phone: "+528112345678",
	country: "MX",
	stateCode: "NL",
	city: "Monterrey",
	municipality: "Monterrey",
	neighborhood: "Centro",
	street: "Av. Constitución",
	externalNumber: "123",
	postalCode: "64000",
	createdAt: "2024-01-01T00:00:00.000Z",
	updatedAt: "2024-01-02T00:00:00.000Z",
	...overrides,
});

describe("ClientEditView", () => {
	beforeAll(() => {
		HTMLFormElement.prototype.requestSubmit = function requestSubmitPolyfill() {
			this.dispatchEvent(
				new Event("submit", { bubbles: true, cancelable: true }),
			);
		};
	});

	afterAll(() => {
		HTMLFormElement.prototype.requestSubmit = originalRequestSubmit;
	});

	beforeEach(() => {
		vi.clearAllMocks();
		mockGetClientById.mockReset();
		mockUpdateClient.mockReset();
		mockToast.mockReset();
		mockPush.mockReset();
	});

	it("renders edit client header", async () => {
		mockGetClientById.mockResolvedValue(buildClient());
		mockUpdateClient.mockResolvedValue(buildClient());
		renderWithProviders(<ClientEditView clientId="1" />);
		expect(await screen.findByText("Editar Cliente")).toBeInTheDocument();
	});

	it("submits updates keeping the loaded person type for moral clients", async () => {
		const client = buildClient({
			personType: "moral",
			businessName: "Visionaria S.A.",
		});
		mockGetClientById.mockResolvedValue(client);
		mockUpdateClient.mockResolvedValue(client);

		const user = userEvent.setup();
		renderWithProviders(<ClientEditView clientId={client.id} />);

		await screen.findByDisplayValue("Visionaria S.A.");
		const saveButtons = screen.getAllByRole("button", {
			name: /guardar cambios/i,
		});
		await user.click(saveButtons.at(-1)!);

		await waitFor(() => expect(mockUpdateClient).toHaveBeenCalled());
		expect(mockUpdateClient).toHaveBeenCalledWith({
			id: client.id,
			input: expect.objectContaining({
				personType: "moral",
				businessName: "Visionaria S.A.",
			}),
		});
	});

	it("includes physical-only fields when client type is physical", async () => {
		const client = buildClient({
			personType: "physical",
			rfc: "LOGA900501E56",
			firstName: "Ana",
			lastName: "Lopez",
			secondLastName: "Garcia",
			birthDate: "1990-05-01T00:00:00.000Z",
			curp: "LOGA900501MDFRRN09",
			businessName: null,
		});
		mockGetClientById.mockResolvedValue(client);
		mockUpdateClient.mockResolvedValue(client);

		const user = userEvent.setup();
		renderWithProviders(<ClientEditView clientId={client.id} />);

		// Wait for form to load
		await screen.findByDisplayValue("Ana");
		await screen.findByDisplayValue("Lopez");

		// Wait a bit more for form to be fully ready
		await waitFor(() => {
			expect(screen.getByDisplayValue(client.rfc)).toBeInTheDocument();
		});

		const saveButtons = screen.getAllByRole("button", {
			name: /guardar cambios/i,
		});
		await user.click(saveButtons.at(-1)!);

		await waitFor(() => expect(mockUpdateClient).toHaveBeenCalled(), {
			timeout: 3000,
		});
		expect(mockUpdateClient.mock.calls[0][0].input).toMatchObject({
			personType: "physical",
			firstName: "Ana",
			lastName: "Lopez",
			secondLastName: "Garcia",
			curp: "LOGA900501MDFRRN09",
		});
	});

	it("shows an error toast when person type cannot be determined", async () => {
		const client = buildClient({
			personType: undefined as unknown as PersonType,
			businessName: "Sin Tipo",
		});
		mockGetClientById.mockResolvedValue(client);
		mockUpdateClient.mockResolvedValue(client);

		const user = userEvent.setup();
		renderWithProviders(<ClientEditView clientId={client.id} />);

		await screen.findByText("Editar Cliente");
		const saveButtons = screen.getAllByRole("button", {
			name: /guardar cambios/i,
		});
		await user.click(saveButtons.at(-1)!);

		await waitFor(() =>
			expect(mockToast).toHaveBeenCalledWith(
				expect.objectContaining({
					title: "Tipo de persona no disponible",
				}),
			),
		);
		expect(mockUpdateClient).not.toHaveBeenCalled();
	});
});
