import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppSidebar } from "./AppSidebar";

// Mock next/navigation
vi.mock("next/navigation", () => ({
	usePathname: () => "/clients",
}));

describe("AppSidebar", () => {
	it("renders the sidebar with navigation items", () => {
		const mockOnToggle = vi.fn();
		render(<AppSidebar collapsed={false} onToggle={mockOnToggle} />);

		expect(screen.getByText("AML Platform")).toBeInTheDocument();
		expect(screen.getByText("Clientes")).toBeInTheDocument();
		expect(screen.getByText("Avisos")).toBeInTheDocument();
		expect(screen.getByText("Transacciones")).toBeInTheDocument();
	});

	it("renders collapsed sidebar", () => {
		const mockOnToggle = vi.fn();
		const { container } = render(
			<AppSidebar collapsed={true} onToggle={mockOnToggle} />,
		);

		// In collapsed mode, the sidebar should have the collapsed width class
		const sidebar = container.querySelector("aside");
		expect(sidebar).toHaveClass("w-16");
	});

	it("renders mobile sidebar", () => {
		const mockOnToggle = vi.fn();
		render(
			<AppSidebar collapsed={false} onToggle={mockOnToggle} isMobile={true} />,
		);

		expect(screen.getByText("Clientes")).toBeInTheDocument();
	});
});
