"use client";

import { useEffect, useState } from "react";

export interface ViewportDimensions {
	height: number;
	offsetTop: number;
}

/**
 * Hook to get the current viewport dimensions, accounting for iOS Safari's dynamic viewport.
 * Uses visualViewport API when available, falls back to window.innerHeight.
 *
 * @returns Object containing height and offsetTop in pixels
 */
export function useViewportHeight(): ViewportDimensions {
	const [dimensions, setDimensions] = useState<ViewportDimensions>(() => {
		if (typeof window === "undefined") {
			return { height: 0, offsetTop: 0 };
		}

		// Use visualViewport if available (iOS Safari, modern browsers)
		if (window.visualViewport) {
			return {
				height: window.visualViewport.height,
				offsetTop: window.visualViewport.offsetTop,
			};
		}

		// Fallback to window.innerHeight
		return { height: window.innerHeight, offsetTop: 0 };
	});

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		const updateDimensions = () => {
			if (window.visualViewport) {
				setDimensions({
					height: window.visualViewport.height,
					offsetTop: window.visualViewport.offsetTop,
				});
			} else {
				setDimensions({ height: window.innerHeight, offsetTop: 0 });
			}
		};

		// Use visualViewport events if available
		if (window.visualViewport) {
			window.visualViewport.addEventListener("resize", updateDimensions);
			window.visualViewport.addEventListener("scroll", updateDimensions);

			// Also listen to orientation changes
			window.addEventListener("orientationchange", updateDimensions);

			return () => {
				window.visualViewport?.removeEventListener("resize", updateDimensions);
				window.visualViewport?.removeEventListener("scroll", updateDimensions);
				window.removeEventListener("orientationchange", updateDimensions);
			};
		}

		// Fallback for browsers without visualViewport
		window.addEventListener("resize", updateDimensions);
		window.addEventListener("orientationchange", updateDimensions);

		return () => {
			window.removeEventListener("resize", updateDimensions);
			window.removeEventListener("orientationchange", updateDimensions);
		};
	}, []);

	return dimensions;
}
