/**
 * Browser-compatible shim for the 'canvas' npm package
 * Used by Turbopack/Webpack to provide browser equivalents for Node.js canvas functions
 *
 * jscanify uses the 'canvas' package's createCanvas function for perspective transforms.
 * In the browser, we use native HTMLCanvasElement instead.
 */

/**
 * Creates a canvas element (browser equivalent of node-canvas's createCanvas)
 */
export function createCanvas(width: number, height: number): HTMLCanvasElement {
	if (typeof document === "undefined") {
		throw new Error("createCanvas can only be used in browser environment");
	}
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	return canvas;
}

/**
 * Loads an image (browser equivalent of node-canvas's loadImage)
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
	if (typeof Image === "undefined") {
		throw new Error("loadImage can only be used in browser environment");
	}
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = (err) => reject(err);
		img.src = src;
	});
}

// Default export for compatibility
export default {
	createCanvas,
	loadImage,
};
