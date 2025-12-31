import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import IndexPage from "./page";

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

		render(<IndexPage />);

		expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);

		resolveOrgs!({ data: { organizations: [], activeOrganizationId: null } });

		await waitFor(() => {
			expect(
				screen.getByText("Create your first organization"),
			).toBeInTheDocument();
		});
	});

	it("shows create org form when user has no organizations", async () => {
		mockListOrganizations.mockResolvedValue({
			data: { organizations: [], activeOrganizationId: null },
		});

		render(<IndexPage />);

		await waitFor(() => {
			expect(
				screen.getByText("Create your first organization"),
			).toBeInTheDocument();
		});

		expect(screen.getByLabelText("Name")).toBeInTheDocument();
		expect(screen.getByLabelText("Slug (URL identifier)")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Create organization" }),
		).toBeInTheDocument();
	});

	it("auto-redirects when user has exactly one organization", async () => {
		mockListOrganizations.mockResolvedValue({
			data: { organizations: [mockOrg1], activeOrganizationId: null },
		});

		render(<IndexPage />);

		await waitFor(() => {
			expect(mockSetActiveOrganization).toHaveBeenCalledWith(mockOrg1.id);
		});

		await waitFor(() => {
			expect(mockReplace).toHaveBeenCalledWith(`/${mockOrg1.slug}/clients`);
		});
	});

	it("shows org picker when user has multiple organizations", async () => {
		mockListOrganizations.mockResolvedValue({
			data: { organizations: [mockOrg1, mockOrg2], activeOrganizationId: null },
		});

		render(<IndexPage />);

		await waitFor(() => {
			expect(screen.getByText("Select an organization")).toBeInTheDocument();
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

		render(<IndexPage />);

		await waitFor(() => {
			expect(mockReplace).toHaveBeenCalledWith(`/${mockOrg2.slug}/clients`);
		});
	});

	it("allows selecting an organization from picker", async () => {
		const user = userEvent.setup();

		mockListOrganizations.mockResolvedValue({
			data: { organizations: [mockOrg1, mockOrg2], activeOrganizationId: null },
		});

		render(<IndexPage />);

		await waitFor(() => {
			expect(screen.getByText("Select an organization")).toBeInTheDocument();
		});

		await user.click(screen.getByText(mockOrg1.name));

		await waitFor(() => {
			expect(mockSetActiveOrganization).toHaveBeenCalledWith(mockOrg1.id);
		});

		await waitFor(() => {
			expect(mockReplace).toHaveBeenCalledWith(`/${mockOrg1.slug}/clients`);
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

		render(<IndexPage />);

		await waitFor(() => {
			expect(
				screen.getByText("Create your first organization"),
			).toBeInTheDocument();
		});

		await user.type(screen.getByLabelText("Name"), "New Organization");
		await user.click(
			screen.getByRole("button", { name: "Create organization" }),
		);

		await waitFor(() => {
			expect(mockCreateOrganization).toHaveBeenCalledWith({
				name: "New Organization",
				slug: "new-organization",
			});
		});

		await waitFor(() => {
			expect(mockReplace).toHaveBeenCalledWith(`/${newOrg.slug}/clients`);
		});
	});

	it("shows error toast when loading fails", async () => {
		mockListOrganizations.mockResolvedValue({
			error: "Network error",
			data: null,
		});

		render(<IndexPage />);

		await waitFor(() => {
			expect(mockToastError).toHaveBeenCalledWith(
				"Error loading organizations",
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

		render(<IndexPage />);

		await waitFor(() => {
			expect(
				screen.getByText("Create your first organization"),
			).toBeInTheDocument();
		});

		await user.type(screen.getByLabelText("Name"), "My Test Org");

		await waitFor(() => {
			expect(screen.getByText("my-test-org")).toBeInTheDocument();
		});
	});

	it("allows custom slug input", async () => {
		const user = userEvent.setup();

		mockListOrganizations.mockResolvedValue({
			data: { organizations: [], activeOrganizationId: null },
		});

		render(<IndexPage />);

		await waitFor(() => {
			expect(
				screen.getByText("Create your first organization"),
			).toBeInTheDocument();
		});

		await user.type(screen.getByLabelText("Slug (URL identifier)"), "custom");

		await waitFor(() => {
			expect(screen.getByText("custom")).toBeInTheDocument();
		});
	});

	it("disables create button when name is empty", async () => {
		mockListOrganizations.mockResolvedValue({
			data: { organizations: [], activeOrganizationId: null },
		});

		render(<IndexPage />);

		await waitFor(() => {
			expect(
				screen.getByText("Create your first organization"),
			).toBeInTheDocument();
		});

		const button = screen.getByRole("button", { name: "Create organization" });
		expect(button).toBeDisabled();
	});
});
