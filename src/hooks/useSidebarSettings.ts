"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
	getSidebarCollapsed,
	setSidebarCollapsed as saveSidebarCollapsed,
} from "@/lib/settings/settingsClient";

const SIDEBAR_COOKIE_NAME = "sidebar_state";

/**
 * Helper to get cookie value
 */
function getCookieValue(name: string): string | null {
	if (typeof document === "undefined") return null;
	const value = `; ${document.cookie}`;
	const parts = value.split(`; ${name}=`);
	if (parts.length === 2) {
		return parts.pop()?.split(";").shift() ?? null;
	}
	return null;
}

/**
 * Helper to set cookie value
 */
function setCookieValue(name: string, value: string, maxAge: number): void {
	if (typeof document === "undefined") return;
	document.cookie = `${name}=${value}; path=/; max-age=${maxAge}`;
}

interface UseSidebarSettingsReturn {
	/** Whether the sidebar is collapsed */
	isCollapsed: boolean;
	/** Whether settings are still loading from the server */
	isLoading: boolean;
	/** Update the collapsed state (persists to server) */
	setCollapsed: (collapsed: boolean) => void;
}

/**
 * Hook to manage sidebar collapsed state with persistence to auth-svc
 *
 * This hook:
 * 1. Loads the initial state from localStorage cookie (for fast UI)
 * 2. Fetches the persisted state from auth-svc (source of truth)
 * 3. Syncs changes back to auth-svc when the user toggles the sidebar
 *
 * Falls back to cookie-only storage if auth-svc is unavailable.
 */
export function useSidebarSettings(
	defaultCollapsed = false,
): UseSidebarSettingsReturn {
	const [isLoading, setIsLoading] = useState(true);
	const [isCollapsed, setIsCollapsedState] = useState(() => {
		// Start with cookie value for fast initial render
		const cookieValue = getCookieValue(SIDEBAR_COOKIE_NAME);
		if (cookieValue === "true") return false; // cookie stores "open" state
		if (cookieValue === "false") return true;
		return defaultCollapsed;
	});

	// Use ref to track if we've loaded from server
	const hasLoadedFromServer = useRef(false);
	// Use ref to track pending save to avoid race conditions
	const pendingSave = useRef<boolean | null>(null);
	// Use ref to track the save timeout for debouncing
	const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Load initial state from server
	useEffect(() => {
		if (hasLoadedFromServer.current) return;

		async function loadFromServer() {
			try {
				const serverCollapsed = await getSidebarCollapsed();
				hasLoadedFromServer.current = true;

				if (serverCollapsed !== undefined) {
					setIsCollapsedState(serverCollapsed);
					// Sync cookie with server state
					setCookieValue(
						SIDEBAR_COOKIE_NAME,
						serverCollapsed ? "false" : "true",
						60 * 60 * 24 * 7,
					);
				}
			} catch {
				// Failed to load from server, use cookie value (already set)
				console.debug(
					"[useSidebarSettings] Failed to load from server, using cookie fallback",
				);
			} finally {
				setIsLoading(false);
			}
		}

		loadFromServer();
	}, []);

	// Debounced save to server
	const saveToServer = useCallback(async (collapsed: boolean) => {
		try {
			await saveSidebarCollapsed(collapsed);
		} catch {
			// Failed to save, but local state is already updated
			console.debug(
				"[useSidebarSettings] Failed to save to server, local state preserved",
			);
		}
	}, []);

	const setCollapsed = useCallback(
		(collapsed: boolean) => {
			// Update local state immediately for responsive UI
			setIsCollapsedState(collapsed);

			// Update cookie for fast reload
			setCookieValue(
				SIDEBAR_COOKIE_NAME,
				collapsed ? "false" : "true",
				60 * 60 * 24 * 7,
			);

			// Track pending save
			pendingSave.current = collapsed;

			// Clear existing timeout
			if (saveTimeout.current) {
				clearTimeout(saveTimeout.current);
			}

			// Debounce save to server (300ms)
			saveTimeout.current = setTimeout(() => {
				if (pendingSave.current !== null) {
					saveToServer(pendingSave.current);
					pendingSave.current = null;
				}
			}, 300);
		},
		[saveToServer],
	);

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (saveTimeout.current) {
				clearTimeout(saveTimeout.current);
				// Save pending state immediately on unmount
				if (pendingSave.current !== null) {
					saveSidebarCollapsed(pendingSave.current).catch(() => {
						// Ignore errors on unmount
					});
				}
			}
		};
	}, []);

	return {
		isCollapsed,
		isLoading,
		setCollapsed,
	};
}
