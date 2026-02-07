import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MobileUploadQR } from "./MobileUploadQR";
import { renderWithProviders } from "@/lib/testHelpers";

// Mock the org store
const mockCurrentOrg = { id: "org-123", name: "Test Org", slug: "test-org" };
vi.mock("@/lib/org-store", () => ({
	useOrgStore: () => ({
		currentOrg: mockCurrentOrg,
	}),
}));

// Mock useJwt hook
vi.mock("@/hooks/useJwt", () => ({
	useJwt: () => ({
		jwt: "mock-jwt-token",
		isLoading: false,
		error: null,
		refetch: vi.fn(),
	}),
}));

// Mock doc-svc API
const mockCreateUploadLink = vi.fn();
const mockSubscribeToUploadLinkEvents = vi.fn();
const mockGetUploadLinkUrl = vi.fn();

vi.mock("@/lib/api/doc-svc", () => ({
	createUploadLink: (...args: unknown[]) => mockCreateUploadLink(...args),
	subscribeToUploadLinkEvents: (...args: unknown[]) =>
		mockSubscribeToUploadLinkEvents(...args),
	getUploadLinkUrl: (...args: unknown[]) => mockGetUploadLinkUrl(...args),
}));

// Mock sonner toast
const mockToastSuccess = vi.fn();
const mockToastInfo = vi.fn();
const mockToastError = vi.fn();

vi.mock("sonner", () => ({
	toast: Object.assign(vi.fn(), {
		success: (...args: unknown[]) => mockToastSuccess(...args),
		info: (...args: unknown[]) => mockToastInfo(...args),
		error: (...args: unknown[]) => mockToastError(...args),
	}),
}));

// Mock QRCodeSVG
vi.mock("qrcode.react", () => ({
	QRCodeSVG: ({ value }: { value: string }) => (
		<div data-testid="qr-code" data-value={value}>
			QR Code
		</div>
	),
}));

describe("MobileUploadQR", () => {
	const mockOnOpenChange = vi.fn();
	let sseCleanup: () => void;

	beforeEach(() => {
		vi.clearAllMocks();

		// Setup default mock responses
		mockCreateUploadLink.mockResolvedValue({
			id: "upload-link-123",
			organizationId: "org-123",
			requiredDocuments: ["INE/IFE"],
			maxUploads: 1,
			allowMultipleFiles: true,
			expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
			status: "ACTIVE",
			createdAt: new Date().toISOString(),
		});

		mockGetUploadLinkUrl.mockImplementation(
			(linkId: string, baseUrl: string) => `${baseUrl}/${linkId}`,
		);

		// SSE subscription mock
		sseCleanup = vi.fn();
		mockSubscribeToUploadLinkEvents.mockReturnValue(sseCleanup);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("shows loading state when modal opens", async () => {
		renderWithProviders(
			<MobileUploadQR
				open={true}
				onOpenChange={mockOnOpenChange}
				documentType="INE/IFE"
			/>,
		);

		// Should show loading badge initially
		expect(screen.getByText(/creando enlace/i)).toBeInTheDocument();
	});

	it("creates upload link and displays QR code when modal opens", async () => {
		renderWithProviders(
			<MobileUploadQR
				open={true}
				onOpenChange={mockOnOpenChange}
				documentType="INE/IFE"
				clientId="client-456"
			/>,
		);

		// Wait for upload link to be created
		await waitFor(() => {
			expect(mockCreateUploadLink).toHaveBeenCalledWith({
				requiredDocuments: [{ type: "INE/IFE" }],
				maxUploads: 1,
				allowMultipleFiles: true,
				metadata: { clientId: "client-456" },
			});
		});

		// Should show QR code after loading
		await waitFor(() => {
			expect(screen.getByTestId("qr-code")).toBeInTheDocument();
		});

		// Should show "Esperando escaneo" status
		await waitFor(() => {
			expect(screen.getByText(/esperando escaneo/i)).toBeInTheDocument();
		});
	});

	it("subscribes to SSE events after creating upload link", async () => {
		renderWithProviders(
			<MobileUploadQR
				open={true}
				onOpenChange={mockOnOpenChange}
				documentType="INE/IFE"
			/>,
		);

		await waitFor(() => {
			expect(mockSubscribeToUploadLinkEvents).toHaveBeenCalledWith(
				"upload-link-123",
				"mock-jwt-token",
				expect.any(Function),
				expect.any(Function),
			);
		});
	});

	it("shows error state when upload link creation fails", async () => {
		mockCreateUploadLink.mockRejectedValue(new Error("Network error"));

		renderWithProviders(
			<MobileUploadQR
				open={true}
				onOpenChange={mockOnOpenChange}
				documentType="INE/IFE"
			/>,
		);

		// Should show error badge and error message
		await waitFor(() => {
			expect(screen.getByText("Network error")).toBeInTheDocument();
		});

		// Should show retry button
		await waitFor(() => {
			expect(
				screen.getByRole("button", { name: /reintentar/i }),
			).toBeInTheDocument();
		});
	});

	it("allows copying the scan URL to clipboard", async () => {
		const user = userEvent.setup();

		// Mock clipboard API using Object.defineProperty
		const writeTextMock = vi.fn().mockResolvedValue(undefined);
		Object.defineProperty(navigator, "clipboard", {
			value: { writeText: writeTextMock },
			writable: true,
			configurable: true,
		});

		renderWithProviders(
			<MobileUploadQR
				open={true}
				onOpenChange={mockOnOpenChange}
				documentType="INE/IFE"
			/>,
		);

		// Wait for QR code to appear
		await waitFor(() => {
			expect(screen.getByTestId("qr-code")).toBeInTheDocument();
		});

		// Find the copy button (it's an icon button with Copy icon)
		const copyButtons = screen.getAllByRole("button");
		const copyButton = copyButtons.find((btn) =>
			btn.querySelector("svg.lucide-copy"),
		);

		if (copyButton) {
			await user.click(copyButton);

			await waitFor(() => {
				expect(writeTextMock).toHaveBeenCalled();
			});

			// Should show success toast
			expect(mockToastSuccess).toHaveBeenCalledWith(
				"URL copiado al portapapeles",
			);
		}
	});

	it("allows refreshing the upload link when expired", async () => {
		// Start with an expired link
		mockCreateUploadLink.mockResolvedValueOnce({
			id: "upload-link-123",
			organizationId: "org-123",
			requiredDocuments: ["INE/IFE"],
			maxUploads: 1,
			allowMultipleFiles: true,
			expiresAt: new Date(Date.now() - 1000).toISOString(), // Already expired
			status: "ACTIVE",
			createdAt: new Date().toISOString(),
		});

		const user = userEvent.setup();

		renderWithProviders(
			<MobileUploadQR
				open={true}
				onOpenChange={mockOnOpenChange}
				documentType="INE/IFE"
			/>,
		);

		// Wait for expired state
		await waitFor(
			() => {
				expect(screen.getByText(/expirado/i)).toBeInTheDocument();
			},
			{ timeout: 3000 },
		);

		// Setup new mock for refresh
		mockCreateUploadLink.mockResolvedValueOnce({
			id: "upload-link-456",
			organizationId: "org-123",
			requiredDocuments: ["INE/IFE"],
			maxUploads: 1,
			allowMultipleFiles: true,
			expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
			status: "ACTIVE",
			createdAt: new Date().toISOString(),
		});

		// Click refresh button
		const refreshButton = screen.getByRole("button", {
			name: /generar nuevo qr/i,
		});
		await user.click(refreshButton);

		// Should create a new upload link
		await waitFor(() => {
			expect(mockCreateUploadLink).toHaveBeenCalledTimes(2);
		});
	});

	it("cleans up SSE subscription when modal closes", async () => {
		const { rerender } = renderWithProviders(
			<MobileUploadQR
				open={true}
				onOpenChange={mockOnOpenChange}
				documentType="INE/IFE"
			/>,
		);

		// Wait for SSE subscription
		await waitFor(() => {
			expect(mockSubscribeToUploadLinkEvents).toHaveBeenCalled();
		});

		// Close the modal
		rerender(
			<MobileUploadQR
				open={false}
				onOpenChange={mockOnOpenChange}
				documentType="INE/IFE"
			/>,
		);

		// SSE cleanup should be called
		await waitFor(() => {
			expect(sseCleanup).toHaveBeenCalled();
		});
	});

	it("displays document type in description", async () => {
		renderWithProviders(
			<MobileUploadQR
				open={true}
				onOpenChange={mockOnOpenChange}
				documentType="Pasaporte"
			/>,
		);

		await waitFor(() => {
			expect(screen.getByText(/pasaporte/i)).toBeInTheDocument();
		});
	});

	it("shows complete status when document-confirmed event is received", async () => {
		let sseCallback: (event: { type: string }) => void;

		mockSubscribeToUploadLinkEvents.mockImplementation(
			(
				_linkId: string,
				_token: string,
				onEvent: (event: { type: string }) => void,
				_onError: (error: Error) => void,
			) => {
				sseCallback = onEvent;
				return sseCleanup;
			},
		);

		renderWithProviders(
			<MobileUploadQR
				open={true}
				onOpenChange={mockOnOpenChange}
				documentType="INE/IFE"
			/>,
		);

		// Wait for SSE subscription
		await waitFor(() => {
			expect(mockSubscribeToUploadLinkEvents).toHaveBeenCalled();
		});

		// Simulate document confirmed event
		act(() => {
			sseCallback({ type: "document-confirmed" });
		});

		// Should show complete status
		await waitFor(() => {
			expect(screen.getByText(/completado/i)).toBeInTheDocument();
		});

		// Should show success toast
		expect(mockToastSuccess).toHaveBeenCalledWith(
			"Documento subido exitosamente",
		);
	});
});
