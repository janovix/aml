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
const REVALIDATION_THROTTLE_MS = 2000;

/**
 * Hook to enable cross-tab session synchronization.
 *
 * Handles:
 * - SESSION_SIGNED_OUT from another tab -> clear local state and redirect to auth app login
 * - Tab becomes visible or focused -> revalidate session (detects cross-app sign-outs)
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

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		// Handle messages from other tabs (BroadcastChannel or localStorage)
		const handleMessage = (message: SessionSyncMessage) => {
			if (message.type === "SESSION_SIGNED_OUT") {
				// Another tab signed out - clear local state and redirect to auth app login
				clearSession();

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
			if (document.visibilityState === "visible") {
				// Throttle revalidation to avoid rapid requests
				const now = Date.now();
				const timeSinceLastRevalidation = now - lastRevalidationRef.current;

				if (timeSinceLastRevalidation >= REVALIDATION_THROTTLE_MS) {
					lastRevalidationRef.current = now;

					// Revalidate session against server
					void revalidateSession().then((isValid) => {
						if (!isValid) {
							// Session is invalid/expired - redirect to auth app login
							const authAppLoginUrl = `${getAuthAppUrl()}/login`;
							window.location.href = authAppLoginUrl;
						}
					});
				}
			}
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
		};
	}, []); // Empty deps - only run once on mount
}
