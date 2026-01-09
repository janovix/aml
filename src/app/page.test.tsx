import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import IndexPage from "./page";
import { renderWithProviders, t } from "@/lib/testHelpers";

// Mock next/navigation
const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: vi.fn(),
		replace: mockReplace,
	}),
	useSearchParams: () => new URLSearchParams(),
}));

// Mock organization API
const mockListOrganizations = vi.fn();
const mockSetActiveOrganization = vi.fn();
const mockCreateOrganization = vi.fn();

vi.mock("@/lib/auth/organizations", () => ({
	listOrganizations: () => mockListOrganizations(),
	setActiveOrganization: (orgId: string) => mockSetActiveOrganization(orgId),
	createOrganization: (data: { name: string; slug: string }) =>
		mockCreateOrganization(data),
}));

// Mock sonner toast
const mockToastError = vi.fn();
vi.mock("sonner", () => ({
	toast: Object.assign(vi.fn(), {
		error: (...args: unknown[]) => mockToastError(...args),
		success: vi.fn(),
		promise: vi.fn(),
	}),
}));

// Mock executeMutation
vi.mock("@/lib/mutations", () => ({
	executeMutation: vi.fn(async ({ mutation, onSuccess }) => {
		const result = await mutation();
		if (onSuccess) {
			await onSuccess(result);
		}
		return result;
	}),
}));

const mockOrg1 = {
	id: "org-1",
	name: "Organization One",
	slug: "org-one",
	status: "active" as const,
};

const mockOrg2 = {
	id: "org-2",
	name: "Organization Two",
	slug: "org-two",
	status: "active" as const,
};

describe("IndexPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockSetActiveOrganization.mockResolvedValue({ data: {}, error: null });
	});

	it("shows loading skeleton initially", async () => {
		let resolveOrgs: (value: unknown) => void;
		const orgsPromise = new Promise((resolve) => {
			resolveOrgs = resolve;
		});
		mockListOrganizations.mockReturnValue(orgsPromise);

		renderWithProviders(<IndexPage />);

		expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);

		resolveOrgs!({ data: { organizations: [], activeOrganizationId: null } });

		await waitFor(() => {
			expect(screen.getByText(t("orgCreateFirstTitle"))).toBeInTheDocument();
		});
	});

	it("shows create org form when user has no organizations", async () => {
		mockListOrganizations.mockResolvedValue({
			data: { organizations: [], activeOrganizationId: null },
		});

		renderWithProviders(<IndexPage />);

		await waitFor(() => {
			expect(screen.getByText(t("orgCreateFirstTitle"))).toBeInTheDocument();
		});

		expect(screen.getByLabelText(t("orgNameLabel"))).toBeInTheDocument();
		expect(screen.getByLabelText(t("orgSlugLabel"))).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: t("orgCreateButton") }),
		).toBeInTheDocument();
	});

	it("auto-redirects when user has exactly one organization", async () => {
		mockListOrganizations.mockResolvedValue({
			data: { organizations: [mockOrg1], activeOrganizationId: null },
		});

		renderWithProviders(<IndexPage />);

		await waitFor(() => {
			expect(mockSetActiveOrganization).toHaveBeenCalledWith(mockOrg1.id);
		});

		await waitFor(() => {
			expect(mockReplace).toHaveBeenCalledWith(`/${mockOrg1.slug}/`);
		});
	});

	it("shows org picker when user has multiple organizations", async () => {
		mockListOrganizations.mockResolvedValue({
			data: { organizations: [mockOrg1, mockOrg2], activeOrganizationId: null },
		});

		renderWithProviders(<IndexPage />);

		await waitFor(() => {
			expect(screen.getByText(t("orgSelectTitle"))).toBeInTheDocument();
		});

		expect(screen.getByText(mockOrg1.name)).toBeInTheDocument();
		expect(screen.getByText(mockOrg2.name)).toBeInTheDocument();
	});

	it("redirects to active org if user has activeOrganizationId", async () => {
		mockListOrganizations.mockResolvedValue({
			data: {
				organizations: [mockOrg1, mockOrg2],
				activeOrganizationId: mockOrg2.id,
			},
		});

		renderWithProviders(<IndexPage />);

		await waitFor(() => {
			expect(mockReplace).toHaveBeenCalledWith(`/${mockOrg2.slug}/`);
		});
	});

	it("allows selecting an organization from picker", async () => {
		const user = userEvent.setup();

		mockListOrganizations.mockResolvedValue({
			data: { organizations: [mockOrg1, mockOrg2], activeOrganizationId: null },
		});

		renderWithProviders(<IndexPage />);

		await waitFor(() => {
			expect(screen.getByText(t("orgSelectTitle"))).toBeInTheDocument();
		});

		await user.click(screen.getByText(mockOrg1.name));

		await waitFor(() => {
			expect(mockSetActiveOrganization).toHaveBeenCalledWith(mockOrg1.id);
		});

		await waitFor(() => {
			expect(mockReplace).toHaveBeenCalledWith(`/${mockOrg1.slug}/`);
		});
	});

	it("creates new organization and redirects", async () => {
		const user = userEvent.setup();

		mockListOrganizations.mockResolvedValue({
			data: { organizations: [], activeOrganizationId: null },
		});

		const newOrg = {
			id: "new-org",
			name: "New Organization",
			slug: "new-organization",
			status: "active" as const,
		};

		mockCreateOrganization.mockResolvedValue({ data: newOrg });

		renderWithProviders(<IndexPage />);

		await waitFor(() => {
			expect(screen.getByText(t("orgCreateFirstTitle"))).toBeInTheDocument();
		});

		await user.type(
			screen.getByLabelText(t("orgNameLabel")),
			"New Organization",
		);
		await user.click(
			screen.getByRole("button", { name: t("orgCreateButton") }),
		);

		await waitFor(() => {
			expect(mockCreateOrganization).toHaveBeenCalledWith({
				name: "New Organization",
				slug: "new-organization",
			});
		});

		await waitFor(() => {
			expect(mockReplace).toHaveBeenCalledWith(`/${newOrg.slug}/`);
		});
	});

	it("shows error toast when loading fails", async () => {
		mockListOrganizations.mockResolvedValue({
			error: "Network error",
			data: null,
		});

		renderWithProviders(<IndexPage />);

		await waitFor(() => {
			expect(mockToastError).toHaveBeenCalledWith(
				t("orgErrorLoading"),
				expect.objectContaining({
					description: "Network error",
				}),
			);
		});
	});

	it("updates slug preview when typing name", async () => {
		const user = userEvent.setup();

		mockListOrganizations.mockResolvedValue({
			data: { organizations: [], activeOrganizationId: null },
		});

		renderWithProviders(<IndexPage />);

		await waitFor(() => {
			expect(screen.getByText(t("orgCreateFirstTitle"))).toBeInTheDocument();
		});

		await user.type(screen.getByLabelText(t("orgNameLabel")), "My Test Org");

		await waitFor(() => {
			expect(screen.getByText("my-test-org")).toBeInTheDocument();
		});
	});

	it("allows custom slug input", async () => {
		const user = userEvent.setup();

		mockListOrganizations.mockResolvedValue({
			data: { organizations: [], activeOrganizationId: null },
		});

		renderWithProviders(<IndexPage />);

		await waitFor(() => {
			expect(screen.getByText(t("orgCreateFirstTitle"))).toBeInTheDocument();
		});

		await user.type(screen.getByLabelText(t("orgSlugLabel")), "custom");

		await waitFor(() => {
			expect(screen.getByText("custom")).toBeInTheDocument();
		});
	});

	it("disables create button when name is empty", async () => {
		mockListOrganizations.mockResolvedValue({
			data: { organizations: [], activeOrganizationId: null },
		});

		renderWithProviders(<IndexPage />);

		await waitFor(() => {
			expect(screen.getByText(t("orgCreateFirstTitle"))).toBeInTheDocument();
		});

		const button = screen.getByRole("button", { name: t("orgCreateButton") });
		expect(button).toBeDisabled();
	});
});
