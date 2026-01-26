/**
 * File Upload API
 * Handles uploading files to R2 storage via aml-svc
 */

import { getAmlCoreBaseUrl } from "./config";

/**
 * Automatically get JWT token for client-side requests.
 */
async function getJwtToken(): Promise<string | null> {
	// Check if we're in a browser environment
	if (typeof window === "undefined") {
		return null;
	}

	try {
		const { tokenCache } = await import("@/lib/auth/tokenCache");
		return await tokenCache.getCachedToken();
	} catch (error) {
		console.warn("Failed to get JWT token:", error);
		return null;
	}
}

export interface FileUploadOptions {
	/** File to upload */
	file: File | Blob;
	/** File name (required for Blob) */
	fileName?: string;
	/** Organization ID */
	organizationId: string;
	/** Client ID (for client documents) */
	clientId?: string;
	/** Document ID (for associating with a document) */
	documentId?: string;
	/** File category/type for organizing in R2 */
	category?: "client-documents" | "ubo-documents" | "other";
	/** Additional metadata */
	metadata?: Record<string, string>;
	/** Base URL override */
	baseUrl?: string;
	/** JWT token for authentication */
	jwt?: string;
	/** Abort signal */
	signal?: AbortSignal;
}

export interface FileUploadResult {
	/** File key in R2 */
	key: string;
	/** Public URL to access the file */
	url: string;
	/** File size in bytes */
	size: number;
	/** ETag for the uploaded file */
	etag: string;
}

/**
 * Upload a single file to R2 storage
 */
export async function uploadFile(
	options: FileUploadOptions,
): Promise<FileUploadResult> {
	const baseUrl = options.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL("/api/v1/files/upload", baseUrl);

	// Create FormData
	const formData = new FormData();

	// Determine file name
	const fileName =
		options.fileName ||
		(options.file instanceof File ? options.file.name : "file");
	formData.append("file", options.file, fileName);

	// Add metadata
	formData.append("organizationId", options.organizationId);
	if (options.clientId) {
		formData.append("clientId", options.clientId);
	}
	if (options.documentId) {
		formData.append("documentId", options.documentId);
	}
	if (options.category) {
		formData.append("category", options.category);
	}
	if (options.metadata) {
		formData.append("metadata", JSON.stringify(options.metadata));
	}

	// Get JWT token if not provided
	const jwt = options.jwt ?? (await getJwtToken());

	// Upload file
	const headers: Record<string, string> = {};
	if (jwt) {
		headers["Authorization"] = `Bearer ${jwt}`;
	}

	const response = await fetch(url.toString(), {
		method: "POST",
		body: formData,
		signal: options.signal,
		headers,
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Upload failed: ${errorText}`);
	}

	const result = (await response.json()) as FileUploadResult;
	return result;
}

/**
 * Upload multiple files in parallel
 */
export async function uploadFiles(
	files: Array<{
		file: File | Blob;
		fileName?: string;
		metadata?: Record<string, string>;
	}>,
	commonOptions: Omit<FileUploadOptions, "file" | "fileName" | "metadata">,
): Promise<FileUploadResult[]> {
	const uploadPromises = files.map(({ file, fileName, metadata }) =>
		uploadFile({
			...commonOptions,
			file,
			fileName,
			metadata,
		}),
	);

	return Promise.all(uploadPromises);
}

/**
 * Upload document with multiple related files
 * (e.g., PDF + rasterized images, INE front + back)
 */
export interface DocumentFilesUploadOptions {
	/** Primary/processed file */
	primaryFile: File | Blob;
	/** Original source file (e.g., original PDF before rasterization) */
	originalFile?: File;
	/** Additional related files (e.g., rasterized images, INE back side) */
	relatedFiles?: Array<{ file: Blob; name: string; type: string }>;
	/** Organization ID */
	organizationId: string;
	/** Client ID */
	clientId: string;
	/** Document ID */
	documentId?: string;
	/** Base URL override */
	baseUrl?: string;
	/** JWT token */
	jwt?: string;
	/** Abort signal */
	signal?: AbortSignal;
}

export interface DocumentFilesUploadResult {
	/** Primary file upload result */
	primary: FileUploadResult;
	/** Original file upload result (if provided) */
	original?: FileUploadResult;
	/** Related files upload results */
	related: FileUploadResult[];
}

/**
 * Upload all files related to a document
 * Returns URLs for primary, original, and related files
 */
export async function uploadDocumentFiles(
	options: DocumentFilesUploadOptions,
): Promise<DocumentFilesUploadResult> {
	const uploads: Array<Promise<FileUploadResult>> = [];
	const uploadTypes: Array<"primary" | "original" | "related"> = [];

	// Upload primary file
	uploads.push(
		uploadFile({
			file: options.primaryFile,
			fileName:
				options.primaryFile instanceof File
					? options.primaryFile.name
					: "processed.jpg",
			organizationId: options.organizationId,
			clientId: options.clientId,
			documentId: options.documentId,
			category: "client-documents",
			metadata: { type: "primary" },
			baseUrl: options.baseUrl,
			jwt: options.jwt,
			signal: options.signal,
		}),
	);
	uploadTypes.push("primary");

	// Upload original file if provided
	if (options.originalFile) {
		uploads.push(
			uploadFile({
				file: options.originalFile,
				fileName: options.originalFile.name,
				organizationId: options.organizationId,
				clientId: options.clientId,
				documentId: options.documentId,
				category: "client-documents",
				metadata: { type: "original" },
				baseUrl: options.baseUrl,
				jwt: options.jwt,
				signal: options.signal,
			}),
		);
		uploadTypes.push("original");
	}

	// Upload related files if provided
	if (options.relatedFiles) {
		for (let i = 0; i < options.relatedFiles.length; i++) {
			const relatedFile = options.relatedFiles[i];
			uploads.push(
				uploadFile({
					file: relatedFile.file,
					fileName: relatedFile.name,
					organizationId: options.organizationId,
					clientId: options.clientId,
					documentId: options.documentId,
					category: "client-documents",
					metadata: {
						type: relatedFile.type,
						index: i.toString(),
					},
					baseUrl: options.baseUrl,
					jwt: options.jwt,
					signal: options.signal,
				}),
			);
			uploadTypes.push("related");
		}
	}

	// Execute all uploads in parallel
	const results = await Promise.all(uploads);

	// Organize results
	const organized: DocumentFilesUploadResult = {
		primary: results[0],
		related: [],
	};

	let resultIndex = 1;
	for (let i = 1; i < uploadTypes.length; i++) {
		const type = uploadTypes[i];
		if (type === "original") {
			organized.original = results[resultIndex];
		} else if (type === "related") {
			organized.related.push(results[resultIndex]);
		}
		resultIndex++;
	}

	return organized;
}
