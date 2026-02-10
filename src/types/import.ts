/**
 * Import Types for the AML frontend
 */

export type ImportStatus =
	| "PENDING"
	| "VALIDATING"
	| "PROCESSING"
	| "COMPLETED"
	| "FAILED";

export type ImportEntityType = "CLIENT" | "OPERATION";

export type ImportRowStatus =
	| "PENDING"
	| "SUCCESS"
	| "WARNING"
	| "ERROR"
	| "SKIPPED";

export interface Import {
	id: string;
	organizationId: string;
	entityType: ImportEntityType;
	fileName: string;
	fileUrl: string;
	fileSize: number;
	status: ImportStatus;
	totalRows: number;
	processedRows: number;
	successCount: number;
	warningCount: number;
	errorCount: number;
	errorMessage: string | null;
	createdBy: string;
	startedAt: string | null;
	completedAt: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface ImportRowResult {
	id: string;
	importId: string;
	rowNumber: number;
	status: ImportRowStatus;
	rawData: string;
	entityId: string | null;
	message: string | null;
	errors: string | null;
	createdAt: string;
	updatedAt: string;
}

/**
 * Row data for display in the UI
 */
export interface RowDisplayData {
	rowNumber: number;
	data: Record<string, string>;
	status: ImportRowStatus;
	message: string | null;
	errors: string[] | null;
	entityId: string | null;
}

/**
 * Catastrophic error type for import failures
 */
export interface CatastrophicError {
	type: string;
	message: string;
	details?: string;
	timestamp: string;
}

/**
 * Import state for UI tracking
 */
export interface ImportState {
	status: "idle" | "uploading" | "processing" | "completed" | "failed";
	importId: string | null;
	fileName: string | null;
	entityType: ImportEntityType | null;
	totalRows: number;
	processedRows: number;
	successCount: number;
	warningCount: number;
	errorCount: number;
	rows: RowDisplayData[];
	error: CatastrophicError | null;
}
