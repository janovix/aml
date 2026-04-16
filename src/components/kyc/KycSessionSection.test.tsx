import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { KycSessionSection } from "./KycSessionSection";
import { renderWithProviders } from "@/lib/testHelpers";
import { ApiError } from "@/lib/api/http";

const mockListKycSessions = vi.fn();
const mockCreateKycSession = vi.fn();

vi.mock("@/hooks/useJwt", () => ({
	useJwt: () => ({
		jwt: "test-jwt",
		isLoading: false,
		error: null,
		refetch: vi.fn(),
	}),
}));

vi.mock("@/lib/api/kyc-sessions", () => ({
	listKycSessions: (...args: unknown[]) => mockListKycSessions(...args),
	createKycSession: (...args: unknown[]) => mockCreateKycSession(...args),
	approveKycSession: vi.fn(),
	rejectKycSession: vi.fn(),
	revokeKycSession: vi.fn(),
	resendKycEmail: vi.fn(),
	getKycSessionEvents: vi.fn(),
}));

vi.mock("@/lib/auth/config", () => ({
	getAuthAppUrl: () => "https://auth.example.com",
}));

vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

describe("KycSessionSection", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockListKycSessions.mockResolvedValue({ data: [] });
		mockCreateKycSession.mockResolvedValue({});
	});

	it("when selfServiceMode is disabled, create button is disabled and alert with CTA is shown", async () => {
		renderWithProviders(
			<KycSessionSection
				clientId="client-1"
				clientEmail="client@example.com"
				selfServiceMode="disabled"
			/>,
		);

		await waitFor(() => {
			expect(mockListKycSessions).toHaveBeenCalledWith({
				clientId: "client-1",
				jwt: "test-jwt",
			});
		});

		const createButton = await screen.findByRole("button", {
			name: /crear y enviar enlace/i,
		});
		expect(createButton).toBeDisabled();

		expect(
			await screen.findByText(
				/no se pueden crear enlaces de kyc autoservicio/i,
			),
		).toBeInTheDocument();
		expect(
			await screen.findByRole("link", {
				name: /ir a configuración de cumplimiento pld/i,
			}),
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", {
				name: /ir a configuración de cumplimiento pld/i,
			}),
		).toHaveAttribute("href", "https://auth.example.com/settings/compliance");
	});

	it("when selfServiceMode is manual, create button is enabled and no disabled alert", async () => {
		renderWithProviders(
			<KycSessionSection
				clientId="client-1"
				clientEmail={null}
				selfServiceMode="manual"
			/>,
		);

		const createButton = await screen.findByRole("button", {
			name: /crear enlace kyc/i,
		});
		expect(createButton).not.toBeDisabled();

		expect(
			screen.queryByText(/no se pueden crear enlaces de kyc autoservicio/i),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("link", {
				name: /ir a configuración de cumplimiento pld/i,
			}),
		).not.toBeInTheDocument();
	});

	it("when selfServiceMode is automatic, create button is enabled and no disabled alert", async () => {
		renderWithProviders(
			<KycSessionSection
				clientId="client-1"
				clientEmail="a@b.com"
				selfServiceMode="automatic"
			/>,
		);

		const createButton = await screen.findByRole("button", {
			name: /crear y enviar enlace/i,
		});
		expect(createButton).not.toBeDisabled();

		expect(
			screen.queryByText(/no se pueden crear enlaces de kyc autoservicio/i),
		).not.toBeInTheDocument();
	});

	it("when create fails with SELF_SERVICE_DISABLED, shows disabled UI after error", async () => {
		mockCreateKycSession.mockRejectedValueOnce(
			new ApiError("Request failed", {
				status: 400,
				body: { message: "SELF_SERVICE_DISABLED" },
			}),
		);

		renderWithProviders(
			<KycSessionSection
				clientId="client-1"
				clientEmail={null}
				selfServiceMode="manual"
			/>,
		);

		const createButton = await screen.findByRole("button", {
			name: /crear enlace kyc/i,
		});
		expect(createButton).not.toBeDisabled();

		await userEvent.click(createButton);

		await waitFor(() => {
			expect(mockCreateKycSession).toHaveBeenCalledWith({
				input: { clientId: "client-1" },
				jwt: "test-jwt",
			});
		});

		await waitFor(() => {
			expect(
				screen.getByText(/no se pueden crear enlaces de kyc autoservicio/i),
			).toBeInTheDocument();
		});

		const createButtonAfter = screen.getByRole("button", {
			name: /crear enlace kyc/i,
		});
		expect(createButtonAfter).toBeDisabled();

		expect(
			screen.getByRole("link", {
				name: /ir a configuración de cumplimiento pld/i,
			}),
		).toBeInTheDocument();
	});

	it("when selfServiceMode is not passed, defaults to automatic (button enabled, no disabled alert)", async () => {
		renderWithProviders(
			<KycSessionSection clientId="client-1" clientEmail={null} />,
		);

		const createButton = await screen.findByRole("button", {
			name: /crear enlace kyc/i,
		});
		expect(createButton).not.toBeDisabled();
		expect(
			screen.queryByText(/no se pueden crear enlaces de kyc autoservicio/i),
		).not.toBeInTheDocument();
	});
});
