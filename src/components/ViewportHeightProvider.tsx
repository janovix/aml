"use client";

import { useEffect } from "react";
import { useViewportHeight } from "@/hooks/use-viewport-height";

/**
 * Provider component that sets CSS custom properties for viewport dimensions
 * based on the actual viewport, accounting for iOS Safari's dynamic viewport
 * and keyboard behavior.
 *
 * This fixes iOS Safari issues where:
 * - 100vh doesn't account for the browser chrome (address bar/toolbar)
 * - Keyboard opening causes extra space above the keyboard
 *
 * Sets:
 * - --viewport-height: Current visual viewport height
 * - --viewport-offset-top: Offset from top when keyboard is open
 * - --keyboard-open: "1" when keyboard is detected, "0" otherwise
 */
export function ViewportHeightProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const { height, offsetTop } = useViewportHeight();

	useEffect(() => {
		const root = document.documentElement;

		// Set CSS custom property for viewport height
		root.style.setProperty("--viewport-height", `${height}px`);

		// Set offset top (important for iOS keyboard positioning)
		root.style.setProperty("--viewport-offset-top", `${offsetTop}px`);

		// Detect if keyboard is likely open (offset > 0 indicates scrolled visual viewport)
		const keyboardOpen = offsetTop > 0 ? "1" : "0";
		root.style.setProperty("--keyboard-open", keyboardOpen);

		// Also set fallback for browsers that support dvh but not visualViewport
		if (typeof window !== "undefined" && window.innerHeight) {
			root.style.setProperty(
				"--viewport-height-fallback",
				`${window.innerHeight}px`,
			);
		}
	}, [height, offsetTop]);

	return <>{children}</>;
}
