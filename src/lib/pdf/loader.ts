/**
 * PDF.js Loader Utility
 * Loads PDF.js library via script tags (same pattern as OpenCV.js)
 */

// Use unpkg CDN which has better CORS support
const PDFJS_VERSION = "4.0.379";
const PDFJS_URL = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.min.mjs`;
const PDFJS_WORKER_URL = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;

// Global state
let loadPromise: Promise<any> | null = null;

/**
 * Check if pdfjsLib is ready
 */
function isPdfJsReady(): boolean {
	if (typeof window === "undefined") return false;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const pdfjsLib = (window as any).pdfjsLib;
	return pdfjsLib && typeof pdfjsLib.getDocument === "function";
}

/**
 * Load a script and return a promise
 */
function loadScript(
	id: string,
	src: string,
	type: string = "text/javascript",
): Promise<void> {
	return new Promise((resolve, reject) => {
		// Check if already exists
		if (document.getElementById(id)) {
			resolve();
			return;
		}

		const script = document.createElement("script");
		script.id = id;
		script.src = src;
		script.type = type;
		script.async = true;

		script.onload = () => resolve();
		script.onerror = () => reject(new Error(`Failed to load ${src}`));

		document.body.appendChild(script);
	});
}

/**
 * Wait for a condition to be true
 */
async function waitFor(
	condition: () => boolean,
	timeoutMs: number = 30000,
	intervalMs: number = 100,
): Promise<void> {
	const startTime = Date.now();

	while (Date.now() - startTime < timeoutMs) {
		if (condition()) {
			return;
		}
		await new Promise((resolve) => setTimeout(resolve, intervalMs));
	}

	throw new Error("Timeout waiting for PDF.js to load");
}

/**
 * Load PDF.js library
 * Uses script tags to load from CDN (same pattern as OpenCV)
 */
export async function loadPdfJs(): Promise<any> {
	// Already loaded
	if (isPdfJsReady()) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return (window as any).pdfjsLib;
	}

	// Already loading - wait for that promise
	if (loadPromise) {
		return loadPromise;
	}

	// Ensure we're in browser
	if (typeof window === "undefined") {
		throw new Error("PDF.js can only be loaded in browser environment");
	}

	loadPromise = (async () => {
		try {
			// Step 1: Load PDF.js script
			console.log("[PDF.js] Loading script from unpkg...");
			await loadScript("pdfjs-lib", PDFJS_URL, "module");
			console.log("[PDF.js] Script loaded");

			// Step 2: Wait for pdfjsLib to be ready
			console.log("[PDF.js] Waiting for library to initialize...");
			await waitFor(isPdfJsReady, 10000);
			console.log("[PDF.js] Ready!");

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const pdfjsLib = (window as any).pdfjsLib;

			// Step 3: Configure worker
			if (pdfjsLib.GlobalWorkerOptions) {
				pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
				console.log("[PDF.js] Worker configured");
			}

			return pdfjsLib;
		} catch (err) {
			const errorMsg =
				err instanceof Error ? err.message : "Failed to load PDF.js";
			console.error("[PDF.js] Error:", errorMsg);
			loadPromise = null; // Reset so it can be retried
			throw new Error(
				"No se pudo cargar la librería PDF.js. Por favor, intenta con una imagen JPG o PNG.",
			);
		}
	})();

	return loadPromise;
}

/**
 * Check if PDF.js is already loaded
 */
export function isPdfJsLoaded(): boolean {
	return isPdfJsReady();
}

/**
 * Get loaded PDF.js instance (returns null if not loaded)
 */
export function getPdfJsInstance(): any {
	if (!isPdfJsReady()) return null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (window as any).pdfjsLib;
}
