/**
 * Document Scanner Types
 * Types for the jscanify-based document scanning pipeline
 */

/** A point in 2D space */
export interface Point {
	x: number;
	y: number;
}

/** Corner points of a detected document */
export interface CornerPoints {
	topLeft: Point;
	topRight: Point;
	bottomLeft: Point;
	bottomRight: Point;
}

/** Scanner processing stages */
export type ScannerStage =
	| "idle" // Initial state
	| "detecting" // Auto-detecting corners
	| "adjusting" // User adjusting corners
	| "highlighting" // Showing highlight preview
	| "extracting" // Extracting document
	| "validating" // OCR validation
	| "waiting_for_back" // INE: Waiting for back side upload
	| "complete"; // Ready to upload

/** Result from corner detection */
export interface DetectionResult {
	success: boolean;
	corners: CornerPoints | null;
	confidence: number; // 0-1, how confident the detection is
	message?: string;
}

/** Result from document extraction */
export interface ExtractionResult {
	success: boolean;
	canvas: HTMLCanvasElement | null;
	blob: Blob | null;
	width: number;
	height: number;
	message?: string;
}

/** Quality validation result */
export interface QualityResult {
	isValid: boolean;
	issues: string[];
	resolution: { width: number; height: number };
	documentAreaRatio: number; // Ratio of document area to total image area
}

/** Configuration for the scanner */
export interface ScannerConfig {
	/** Minimum resolution for the extracted document */
	minResolution: { width: number; height: number };
	/** Minimum ratio of document area to image area */
	minDocumentAreaRatio: number;
	/** Color for corner markers */
	cornerMarkerColor: string;
	/** Color for highlight overlay */
	highlightColor: string;
	/** Size of corner drag handles */
	cornerHandleSize: number;
}

/** Default scanner configuration */
export const DEFAULT_SCANNER_CONFIG: ScannerConfig = {
	minResolution: { width: 400, height: 250 },
	minDocumentAreaRatio: 0.1,
	cornerMarkerColor: "#00d4ff",
	highlightColor: "rgba(255, 200, 0, 0.3)",
	cornerHandleSize: 20,
};

/** PDF rasterization configuration */
export interface PDFConfig {
	/** Maximum number of pages to process */
	maxPages: number;
	/** DPI for rendering PDF pages */
	renderDPI: number;
	/** Maximum dimension (width or height) in pixels */
	maxDimension: number;
}

/** Default PDF configuration */
export const DEFAULT_PDF_CONFIG: PDFConfig = {
	maxPages: 10,
	renderDPI: 150,
	maxDimension: 2000,
};

/** Result from PDF rasterization */
export interface PDFRasterResult {
	success: boolean;
	pages: HTMLCanvasElement[];
	totalPages: number;
	processedPages: number;
	message?: string;
}

/** Document page being processed in the scanner */
export interface DocumentPage {
	id: string;
	originalCanvas: HTMLCanvasElement;
	corners: CornerPoints | null;
	extractedCanvas: HTMLCanvasElement | null;
	extractedBlob: Blob | null;
	stage: ScannerStage;
	quality: QualityResult | null;
}

/** Scanner session state */
export interface ScannerSession {
	id: string;
	pages: DocumentPage[];
	currentPageIndex: number;
	sourceFile: File | null;
	sourceType: "image" | "pdf";
}
