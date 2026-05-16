import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, fireEvent, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { renderWithProviders } from "@/lib/testHelpers";
import type { DocumentExtractionData } from "@/components/document-scanner";
import type { OCRResult } from "@/lib/document-scanner";

// Capture the latest `onExtracted` callback so each spec can drive the
// scanner pipeline with whatever fake OCR result it needs without ever
// loading the real OpenCV / Tesseract stack into JSDOM.
let lastOnExtracted: ((data: DocumentExtractionData) => void) | null = null;

vi.mock("@/components/document-scanner", () => ({
	DocumentScannerModal: ({
		open,
		onExtracted,
	}: {
		open: boolean;
		onExtracted: (data: DocumentExtractionData) => void;
		[k: string]: unknown;
	}) => {
		lastOnExtracted = onExtracted;
		return open ? <div data-testid="mock-scanner-modal" /> : null;
	},
}));

// CatalogSelector + ZipCodeAddressFields are heavy (data fetching, async
// catalog hydration). Stub them to lightweight passthroughs so the test
// stays focused on the prefill bridge.
vi.mock("@/components/catalogs/CatalogSelector", () => ({
	CatalogSelector: ({ label, value }: { label: string; value?: string }) => (
		<div data-testid={`catalog-${label}`} data-value={value ?? ""}>
			{label}: {value ?? ""}
		</div>
	),
}));

vi.mock("../ZipCodeAddressFields", () => ({
	ZipCodeAddressFields: () => <div data-testid="zip-fields" />,
}));

// AML APIs the form talks to. None of the prefill specs trigger a
// submit, but the imports run at module load so they need shimmed.
vi.mock("@/lib/api/clients", () => ({
	createClient: vi.fn(),
	checkRfcExists: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/hooks/useJwt", () => ({
	useJwt: () => ({
		jwt: null,
		isLoading: false,
		error: null,
		refetch: vi.fn(),
	}),
}));

vi.mock("@/hooks/useOrgNavigation", () => ({
	useOrgNavigation: () => ({
		routes: { clients: { detail: (id: string) => `/clients/${id}` } },
		navigateTo: vi.fn(),
		orgPath: (p: string) => p,
		orgSlug: "test-org",
	}),
}));

// Import the component AFTER all mocks so the dynamic DocumentScannerModal
// import resolves to our test double.
import { ClientInfoStep } from "./ClientInfoStep";

function makeOcrResult(overrides: Partial<OCRResult> = {}): OCRResult {
	return {
		success: true,
		text: "",
		confidence: 0.9,
		documentType: "PASSPORT",
		documentTypeConfidence: 0.95,
		detectedFields: {},
		comparisons: [],
		foundFields: [],
		missingFields: [],
		isValid: true,
		isExpired: false,
		message: "",
		...overrides,
	};
}

function renderStep(): ReturnType<typeof renderWithProviders> {
	return renderWithProviders(
		<ClientInfoStep
			onClientCreated={vi.fn()}
			onCancel={vi.fn()}
			onPersonTypeChange={vi.fn()}
			initialPersonType="physical"
		/>,
	);
}

async function pickFile(): Promise<void> {
	const input = screen.getByTestId("id-scan-file-input") as HTMLInputElement;
	const file = new File(["x"], "id.jpg", { type: "image/jpeg" });
	await act(async () => {
		fireEvent.change(input, { target: { files: [file] } });
	});
}

async function emitOcr(data: DocumentExtractionData): Promise<void> {
	if (!lastOnExtracted) throw new Error("DocumentScannerModal not open yet");
	await act(async () => {
		lastOnExtracted!(data);
	});
}

beforeEach(() => {
	lastOnExtracted = null;
	sessionStorage.clear();
});

describe("ClientInfoStep — OCR prefill", () => {
	it("renders the scan CTA only for physical persons", () => {
		renderStep();
		expect(
			screen.getByRole("button", { name: /escanear identificación/i }),
		).toBeInTheDocument();
	});

	it("does not render banner or badges before any scan", () => {
		renderStep();
		expect(screen.queryByText(/autocompletamos/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/^Autocompletado$/i)).not.toBeInTheDocument();
	});

	it("prefills empty fields, shows banner and Prefilled / Verify badges", async () => {
		renderStep();
		await pickFile();
		expect(lastOnExtracted).not.toBeNull();

		await emitOcr({
			processedBlob: new Blob(),
			processedCanvas: document.createElement("canvas"),
			ocrResult: makeOcrResult({
				detectedFields: {
					firstName: "MARIA",
					lastName: "RAMIREZ",
					curp: "RAMM900515MDFXXX01",
					birthDate: "1990-05-15",
				},
				mrzData: {
					success: true,
					documentType: "PASSPORT",
					confidence: 0.6,
					firstName: "MARIA",
					lastName: "RAMIREZ",
					sex: "F",
					birthDate: "1990-05-15",
					curp: "RAMM900515MDFXXX01",
				},
			}),
		});

		const firstName = screen.getByPlaceholderText("Juan") as HTMLInputElement;
		await waitFor(() => expect(firstName.value).toBe("MARIA"));

		const lastName = screen.getByPlaceholderText("Pérez") as HTMLInputElement;
		expect(lastName.value).toBe("RAMIREZ");

		const curp = screen.getByPlaceholderText(
			"PECJ850615HDFRRN09",
		) as HTMLInputElement;
		expect(curp.value).toBe("RAMM900515MDFXXX01");

		// Banner + badges
		expect(
			await screen.findByText(/autocompletamos\s+\d+\s+campo/i),
		).toBeInTheDocument();
		const prefilledBadges = screen.getAllByText(/^autocompletado$/i);
		expect(prefilledBadges.length).toBeGreaterThanOrEqual(3);

		// MRZ confidence is 0.6 → below 0.7 threshold → "Verificar" badge
		// shows next to MRZ-derived fields.
		const verifyBadges = screen.getAllByText(/^verificar$/i);
		expect(verifyBadges.length).toBeGreaterThanOrEqual(3);
	});

	it("never overwrites a value the staff member has already typed", async () => {
		renderStep();

		const firstName = screen.getByPlaceholderText("Juan") as HTMLInputElement;
		await userEvent.type(firstName, "JUAN");
		expect(firstName.value).toBe("JUAN");

		await pickFile();
		await emitOcr({
			processedBlob: new Blob(),
			processedCanvas: document.createElement("canvas"),
			ocrResult: makeOcrResult({
				detectedFields: {
					firstName: "MARIA",
					lastName: "RAMIREZ",
				},
			}),
		});

		// The staff-entered name wins; lastName (still empty) is prefilled.
		expect(firstName.value).toBe("JUAN");
		const lastName = screen.getByPlaceholderText("Pérez") as HTMLInputElement;
		await waitFor(() => expect(lastName.value).toBe("RAMIREZ"));

		// firstName should NOT carry the prefilled badge — only lastName does.
		const prefilledBadges = screen.getAllByText(/^autocompletado$/i);
		expect(prefilledBadges.length).toBe(1);
	});

	it("clears the prefill badge when the staff member edits a prefilled field", async () => {
		renderStep();
		await pickFile();
		await emitOcr({
			processedBlob: new Blob(),
			processedCanvas: document.createElement("canvas"),
			ocrResult: makeOcrResult({
				detectedFields: { firstName: "MARIA" },
			}),
		});

		await waitFor(() =>
			expect(screen.getAllByText(/^autocompletado$/i).length).toBe(1),
		);

		const firstName = screen.getByPlaceholderText("Juan") as HTMLInputElement;
		await userEvent.type(firstName, "X");

		expect(screen.queryByText(/^autocompletado$/i)).not.toBeInTheDocument();
	});
});
