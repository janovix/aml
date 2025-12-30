"use client";

import { useEffect, useState } from "react";

/**
 * Hook to get the current viewport height, accounting for iOS Safari's dynamic viewport.
 * Uses visualViewport API when available, falls back to window.innerHeight.
 *
 * @returns The current viewport height in pixels
 */
export function useViewportHeight(): number {
	const [height, setHeight] = useState(() => {
		if (typeof window === "undefined") {
			return 0;
		}

		// Use visualViewport if available (iOS Safari, modern browsers)
		if (window.visualViewport) {
			return window.visualViewport.height;
		}

		// Fallback to window.innerHeight
		return window.innerHeight;
	});

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		const updateHeight = () => {
			if (window.visualViewport) {
				setHeight(window.visualViewport.height);
			} else {
				setHeight(window.innerHeight);
			}
		};

		// Use visualViewport events if available
		if (window.visualViewport) {
			window.visualViewport.addEventListener("resize", updateHeight);
			window.visualViewport.addEventListener("scroll", updateHeight);

			// Also listen to orientation changes
			window.addEventListener("orientationchange", updateHeight);

			return () => {
				window.visualViewport?.removeEventListener("resize", updateHeight);
				window.visualViewport?.removeEventListener("scroll", updateHeight);
				window.removeEventListener("orientationchange", updateHeight);
			};
		}

		// Fallback for browsers without visualViewport
		window.addEventListener("resize", updateHeight);
		window.addEventListener("orientationchange", updateHeight);

		return () => {
			window.removeEventListener("resize", updateHeight);
			window.removeEventListener("orientationchange", updateHeight);
		};
	}, []);

	return height;
}
