"use client";

import { useState, useCallback, useEffect } from "react";
import { FileUploader } from "./FileUploader";
import { ImportProgress } from "./ImportProgress";
import { RowStatusTable } from "./RowStatusTable";
import { CatastrophicError } from "./CatastrophicError";
import { useImportSSE } from "@/hooks/useImportSSE";
import { createImport, getImport } from "@/lib/api/imports";
import type {
	ImportState,
	ImportEntityType,
	RowDisplayData,
} from "@/types/import";

const initialState: ImportState = {
	status: "idle",
	importId: null,
	fileName: null,
	entityType: null,
	totalRows: 0,
	processedRows: 0,
	successCount: 0,
	warningCount: 0,
	errorCount: 0,
	rows: [],
	error: null,
};

export function ImportPageContent() {
	const [state, setState] = useState<ImportState>(initialState);

	// Use SSE for real-time updates when an import is in progress
	const { progress, rowUpdates, connectionStatus, isComplete, error } =
		useImportSSE({
			importId: state.importId ?? "",
			enabled:
				state.status === "processing" ||
				(state.status === "uploading" && !!state.importId),
		});

	// Update state from SSE progress
	useEffect(() => {
		if (progress) {
			setState((prev) => ({
				...prev,
				status:
					progress.status === "COMPLETED"
						? "completed"
						: progress.status === "FAILED"
							? "failed"
							: "processing",
				totalRows: progress.totalRows,
				processedRows: progress.processedRows,
				successCount: progress.successCount,
				warningCount: progress.warningCount,
				errorCount: progress.errorCount,
				error: progress.errorMessage
					? {
							type: "IMPORT_FAILED",
							message: progress.errorMessage,
							timestamp: new Date().toISOString(),
						}
					: prev.error,
			}));
		}
	}, [progress]);

	// Update rows from SSE row updates
	useEffect(() => {
		if (rowUpdates.length > 0) {
			const newRows: RowDisplayData[] = rowUpdates.map((row) => {
				let parsedData: Record<string, string> = {};
				try {
					parsedData = JSON.parse(row.rawData);
				} catch {
					parsedData = { raw: row.rawData };
				}

				let parsedErrors: string[] | null = null;
				if (row.errors) {
					try {
						parsedErrors = JSON.parse(row.errors);
					} catch {
						parsedErrors = [row.errors];
					}
				}

				return {
					rowNumber: row.rowNumber,
					data: parsedData,
					status: row.status,
					message: row.message,
					errors: parsedErrors,
					entityId: row.entityId,
				};
			});

			setState((prev) => {
				// Merge new rows with existing rows
				const rowMap = new Map(prev.rows.map((r) => [r.rowNumber, r]));
				for (const row of newRows) {
					rowMap.set(row.rowNumber, row);
				}
				return {
					...prev,
					rows: Array.from(rowMap.values()).sort(
						(a, b) => a.rowNumber - b.rowNumber,
					),
				};
			});
		}
	}, [rowUpdates]);

	// Handle SSE error
	useEffect(() => {
		if (error && state.status === "processing") {
			setState((prev) => ({
				...prev,
				status: "failed",
				error: {
					type: "CONNECTION_ERROR",
					message: error,
					timestamp: new Date().toISOString(),
				},
			}));
		}
	}, [error, state.status]);

	const handleFileUpload = useCallback(
		async (file: File, entityType: ImportEntityType) => {
			setState((prev) => ({
				...prev,
				status: "uploading",
				fileName: file.name,
				entityType,
				error: null,
			}));

			try {
				const result = await createImport({ file, entityType });

				setState((prev) => ({
					...prev,
					status: "processing",
					importId: result.data.id,
					totalRows: result.data.totalRows,
				}));

				// Load initial row data if available
				if (result.data.id) {
					const importData = await getImport({ id: result.data.id });
					if (importData.rowResults) {
						const rows: RowDisplayData[] = importData.rowResults.map((row) => {
							let parsedData: Record<string, string> = {};
							try {
								parsedData = JSON.parse(row.rawData);
							} catch {
								parsedData = { raw: row.rawData };
							}

							let parsedErrors: string[] | null = null;
							if (row.errors) {
								try {
									parsedErrors = JSON.parse(row.errors);
								} catch {
									parsedErrors = [row.errors];
								}
							}

							return {
								rowNumber: row.rowNumber,
								data: parsedData,
								status: row.status,
								message: row.message,
								errors: parsedErrors,
								entityId: row.entityId,
							};
						});

						setState((prev) => ({
							...prev,
							rows,
							totalRows: importData.totalRows,
							processedRows: importData.processedRows,
							successCount: importData.successCount,
							warningCount: importData.warningCount,
							errorCount: importData.errorCount,
						}));
					}
				}
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : "Error desconocido";
				setState((prev) => ({
					...prev,
					status: "failed",
					error: {
						type: "UPLOAD_ERROR",
						message: errorMessage,
						timestamp: new Date().toISOString(),
					},
				}));
			}
		},
		[],
	);

	const handleReset = useCallback(() => {
		setState(initialState);
	}, []);

	const handleRetry = useCallback(async () => {
		// For now, just reset - in the future, could re-upload the same file
		handleReset();
	}, [handleReset]);

	return (
		<div className="h-full flex flex-col overflow-hidden bg-background">
			<div className="flex-1 overflow-hidden">
				{state.status === "failed" && state.error ? (
					<div className="h-full overflow-auto p-4">
						<CatastrophicError
							error={state.error}
							onRetry={handleRetry}
							onReset={handleReset}
						/>
					</div>
				) : state.status === "idle" ? (
					<div className="h-full overflow-auto p-4">
						<FileUploader onFileUpload={handleFileUpload} />
					</div>
				) : (
					<div className="h-full flex flex-col">
						{/* Progress section */}
						<div className="flex-shrink-0 p-3 border-b border-border">
							<ImportProgress state={state} onReset={handleReset} />
						</div>
						{/* Row status table */}
						<div className="flex-1 overflow-hidden">
							<RowStatusTable
								rows={state.rows}
								currentRow={state.processedRows}
							/>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
