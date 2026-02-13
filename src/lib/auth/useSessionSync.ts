"use client";

/**
 * React hook for cross-tab session synchronization.
 *
 * ONLY handles broadcast messages between tabs - does NOT do client-side revalidation.
 * Session validation is handled by middleware on every navigation, which was working
 * reliably before client-side revalidation was added.
 *
 * The middleware approach is more reliable than direct client-to-auth-svc requests because:
 * - It goes through the same-origin Next.js server
 * - It properly forwards refreshed cookies to the browser
 * - It doesn't suffer from cross-origin CORS issues
 *
 * This hook only handles:
 * - SESSION_SIGNED_OUT from another tab -> clear local state and redirect
 * - SESSION_UPDATED from another tab -> trigger navigation to force middleware revalidation
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

		// Cleanup listeners on unmount
		return () => {
			cleanupSync();
		};
	}, []); // Empty deps - only run once on mount
}
