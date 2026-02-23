import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/lib/testHelpers";
import { FormActionBar } from "./FormActionBar";
import { Save, X } from "lucide-react";

// Mock ChatProvider's useChats
vi.mock("@/components/chat/ChatProvider", () => ({
	ChatProvider: ({ children }: { children: React.ReactNode }) => children,
	useChats: () => ({ isOpen: false, openChat: vi.fn(), closeChat: vi.fn() }),
}));

describe("FormActionBar", () => {
	it("renders action buttons", () => {
		renderWithProviders(
			<FormActionBar
				actions={[
					{ label: "Guardar", onClick: vi.fn() },
					{ label: "Cancelar", onClick: vi.fn() },
				]}
			/>,
		);

		expect(screen.getAllByText("Guardar").length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText("Cancelar").length).toBeGreaterThanOrEqual(1);
	});

	it("calls onClick when action button is clicked", async () => {
		const user = userEvent.setup();
		const onSave = vi.fn();
		renderWithProviders(
			<FormActionBar actions={[{ label: "Guardar", onClick: onSave }]} />,
		);

		// Click any of the rendered "Guardar" buttons (mobile + desktop)
		const buttons = screen.getAllByText("Guardar");
		await user.click(buttons[0]);
		expect(onSave).toHaveBeenCalled();
	});

	it("disables button when disabled is true", () => {
		renderWithProviders(
			<FormActionBar
				actions={[{ label: "Save", onClick: vi.fn(), disabled: true }]}
			/>,
		);

		const buttons = screen.getAllByText("Save");
		for (const button of buttons) {
			expect(button.closest("button")).toBeDisabled();
		}
	});

	it("renders icon with button", () => {
		const { container } = renderWithProviders(
			<FormActionBar
				actions={[{ label: "Guardar", onClick: vi.fn(), icon: Save }]}
			/>,
		);

		// Should render SVG icons
		const svgs = container.querySelectorAll("svg");
		expect(svgs.length).toBeGreaterThanOrEqual(1);
	});

	it("shows loading state", () => {
		renderWithProviders(
			<FormActionBar
				actions={[{ label: "Saving...", onClick: vi.fn(), loading: true }]}
			/>,
		);

		// The loading indicator should be rendered
		expect(screen.getAllByText("Saving...").length).toBeGreaterThanOrEqual(1);
	});
});
