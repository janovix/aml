import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ClientLayout from "./ClientLayout";

vi.mock("./ThemeProvider", () => ({
	ThemeProvider: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="theme-provider">{children}</div>
	),
}));

vi.mock("./layout/DashboardLayout", () => ({
	DashboardLayout: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="dashboard-shell">{children}</div>
	),
}));

describe("ClientLayout", () => {
	it("renders children", () => {
		render(
			<ClientLayout>
				<div>Test Content</div>
			</ClientLayout>,
		);

		expect(screen.getByText("Test Content")).toBeInTheDocument();
	});

	it("renders ThemeProvider", () => {
		const { container } = render(
			<ClientLayout>
				<div>Test</div>
			</ClientLayout>,
		);

		const providers = screen.getAllByTestId("theme-provider");
		const ourProvider = providers.find((p) => container.contains(p));
		expect(ourProvider).toBeInTheDocument();
	});

	it("renders DashboardLayout", () => {
		const { container } = render(
			<ClientLayout>
				<div>Test</div>
			</ClientLayout>,
		);

		const dashboardShells = screen.getAllByTestId("dashboard-shell");
		const ourShell = dashboardShells.find((s) => container.contains(s));
		expect(ourShell).toBeInTheDocument();
	});
});
