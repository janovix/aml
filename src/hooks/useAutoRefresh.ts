import { useEffect, useRef, useCallback, useState } from "react";

interface UseAutoRefreshOptions {
	/** Interval in milliseconds (default: 30000 = 30 seconds) */
	interval?: number;
	/** Whether auto-refresh is enabled (default: true) */
	enabled?: boolean;
	/** Only refresh when tab is visible (default: true) */
	onlyWhenVisible?: boolean;
	/** Maximum consecutive failures before stopping auto-refresh (default: 3) */
	maxRetries?: number;
}

/**
 * Hook to automatically refresh data at a specified interval.
 * Silently refreshes data without showing loading states.
 * Stops retrying after a configured number of consecutive failures.
 *
 * @param refreshFn - The function to call for refreshing data
 * @param options - Configuration options
 */
export function useAutoRefresh(
	refreshFn: () => Promise<void> | void,
	options: UseAutoRefreshOptions = {},
): void {
	const {
		interval = 30000, // 30 seconds default
		enabled = true,
		onlyWhenVisible = true,
		maxRetries = 3,
	} = options;

	const refreshFnRef = useRef(refreshFn);
	const isRefreshingRef = useRef(false);
	const [consecutiveFailures, setConsecutiveFailures] = useState(0);

	// Keep the ref updated with the latest function
	useEffect(() => {
		refreshFnRef.current = refreshFn;
	}, [refreshFn]);

	// Reset failure count when enabled changes (e.g., when user navigates back)
	useEffect(() => {
		if (enabled) {
			setConsecutiveFailures(0);
		}
	}, [enabled]);

	const doRefresh = useCallback(async () => {
		// Skip if already refreshing
		if (isRefreshingRef.current) {
			return;
		}

		// Skip if tab is not visible and onlyWhenVisible is true
		if (onlyWhenVisible && document.hidden) {
			return;
		}

		try {
			isRefreshingRef.current = true;
			await refreshFnRef.current();
			// Reset failure count on success
			setConsecutiveFailures(0);
		} catch (error) {
			// Silently handle errors - don't show toast for background refreshes
			console.debug("Auto-refresh failed:", error);
			setConsecutiveFailures((prev) => prev + 1);
		} finally {
			isRefreshingRef.current = false;
		}
	}, [onlyWhenVisible]);

	// Determine if we should continue refreshing based on failure count
	const shouldRefresh = enabled && consecutiveFailures < maxRetries;

	useEffect(() => {
		if (!shouldRefresh) {
			return;
		}

		const intervalId = setInterval(doRefresh, interval);

		// Also refresh when tab becomes visible after being hidden
		const handleVisibilityChange = () => {
			if (!document.hidden && onlyWhenVisible) {
				doRefresh();
			}
		};

		if (onlyWhenVisible) {
			document.addEventListener("visibilitychange", handleVisibilityChange);
		}

		return () => {
			clearInterval(intervalId);
			if (onlyWhenVisible) {
				document.removeEventListener(
					"visibilitychange",
					handleVisibilityChange,
				);
			}
		};
	}, [shouldRefresh, interval, doRefresh, onlyWhenVisible]);
}
