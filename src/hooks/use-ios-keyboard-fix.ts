"use client";

import { useEffect } from "react";

/**
 * Hook to fix iOS Safari keyboard issues where extra space appears above the keyboard.
 *
 * The issue happens because iOS Safari scrolls the page when an input is focused,
 * but doesn't properly account for the keyboard height, leaving a gap.
 *
 * This hook:
 * 1. Detects iOS Safari
 * 2. Listens for focus events on inputs
 * 3. After the keyboard opens, scrolls the input into view properly
 * 4. Adjusts the scroll position to eliminate the gap
 */
export function useIOSKeyboardFix(): void {
	useEffect(() => {
		// Only run on client
		if (typeof window === "undefined") {
			return;
		}

		// Detect iOS Safari
		const isIOS =
			/iPad|iPhone|iPod/.test(navigator.userAgent) ||
			(navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

		if (!isIOS) {
			return;
		}

		// Get the scrollable main content container
		const getScrollContainer = (): HTMLElement | null => {
			return document.querySelector("main");
		};

		const handleFocus = (event: FocusEvent): void => {
			const target = event.target as HTMLElement;

			// Only handle input elements
			if (
				!target ||
				(target.tagName !== "INPUT" &&
					target.tagName !== "TEXTAREA" &&
					target.tagName !== "SELECT")
			) {
				return;
			}

			// Wait for the keyboard to open
			setTimeout(() => {
				if (!window.visualViewport) {
					return;
				}

				const scrollContainer = getScrollContainer();
				if (!scrollContainer) {
					return;
				}

				// Get the visual viewport dimensions
				const viewportHeight = window.visualViewport.height;
				const viewportOffsetTop = window.visualViewport.offsetTop;

				// Get the target's position relative to the viewport
				const targetRect = target.getBoundingClientRect();

				// Calculate where we want the input to be (centered in visible area, or at least visible)
				const desiredPosition = viewportHeight * 0.3; // Place input at 30% from top of visible area

				// Current position of the input from the top of the visible viewport
				const currentPosition = targetRect.top - viewportOffsetTop;

				// Calculate how much we need to scroll
				const scrollAdjustment = currentPosition - desiredPosition;

				if (scrollAdjustment > 0) {
					// Scroll the container to bring the input into better view
					scrollContainer.scrollBy({
						top: scrollAdjustment,
						behavior: "smooth",
					});
				}

				// Also ensure the document doesn't have extra scroll space
				// by scrolling the window if needed
				if (viewportOffsetTop > 0) {
					window.scrollTo({
						top: 0,
						behavior: "instant",
					});
				}
			}, 300); // Wait for keyboard animation
		};

		const handleBlur = (): void => {
			// When input is blurred, reset any scroll adjustments
			setTimeout(() => {
				if (window.visualViewport && window.visualViewport.offsetTop > 0) {
					window.scrollTo({
						top: 0,
						behavior: "smooth",
					});
				}
			}, 100);
		};

		// Use capture phase to catch all focus events
		document.addEventListener("focusin", handleFocus, { capture: true });
		document.addEventListener("focusout", handleBlur, { capture: true });

		return () => {
			document.removeEventListener("focusin", handleFocus, { capture: true });
			document.removeEventListener("focusout", handleBlur, { capture: true });
		};
	}, []);
}
