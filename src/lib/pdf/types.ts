/**
 * PDF Processing Types
 */

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
