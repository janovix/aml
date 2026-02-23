/**
 * PDF Processing Library
 * Exports PDF loading and rasterization utilities
 */

// Types
export type { PDFConfig, PDFRasterResult } from "./types";
export { DEFAULT_PDF_CONFIG } from "./types";

// Loader
export { loadPdfJs, isPdfJsLoaded, getPdfJsInstance } from "./loader";

// Rasterizer
export {
	rasterizePDF,
	isPDFFile,
	isImageFile,
	getFileType,
} from "./rasterizer";
