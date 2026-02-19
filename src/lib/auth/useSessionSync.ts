"use client";

/**
 * React hook for cross-tab session synchronization and tab visibility revalidation.
 *
 * This hook handles two session synchronization mechanisms:
 * 1. BroadcastChannel - instant sync between tabs on the same origin
 * 2. visibilitychange - silent session revalidation when tab gains focus after being hidden >5 minutes
 *
 * This hook handles:
 * - SESSION_SIGNED_OUT from another tab -> clear local state and redirect
 * - SESSION_UPDATED from another tab -> silent revalidation to pick up fresh session data
 * - Tab becomes visible after >5 min -> silent revalidateSession(), redirect only if actually invalid
 *
 * Usage:
 * Call this hook once in your app's root client component (e.g., ClientLayout).
 */

import { useEffect } from "react";

import {
	initSessionSync,
	revalidateSession,
	type SessionSyncMessage,
} from "./sessionSync";
import { clearSession } from "./sessionStore";
import { getAuthAppUrl } from "./config";

/**
 * How long the tab must be hidden before triggering a session revalidation on return.
 * 5 minutes gives plenty of buffer without being overly aggressive.
 */
const STALE_THRESHOLD = 5 * 60 * 1000;

/**
 * Hook to enable cross-tab session synchronization.
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
	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		const authAppLoginUrl = `${getAuthAppUrl()}/login`;

		const redirectToLogin = () => {
			if (window.location.href !== authAppLoginUrl) {
				window.location.href = authAppLoginUrl;
			}
		};

		// Handle messages from other tabs (BroadcastChannel or localStorage)
		const handleMessage = (message: SessionSyncMessage) => {
			if (message.type === "SESSION_SIGNED_OUT") {
				clearSession();
				redirectToLogin();
			} else if (message.type === "SESSION_UPDATED") {
				// Silently pick up the updated session data without a full page reload
				void revalidateSession();
			}
		};

		// Initialize BroadcastChannel and storage listeners
		const cleanupSync = initSessionSync(handleMessage);

		// Track when tab was last visible for session revalidation on focus
		let lastVisibleAt = Date.now();

		const handleVisibilityChange = () => {
			if (document.visibilityState === "visible") {
				const hiddenDuration = Date.now() - lastVisibleAt;
				if (hiddenDuration > STALE_THRESHOLD) {
					// Silently revalidate -- only redirect if the session is actually invalid
					void revalidateSession().then((isValid) => {
						if (!isValid) {
							redirectToLogin();
						}
					});
				}
			} else {
				lastVisibleAt = Date.now();
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);

		// Cleanup listeners on unmount
		return () => {
			cleanupSync();
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, []); // Empty deps - only run once on mount
}
