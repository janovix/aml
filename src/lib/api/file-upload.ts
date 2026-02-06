/**
 * Document Upload API
 * Handles uploading documents via doc-svc for KYC processing
 */

import * as Sentry from "@sentry/nextjs";
import {
	uploadDocument as uploadToDocSvc,
	getDocumentUrls,
	pollJobUntilComplete,
	type JobStatusResponse,
	type DocumentUrlsResponse,
} from "./doc-svc";

// Re-export types from doc-svc
export type { JobStatusResponse, DocumentUrlsResponse };

/**
 * Options for uploading documents via doc-svc
 */
export interface DocumentUploadOptions {
	/** Organization ID */
	organizationId: string;
	/** User ID */
	userId: string;
	/** Primary file (processed image) */
	primaryFile: Blob;
	/** Original file name */
	fileName: string;
	/** Additional page images (for multi-page documents, INE front/back, etc.) */
	pageImages?: Blob[];
	/** PDF file (if uploading a PDF or generated PDF) */
	pdfFile?: Blob | null;
	/** Whether to wait for AI processing to complete */
	waitForProcessing?: boolean;
	/** Progress callback */
	onProgress?: (stage: string, percent: number) => void;
	/** Abort signal */
	signal?: AbortSignal;
}

/**
 * Result from document upload
 */
export interface DocumentUploadResult {
	/** Document ID in doc-svc */
	documentId: string;
	/** Processing job ID */
	jobId: string;
	/** Final job status (if waitForProcessing was true) */
	jobStatus?: JobStatusResponse;
}

/**
 * Upload a document to doc-svc for processing
 *
 * This uploads files directly to R2 via presigned URLs and triggers
 * doc-svc's AI processing pipeline.
 *
 * @example
 * ```ts
 * const result = await uploadDocument({
 *   organizationId: "org_123",
 *   userId: "user_456",
 *   primaryFile: processedBlob,
 *   fileName: "document.jpg",
 *   pageImages: [frontBlob, backBlob],
 *   pdfFile: generatedPdfBlob,
 *   waitForProcessing: false,
 *   onProgress: (stage, percent) => console.log(stage, percent),
 * });
 *
 * // result.documentId is stored in client_documents.doc_svc_document_id
 * // result.jobId is stored in client_documents.doc_svc_job_id
 * ```
 */
export async function uploadDocument(
	options: DocumentUploadOptions,
): Promise<DocumentUploadResult> {
	const {
		organizationId,
		userId,
		primaryFile,
		fileName,
		pageImages = [],
		pdfFile,
		waitForProcessing = false,
		onProgress,
	} = options;

	return await Sentry.startSpan(
		{
			name: "Document Upload to doc-svc",
			op: "http.client",
			attributes: {
				"file.name": fileName,
				"file.size": primaryFile.size,
				"pages.count": pageImages.length || 1,
				"has.pdf": !!pdfFile,
			},
		},
		async () => {
			// Build image array - use page images if provided, otherwise use primary file
			const images: Blob[] = pageImages.length > 0 ? pageImages : [primaryFile];

			// Upload to doc-svc
			const uploadResult = await uploadToDocSvc(
				organizationId,
				userId,
				images,
				pdfFile ?? null,
				fileName,
				onProgress,
			);

			const result: DocumentUploadResult = {
				documentId: uploadResult.documentId,
				jobId: uploadResult.jobId,
			};

			// Optionally wait for processing to complete
			if (waitForProcessing) {
				onProgress?.("Processing document...", 80);

				const jobStatus = await pollJobUntilComplete(
					organizationId,
					uploadResult.jobId,
					(status) => {
						if (status.status === "PROCESSING") {
							onProgress?.("AI processing...", 85);
						}
					},
				);

				result.jobStatus = jobStatus;
				onProgress?.("Complete", 100);
			}

			return result;
		},
	);
}

/**
 * Upload document files for KYC processing
 *
 * Convenience function that handles common document upload patterns:
 * - ID documents (INE front/back, passport)
 * - Multi-page PDFs
 * - Simple single-page documents
 *
 * @example
 * ```ts
 * // INE document with front and back
 * const result = await uploadDocumentForKYC({
 *   organizationId: "org_123",
 *   userId: "user_456",
 *   primaryFile: processedFrontBlob,
 *   relatedFiles: [
 *     { file: frontBlob, name: "ine_front.jpg", type: "ine_front" },
 *     { file: backBlob, name: "ine_back.jpg", type: "ine_back" },
 *   ],
 *   pdfFile: generatedPdfBlob,
 * });
 * ```
 */
export async function uploadDocumentForKYC(options: {
	organizationId: string;
	userId: string;
	/** Primary processed file */
	primaryFile: Blob;
	/** Original file name */
	fileName?: string;
	/** Original PDF file (if user uploaded PDF) */
	originalPdf?: File | null;
	/** Related files (INE front/back, rasterized pages, etc.) */
	relatedFiles?: Array<{ file: Blob; name: string; type: string }>;
	/** Generated PDF (if not uploading original) */
	generatedPdf?: Blob | null;
	/** Whether to wait for AI processing */
	waitForProcessing?: boolean;
	/** Progress callback */
	onProgress?: (stage: string, percent: number) => void;
}): Promise<DocumentUploadResult> {
	const {
		organizationId,
		userId,
		primaryFile,
		fileName = "document.jpg",
		originalPdf,
		relatedFiles,
		generatedPdf,
		waitForProcessing,
		onProgress,
	} = options;

	// Build page images from related files
	const pageImages: Blob[] = [];

	if (relatedFiles) {
		for (const rf of relatedFiles) {
			// Include INE sides and rasterized pages
			if (
				rf.type.includes("ine_") ||
				rf.type.includes("rasterized_page") ||
				rf.type.includes("page_")
			) {
				pageImages.push(rf.file);
			}
		}
	}

	// If no page images, the primary file is the only image
	if (pageImages.length === 0) {
		pageImages.push(primaryFile);
	}

	// Determine PDF file - prioritize original, then generated
	const pdfFile = originalPdf ?? generatedPdf ?? null;

	// Upload to doc-svc
	return await uploadDocument({
		organizationId,
		userId,
		primaryFile,
		fileName,
		pageImages,
		pdfFile,
		waitForProcessing,
		onProgress,
	});
}

/**
 * Get presigned URLs for document images/PDF from doc-svc
 *
 * Use this to display document images in the UI
 */
export async function getDocumentDisplayUrls(
	organizationId: string,
	documentId: string,
	type: "pdf" | "images" | "all" = "all",
): Promise<DocumentUrlsResponse> {
	return await getDocumentUrls(organizationId, documentId, type);
}
