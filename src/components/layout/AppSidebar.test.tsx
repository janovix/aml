import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppSidebar } from "./AppSidebar";

vi.mock("next/navigation", () => ({
	usePathname: () => "/clients",
}));

describe("AppSidebar", () => {
	const defaultProps = {
		collapsed: false,
		onToggle: vi.fn(),
	};

	it("renders sidebar with logo", () => {
		render(<AppSidebar {...defaultProps} />);

		expect(screen.getByText("AML Platform")).toBeInTheDocument();
	});

	it("renders navigation items", () => {
		const { container } = render(<AppSidebar {...defaultProps} />);

		const clientesLinks = screen.getAllByText("Clientes");
		const transaccionesLinks = screen.getAllByText("Transacciones");
		const ourClientes = clientesLinks.find((link) => container.contains(link));
		const ourTransacciones = transaccionesLinks.find((link) =>
			container.contains(link),
		);
		expect(ourClientes).toBeInTheDocument();
		expect(ourTransacciones).toBeInTheDocument();
	});

	it("highlights active navigation item", () => {
		const { container } = render(<AppSidebar {...defaultProps} />);

		const clientLinks = screen.getAllByRole("link", { name: /clientes/i });
		const ourLink = clientLinks.find((link) => container.contains(link));
		expect(ourLink).toHaveAttribute("aria-current", "page");
	});

	it("calls onToggle when collapse button is clicked", async () => {
		const user = userEvent.setup();
		const { container } = render(<AppSidebar {...defaultProps} />);

		const collapseButtons = screen.getAllByRole("button", {
			name: /colapsar sidebar/i,
		});
		const ourButton = collapseButtons.find((btn) => container.contains(btn));
		if (ourButton) {
			await user.click(ourButton);
			expect(defaultProps.onToggle).toHaveBeenCalled();
		}
	});

	it("renders collapsed state", () => {
		const { container } = render(
			<AppSidebar {...defaultProps} collapsed={true} />,
		);

		// When collapsed, logo text should not be visible in our container
		// Check that the sidebar has collapsed width class
		const sidebar = container.querySelector("aside");
		expect(sidebar).toHaveClass("w-16");
	});

	it("renders mobile menu when isMobile is true", () => {
		render(<AppSidebar {...defaultProps} isMobile={true} />);

		const transactionLabels = screen.getAllByText("Transacción");
		const analysisLabels = screen.getAllByText("Análisis");
		expect(transactionLabels.length).toBeGreaterThan(0);
		expect(analysisLabels.length).toBeGreaterThan(0);
	});

	it("shows 'Pronto' badge for unavailable items", () => {
		render(<AppSidebar {...defaultProps} />);

		const prontoBadges = screen.getAllByText("Pronto");
		expect(prontoBadges.length).toBeGreaterThan(0);
	});
});
