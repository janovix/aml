"use client";

import { useEffect, useRef } from "react";
import { useViewportHeight } from "@/hooks/use-viewport-height";
import { useKeyboardScrollFix } from "@/hooks/use-keyboard-scroll-fix";

/**
 * Provider component that sets a CSS custom property --viewport-height
 * based on the actual viewport height, accounting for iOS Safari's dynamic viewport.
 *
 * This fixes iOS Safari issues where 100vh doesn't account for the
 * browser chrome (address bar/toolbar) that hides/shows on scroll.
 *
 * Additionally, it handles iOS keyboard issues by:
 * - Not shrinking the layout when keyboard opens (detects significant height reduction + focused input)
 * - Scrolling focused inputs into view when keyboard appears
 */
export function ViewportHeightProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const viewportHeight = useViewportHeight();
	const stableHeightRef = useRef<number | null>(null);
	const lastUpdateTimeRef = useRef<number>(0);

	// Apply keyboard scroll fix for iOS
	useKeyboardScrollFix();

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		const now = Date.now();

		// Determine if an input element is currently focused (keyboard likely open)
		const activeElement = document.activeElement;
		const isInputFocused =
			activeElement instanceof HTMLInputElement ||
			activeElement instanceof HTMLTextAreaElement ||
			activeElement instanceof HTMLSelectElement ||
			activeElement?.getAttribute("contenteditable") === "true";

		// Calculate height reduction percentage
		const previousHeight = stableHeightRef.current || window.innerHeight;
		const heightReduction =
			((previousHeight - viewportHeight) / previousHeight) * 100;

		// If height reduced significantly (>20%) and an input is focused,
		// this is likely the keyboard opening - don't update the CSS variable
		const isKeyboardOpening = heightReduction > 20 && isInputFocused;

		// If height increased significantly or no input is focused,
		// the keyboard is likely closing - update normally
		const isKeyboardClosing =
			heightReduction < -10 || (!isInputFocused && stableHeightRef.current);

		// Debounce rapid updates (address bar animation is ~100ms)
		const shouldDebounce = now - lastUpdateTimeRef.current < 100;

		if (isKeyboardOpening && !shouldDebounce) {
			// Keyboard opening - don't shrink the layout
			// Keep the previous stable height
			return;
		}

		// Update the stable height reference
		if (
			!isInputFocused ||
			isKeyboardClosing ||
			stableHeightRef.current === null
		) {
			stableHeightRef.current = viewportHeight;
			lastUpdateTimeRef.current = now;
		}

		const heightToUse = stableHeightRef.current || viewportHeight;

		// Set CSS custom property on document root
		document.documentElement.style.setProperty(
			"--viewport-height",
			`${heightToUse}px`,
		);

		// Also set fallback for browsers that support dvh but not visualViewport
		if (window.innerHeight) {
			document.documentElement.style.setProperty(
				"--viewport-height-fallback",
				`${window.innerHeight}px`,
			);
		}
	}, [viewportHeight]);

	return <>{children}</>;
}
