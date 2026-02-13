"use client";

/**
 * React hook for cross-tab and cross-app session synchronization.
 *
 * Activates three sync mechanisms:
 * 1. BroadcastChannel listener - receives instant notifications from other same-origin tabs
 * 2. visibilitychange listener - revalidates session when tab becomes visible (hidden → visible)
 * 3. focus listener - revalidates session when window gains focus (handles side-by-side windows)
 *
 * Usage:
 * Call this hook once in your app's root client component (e.g., ClientLayout).
 */

import { useEffect, useRef } from "react";

import {
	initSessionSync,
	revalidateSession,
	type SessionSyncMessage,
} from "./sessionSync";
import { clearSession } from "./sessionStore";
import { getAuthAppUrl } from "./config";

/**
 * Minimum interval (ms) between revalidations triggered by visibilitychange/focus.
 * Prevents hammering the server when rapidly switching tabs.
 */
const REVALIDATION_THROTTLE_MS = 5000; // Increased from 2s to 5s

/**
 * Delay (ms) before starting revalidation after tab becomes visible.
 * Gives the browser time to fully restore network connections.
 */
const WAKE_UP_DELAY_MS = 800;

/**
 * Delay (ms) before retrying revalidation after a soft failure.
 * A soft failure is when revalidation fails but we don't want to immediately redirect.
 */
const SOFT_FAILURE_RETRY_MS = 12000; // 12 seconds

/**
 * Maximum number of consecutive soft failures before redirecting to login.
 */
const MAX_SOFT_FAILURES = 2;

/**
 * Hook to enable cross-tab session synchronization.
 *
 * Handles:
 * - SESSION_SIGNED_OUT from another tab -> clear local state and redirect to auth app login
 * - Tab becomes visible or focused -> revalidate session (detects cross-app sign-outs)
 *
 * Features resilience improvements:
 * - Wake-up delay before revalidation to let browser restore network
 * - Deduplicates concurrent visibility/focus events
 * - Soft failure mode: retries failed revalidations before redirecting
 *
 * Note: AML app has no public routes, so SESSION_UPDATED doesn't trigger redirects.
 * The middleware handles routing authenticated users.
 *
 * @example
 * ```tsx
 * export default function ClientLayout({ children }) {
 *   useSessionSync();
 *   return <div>{children}</div>;
 * }
 * ```
 */
export function useSessionSync(): void {
	const lastRevalidationRef = useRef<number>(0);
	const isRevalidatingRef = useRef<boolean>(false);
	const consecutiveFailuresRef = useRef<number>(0);
	const softFailureTimeoutRef = useRef<number | null>(null);

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		// Handle messages from other tabs (BroadcastChannel or localStorage)
		const handleMessage = (message: SessionSyncMessage) => {
			if (message.type === "SESSION_SIGNED_OUT") {
				// Another tab signed out - clear local state and redirect to auth app login
				clearSession();

				// Cancel any pending soft failure retries
				if (softFailureTimeoutRef.current) {
					clearTimeout(softFailureTimeoutRef.current);
					softFailureTimeoutRef.current = null;
				}

				// Redirect to auth app login
				const authAppLoginUrl = `${getAuthAppUrl()}/login`;
				if (window.location.href !== authAppLoginUrl) {
					window.location.href = authAppLoginUrl;
				}
			}
			// Note: SESSION_UPDATED is received but we don't need to redirect
			// AML app has no public routes - middleware handles authenticated user routing
		};

		// Initialize BroadcastChannel and storage listeners
		const cleanupSync = initSessionSync(handleMessage);

		// Handle tab visibility changes and window focus
		const handleVisibilityOrFocus = () => {
			if (document.visibilityState !== "visible") {
				return;
			}

			// Deduplicate: don't start a new revalidation if one is already in progress
			if (isRevalidatingRef.current) {
				return;
			}

			// Throttle revalidation to avoid rapid requests
			const now = Date.now();
			const timeSinceLastRevalidation = now - lastRevalidationRef.current;

			if (timeSinceLastRevalidation < REVALIDATION_THROTTLE_MS) {
				return;
			}

			lastRevalidationRef.current = now;
			isRevalidatingRef.current = true;

			// Add wake-up delay before revalidation
			setTimeout(() => {
				void revalidateSession()
					.then((isValid) => {
						if (isValid) {
							// Session is valid - reset failure counter
							consecutiveFailuresRef.current = 0;

							// Cancel any pending soft failure retries
							if (softFailureTimeoutRef.current) {
								clearTimeout(softFailureTimeoutRef.current);
								softFailureTimeoutRef.current = null;
							}
						} else {
							// Session validation failed
							consecutiveFailuresRef.current += 1;

							// Check if we should redirect or do a soft failure
							if (consecutiveFailuresRef.current >= MAX_SOFT_FAILURES) {
								// Hard failure - redirect to login
								const authAppLoginUrl = `${getAuthAppUrl()}/login`;
								window.location.href = authAppLoginUrl;
							} else {
								// Soft failure - schedule a retry
								console.warn(
									`[SessionSync] Soft failure ${consecutiveFailuresRef.current}/${MAX_SOFT_FAILURES}, will retry in ${SOFT_FAILURE_RETRY_MS / 1000}s`,
								);

								// Cancel any existing soft failure timeout
								if (softFailureTimeoutRef.current) {
									clearTimeout(softFailureTimeoutRef.current);
								}

								// Schedule retry
								softFailureTimeoutRef.current = window.setTimeout(() => {
									softFailureTimeoutRef.current = null;
									isRevalidatingRef.current = false;
									handleVisibilityOrFocus();
								}, SOFT_FAILURE_RETRY_MS);
							}
						}
					})
					.finally(() => {
						// Only clear the flag if we're not in soft failure retry mode
						if (!softFailureTimeoutRef.current) {
							isRevalidatingRef.current = false;
						}
					});
			}, WAKE_UP_DELAY_MS);
		};

		// Handle window focus (for separate windows - visibilitychange doesn't fire for side-by-side windows)
		const handleFocus = () => {
			// Use the same logic as visibilitychange
			handleVisibilityOrFocus();
		};

		document.addEventListener("visibilitychange", handleVisibilityOrFocus);
		window.addEventListener("focus", handleFocus);

		// Cleanup listeners on unmount
		return () => {
			cleanupSync();
			document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
			window.removeEventListener("focus", handleFocus);

			// Clear any pending soft failure timeout
			if (softFailureTimeoutRef.current) {
				clearTimeout(softFailureTimeoutRef.current);
			}
		};
	}, []); // Empty deps - only run once on mount
}
