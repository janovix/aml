import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ClientNewPageContent } from "./ClientNewPageContent";

const mockPush = vi.fn();
const mockToast = vi.fn();

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: mockPush,
	}),
	usePathname: () => `/clients/new`,
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
		render(<ClientNewPageContent />);

		expect(screen.getByText("Nuevo Cliente")).toBeInTheDocument();
		expect(screen.getByLabelText("RFC *")).toBeInTheDocument();
	});

	it("renders all form sections", () => {
		render(<ClientNewPageContent />);

		const basicInfoElements = screen.getAllByText("Información Básica");
		const addressElements = screen.getAllByText("Dirección");
		const statusElements = screen.getAllByText("Estado y Riesgo");
		expect(basicInfoElements.length).toBeGreaterThan(0);
		expect(addressElements.length).toBeGreaterThan(0);
		expect(statusElements.length).toBeGreaterThan(0);
	});

	it("renders all required form fields", () => {
		render(<ClientNewPageContent />);

		expect(screen.getByLabelText("RFC *")).toBeInTheDocument();
		expect(screen.getByLabelText("Tipo de Persona *")).toBeInTheDocument();
		expect(screen.getByLabelText("Email *")).toBeInTheDocument();
		expect(screen.getByLabelText("Teléfono *")).toBeInTheDocument();
		expect(screen.getByLabelText("Nivel de Riesgo *")).toBeInTheDocument();
		expect(screen.getByLabelText("Estado *")).toBeInTheDocument();
	});

	it("renders cancel and create buttons", () => {
		render(<ClientNewPageContent />);

		const cancelButtons = screen.getAllByText("Cancelar");
		const createButtons = screen.getAllByText("Crear Cliente");
		expect(cancelButtons.length).toBeGreaterThan(0);
		expect(createButtons.length).toBeGreaterThan(0);
	});

	it("renders address fields", () => {
		render(<ClientNewPageContent />);

		expect(screen.getByLabelText("Calle")).toBeInTheDocument();
		expect(screen.getByLabelText("Número Exterior")).toBeInTheDocument();
		expect(screen.getByLabelText("Ciudad")).toBeInTheDocument();
	});
});
