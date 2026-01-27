declare module "jscanify" {
	interface CornerPoint {
		x: number;
		y: number;
	}

	interface CornerPoints {
		topLeftCorner: CornerPoint;
		topRightCorner: CornerPoint;
		bottomLeftCorner: CornerPoint;
		bottomRightCorner: CornerPoint;
	}

	class Scanner {
		constructor();

		/**
		 * Get corner points of a document in an image
		 * @param canvas - Source canvas or image element
		 * @returns Corner points of detected document or null if not found
		 */
		getCornerPoints(
			canvas: HTMLCanvasElement | HTMLImageElement,
		): CornerPoints | null;

		/**
		 * Extract and perspective-correct document from image
		 * @param canvas - Source canvas or image element
		 * @param width - Output width
		 * @param height - Output height
		 * @param corners - Corner points for extraction
		 * @returns Canvas with extracted document
		 */
		extractPaper(
			canvas: HTMLCanvasElement | HTMLImageElement,
			width: number,
			height: number,
			corners?: CornerPoints,
		): HTMLCanvasElement;

		/**
		 * Highlight detected document in image
		 * @param canvas - Source canvas or image element
		 * @param options - Highlight options
		 * @returns Canvas with highlighted document
		 */
		highlightPaper(
			canvas: HTMLCanvasElement | HTMLImageElement,
			options?: { color?: string; thickness?: number },
		): HTMLCanvasElement;
	}

	export = Scanner;
}
