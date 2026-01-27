/**
 * AI-powered document extraction client
 *
 * Calls the doc-processor-worker for real-time AI field extraction
 * using vision models. Much more accurate than traditional OCR.
 */

/**
 * Extracted field with confidence
 */
export interface AIExtractedField {
	value: string | null;
	confidence: number;
	source?: string;
}

/**
 * AI extraction result
 */
export interface AIExtractionResult {
	success: boolean;
	documentType: string;
	classification?: {
		docFamily: "valid_id" | "proof_of_address" | "corporate" | null;
		docType: string | null;
		confidence: number;
	};
	extraction: {
		fields: Record<string, AIExtractedField>;
		rawMarkdown?: string;
	};
	error?: string;
}

/**
 * Map document scanner types to doc-processor-worker types
 */
function mapDocumentType(scannerType: string): string {
	const normalized = scannerType.toLowerCase();
	if (normalized.includes("ine") || normalized.includes("ife")) {
		return "mx_ine";
	}
	if (normalized.includes("pasaporte") || normalized.includes("passport")) {
		return "passport";
	}
	if (normalized.includes("cartilla")) {
		return "mx_cartilla_militar";
	}
	if (normalized.includes("cedula") || normalized.includes("profesional")) {
		return "mx_cedula_profesional";
	}
	return "unknown";
}

/**
 * Convert canvas to base64 (without data URL prefix)
 */
function canvasToBase64(canvas: HTMLCanvasElement, quality = 0.85): string {
	const dataUrl = canvas.toDataURL("image/jpeg", quality);
	// Remove the "data:image/jpeg;base64," prefix
	return dataUrl.split(",")[1];
}

/**
 * Get the doc-processor-worker URL based on environment
 */
function getWorkerUrl(): string {
	// Check for environment-specific URLs
	if (typeof window !== "undefined") {
		// In development, use localhost
		if (window.location.hostname === "localhost") {
			return "http://localhost:8788"; // Default wrangler dev port
		}
		// In production, use the deployed worker URL
		// This should match your Cloudflare Workers domain
		return (
			process.env.NEXT_PUBLIC_DOC_PROCESSOR_URL ||
			"https://doc-processor.janovix.workers.dev"
		);
	}
	return "http://localhost:8788";
}

/**
 * Extract fields from document image using AI vision
 *
 * @param canvas - The document image canvas
 * @param documentType - Hint for document type (optional, will auto-detect)
 * @returns Extraction result with fields and confidence scores
 */
export async function extractWithAI(
	canvas: HTMLCanvasElement,
	documentType?: string,
): Promise<AIExtractionResult> {
	const workerUrl = getWorkerUrl();

	try {
		console.log("[AI Extraction] Starting extraction...");
		console.log("[AI Extraction] Worker URL:", workerUrl);

		const base64Image = canvasToBase64(canvas);
		const mappedType = documentType ? mapDocumentType(documentType) : undefined;

		console.log("[AI Extraction] Document type:", mappedType || "auto-detect");
		console.log(
			"[AI Extraction] Image size:",
			Math.round(base64Image.length / 1024),
			"KB",
		);

		const response = await fetch(`${workerUrl}/extract`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				image: base64Image,
				documentType: mappedType,
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error("[AI Extraction] Error response:", errorText);
			return {
				success: false,
				documentType: "unknown",
				extraction: { fields: {} },
				error: `HTTP ${response.status}: ${errorText}`,
			};
		}

		const result = (await response.json()) as AIExtractionResult;
		console.log("[AI Extraction] Success:", result);

		return result;
	} catch (error) {
		console.error("[AI Extraction] Failed:", error);
		return {
			success: false,
			documentType: "unknown",
			extraction: { fields: {} },
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

/**
 * Check if AI extraction is available
 *
 * Pings the health endpoint of the doc-processor-worker
 */
export async function isAIExtractionAvailable(): Promise<boolean> {
	const workerUrl = getWorkerUrl();

	try {
		const response = await fetch(`${workerUrl}/health`, {
			method: "GET",
			signal: AbortSignal.timeout(3000), // 3 second timeout
		});

		return response.ok;
	} catch {
		return false;
	}
}

/**
 * Normalize AI extracted fields to match our OCR result format
 */
export function normalizeAIFields(
	extraction: AIExtractionResult["extraction"],
): {
	fullName?: string;
	firstName?: string;
	lastName?: string;
	curp?: string;
	birthDate?: string;
	gender?: string;
	nationality?: string;
	passportNumber?: string;
	expiryDate?: string;
	ineDocumentNumber?: string;
	address?: string;
} {
	const fields = extraction.fields;
	const result: Record<string, string | undefined> = {};

	// Map AI field names to our format
	if (fields.full_name?.value) result.fullName = fields.full_name.value;
	if (fields.first_name?.value) result.firstName = fields.first_name.value;
	if (fields.last_name?.value) result.lastName = fields.last_name.value;
	if (fields.curp?.value) result.curp = fields.curp.value;
	if (fields.date_of_birth?.value)
		result.birthDate = fields.date_of_birth.value;
	if (fields.gender?.value) result.gender = fields.gender.value;
	if (fields.nationality?.value) result.nationality = fields.nationality.value;
	if (fields.document_number?.value)
		result.passportNumber = fields.document_number.value;
	if (fields.passport_number?.value)
		result.passportNumber = fields.passport_number.value;
	if (fields.expiry_date?.value) result.expiryDate = fields.expiry_date.value;
	// INE document number from MRZ (IDMEX number)
	if (fields.ine_document_number?.value)
		result.ineDocumentNumber = fields.ine_document_number.value;
	if (fields.idmex_number?.value)
		result.ineDocumentNumber = fields.idmex_number.value;
	if (fields.address?.value) result.address = fields.address.value;

	return result;
}
