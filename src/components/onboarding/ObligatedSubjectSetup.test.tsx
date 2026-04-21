import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/lib/testHelpers";
import { ObligatedSubjectSetup } from "./ObligatedSubjectSetup";

vi.mock("@/hooks/useJwt", () => ({
	useJwt: vi.fn(() => ({ jwt: "mock-jwt", isLoading: false })),
}));

vi.mock("@/lib/api/organization-settings", () => ({
	getOrganizationSettings: vi.fn(),
	updateOrganizationSettings: vi.fn().mockResolvedValue({}),
}));

describe("ObligatedSubjectSetup", () => {
	it("renders the setup form", () => {
		renderWithProviders(<ObligatedSubjectSetup onComplete={vi.fn()} />);

		expect(
			screen.getByText("Configuración de Sujeto Obligado"),
		).toBeInTheDocument();
		expect(screen.getByText("Actividad Vulnerable")).toBeInTheDocument();
		expect(screen.getByText("RFC del Sujeto Obligado")).toBeInTheDocument();
	});

	it("renders activity options with selectable and disabled tiles", () => {
		renderWithProviders(<ObligatedSubjectSetup onComplete={vi.fn()} />);

		expect(screen.getByText("VEH")).toBeInTheDocument();
		expect(screen.getByText("INM")).toBeInTheDocument();
		expect(screen.getByText("AVI")).toBeInTheDocument();

		const aviButton = screen.getByText("AVI").closest("button");
		expect(aviButton).toBeTruthy();
		expect(aviButton).toBeDisabled();

		const vehButton = screen.getByText("VEH").closest("button");
		expect(vehButton).toBeTruthy();
		expect(vehButton).not.toBeDisabled();
	});

	it("has disabled submit button initially", () => {
		renderWithProviders(<ObligatedSubjectSetup onComplete={vi.fn()} />);

		const submitBtn = screen.getByText("Guardar configuración");
		expect(submitBtn.closest("button")).toBeDisabled();
	});

	it("validates RFC format", async () => {
		const user = userEvent.setup();
		renderWithProviders(<ObligatedSubjectSetup onComplete={vi.fn()} />);

		const rfcInput = screen.getByPlaceholderText("Ej. XAXX010101000");
		await user.type(rfcInput, "INVALID");

		expect(screen.getByText("Formato de RFC inválido")).toBeInTheDocument();
	});

	it("shows person type for valid RFC", async () => {
		const user = userEvent.setup();
		renderWithProviders(<ObligatedSubjectSetup onComplete={vi.fn()} />);

		const rfcInput = screen.getByPlaceholderText("Ej. XAXX010101000");
		await user.type(rfcInput, "XAXX010101000");

		expect(screen.getByText("Persona Física")).toBeInTheDocument();
	});

	it("shows Persona Moral for 12 character RFC", async () => {
		const user = userEvent.setup();
		renderWithProviders(<ObligatedSubjectSetup onComplete={vi.fn()} />);

		const rfcInput = screen.getByPlaceholderText("Ej. XAXX010101000");
		await user.type(rfcInput, "XAX010101AB1");

		expect(screen.getByText("Persona Moral")).toBeInTheDocument();
	});

	it("shows permanent warning", () => {
		renderWithProviders(<ObligatedSubjectSetup onComplete={vi.fn()} />);

		expect(
			screen.getByText("Esta selección es permanente y no se puede cambiar."),
		).toBeInTheDocument();
	});
});
