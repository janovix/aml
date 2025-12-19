import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AlertsPageContent } from "./AlertsPageContent";
import { useRouter } from "next/navigation";

vi.mock("next/navigation", () => ({
	useRouter: vi.fn(),
}));

describe("AlertsPageContent", () => {
	it("should render the alerts page content", () => {
		const mockPush = vi.fn();
		vi.mocked(useRouter).mockReturnValue({
			push: mockPush,
		} as unknown as ReturnType<typeof useRouter>);

		render(<AlertsPageContent />);

		expect(screen.getByText("Avisos")).toBeInTheDocument();
		expect(
			screen.getByText("Gestión y monitoreo de alertas de cumplimiento AML"),
		).toBeInTheDocument();
		expect(screen.getByLabelText("Nuevo Aviso")).toBeInTheDocument();
	});
});
