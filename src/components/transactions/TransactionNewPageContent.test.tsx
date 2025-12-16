import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TransactionNewPageContent } from "./TransactionNewPageContent";

const mockPush = vi.fn();
const mockToast = vi.fn();

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: mockPush,
	}),
	usePathname: () => `/transactions/new`,
}));

vi.mock("@/hooks/use-toast", () => ({
	useToast: () => ({
		toast: mockToast,
		toasts: [],
	}),
}));

describe("TransactionNewPageContent", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders new transaction form", () => {
		render(<TransactionNewPageContent />);

		expect(screen.getByText("Nueva Transacción")).toBeInTheDocument();
		expect(screen.getByLabelText("Cliente *")).toBeInTheDocument();
	});

	it("renders all form sections", () => {
		render(<TransactionNewPageContent />);

		const basicInfoElements = screen.getAllByText("Información Básica");
		const typeStatusElements = screen.getAllByText("Tipo y Estado");
		const accountElements = screen.getAllByText("Información de Cuentas");
		expect(basicInfoElements.length).toBeGreaterThan(0);
		expect(typeStatusElements.length).toBeGreaterThan(0);
		expect(accountElements.length).toBeGreaterThan(0);
	});

	it("renders all required form fields", () => {
		render(<TransactionNewPageContent />);

		expect(screen.getByLabelText("Cliente *")).toBeInTheDocument();
		expect(screen.getByLabelText("Monto *")).toBeInTheDocument();
		expect(screen.getByLabelText("Moneda *")).toBeInTheDocument();
		expect(screen.getByLabelText("Fecha *")).toBeInTheDocument();
		expect(screen.getByLabelText("Tipo de Transacción *")).toBeInTheDocument();
		expect(screen.getByLabelText("Estado *")).toBeInTheDocument();
		expect(screen.getByLabelText("Canal *")).toBeInTheDocument();
	});

	it("renders cancel and create buttons", () => {
		render(<TransactionNewPageContent />);

		const cancelButtons = screen.getAllByText("Cancelar");
		const createButtons = screen.getAllByText("Crear Transacción");
		expect(cancelButtons.length).toBeGreaterThan(0);
		expect(createButtons.length).toBeGreaterThan(0);
	});

	it("renders account information fields", () => {
		render(<TransactionNewPageContent />);

		expect(screen.getByLabelText("Cuenta Origen")).toBeInTheDocument();
		expect(screen.getByLabelText("Cuenta Destino")).toBeInTheDocument();
	});

	it("renders description field", () => {
		render(<TransactionNewPageContent />);

		expect(screen.getByLabelText("Descripción")).toBeInTheDocument();
	});
});
