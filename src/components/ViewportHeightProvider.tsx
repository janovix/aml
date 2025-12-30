"use client";

import { useEffect } from "react";
import { useViewportHeight } from "@/hooks/use-viewport-height";

/**
 * Provider component that sets a CSS custom property --viewport-height
 * based on the actual viewport height, accounting for iOS Safari's dynamic viewport.
 *
 * This fixes iOS Safari issues where 100vh doesn't account for the
 * browser chrome (address bar/toolbar) that hides/shows on scroll.
 */
export function ViewportHeightProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const viewportHeight = useViewportHeight();

	useEffect(() => {
		// Set CSS custom property on document root
		document.documentElement.style.setProperty(
			"--viewport-height",
			`${viewportHeight}px`,
		);

		// Also set fallback for browsers that support dvh but not visualViewport
		if (typeof window !== "undefined" && window.innerHeight) {
			document.documentElement.style.setProperty(
				"--viewport-height-fallback",
				`${window.innerHeight}px`,
			);
		}
	}, [viewportHeight]);

	return <>{children}</>;
}
