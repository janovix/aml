/**
 * PDF Rasterization Utility
 * Converts PDF pages to canvas images for document scanning
 */

import type { PDFConfig, PDFRasterResult } from "./types";
import { DEFAULT_PDF_CONFIG } from "./types";
import { loadPdfJs } from "./pdf-loader";

// PDF.js types
interface PDFDocumentProxy {
	numPages: number;
	getPage(pageNumber: number): Promise<PDFPageProxy>;
}

interface PDFPageProxy {
	getViewport(options: { scale: number }): PDFPageViewport;
	render(options: {
		canvasContext: CanvasRenderingContext2D;
		viewport: PDFPageViewport;
	}): { promise: Promise<void> };
}

interface PDFPageViewport {
	width: number;
	height: number;
}

/**
 * Rasterize PDF pages to canvas elements
 */
export async function rasterizePDF(
	file: File,
	config: Partial<PDFConfig> = {},
): Promise<PDFRasterResult> {
	const mergedConfig: PDFConfig = {
		...DEFAULT_PDF_CONFIG,
		...config,
	};

	try {
		// Validate file
		if (!file || !(file instanceof File)) {
			throw new Error("Archivo inválido");
		}

		// Validate file is actually a PDF
		if (!isPDFFile(file)) {
			throw new Error("El archivo no es un PDF válido");
		}

		// Load PDF.js library
		const pdfjs = await loadPdfJs();

		// Validate pdfjs loaded correctly
		if (!pdfjs || typeof pdfjs.getDocument !== "function") {
			throw new Error("Error al cargar la librería PDF.js");
		}

		// Read file as ArrayBuffer
		const arrayBuffer = await file.arrayBuffer();

		// Validate arrayBuffer
		if (!arrayBuffer || arrayBuffer.byteLength === 0) {
			throw new Error("El archivo PDF está vacío o corrupto");
		}

		// Load PDF document with error handling
		const loadingTask = pdfjs.getDocument({ data: arrayBuffer });

		// Validate loading task
		if (!loadingTask || typeof loadingTask.promise !== "object") {
			throw new Error("Error al inicializar la carga del PDF");
		}

		const pdf: PDFDocumentProxy = await loadingTask.promise;

		// Validate PDF document
		if (!pdf || typeof pdf.numPages !== "number") {
			throw new Error("El documento PDF no se cargó correctamente");
		}

		const totalPages = pdf.numPages;

		if (totalPages === 0) {
			throw new Error("El PDF no contiene páginas");
		}

		const pagesToProcess = Math.min(totalPages, mergedConfig.maxPages);
		const pages: HTMLCanvasElement[] = [];

		// Process each page
		for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
			try {
				const page = await pdf.getPage(pageNum);

				// Validate page object
				if (!page || typeof page.getViewport !== "function") {
					console.warn(`Página ${pageNum} no válida, saltando...`);
					continue;
				}

				// Calculate scale based on DPI and max dimension
				const defaultViewport = page.getViewport({ scale: 1 });

				// Validate viewport
				if (
					!defaultViewport ||
					typeof defaultViewport.width !== "number" ||
					typeof defaultViewport.height !== "number"
				) {
					console.warn(`Viewport de página ${pageNum} no válido, saltando...`);
					continue;
				}

				const dpiScale = mergedConfig.renderDPI / 72; // PDF default is 72 DPI

				// Calculate scale to fit within max dimension
				const maxDimScale = Math.min(
					mergedConfig.maxDimension / defaultViewport.width,
					mergedConfig.maxDimension / defaultViewport.height,
				);

				// Use the smaller of DPI scale and max dimension scale
				const scale = Math.min(dpiScale, maxDimScale);
				const viewport = page.getViewport({ scale });

				// Validate scaled viewport
				if (
					!viewport ||
					typeof viewport.width !== "number" ||
					typeof viewport.height !== "number"
				) {
					console.warn(
						`Viewport escalado de página ${pageNum} no válido, saltando...`,
					);
					continue;
				}

				// Create canvas for this page
				const canvas = document.createElement("canvas");
				canvas.width = Math.floor(viewport.width);
				canvas.height = Math.floor(viewport.height);

				const ctx = canvas.getContext("2d", { willReadFrequently: true });
				if (!ctx) {
					console.warn(
						`No se pudo obtener contexto de canvas para página ${pageNum}, saltando...`,
					);
					continue;
				}

				// Render page to canvas with timeout protection
				const renderTask = page.render({
					canvasContext: ctx,
					viewport,
				});

				// Validate render task
				if (!renderTask || typeof renderTask.promise !== "object") {
					console.warn(
						`Tarea de renderizado de página ${pageNum} no válida, saltando...`,
					);
					continue;
				}

				await renderTask.promise;

				pages.push(canvas);
			} catch (pageError) {
				console.error(`Error procesando página ${pageNum}:`, pageError);
				// Continue processing other pages
				continue;
			}
		}

		// Check if we got at least one page
		if (pages.length === 0) {
			throw new Error("No se pudo procesar ninguna página del PDF");
		}

		return {
			success: true,
			pages,
			totalPages,
			processedPages: pages.length,
			message:
				totalPages > pagesToProcess
					? `Se procesaron ${pagesToProcess} de ${totalPages} páginas (límite máximo)`
					: pages.length < pagesToProcess
						? `Se procesaron ${pages.length} de ${pagesToProcess} páginas solicitadas`
						: undefined,
		};
	} catch (error) {
		console.error("Error rasterizing PDF:", error);
		return {
			success: false,
			pages: [],
			totalPages: 0,
			processedPages: 0,
			message: error instanceof Error ? error.message : "Error al procesar PDF",
		};
	}
}

/**
 * Check if a file is a PDF
 */
export function isPDFFile(file: File): boolean {
	return (
		file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
	);
}

/**
 * Check if a file is an image
 */
export function isImageFile(file: File): boolean {
	return file.type.startsWith("image/");
}

/**
 * Get file type category
 */
export function getFileType(file: File): "pdf" | "image" | "unknown" {
	if (isPDFFile(file)) return "pdf";
	if (isImageFile(file)) return "image";
	return "unknown";
}
