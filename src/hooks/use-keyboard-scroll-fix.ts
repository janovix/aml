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

			// Use a timeout to let the keyboard open first
			// The keyboard animation takes about 300ms on iOS
			setTimeout(() => {
				if (document.activeElement === target) {
					scrollElementIntoView(target);
				}
			}, 350);
		};

		const handleVisualViewportResize = (): void => {
			// When visualViewport resizes (keyboard opening/closing),
			// re-scroll the focused element into view
			if (
				lastFocusedElement.current &&
				document.activeElement === lastFocusedElement.current
			) {
				scrollElementIntoView(lastFocusedElement.current);
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
	const elementTop = rect.top - viewportOffsetTop;
	const elementBottom = rect.bottom - viewportOffsetTop;

	// Add some padding from the top of the viewport
	const topPadding = 20;

	// Check if element is visible in the visual viewport
	const isAboveViewport = elementTop < topPadding;
	const isBelowViewport = elementBottom > viewportHeight - 20;

	if (isAboveViewport || isBelowViewport) {
		// Calculate how much we need to scroll
		// Position the element in the upper third of the visible area
		const targetPosition = viewportHeight * 0.3;
		const scrollAmount = elementTop - targetPosition;

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
