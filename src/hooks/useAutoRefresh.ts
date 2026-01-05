import { useEffect, useRef, useCallback } from "react";

interface UseAutoRefreshOptions {
	/** Interval in milliseconds (default: 30000 = 30 seconds) */
	interval?: number;
	/** Whether auto-refresh is enabled (default: true) */
	enabled?: boolean;
	/** Only refresh when tab is visible (default: true) */
	onlyWhenVisible?: boolean;
}

/**
 * Hook to automatically refresh data at a specified interval.
 * Silently refreshes data without showing loading states.
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
	} = options;

	const refreshFnRef = useRef(refreshFn);
	const isRefreshingRef = useRef(false);

	// Keep the ref updated with the latest function
	useEffect(() => {
		refreshFnRef.current = refreshFn;
	}, [refreshFn]);

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
		} catch (error) {
			// Silently handle errors - don't show toast for background refreshes
			console.debug("Auto-refresh failed:", error);
		} finally {
			isRefreshingRef.current = false;
		}
	}, [onlyWhenVisible]);

	useEffect(() => {
		if (!enabled) {
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
	}, [enabled, interval, doRefresh, onlyWhenVisible]);
}
