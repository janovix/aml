"use client";

import { useEffect, useRef } from "react";

/**
 * Hook to handle iOS Safari keyboard issues.
 * When the keyboard opens, it scrolls the focused input into view
 * to prevent it from being hidden behind the keyboard.
 *
 * This is specifically designed for iOS Safari where:
 * - The visualViewport shrinks when the keyboard opens
 * - Inputs can get hidden behind the keyboard
 * - The browser's automatic scrolling doesn't always work correctly
 */
export function useKeyboardScrollFix(): void {
	const lastFocusedElement = useRef<
		HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null
	>(null);
	const keyboardOpenRef = useRef<boolean>(false);
	const initialViewportHeightRef = useRef<number | null>(null);

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		// Only apply the fix on iOS devices
		const isIOS =
			/iPad|iPhone|iPod/.test(navigator.userAgent) ||
			(navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

		if (!isIOS) {
			return;
		}

		// Store initial viewport height to detect keyboard
		initialViewportHeightRef.current = window.innerHeight;

		const handleFocus = (event: FocusEvent): void => {
			const target = event.target as Element;

			// Only handle input elements
			if (
				!(target instanceof HTMLInputElement) &&
				!(target instanceof HTMLTextAreaElement) &&
				!(target instanceof HTMLSelectElement)
			) {
				return;
			}

			lastFocusedElement.current = target;

			// If keyboard is already open, use shorter delay (just for layout settle)
			// Otherwise wait for keyboard animation (~300ms on iOS)
			const delay = keyboardOpenRef.current ? 50 : 350;

			setTimeout(() => {
				if (document.activeElement === target) {
					scrollElementIntoView(target);
				}
			}, delay);
		};

		const handleVisualViewportResize = (): void => {
			if (!window.visualViewport || !initialViewportHeightRef.current) {
				return;
			}

			// Detect if keyboard is open based on viewport height reduction
			const heightReduction =
				initialViewportHeightRef.current - window.visualViewport.height;
			const keyboardThreshold = 150; // Keyboard is typically 250-350px on iPhone

			keyboardOpenRef.current = heightReduction > keyboardThreshold;

			// When visualViewport resizes (keyboard opening/closing),
			// re-scroll the focused element into view
			if (
				lastFocusedElement.current &&
				document.activeElement === lastFocusedElement.current
			) {
				// Small delay to let the viewport settle
				setTimeout(() => {
					if (
						lastFocusedElement.current &&
						document.activeElement === lastFocusedElement.current
					) {
						scrollElementIntoView(lastFocusedElement.current);
					}
				}, 50);
			}
		};

		const handleBlur = (): void => {
			lastFocusedElement.current = null;
		};

		// Add event listeners
		document.addEventListener("focusin", handleFocus, { passive: true });
		document.addEventListener("focusout", handleBlur, { passive: true });

		if (window.visualViewport) {
			window.visualViewport.addEventListener(
				"resize",
				handleVisualViewportResize,
				{ passive: true },
			);
		}

		return () => {
			document.removeEventListener("focusin", handleFocus);
			document.removeEventListener("focusout", handleBlur);

			if (window.visualViewport) {
				window.visualViewport.removeEventListener(
					"resize",
					handleVisualViewportResize,
				);
			}
		};
	}, []);
}

/**
 * Scrolls an element into view, accounting for iOS keyboard.
 * Uses visualViewport to determine the actual visible area.
 */
function scrollElementIntoView(element: Element): void {
	if (!window.visualViewport) {
		// Fallback for browsers without visualViewport
		element.scrollIntoView({ behavior: "smooth", block: "center" });
		return;
	}

	const rect = element.getBoundingClientRect();
	const viewportHeight = window.visualViewport.height;
	const viewportOffsetTop = window.visualViewport.offsetTop;

	// Calculate where the element is relative to the visual viewport
	// The visual viewport is the area visible above the keyboard
	const elementTopInViewport = rect.top - viewportOffsetTop;
	const elementBottomInViewport = rect.bottom - viewportOffsetTop;

	// Padding from edges of the visible viewport
	const topPadding = 60; // Space from top of visible area
	const bottomPadding = 80; // Extra space from bottom (just above keyboard)

	// The safe zone is the area where the element should be visible
	const safeZoneTop = topPadding;
	const safeZoneBottom = viewportHeight - bottomPadding;

	// Check if element is outside the safe zone
	const isAboveSafeZone = elementTopInViewport < safeZoneTop;
	const isBelowSafeZone = elementBottomInViewport > safeZoneBottom;

	if (isAboveSafeZone || isBelowSafeZone) {
		// Calculate target position - aim for the element to be in upper-middle of safe zone
		// This ensures it's well above the keyboard with room for the input label
		const targetPositionFromTop = Math.min(
			safeZoneTop + 20, // Near the top of safe zone
			viewportHeight * 0.25, // Or 25% from top, whichever is smaller
		);

		const scrollAmount = elementTopInViewport - targetPositionFromTop;

		// Find the scrollable container
		const scrollContainer = findScrollableParent(element);

		if (scrollContainer) {
			scrollContainer.scrollBy({
				top: scrollAmount,
				behavior: "smooth",
			});
		} else {
			// Fallback to window scroll
			window.scrollBy({
				top: scrollAmount,
				behavior: "smooth",
			});
		}
	}
}

/**
 * Finds the nearest scrollable parent element.
 */
function findScrollableParent(element: Element): Element | null {
	let parent = element.parentElement;

	while (parent) {
		const style = window.getComputedStyle(parent);
		const overflowY = style.overflowY;

		if (
			(overflowY === "auto" || overflowY === "scroll") &&
			parent.scrollHeight > parent.clientHeight
		) {
			return parent;
		}

		parent = parent.parentElement;
	}

	return null;
}
