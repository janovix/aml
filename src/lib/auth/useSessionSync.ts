"use client";

/**
 * React hook for cross-tab session synchronization and tab visibility revalidation.
 *
 * This hook handles two session synchronization mechanisms:
 * 1. BroadcastChannel - instant sync between tabs on the same origin
 * 2. visibilitychange - revalidation when tab gains focus after being hidden >2 minutes
 *
 * Session validation is handled by middleware on every navigation, which was working
 * reliably before client-side revalidation was added.
 *
 * The middleware approach is more reliable than direct client-to-auth-svc requests because:
 * - It goes through the same-origin Next.js server
 * - It properly forwards refreshed cookies to the browser
 * - It doesn't suffer from cross-origin CORS issues
 *
 * This hook handles:
 * - SESSION_SIGNED_OUT from another tab -> clear local state and redirect
 * - SESSION_UPDATED from another tab -> trigger navigation to force middleware revalidation
 * - Tab becomes visible after >2 min -> reload page to revalidate session via middleware
 *
 * Usage:
 * Call this hook once in your app's root client component (e.g., ClientLayout).
 */

import { useEffect } from "react";

import { initSessionSync, type SessionSyncMessage } from "./sessionSync";
import { clearSession } from "./sessionStore";
import { getAuthAppUrl } from "./config";

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
			} else if (message.type === "SESSION_UPDATED") {
				// Another tab updated the session
				// Trigger a page reload to force middleware to run and hydrate fresh session data
				// The middleware will validate with auth-svc and pass fresh session to the page
				console.log(
					"[SessionSync] Session updated in another tab, reloading page",
				);
				window.location.reload();
			}
		};

		// Initialize BroadcastChannel and storage listeners
		const cleanupSync = initSessionSync(handleMessage);

		// Track when tab was last visible for session revalidation on focus
		let lastVisibleAt = Date.now();
		const STALE_THRESHOLD = 2 * 60 * 1000; // 2 minutes

		const handleVisibilityChange = () => {
			if (document.visibilityState === "visible") {
				const hiddenDuration = Date.now() - lastVisibleAt;
				if (hiddenDuration > STALE_THRESHOLD) {
					// Tab was hidden long enough that cookie cache may have expired
					// Force a page reload to trigger middleware session validation
					console.log(
						`[SessionSync] Tab was hidden for ${Math.round(hiddenDuration / 1000)}s, reloading to revalidate session`,
					);
					window.location.reload();
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
