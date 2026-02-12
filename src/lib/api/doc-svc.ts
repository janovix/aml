/**
 * doc-svc API Client for AML
 *
 * Client for interacting with the document service using JWT authentication.
 */

import { tokenCache } from "@/lib/auth/tokenCache";

const DOC_SVC_URL =
	process.env.NEXT_PUBLIC_DOC_SVC_URL || "https://doc-svc.janovix.workers.dev";

/**
 * Response from initiate-upload endpoint
 */
export interface InitiateUploadResponse {
	documentId: string;
	uploadUrls: {
		originalPdfs: string[];
		originalImages: string[];
		rasterizedImages: string[];
		finalPdf: string;
	};
	keys: {
		originalPdfs: string[];
		originalImages: string[];
		rasterizedImages: string[];
		finalPdf: string;
	};
	expiresAt: string;
}

/**
 * Response from confirm endpoint
 */
export interface ConfirmUploadResponse {
	documentId: string;
	jobId: string;
	status: string;
}

/**
 * Response from get-urls endpoint
 */
export interface DocumentUrlsResponse {
	pdfUrl?: string;
	imageUrls: string[];
	expiresAt: string;
}

/**
 * Job status response
 */
export interface JobStatusResponse {
	id: string;
	documentId: string;
	status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
	classification?: {
		docFamily: string;
		docType: string;
		confidence: number;
	};
	visualValidation?: {
		score: number;
		threshold: number;
		pass: boolean;
		signals?: string[];
	};
	extraction?: {
		fields: Record<string, { value: string; confidence: number }>;
	};
	validations?: Array<{
		rule: string;
		pass: boolean;
		message?: string;
	}>;
	risk?: {
		score: number;
		signals: string[];
	};
	decision?: "APPROVED" | "REVIEW" | "REJECTED";
	decisionReason?: string;
	errorMessage?: string;
}

/**
 * API error
 */
export class DocSvcError extends Error {
	constructor(
		message: string,
		public status: number,
	) {
		super(message);
		this.name = "DocSvcError";
	}
}

/**
 * Get auth headers with JWT
 *
 * The JWT token contains userId and organizationId claims, so no custom headers needed.
 */
async function getAuthHeaders(): Promise<Headers> {
	const token = await tokenCache.getCachedToken();
	const headers = new Headers({
		"Content-Type": "application/json",
	});

	if (token) {
		headers.set("Authorization", `Bearer ${token}`);
	}

	return headers;
}

/**
 * Initiate a document upload (authenticated)
 *
 * @param organizationId - Organization ID
 * @param userId - User ID
 * @param pageCount - Number of pages/images to upload
 * @param hasPdf - Whether a PDF will be uploaded
 */
export async function initiateUpload(
	organizationId: string,
	userId: string,
	pageCount: number,
	hasPdf: boolean,
): Promise<InitiateUploadResponse> {
	const headers = await getAuthHeaders();

	const response = await fetch(`${DOC_SVC_URL}/documents/initiate-upload`, {
		method: "POST",
		headers,
		body: JSON.stringify({ pageCount, hasPdf }),
	});

	const data = (await response.json()) as {
		success: boolean;
		result?: InitiateUploadResponse;
		error?: string;
	};

	if (!response.ok || !data.success) {
		throw new DocSvcError(
			data.error || "Failed to initiate upload",
			response.status,
		);
	}

	return data.result!;
}

/**
 * Upload a file to a presigned URL
 *
 * @param url - Presigned PUT URL
 * @param blob - File blob to upload
 * @param contentType - MIME type
 */
export async function uploadToPresignedUrl(
	url: string,
	blob: Blob,
	contentType: string,
): Promise<void> {
	const response = await fetch(url, {
		method: "PUT",
		headers: {
			"Content-Type": contentType,
		},
		body: blob,
	});

	if (!response.ok) {
		throw new DocSvcError(
			`Failed to upload file: ${response.status}`,
			response.status,
		);
	}
}

/**
 * Confirm document upload
 *
 * @param organizationId - Organization ID
 * @param userId - User ID
 * @param documentId - Document ID
 * @param keys - R2 keys of uploaded files
 * @param fileName - Original file name
 * @param fileSize - Total file size
 */
export async function confirmUpload(
	organizationId: string,
	userId: string,
	documentId: string,
	keys: {
		originalPdfs: string[];
		originalImages: string[];
		rasterizedImages: string[];
		finalPdf: string;
	},
	fileName: string,
	fileSize: number,
): Promise<ConfirmUploadResponse> {
	const headers = await getAuthHeaders();

	// Send flat keys matching doc-svc schema (preferred format)
	const response = await fetch(
		`${DOC_SVC_URL}/documents/${documentId}/confirm`,
		{
			method: "POST",
			headers,
			body: JSON.stringify({
				fileName,
				fileSize,
				pageCount: keys.rasterizedImages.length,
				rasterizedImages: keys.rasterizedImages,
				finalPdfKey: keys.finalPdf,
				// Only include if not empty
				originalPdfs:
					keys.originalPdfs.length > 0 ? keys.originalPdfs : undefined,
				originalImages:
					keys.originalImages.length > 0 ? keys.originalImages : undefined,
			}),
		},
	);

	const data = (await response.json()) as {
		success: boolean;
		result?: ConfirmUploadResponse;
		error?: string;
	};

	if (!response.ok || !data.success) {
		throw new DocSvcError(
			data.error || "Failed to confirm upload",
			response.status,
		);
	}

	return data.result!;
}

/**
 * Get document URLs for viewing
 *
 * @param organizationId - Organization ID
 * @param documentId - Document ID
 * @param type - Type of URLs to get
 */
export async function getDocumentUrls(
	organizationId: string,
	documentId: string,
	type: "pdf" | "images" | "all" = "all",
): Promise<DocumentUrlsResponse> {
	const headers = await getAuthHeaders();

	const response = await fetch(
		`${DOC_SVC_URL}/documents/${documentId}/urls?type=${type}`,
		{ headers },
	);

	const data = (await response.json()) as {
		success: boolean;
		result?: DocumentUrlsResponse;
		error?: string;
	};

	if (!response.ok || !data.success) {
		throw new DocSvcError(data.error || "Failed to get URLs", response.status);
	}

	return data.result!;
}

/**
 * Get job status
 *
 * @param organizationId - Organization ID
 * @param jobId - Job ID
 */
export async function getJobStatus(
	organizationId: string,
	jobId: string,
): Promise<JobStatusResponse> {
	const headers = await getAuthHeaders();

	const response = await fetch(`${DOC_SVC_URL}/jobs/${jobId}`, { headers });

	const data = (await response.json()) as {
		success: boolean;
		result?: JobStatusResponse;
		error?: string;
	};

	if (!response.ok || !data.success) {
		throw new DocSvcError(
			data.error || "Failed to get job status",
			response.status,
		);
	}

	return data.result!;
}

/**
 * Poll job status until complete or failed
 *
 * @param organizationId - Organization ID
 * @param jobId - Job ID
 * @param onProgress - Optional callback for progress updates
 * @param intervalMs - Polling interval (default: 2000ms)
 * @param maxAttempts - Maximum number of attempts (default: 60)
 */
export async function pollJobUntilComplete(
	organizationId: string,
	jobId: string,
	onProgress?: (status: JobStatusResponse) => void,
	intervalMs: number = 2000,
	maxAttempts: number = 60,
): Promise<JobStatusResponse> {
	let attempts = 0;

	while (attempts < maxAttempts) {
		const status = await getJobStatus(organizationId, jobId);
		onProgress?.(status);

		if (status.status === "COMPLETED" || status.status === "FAILED") {
			return status;
		}

		await new Promise((resolve) => setTimeout(resolve, intervalMs));
		attempts++;
	}

	throw new DocSvcError("Job polling timeout", 408);
}

/**
 * Generate a PDF from image blobs
 *
 * Uses pdf-lib (via @janovix/document-scanner) to create a PDF document
 * from an array of image blobs. Each image becomes a page sized to its
 * natural dimensions.
 *
 * @param images - Array of image blobs (JPEG or PNG)
 * @returns PDF blob
 */
async function generatePdfFromBlobs(images: Blob[]): Promise<Blob> {
	if (images.length === 0) {
		throw new DocSvcError("No images provided for PDF generation", 400);
	}

	// Dynamically import pdf-lib via document-scanner package
	const { loadPdfLib } = await import("@janovix/document-scanner");
	const { PDFDocument } = await loadPdfLib();

	const pdfDoc = await PDFDocument.create();

	for (const imageBlob of images) {
		const imageBytes = await imageBlob.arrayBuffer();

		// Embed based on MIME type
		let embeddedImage;
		if (imageBlob.type === "image/png") {
			embeddedImage = await pdfDoc.embedPng(imageBytes);
		} else {
			// Default to JPEG for jpg, jpeg, and other formats
			embeddedImage = await pdfDoc.embedJpg(imageBytes);
		}

		// Add page with image's natural dimensions
		const page = pdfDoc.addPage([embeddedImage.width, embeddedImage.height]);
		page.drawImage(embeddedImage, {
			x: 0,
			y: 0,
			width: embeddedImage.width,
			height: embeddedImage.height,
		});
	}

	const pdfBytes = await pdfDoc.save();
	// Convert to Uint8Array to ensure compatibility with Blob constructor
	return new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
}

/**
 * Complete upload flow helper
 *
 * @param organizationId - Organization ID
 * @param userId - User ID
 * @param images - Array of image blobs
 * @param pdf - Optional PDF blob
 * @param fileName - Original file name
 * @param onProgress - Optional progress callback
 */
export async function uploadDocument(
	organizationId: string,
	userId: string,
	images: Blob[],
	pdf: Blob | null,
	fileName: string,
	onProgress?: (stage: string, percent: number) => void,
): Promise<{
	documentId: string;
	jobId: string;
}> {
	onProgress?.("Initializing upload...", 10);

	// Auto-generate PDF from images if none provided
	let pdfToUpload = pdf;
	if (!pdfToUpload && images.length > 0) {
		onProgress?.("Generating PDF...", 15);
		pdfToUpload = await generatePdfFromBlobs(images);
	}

	// Step 1: Initiate upload
	const initResult = await initiateUpload(
		organizationId,
		userId,
		images.length,
		true, // Always true since we always generate/provide a PDF now
	);

	onProgress?.("Uploading files...", 20);

	// Step 2: Upload files to presigned URLs
	const uploadPromises: Promise<void>[] = [];

	// Upload PDF (always present now)
	if (pdfToUpload && initResult.uploadUrls.finalPdf) {
		uploadPromises.push(
			uploadToPresignedUrl(
				initResult.uploadUrls.finalPdf,
				pdfToUpload,
				"application/pdf",
			),
		);
	}

	// Upload images to rasterizedImages URLs
	for (let i = 0; i < images.length; i++) {
		if (initResult.uploadUrls.rasterizedImages[i]) {
			uploadPromises.push(
				uploadToPresignedUrl(
					initResult.uploadUrls.rasterizedImages[i],
					images[i],
					"image/jpeg",
				),
			);
		}
	}

	await Promise.all(uploadPromises);

	onProgress?.("Confirming upload...", 70);

	// Step 3: Calculate total size
	let totalSize = 0;
	if (pdfToUpload) totalSize += pdfToUpload.size;
	for (const img of images) totalSize += img.size;

	// Step 4: Confirm upload
	const confirmResult = await confirmUpload(
		organizationId,
		userId,
		initResult.documentId,
		initResult.keys,
		fileName,
		totalSize,
	);

	onProgress?.("Upload complete", 100);

	return {
		documentId: confirmResult.documentId,
		jobId: confirmResult.jobId,
	};
}

// ============================================================================
// Upload Link Management
// ============================================================================

/**
 * Response from GET /upload-links/:id
 */
export interface UploadLinkResponse {
	id: string;
	organizationId: string;
	requiredDocuments: string[];
	uploadedCount: number;
	maxUploads: number | null;
	allowMultipleFiles: boolean;
	expiresAt: string;
	status: "ACTIVE" | "EXPIRED" | "COMPLETED";
	createdAt: string;
}

/**
 * Response from POST /upload-links
 */
export interface CreateUploadLinkResponse {
	id: string;
	organizationId: string;
	requiredDocuments: string[];
	maxUploads: number | null;
	allowMultipleFiles: boolean;
	expiresAt: string;
	status: "ACTIVE";
	createdAt: string;
}

/**
 * Response from list upload links
 */
export interface ListUploadLinksResponse {
	items: UploadLinkResponse[];
	total: number;
}

/**
 * Valid document types for the API
 */
export type DocumentType =
	| "mx_ine_front"
	| "mx_ine_back"
	| "passport"
	| "proof_of_address"
	| "proof_of_income"
	| "bank_statement"
	| "utility_bill"
	| "other";

/**
 * Map display names to API document types
 */
const DOCUMENT_TYPE_MAP: Record<string, DocumentType> = {
	// Display names -> API values
	"INE/IFE": "mx_ine_front",
	INE: "mx_ine_front",
	IFE: "mx_ine_front",
	"INE Frente": "mx_ine_front",
	"INE Reverso": "mx_ine_back",
	Pasaporte: "passport",
	"Comprobante de Domicilio": "proof_of_address",
	"Comprobante de Ingresos": "proof_of_income",
	"Estado de Cuenta": "bank_statement",
	"Recibo de Servicios": "utility_bill",
	Otro: "other",
	Documento: "other",
	// Also accept API values directly
	mx_ine_front: "mx_ine_front",
	mx_ine_back: "mx_ine_back",
	passport: "passport",
	proof_of_address: "proof_of_address",
	proof_of_income: "proof_of_income",
	bank_statement: "bank_statement",
	utility_bill: "utility_bill",
	other: "other",
};

/**
 * Map a document type string to a valid API document type
 */
function mapDocumentType(docType: string): DocumentType {
	const mapped = DOCUMENT_TYPE_MAP[docType];
	if (mapped) return mapped;
	// Default to "other" for unknown types
	console.warn(`Unknown document type "${docType}", defaulting to "other"`);
	return "other";
}

/**
 * Required document object with type, label, and description
 */
export interface RequiredDocument {
	type: DocumentType;
	label?: string;
	description?: string;
}

/**
 * Create input for upload link
 */
export interface CreateUploadLinkInput {
	/** Required documents as objects with type/label/description */
	requiredDocuments?: RequiredDocument[];
	/** @deprecated Use requiredDocuments with objects instead */
	requiredDocumentTypes?: string[];
	maxUploads?: number;
	allowMultipleFiles?: boolean;
	expiresInHours?: number;
	metadata?: Record<string, unknown>;
}

/**
 * Document uploaded via upload link
 */
export interface UploadLinkDocument {
	id: string;
	fileName: string;
	fileSize: number;
	pageCount: number;
	documentType: string | null;
	createdAt: string;
}

/**
 * SSE Event types
 */
export type SSEEventType =
	| "document-initiated"
	| "document-confirmed"
	| "upload-link-updated"
	| "keep-alive";

export interface SSEEvent {
	type: SSEEventType;
	uploadLinkId: string;
	data?: {
		documentId?: string;
		uploadedCount?: number;
		status?: string;
	};
	timestamp: string;
}

/**
 * Create an upload link for document collection
 *
 * User ID and Organization ID are extracted from JWT token on the server.
 *
 * @param input - Upload link configuration
 */
export async function createUploadLink(
	input: CreateUploadLinkInput = {},
): Promise<CreateUploadLinkResponse> {
	const headers = await getAuthHeaders();

	// Calculate expiration date (default: 1 hour from now)
	const expiresInHours = input.expiresInHours ?? 1;
	const expiresAt = new Date(
		Date.now() + expiresInHours * 60 * 60 * 1000,
	).toISOString();

	// Handle new object format (preferred) or legacy string array
	let requiredDocuments: RequiredDocument[];

	if (input.requiredDocuments && input.requiredDocuments.length > 0) {
		// New format: array of objects with type/label/description
		requiredDocuments = input.requiredDocuments.map((doc) => ({
			type: doc.type,
			label: doc.label,
			description: doc.description,
		}));
	} else if (
		input.requiredDocumentTypes &&
		input.requiredDocumentTypes.length > 0
	) {
		// Legacy format: array of strings
		requiredDocuments = input.requiredDocumentTypes
			.filter((doc) => doc && doc.trim() !== "")
			.map((doc) => ({ type: mapDocumentType(doc) }));
	} else {
		// Default to "other" if nothing specified
		requiredDocuments = [{ type: "other" }];
	}

	// Build the API request body
	const requestBody = {
		expiresAt,
		requiredDocuments,
		maxUploads: input.maxUploads,
		allowMultipleFiles: input.allowMultipleFiles ?? true,
		metadata: input.metadata,
	};

	const response = await fetch(`${DOC_SVC_URL}/upload-links`, {
		method: "POST",
		headers,
		body: JSON.stringify(requestBody),
	});

	const data = (await response.json()) as {
		success: boolean;
		result?: CreateUploadLinkResponse;
		error?: string;
	};

	if (!response.ok || !data.success) {
		throw new DocSvcError(
			data.error || "Failed to create upload link",
			response.status,
		);
	}

	return data.result!;
}

/**
 * Get upload link details
 *
 * @param organizationId - Organization ID
 * @param linkId - Upload link ID
 */
export async function getUploadLink(
	organizationId: string,
	linkId: string,
): Promise<UploadLinkResponse> {
	const headers = await getAuthHeaders();

	const response = await fetch(`${DOC_SVC_URL}/upload-links/${linkId}`, {
		headers,
	});

	const data = (await response.json()) as {
		success: boolean;
		result?: UploadLinkResponse;
		error?: string;
	};

	if (!response.ok || !data.success) {
		throw new DocSvcError(
			data.error || "Upload link not found",
			response.status,
		);
	}

	return data.result!;
}

/**
 * List upload links for organization
 *
 * @param organizationId - Organization ID
 * @param status - Filter by status
 * @param limit - Maximum number of results
 * @param offset - Pagination offset
 */
export async function listUploadLinks(
	organizationId: string,
	status?: "ACTIVE" | "EXPIRED" | "COMPLETED",
	limit: number = 20,
	offset: number = 0,
): Promise<ListUploadLinksResponse> {
	const headers = await getAuthHeaders();

	const params = new URLSearchParams({
		limit: String(limit),
		offset: String(offset),
	});
	if (status) {
		params.set("status", status);
	}

	const response = await fetch(`${DOC_SVC_URL}/upload-links?${params}`, {
		headers,
	});

	const data = (await response.json()) as {
		success: boolean;
		result?: ListUploadLinksResponse;
		error?: string;
	};

	if (!response.ok || !data.success) {
		throw new DocSvcError(
			data.error || "Failed to list upload links",
			response.status,
		);
	}

	return data.result!;
}

/**
 * List documents for an upload link
 *
 * @param organizationId - Organization ID
 * @param linkId - Upload link ID
 */
export async function listUploadLinkDocuments(
	linkId: string,
): Promise<UploadLinkDocument[]> {
	const headers = await getAuthHeaders();

	const response = await fetch(
		`${DOC_SVC_URL}/upload-links/${linkId}/documents`,
		{ headers },
	);

	const data = (await response.json()) as {
		success: boolean;
		result?: { documents: UploadLinkDocument[] };
		error?: string;
	};

	if (!response.ok || !data.success) {
		throw new DocSvcError(
			data.error || "Failed to list upload link documents",
			response.status,
		);
	}

	return data.result!.documents;
}

/**
 * Subscribe to upload link events via SSE
 *
 * @param linkId - Upload link ID
 * @param token - JWT token for authentication
 * @param onEvent - Callback for events
 * @param onError - Callback for errors
 * @returns Cleanup function to close the connection
 */
export function subscribeToUploadLinkEvents(
	linkId: string,
	token: string,
	onEvent: (event: SSEEvent) => void,
	onError?: (error: Error) => void,
): () => void {
	// Note: SSE/EventSource doesn't support custom headers, so we pass JWT as query param
	const eventSource = new EventSource(
		`${DOC_SVC_URL}/upload-links/${linkId}/events?token=${encodeURIComponent(token)}`,
	);

	eventSource.onmessage = (event) => {
		try {
			const parsedEvent = JSON.parse(event.data) as SSEEvent;
			onEvent(parsedEvent);
		} catch (err) {
			console.error("Failed to parse SSE event:", err);
		}
	};

	eventSource.onerror = (err) => {
		console.error("SSE connection error:", err);
		onError?.(new Error("SSE connection error"));
	};

	// Return cleanup function
	return () => {
		eventSource.close();
	};
}

/**
 * Get the scan app base URL from environment or default
 */
const SCAN_APP_URL =
	process.env.NEXT_PUBLIC_SCAN_APP_URL || "https://scan.janovix.com";

/**
 * Generate shareable upload link URL
 *
 * @param linkId - Upload link ID
 * @param baseUrl - Base URL for scan app (defaults to NEXT_PUBLIC_SCAN_APP_URL)
 */
export function getUploadLinkUrl(
	linkId: string,
	baseUrl: string = SCAN_APP_URL,
): string {
	return `${baseUrl}/${linkId}`;
}
