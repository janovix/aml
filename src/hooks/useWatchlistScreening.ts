/**
 * useWatchlistScreening Hook
 * Server-Sent Events hook for real-time watchlist screening updates
 * Combines SSE for real-time updates with polling fallback
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getWatchlistBaseUrl } from "@/lib/api/config";
import {
	getQueryResults,
	type WatchlistQueryResult,
} from "@/lib/api/watchlist";

export interface UseWatchlistScreeningOptions {
	watchlistQueryId: string | null | undefined;
	enabled?: boolean;
	authToken?: string;
}

export interface UseWatchlistScreeningResult {
	/** Current screening data */
	data: WatchlistQueryResult | null;
	/** Whether data is being loaded */
	isLoading: boolean;
	/** Error message if any */
	error: string | null;
	/** Connection status for SSE */
	connectionStatus: "disconnected" | "connecting" | "connected" | "error";
	/** Whether all async searches are complete */
	isComplete: boolean;
	/** Refetch function to manually update data */
	refetch: () => Promise<void>;
}

export function useWatchlistScreening(
	opts: UseWatchlistScreeningOptions,
): UseWatchlistScreeningResult {
	const { watchlistQueryId, enabled = true, authToken } = opts;

	const [data, setData] = useState<WatchlistQueryResult | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [connectionStatus, setConnectionStatus] = useState<
		"disconnected" | "connecting" | "connected" | "error"
	>("disconnected");
	const [isComplete, setIsComplete] = useState(false);

	const eventSourceRef = useRef<EventSource | null>(null);
	const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

	/**
	 * Fetch current query state from REST API
	 */
	const fetchData = useCallback(async () => {
		if (!watchlistQueryId) return;

		try {
			const result = await getQueryResults(watchlistQueryId, { authToken });
			if (result) {
				setData(result);
				setError(null);

				// Check if all async searches are complete
				const allComplete = checkIfComplete(result);
				setIsComplete(allComplete);
			}
		} catch (err) {
			console.error("[useWatchlistScreening] Error fetching data:", err);
			setError(
				err instanceof Error ? err.message : "Failed to fetch screening data",
			);
		}
	}, [watchlistQueryId, authToken]);

	/**
	 * Connect to SSE for real-time updates
	 */
	const connectSSE = useCallback(() => {
		if (!watchlistQueryId || !enabled) {
			return;
		}

		// Clean up existing connection
		if (eventSourceRef.current) {
			eventSourceRef.current.close();
			eventSourceRef.current = null;
		}

		const baseUrl = getWatchlistBaseUrl();
		// Note: SSE doesn't support custom headers, so we pass JWT as query param if needed
		const url = authToken
			? `${baseUrl}/events/${watchlistQueryId}?token=${encodeURIComponent(authToken)}`
			: `${baseUrl}/events/${watchlistQueryId}`;

		setConnectionStatus("connecting");

		try {
			const eventSource = new EventSource(url);
			eventSourceRef.current = eventSource;

			eventSource.onopen = () => {
				console.log("[useWatchlistScreening] SSE connected");
				setConnectionStatus("connected");
			};

			// Handle PEP official results
			eventSource.addEventListener("pep_results", (event) => {
				console.log("[useWatchlistScreening] PEP results received");
				const payload = JSON.parse((event as MessageEvent).data);
				setData((prev) => {
					if (!prev) return prev;
					return {
						...prev,
						pepOfficialStatus: "completed",
						pepOfficialResult: payload,
						pepOfficialCount: payload.results_sent || 0,
					};
				});
			});

			// Handle PEP AI (Grok) results
			eventSource.addEventListener("pep_grok_results", (event) => {
				console.log("[useWatchlistScreening] PEP AI results received");
				const payload = JSON.parse((event as MessageEvent).data);
				setData((prev) => {
					if (!prev) return prev;
					return {
						...prev,
						pepAiStatus: "completed",
						pepAiResult: payload,
					};
				});
			});

			// Handle adverse media results
			eventSource.addEventListener("adverse_media_results", (event) => {
				console.log("[useWatchlistScreening] Adverse media results received");
				const payload = JSON.parse((event as MessageEvent).data);
				setData((prev) => {
					if (!prev) return prev;
					return {
						...prev,
						adverseMediaStatus: "completed",
						adverseMediaResult: payload,
					};
				});
			});

			// Handle PEP error
			eventSource.addEventListener("pep_error", (event) => {
				console.log("[useWatchlistScreening] PEP error received");
				const payload = JSON.parse((event as MessageEvent).data);
				setData((prev) => {
					if (!prev) return prev;
					return {
						...prev,
						pepOfficialStatus: "failed",
						pepOfficialResult: { error: payload.error },
					};
				});
			});

			// Handle PEP AI error
			eventSource.addEventListener("pep_grok_error", (event) => {
				console.log("[useWatchlistScreening] PEP AI error received");
				const payload = JSON.parse((event as MessageEvent).data);
				setData((prev) => {
					if (!prev) return prev;
					return {
						...prev,
						pepAiStatus: "failed",
						pepAiResult: { error: payload.error },
					};
				});
			});

			// Handle adverse media error
			eventSource.addEventListener("adverse_media_error", (event) => {
				console.log("[useWatchlistScreening] Adverse media error received");
				const payload = JSON.parse((event as MessageEvent).data);
				setData((prev) => {
					if (!prev) return prev;
					return {
						...prev,
						adverseMediaStatus: "failed",
						adverseMediaResult: { error: payload.error },
					};
				});
			});

			eventSource.onerror = () => {
				console.error("[useWatchlistScreening] SSE connection error");
				setConnectionStatus("error");
				eventSource.close();
				eventSourceRef.current = null;
			};
		} catch (err) {
			console.error("[useWatchlistScreening] Error connecting to SSE:", err);
			setConnectionStatus("error");
		}
	}, [watchlistQueryId, enabled, authToken]);

	/**
	 * Start polling as fallback
	 */
	const startPolling = useCallback(() => {
		if (pollingIntervalRef.current) {
			clearInterval(pollingIntervalRef.current);
		}

		// Poll every 5 seconds
		pollingIntervalRef.current = setInterval(() => {
			fetchData();
		}, 5000);
	}, [fetchData]);

	/**
	 * Stop polling
	 */
	const stopPolling = useCallback(() => {
		if (pollingIntervalRef.current) {
			clearInterval(pollingIntervalRef.current);
			pollingIntervalRef.current = null;
		}
	}, []);

	/**
	 * Check if all async searches are done
	 */
	const checkIfComplete = (result: WatchlistQueryResult): boolean => {
		const doneStatuses = ["completed", "failed", "skipped"];
		return (
			doneStatuses.includes(result.pepOfficialStatus) &&
			doneStatuses.includes(result.pepAiStatus) &&
			doneStatuses.includes(result.adverseMediaStatus)
		);
	};

	// Initial data fetch and SSE connection
	useEffect(() => {
		if (!watchlistQueryId || !enabled) {
			setConnectionStatus("disconnected");
			setData(null);
			setIsLoading(false);
			return;
		}

		setIsLoading(true);

		// Fetch initial data
		fetchData().then(() => {
			setIsLoading(false);

			// Connect to SSE for real-time updates
			connectSSE();

			// Start polling as fallback
			startPolling();
		});

		return () => {
			// Cleanup
			if (eventSourceRef.current) {
				eventSourceRef.current.close();
				eventSourceRef.current = null;
			}
			stopPolling();
		};
	}, [
		watchlistQueryId,
		enabled,
		fetchData,
		connectSSE,
		startPolling,
		stopPolling,
	]);

	// Auto-disconnect SSE when complete
	useEffect(() => {
		if (isComplete && eventSourceRef.current) {
			console.log("[useWatchlistScreening] All searches complete, closing SSE");
			eventSourceRef.current.close();
			eventSourceRef.current = null;
			setConnectionStatus("disconnected");
			stopPolling();
		}
	}, [isComplete, stopPolling]);

	// Update isComplete when data changes
	useEffect(() => {
		if (data) {
			const complete = checkIfComplete(data);
			if (complete !== isComplete) {
				setIsComplete(complete);
			}
		}
	}, [data, isComplete]);

	return {
		data,
		isLoading,
		error,
		connectionStatus,
		isComplete,
		refetch: fetchData,
	};
}
