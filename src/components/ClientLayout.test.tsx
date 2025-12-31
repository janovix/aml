import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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

// Mock the OrgBootstrapper to pass through children immediately (avoids async loading state)
vi.mock("./OrgBootstrapper", () => ({
	OrgBootstrapper: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="org-bootstrapper">{children}</div>
	),
}));

describe("ClientLayout", () => {
	it("renders children", async () => {
		render(
			<ClientLayout>
				<div>Test Content</div>
			</ClientLayout>,
		);

		await waitFor(() => {
			expect(screen.getByText("Test Content")).toBeInTheDocument();
		});
	});

	it("renders ThemeProvider", async () => {
		const { container } = render(
			<ClientLayout>
				<div>Test</div>
			</ClientLayout>,
		);

		await waitFor(() => {
			const providers = screen.getAllByTestId("theme-provider");
			const ourProvider = providers.find((p) => container.contains(p));
			expect(ourProvider).toBeInTheDocument();
		});
	});

	it("renders DashboardLayout", async () => {
		const { container } = render(
			<ClientLayout>
				<div>Test</div>
			</ClientLayout>,
		);

		await waitFor(() => {
			const dashboardShells = screen.getAllByTestId("dashboard-shell");
			const ourShell = dashboardShells.find((s) => container.contains(s));
			expect(ourShell).toBeInTheDocument();
		});
	});

	it("renders OrgBootstrapper", async () => {
		const { container } = render(
			<ClientLayout>
				<div>Test</div>
			</ClientLayout>,
		);

		await waitFor(() => {
			const bootstrappers = screen.getAllByTestId("org-bootstrapper");
			const ourBootstrapper = bootstrappers.find((b) => container.contains(b));
			expect(ourBootstrapper).toBeInTheDocument();
		});
	});
});
