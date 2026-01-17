/**
 * useImportSSE Hook
 * Server-Sent Events hook for real-time import progress updates
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getAmlCoreBaseUrl } from "@/lib/api/config";
import { useJwt } from "@/hooks/useJwt";
import type {
	ImportStatus,
	ImportRowResult,
	ImportRowStatus,
} from "@/lib/api/imports";

export interface ImportProgress {
	status: ImportStatus;
	processedRows: number;
	totalRows: number;
	successCount: number;
	warningCount: number;
	errorCount: number;
	errorMessage?: string | null;
	completedAt?: string | null;
}

export interface UseImportSSEOptions {
	importId: string;
	enabled?: boolean;
	baseUrl?: string;
}

export interface UseImportSSEResult {
	/** Current import progress */
	progress: ImportProgress | null;
	/** Row updates received in real-time */
	rowUpdates: ImportRowResult[];
	/** Connection status */
	connectionStatus: "connecting" | "connected" | "disconnected" | "error";
	/** Whether the import is complete */
	isComplete: boolean;
	/** Error message if any */
	error: string | null;
	/** Reconnect function */
	reconnect: () => void;
}

export function useImportSSE(opts: UseImportSSEOptions): UseImportSSEResult {
	const { importId, enabled = true, baseUrl } = opts;
	const { jwt: token } = useJwt();

	const [progress, setProgress] = useState<ImportProgress | null>(null);
	const [rowUpdates, setRowUpdates] = useState<ImportRowResult[]>([]);
	const [connectionStatus, setConnectionStatus] = useState<
		"connecting" | "connected" | "disconnected" | "error"
	>("disconnected");
	const [error, setError] = useState<string | null>(null);
	const [isComplete, setIsComplete] = useState(false);

	const eventSourceRef = useRef<EventSource | null>(null);
	const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	const connect = useCallback(() => {
		if (!enabled || !importId || !token) {
			return;
		}

		// Clean up any existing connection
		if (eventSourceRef.current) {
			eventSourceRef.current.close();
		}

		const base = baseUrl ?? getAmlCoreBaseUrl();
		// Note: SSE doesn't support custom headers, so we pass the JWT as a query param
		// The backend needs to accept JWT from either header or query param
		const url = `${base}/api/v1/imports/${importId}/events?token=${encodeURIComponent(token)}`;

		setConnectionStatus("connecting");
		setError(null);

		const eventSource = new EventSource(url);
		eventSourceRef.current = eventSource;

		eventSource.addEventListener("connected", (event) => {
			setConnectionStatus("connected");
			const data = JSON.parse((event as MessageEvent).data);
			setProgress({
				status: data.status,
				processedRows: 0,
				totalRows: 0,
				successCount: 0,
				warningCount: 0,
				errorCount: 0,
			});
		});

		eventSource.addEventListener("row_update", (event) => {
			const data = JSON.parse((event as MessageEvent).data) as ImportRowResult;
			setRowUpdates((prev) => {
				// Update existing row or add new one
				const existingIndex = prev.findIndex(
					(r) => r.rowNumber === data.rowNumber,
				);
				if (existingIndex >= 0) {
					const updated = [...prev];
					updated[existingIndex] = data;
					return updated;
				}
				return [...prev, data];
			});
		});

		eventSource.addEventListener("status_change", (event) => {
			const data = JSON.parse((event as MessageEvent).data);
			setProgress((prev) => ({
				...(prev ?? {
					status: "PENDING" as ImportStatus,
					processedRows: 0,
					totalRows: 0,
					successCount: 0,
					warningCount: 0,
					errorCount: 0,
				}),
				status: data.status,
				processedRows: data.processedRows ?? prev?.processedRows ?? 0,
				totalRows: data.totalRows ?? prev?.totalRows ?? 0,
				successCount: data.successCount ?? prev?.successCount ?? 0,
				warningCount: data.warningCount ?? prev?.warningCount ?? 0,
				errorCount: data.errorCount ?? prev?.errorCount ?? 0,
			}));
		});

		eventSource.addEventListener("completed", (event) => {
			const data = JSON.parse((event as MessageEvent).data);
			setProgress({
				status: data.status,
				processedRows: data.processedRows,
				totalRows: data.totalRows,
				successCount: data.successCount,
				warningCount: data.warningCount,
				errorCount: data.errorCount,
				errorMessage: data.errorMessage,
				completedAt: data.completedAt,
			});
			setIsComplete(true);
			eventSource.close();
			setConnectionStatus("disconnected");
		});

		eventSource.addEventListener("error", (event) => {
			const data = JSON.parse((event as MessageEvent).data);
			setError(data.message ?? "An error occurred");
			setProgress((prev) =>
				prev
					? {
							...prev,
							status: "FAILED" as ImportStatus,
							errorMessage: data.message,
						}
					: null,
			);
			setIsComplete(true);
			eventSource.close();
			setConnectionStatus("error");
		});

		eventSource.onerror = () => {
			setConnectionStatus("error");
			eventSource.close();

			// Auto-reconnect after 3 seconds if not complete
			if (!isComplete) {
				reconnectTimeoutRef.current = setTimeout(() => {
					connect();
				}, 3000);
			}
		};
	}, [enabled, importId, token, baseUrl, isComplete]);

	const reconnect = useCallback(() => {
		setError(null);
		setIsComplete(false);
		connect();
	}, [connect]);

	useEffect(() => {
		connect();

		return () => {
			if (eventSourceRef.current) {
				eventSourceRef.current.close();
			}
			if (reconnectTimeoutRef.current) {
				clearTimeout(reconnectTimeoutRef.current);
			}
		};
	}, [connect]);

	return {
		progress,
		rowUpdates,
		connectionStatus,
		isComplete,
		error,
		reconnect,
	};
}
