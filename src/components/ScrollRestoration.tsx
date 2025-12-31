"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const SCROLL_STORAGE_KEY = "scroll-positions";

/**
 * Get the scroll container (main content area)
 * Falls back to window if not found
 */
function getScrollContainer(): Element | Window {
	// The main content area is the scrollable container
	const main = document.querySelector("main.overflow-y-auto");
	return main || window;
}

/**
 * Get current scroll position
 */
function getScrollPosition(container: Element | Window): number {
	if (container instanceof Window) {
		return container.scrollY;
	}
	return container.scrollTop;
}

/**
 * Set scroll position
 */
function setScrollPosition(container: Element | Window, position: number) {
	if (container instanceof Window) {
		container.scrollTo(0, position);
	} else {
		container.scrollTop = position;
	}
}

/**
 * Load saved scroll positions from sessionStorage
 */
function loadScrollPositions(): Record<string, number> {
	try {
		const saved = sessionStorage.getItem(SCROLL_STORAGE_KEY);
		return saved ? JSON.parse(saved) : {};
	} catch {
		return {};
	}
}

/**
 * Save scroll positions to sessionStorage
 */
function saveScrollPositions(positions: Record<string, number>) {
	try {
		// Keep only the last 50 entries to prevent storage bloat
		const entries = Object.entries(positions);
		if (entries.length > 50) {
			const trimmed = Object.fromEntries(entries.slice(-50));
			sessionStorage.setItem(SCROLL_STORAGE_KEY, JSON.stringify(trimmed));
		} else {
			sessionStorage.setItem(SCROLL_STORAGE_KEY, JSON.stringify(positions));
		}
	} catch {
		// Ignore storage errors
	}
}

/**
 * ScrollRestoration Component
 *
 * Handles scroll behavior for navigation:
 * 1. Scrolls to top when navigating to a new page (push navigation)
 * 2. Restores scroll position when using browser back/forward buttons
 *
 * Uses sessionStorage to persist scroll positions across page loads.
 */
export function ScrollRestoration() {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const previousPathRef = useRef<string | null>(null);
	const isPopStateRef = useRef(false);
	const scrollPositionsRef = useRef<Record<string, number>>({});

	// Load scroll positions on mount
	useEffect(() => {
		scrollPositionsRef.current = loadScrollPositions();
	}, []);

	// Listen for popstate (back/forward navigation)
	useEffect(() => {
		const handlePopState = () => {
			isPopStateRef.current = true;
		};

		window.addEventListener("popstate", handlePopState);
		return () => window.removeEventListener("popstate", handlePopState);
	}, []);

	// Handle scroll on pathname/search change
	useEffect(() => {
		// Create a unique key for the current URL (pathname + search params)
		const currentKey =
			pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");
		const previousPath = previousPathRef.current;

		// Skip on initial mount
		if (previousPath === null) {
			previousPathRef.current = currentKey;
			return;
		}

		// If same path, do nothing (e.g., filter changes should NOT scroll)
		// But we want to scroll to top when navigating to a NEW pathname
		const previousPathname = previousPath.split("?")[0];
		const currentPathname = pathname;

		const container = getScrollContainer();

		if (isPopStateRef.current) {
			// Back/forward navigation - restore scroll position
			const savedPosition = scrollPositionsRef.current[currentKey];
			if (savedPosition !== undefined) {
				// Use requestAnimationFrame to ensure the DOM is ready
				requestAnimationFrame(() => {
					setScrollPosition(container, savedPosition);
				});
			}
			isPopStateRef.current = false;
		} else if (previousPathname !== currentPathname) {
			// New navigation (different pathname) - save current position and scroll to top
			scrollPositionsRef.current[previousPath] = getScrollPosition(container);
			saveScrollPositions(scrollPositionsRef.current);

			// Scroll to top
			requestAnimationFrame(() => {
				setScrollPosition(container, 0);
			});
		}
		// If only search params changed (same pathname), don't scroll

		previousPathRef.current = currentKey;
	}, [pathname, searchParams]);

	// Save scroll position before unload
	useEffect(() => {
		const handleBeforeUnload = () => {
			const container = getScrollContainer();
			const currentKey =
				pathname +
				(searchParams.toString() ? `?${searchParams.toString()}` : "");
			scrollPositionsRef.current[currentKey] = getScrollPosition(container);
			saveScrollPositions(scrollPositionsRef.current);
		};

		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => window.removeEventListener("beforeunload", handleBeforeUnload);
	}, [pathname, searchParams]);

	return null; // This component doesn't render anything
}
