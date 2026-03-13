"use client";

import { useState, useEffect } from "react";
import { ImportProgress } from "./ImportProgress";
import { RowStatusTable } from "./RowStatusTable";
import { CatastrophicError } from "./CatastrophicError";
import { StepIndicator } from "./StepIndicator";
import { ColumnMappingStep } from "./ColumnMappingStep";
import { useImportSSE } from "@/hooks/useImportSSE";
import { useJwt } from "@/hooks/useJwt";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import {
	getImport,
	getImportPreview,
	getImportTargetFields,
	startImport,
} from "@/lib/api/imports";
import { Skeleton } from "@/components/ui/skeleton";
import type {
	ImportState,
	ImportEntityType,
	RowDisplayData,
} from "@/types/import";
import type { ImportTargetField } from "@/lib/api/imports";

/**
 * Skeleton for ImportViewContent — mirrors the progress card + rows table layout.
 */
export function ImportDetailsSkeleton(): React.ReactElement {
	return (
		<div className="h-full flex flex-col overflow-hidden bg-background">
			<div className="flex-1 overflow-hidden p-4">
				<div className="h-full flex flex-col gap-4">
					{/* Progress card skeleton */}
					<div className="flex-shrink-0">
						<div className="rounded-lg border bg-card p-6 space-y-4">
							<div className="flex items-center justify-between">
								<Skeleton className="h-6 w-48" />
								<Skeleton className="h-8 w-24 rounded-md" />
							</div>
							<Skeleton className="h-3 w-full rounded-full" />
							<div className="grid grid-cols-4 gap-4">
								{[1, 2, 3, 4].map((i) => (
									<div key={i} className="space-y-1.5">
										<Skeleton className="h-4 w-20" />
										<Skeleton className="h-7 w-12" />
									</div>
								))}
							</div>
						</div>
					</div>
					{/* Row status table skeleton */}
					<div className="flex-1 min-h-0 rounded-lg border bg-card overflow-hidden">
						<div className="p-4 border-b">
							<Skeleton className="h-5 w-32" />
						</div>
						<div className="divide-y">
							{[1, 2, 3, 4, 5, 6].map((i) => (
								<div key={i} className="flex items-center gap-4 px-4 py-3">
									<Skeleton className="h-5 w-8 shrink-0" />
									<Skeleton className="h-5 w-20 shrink-0" />
									<Skeleton className="h-4 flex-1" />
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

interface ImportViewContentProps {
	importId: string;
}

const initialState: ImportState = {
	status: "idle",
	importId: null,
	fileName: null,
	entityType: null,
	activityCode: null,
	totalRows: 0,
	processedRows: 0,
	successCount: 0,
	warningCount: 0,
	errorCount: 0,
	skippedCount: 0,
	rows: [],
	error: null,
};

export function ImportViewContent({ importId }: ImportViewContentProps) {
	const { jwt, isLoading: isJwtLoading } = useJwt();
	const { navigateTo } = useOrgNavigation();
	const [state, setState] = useState<ImportState>({
		...initialState,
		importId,
		status: "processing",
	});
	const [isLoading, setIsLoading] = useState(true);
	const [mappingStepData, setMappingStepData] = useState<{
		headers: string[];
		sampleRows: Record<string, string>[];
		targetFields: ImportTargetField[];
		initialMapping: Record<string, string>;
		showAutoMappingNotice: boolean;
	} | null>(null);

	// Use SSE for real-time updates
	const {
		progress,
		rowUpdates,
		error: sseError,
	} = useImportSSE({
		importId,
		enabled: state.status === "processing" || state.status === "uploading",
	});

	// Load existing import on mount
	useEffect(() => {
		async function loadImport() {
			if (!jwt) return;

			setIsLoading(true);
			try {
				const importData = await getImport({ id: importId, jwt });

				// Parse row results
				const rows: RowDisplayData[] = (importData.rowResults || []).map(
					(row) => {
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
					},
				);

				const isFinished =
					importData.status === "COMPLETED" || importData.status === "FAILED";
				const needsMapping =
					importData.status === "PENDING" &&
					importData.totalRows === 0 &&
					(!importData.rowResults || importData.rowResults.length === 0);

				setState({
					status: isFinished
						? importData.status === "COMPLETED"
							? "completed"
							: "failed"
						: needsMapping
							? "mapping"
							: "processing",
					importId: importData.id,
					fileName: importData.fileName,
					entityType: importData.entityType as ImportEntityType,
					activityCode:
						(importData as { activityCode?: string | null }).activityCode ??
						null,
					totalRows: importData.totalRows,
					processedRows: importData.processedRows,
					successCount: importData.successCount,
					warningCount: importData.warningCount,
					errorCount: importData.errorCount,
					skippedCount: importData.skippedCount,
					rows,
					error: importData.errorMessage
						? {
								type: "IMPORT_FAILED",
								message: importData.errorMessage,
								timestamp: importData.completedAt || new Date().toISOString(),
							}
						: null,
				});
			} catch (err) {
				console.error("Failed to load import:", err);
				setState((prev) => ({
					...prev,
					status: "failed",
					error: {
						type: "LOAD_ERROR",
						message:
							err instanceof Error ? err.message : "Failed to load import",
						timestamp: new Date().toISOString(),
					},
				}));
			} finally {
				setIsLoading(false);
			}
		}

		if (!isJwtLoading && jwt) {
			loadImport();
		}
	}, [importId, jwt, isJwtLoading]);

	// When showing mapping step, fetch preview and target-fields and compute auto-suggest
	useEffect(() => {
		if (
			state.status !== "mapping" ||
			!state.importId ||
			!state.entityType ||
			!jwt
		) {
			return;
		}
		let cancelled = false;
		(async () => {
			try {
				const [preview, targetRes] = await Promise.all([
					getImportPreview({ id: state.importId!, jwt }),
					getImportTargetFields({
						entityType: state.entityType!,
						activityCode:
							state.entityType === "OPERATION"
								? (state.activityCode ?? undefined)
								: undefined,
						jwt,
					}),
				]);
				if (cancelled) return;
				// Auto-suggest: match headers to target field value (normalize: lower, no _-\s)
				const norm = (s: string) =>
					s
						.toLowerCase()
						.replace(/[\s_\-]/g, "")
						.trim();
				const initialMapping: Record<string, string> = {};
				let suggestedCount = 0;
				for (const header of preview.headers) {
					const n = norm(header);
					const found = targetRes.fields.find(
						(f) => norm(f.value) === n || norm(f.label) === n,
					);
					if (found) {
						initialMapping[header] = found.value;
						suggestedCount++;
					}
				}
				setMappingStepData({
					headers: preview.headers,
					sampleRows: preview.sampleRows,
					targetFields: targetRes.fields,
					initialMapping,
					showAutoMappingNotice: suggestedCount > 0,
				});
			} catch (err) {
				if (!cancelled) {
					console.error("Failed to load mapping data:", err);
					setState((prev) => ({
						...prev,
						status: "failed",
						error: {
							type: "LOAD_ERROR",
							message:
								err instanceof Error
									? err.message
									: "Error al cargar vista previa",
							timestamp: new Date().toISOString(),
						},
					}));
				}
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [state.status, state.importId, state.entityType, state.activityCode, jwt]);

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
				skippedCount: progress.skippedCount,
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
		if (sseError && state.status === "processing") {
			setState((prev) => ({
				...prev,
				status: "failed",
				error: {
					type: "CONNECTION_ERROR",
					message: sseError,
					timestamp: new Date().toISOString(),
				},
			}));
		}
	}, [sseError, state.status]);

	const handleReset = () => {
		navigateTo("/import");
	};

	const handleRetry = () => {
		navigateTo("/import");
	};

	async function handleStartImport(mapping: Record<string, string>) {
		if (!state.importId || !jwt) return;
		await startImport({ id: state.importId, columnMapping: mapping, jwt });
		setMappingStepData(null);
		setState((prev) => ({ ...prev, status: "processing" }));
	}

	// Show loading state
	if (isLoading || isJwtLoading) {
		return <ImportDetailsSkeleton />;
	}

	return (
		<div className="flex h-full flex-col overflow-hidden bg-background">
			<div className="flex-1 overflow-hidden p-4">
				{state.status === "failed" && state.error ? (
					<CatastrophicError
						error={state.error}
						onRetry={handleRetry}
						onReset={handleReset}
					/>
				) : state.status === "mapping" && mappingStepData ? (
					<>
						<StepIndicator current={2} />
						<ColumnMappingStep
							fileName={state.fileName ?? ""}
							entityType={state.entityType ?? "CLIENT"}
							activityCode={state.activityCode}
							headers={mappingStepData.headers}
							sampleRows={mappingStepData.sampleRows}
							targetFields={mappingStepData.targetFields}
							initialMapping={mappingStepData.initialMapping}
							showAutoMappingNotice={mappingStepData.showAutoMappingNotice}
							onStartImport={handleStartImport}
						/>
					</>
				) : (
					<div className="flex h-full flex-col gap-4">
						<StepIndicator current={3} />
						<div className="flex-shrink-0">
							<ImportProgress state={state} onReset={handleReset} />
						</div>
						<div className="min-h-0 flex-1 overflow-hidden">
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
