/**
 * AI Import Tool
 *
 * Tool that allows the AI to process CSV/Excel file imports
 * for clients and transactions.
 */

import { z } from "zod";
import { getAmlCoreBaseUrl } from "@/lib/api/config";

interface FileUpload {
	fileName: string;
	entityType: "CLIENT" | "TRANSACTION";
	fileContent: string; // Base64 encoded
}

/**
 * Convert base64 to Blob
 */
function base64ToBlob(base64: string, mimeType: string): Blob {
	const byteCharacters = atob(base64);
	const byteNumbers = new Array(byteCharacters.length);
	for (let i = 0; i < byteCharacters.length; i++) {
		byteNumbers[i] = byteCharacters.charCodeAt(i);
	}
	const byteArray = new Uint8Array(byteNumbers);
	return new Blob([byteArray], { type: mimeType });
}

/**
 * Determine MIME type from file name
 */
function getMimeType(fileName: string): string {
	const ext = fileName.toLowerCase().split(".").pop();
	switch (ext) {
		case "csv":
			return "text/csv";
		case "xlsx":
			return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
		case "xls":
			return "application/vnd.ms-excel";
		default:
			return "application/octet-stream";
	}
}

// Schema for the import tool
const processImportSchema = z.object({
	confirm: z
		.boolean()
		.default(true)
		.describe("Confirm processing the uploaded file"),
});

/**
 * Build an app link with optional org slug
 */
function buildAppLink(path: string, orgSlug?: string): string {
	if (orgSlug) {
		return `/${orgSlug}${path.startsWith("/") ? path : `/${path}`}`;
	}
	return path;
}

/**
 * Create the import tool with the file upload context
 */
export function createImportTool(
	jwt: string,
	fileUpload: FileUpload,
	orgSlug?: string,
) {
	return {
		processImport: {
			description: `Process the uploaded file (${fileUpload.fileName}) to import ${fileUpload.entityType === "CLIENT" ? "clients" : "transactions"}. This will validate and import all rows from the file.`,
			inputSchema: processImportSchema,
			execute: async ({ confirm }: z.infer<typeof processImportSchema>) => {
				if (!confirm) {
					return "Import cancelled by user.";
				}

				try {
					const baseUrl = getAmlCoreBaseUrl();
					const url = new URL("/api/v1/imports", baseUrl);

					// Convert base64 to File
					const mimeType = getMimeType(fileUpload.fileName);
					const blob = base64ToBlob(fileUpload.fileContent, mimeType);
					const file = new File([blob], fileUpload.fileName, {
						type: mimeType,
					});

					// Create FormData
					const formData = new FormData();
					formData.append("file", file);
					formData.append("entityType", fileUpload.entityType);

					// Upload and create import
					const response = await fetch(url.toString(), {
						method: "POST",
						headers: {
							Authorization: `Bearer ${jwt}`,
						},
						body: formData,
					});

					if (!response.ok) {
						const errorBody = await response.json().catch(() => ({}));
						throw new Error(
							(errorBody as { message?: string }).message ||
								`Upload failed: ${response.status}`,
						);
					}

					const result = (await response.json()) as {
						success: boolean;
						data: {
							id: string;
							status: string;
							totalRows: number;
							fileName: string;
						};
					};

					if (!result.success) {
						return `Failed to create import: Unknown error`;
					}

					const importData = result.data;

					// Build links
					const importDetailLink = buildAppLink(
						`/import/${importData.id}`,
						orgSlug,
					);
					const importsListLink = buildAppLink("/import", orgSlug);

					// Return success message with import details and links
					return `✅ Import created successfully!

**Import Details:**
- **ID**: ${importData.id}
- **File**: ${importData.fileName}
- **Status**: ${importData.status}
- **Total Rows**: ${importData.totalRows}

The import is now being processed. 

👉 **[View Import Status](${importDetailLink})** | [All Imports](${importsListLink})

Would you like me to check the import status?`;
				} catch (error) {
					const msg =
						error instanceof Error ? error.message : "Failed to process import";

					// Build link to imports page
					const importsLink = buildAppLink("/import", orgSlug);

					return `❌ Error processing import: ${msg}

Please check that:
1. The file format is correct (CSV or Excel)
2. The columns match the expected template
3. You have permission to import data

👉 **[Download templates](${importsLink})**`;
				}
			},
		},
	};
}

export type ImportTool = ReturnType<typeof createImportTool>;
