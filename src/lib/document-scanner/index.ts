/**
 * Document Scanner Library
 * Wrapper around jscanify for document scanning functionality
 *
 * Both OpenCV.js and jscanify are loaded via script tags (not npm import)
 * to ensure jscanify can access the global cv object.
 *
 * Following react-scanify-demo approach:
 * https://github.com/ColonelParrot/react-scanify-demo
 */

import type {
	CornerPoints,
	DetectionResult,
	ExtractionResult,
	QualityResult,
	ScannerConfig,
} from "./types";
import { DEFAULT_SCANNER_CONFIG } from "./types";
import {
	loadOpenCVScript,
	isOpenCVReady,
	getJscanifyClass,
} from "./OpenCVProvider";

// Cached scanner instance
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let scannerInstance: any = null;

/**
 * Check if OpenCV is loaded and ready
 */
export function isOpenCVLoaded(): boolean {
	return isOpenCVReady();
}

/**
 * Get jscanify scanner instance
 * Loads OpenCV and jscanify if not already loaded
 */
async function getJscanify() {
	// Ensure we're in browser environment
	if (typeof window === "undefined") {
		throw new Error("jscanify can only be used in browser environment");
	}

	// Load OpenCV and jscanify if not ready
	if (!isOpenCVReady()) {
		await loadOpenCVScript();
	}

	if (scannerInstance) {
		return { scanner: scannerInstance };
	}

	// Get jscanify class from window (loaded via script tag)
	const JscanifyClass = getJscanifyClass();
	if (!JscanifyClass) {
		throw new Error("jscanify not loaded");
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	scannerInstance = new (JscanifyClass as any)();
	console.log("[DocumentScanner] Scanner instance created");

	return { scanner: scannerInstance };
}

/**
 * Load an image file into a canvas element
 */
export async function loadImageToCanvas(
	file: File,
): Promise<HTMLCanvasElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		const url = URL.createObjectURL(file);

		img.onload = () => {
			URL.revokeObjectURL(url);
			const canvas = document.createElement("canvas");
			canvas.width = img.naturalWidth;
			canvas.height = img.naturalHeight;
			const ctx = canvas.getContext("2d");
			if (!ctx) {
				reject(new Error("Could not get canvas context"));
				return;
			}
			ctx.drawImage(img, 0, 0);
			resolve(canvas);
		};

		img.onerror = () => {
			URL.revokeObjectURL(url);
			reject(new Error("Failed to load image"));
		};

		img.src = url;
	});
}

/**
 * Detect document corners in an image using jscanify
 */
export async function detectCorners(
	canvas: HTMLCanvasElement,
): Promise<DetectionResult> {
	try {
		const { scanner } = await getJscanify();

		// jscanify needs to find the paper contour first, then get corners
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const cv = (window as any).cv;
		const img = cv.imread(canvas);
		const contour = scanner.findPaperContour(img);

		if (!contour) {
			img.delete();
			return {
				success: false,
				corners: null,
				confidence: 0,
				message: "No document detected in image",
			};
		}

		// Get corner points from the contour
		const result = scanner.getCornerPoints(contour);

		// Clean up OpenCV objects
		img.delete();
		contour.delete();

		if (!result || !result.topLeftCorner) {
			return {
				success: false,
				corners: null,
				confidence: 0,
				message: "No document detected in image",
			};
		}

		// Convert jscanify format to our format
		const corners: CornerPoints = {
			topLeft: {
				x: result.topLeftCorner.x,
				y: result.topLeftCorner.y,
			},
			topRight: {
				x: result.topRightCorner.x,
				y: result.topRightCorner.y,
			},
			bottomLeft: {
				x: result.bottomLeftCorner.x,
				y: result.bottomLeftCorner.y,
			},
			bottomRight: {
				x: result.bottomRightCorner.x,
				y: result.bottomRightCorner.y,
			},
		};

		// Calculate confidence based on how well-formed the quadrilateral is
		const confidence = calculateConfidence(
			corners,
			canvas.width,
			canvas.height,
		);

		return {
			success: true,
			corners,
			confidence,
		};
	} catch (error) {
		console.error("Error detecting corners:", error);
		return {
			success: false,
			corners: null,
			confidence: 0,
			message: error instanceof Error ? error.message : "Detection failed",
		};
	}
}

/**
 * Calculate confidence score for detected corners
 */
function calculateConfidence(
	corners: CornerPoints,
	imageWidth: number,
	imageHeight: number,
): number {
	// Check if corners form a valid quadrilateral
	const area = calculateQuadrilateralArea(corners);
	const imageArea = imageWidth * imageHeight;
	const areaRatio = area / imageArea;

	// Ideal: document takes up 20-90% of the image
	let confidence = 1.0;

	if (areaRatio < 0.1) {
		confidence *= 0.5; // Too small
	} else if (areaRatio > 0.95) {
		confidence *= 0.7; // Too large (might be full image)
	}

	// Check for reasonable aspect ratio
	const width =
		(distance(corners.topLeft, corners.topRight) +
			distance(corners.bottomLeft, corners.bottomRight)) /
		2;
	const height =
		(distance(corners.topLeft, corners.bottomLeft) +
			distance(corners.topRight, corners.bottomRight)) /
		2;
	const aspectRatio = width / height;

	// Most documents are between 0.5 and 2.0 aspect ratio
	if (aspectRatio < 0.3 || aspectRatio > 3.0) {
		confidence *= 0.6;
	}

	return Math.max(0, Math.min(1, confidence));
}

/**
 * Calculate area of a quadrilateral using Shoelace formula
 */
function calculateQuadrilateralArea(corners: CornerPoints): number {
	const points = [
		corners.topLeft,
		corners.topRight,
		corners.bottomRight,
		corners.bottomLeft,
	];

	let area = 0;
	for (let i = 0; i < 4; i++) {
		const j = (i + 1) % 4;
		area += points[i].x * points[j].y;
		area -= points[j].x * points[i].y;
	}

	return Math.abs(area) / 2;
}

/**
 * Calculate distance between two points
 */
function distance(
	p1: { x: number; y: number },
	p2: { x: number; y: number },
): number {
	return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * Draw highlighted document area on a canvas
 * Creates an orange/yellow overlay ON the detected document area
 */
export function highlightDocument(
	sourceCanvas: HTMLCanvasElement,
	corners: CornerPoints,
	_highlightColor: string = "rgba(255, 165, 0, 0.4)",
): HTMLCanvasElement {
	const canvas = document.createElement("canvas");
	canvas.width = sourceCanvas.width;
	canvas.height = sourceCanvas.height;
	const ctx = canvas.getContext("2d");

	if (!ctx) {
		throw new Error("Could not get canvas context");
	}

	// Draw original image
	ctx.drawImage(sourceCanvas, 0, 0);

	// Draw semi-transparent orange/yellow fill ON the document area
	ctx.fillStyle = "rgba(255, 165, 0, 0.4)";
	ctx.beginPath();
	ctx.moveTo(corners.topLeft.x, corners.topLeft.y);
	ctx.lineTo(corners.topRight.x, corners.topRight.y);
	ctx.lineTo(corners.bottomRight.x, corners.bottomRight.y);
	ctx.lineTo(corners.bottomLeft.x, corners.bottomLeft.y);
	ctx.closePath();
	ctx.fill();

	// Draw a thick orange border around the document
	ctx.strokeStyle = "rgba(255, 165, 0, 1)";
	ctx.lineWidth = 4;
	ctx.beginPath();
	ctx.moveTo(corners.topLeft.x, corners.topLeft.y);
	ctx.lineTo(corners.topRight.x, corners.topRight.y);
	ctx.lineTo(corners.bottomRight.x, corners.bottomRight.y);
	ctx.lineTo(corners.bottomLeft.x, corners.bottomLeft.y);
	ctx.closePath();
	ctx.stroke();

	return canvas;
}

/**
 * Extract and perspective-correct the document from the image using jscanify
 */
export async function extractDocument(
	sourceCanvas: HTMLCanvasElement,
	corners: CornerPoints,
): Promise<ExtractionResult> {
	try {
		const { scanner } = await getJscanify();

		// Calculate output dimensions based on detected corners
		const width = Math.max(
			distance(corners.topLeft, corners.topRight),
			distance(corners.bottomLeft, corners.bottomRight),
		);
		const height = Math.max(
			distance(corners.topLeft, corners.bottomLeft),
			distance(corners.topRight, corners.bottomRight),
		);

		// Convert corners to jscanify format
		const cornerPointsForExtract = {
			topLeftCorner: corners.topLeft,
			topRightCorner: corners.topRight,
			bottomLeftCorner: corners.bottomLeft,
			bottomRightCorner: corners.bottomRight,
		};

		// Extract the document with perspective correction
		const extractedCanvas = scanner.extractPaper(
			sourceCanvas,
			Math.round(width),
			Math.round(height),
			cornerPointsForExtract,
		);

		// Convert to blob
		const blob = await new Promise<Blob | null>((resolve) => {
			extractedCanvas.toBlob(
				(b: Blob | null) => resolve(b),
				"image/jpeg",
				0.92,
			);
		});

		return {
			success: true,
			canvas: extractedCanvas,
			blob,
			width: extractedCanvas.width,
			height: extractedCanvas.height,
		};
	} catch (error) {
		console.error("Error extracting document:", error);
		return {
			success: false,
			canvas: null,
			blob: null,
			width: 0,
			height: 0,
			message: error instanceof Error ? error.message : "Extraction failed",
		};
	}
}

/**
 * Validate the quality of an extracted document
 */
export function validateQuality(
	canvas: HTMLCanvasElement,
	corners: CornerPoints,
	sourceWidth: number,
	sourceHeight: number,
	config: Partial<ScannerConfig> = {},
): QualityResult {
	const issues: string[] = [];
	const minRes = config.minResolution || DEFAULT_SCANNER_CONFIG.minResolution;
	const minAreaRatio =
		config.minDocumentAreaRatio || DEFAULT_SCANNER_CONFIG.minDocumentAreaRatio;

	// Check resolution
	if (canvas.width < minRes.width || canvas.height < minRes.height) {
		issues.push(
			`Resolución muy baja (${canvas.width}x${canvas.height}). Mínimo requerido: ${minRes.width}x${minRes.height}`,
		);
	}

	// Calculate document area ratio
	const docArea = calculateQuadrilateralArea(corners);
	const imageArea = sourceWidth * sourceHeight;
	const documentAreaRatio = docArea / imageArea;

	if (documentAreaRatio < minAreaRatio) {
		issues.push(
			`El documento ocupa muy poco espacio en la imagen (${(documentAreaRatio * 100).toFixed(1)}%). Acerque más el documento.`,
		);
	}

	// Check for valid quadrilateral (no crossing lines)
	if (!isValidQuadrilateral(corners)) {
		issues.push(
			"Los puntos de esquina forman una figura inválida. Ajuste las esquinas.",
		);
	}

	return {
		isValid: issues.length === 0,
		issues,
		resolution: { width: canvas.width, height: canvas.height },
		documentAreaRatio,
	};
}

/**
 * Check if corners form a valid (non-self-intersecting) quadrilateral
 */
function isValidQuadrilateral(corners: CornerPoints): boolean {
	const { topLeft, topRight, bottomRight, bottomLeft } = corners;

	return (
		!linesIntersect(topLeft, topRight, bottomLeft, bottomRight) &&
		!linesIntersect(topLeft, bottomLeft, topRight, bottomRight)
	);
}

/**
 * Check if two line segments intersect
 */
function linesIntersect(
	p1: { x: number; y: number },
	p2: { x: number; y: number },
	p3: { x: number; y: number },
	p4: { x: number; y: number },
): boolean {
	const ccw = (
		a: { x: number; y: number },
		b: { x: number; y: number },
		c: { x: number; y: number },
	) => {
		return (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);
	};

	return (
		ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4)
	);
}

/**
 * Create default corner points for a canvas (full image bounds)
 */
export function getDefaultCorners(
	width: number,
	height: number,
	padding: number = 20,
): CornerPoints {
	return {
		topLeft: { x: padding, y: padding },
		topRight: { x: width - padding, y: padding },
		bottomLeft: { x: padding, y: height - padding },
		bottomRight: { x: width - padding, y: height - padding },
	};
}

// Re-export specific types (avoid circular export issues)
export type {
	Point,
	CornerPoints,
	ScannerStage,
	DetectionResult,
	ExtractionResult,
	QualityResult,
	ScannerConfig,
	PDFConfig,
	PDFRasterResult,
	DocumentPage,
	ScannerSession,
} from "./types";

export { DEFAULT_SCANNER_CONFIG, DEFAULT_PDF_CONFIG } from "./types";

// Re-export OpenCV utilities
export { useOpenCV, isOpenCVReady, loadOpenCVScript } from "./OpenCVProvider";

// Re-export PDF.js utilities
export { loadPdfJs, isPdfJsLoaded, getPdfJsInstance } from "./pdf-loader";

// Re-export Tesseract/OCR utilities
export {
	useTesseract,
	isTesseractLoaded,
	loadTesseractScript,
	performOCR,
	type OCRResult,
	type PersonalData,
	type FieldComparison,
	type OCRProgressCallback,
} from "./TesseractLoader";

// Re-export AI extraction utilities
export {
	extractWithAI,
	isAIExtractionAvailable,
	normalizeAIFields,
	type AIExtractionResult,
	type AIExtractedField,
} from "./ai-extraction";

// Re-export MRZ parser utilities
export {
	parseMRZ,
	parsePassportMRZ,
	parseAnyMRZ,
	detectMRZType,
	extractCURP,
	calculateMRZCheckDigit,
	validateCheckDigit,
	type MRZResult,
	type MRZDocumentType,
} from "./mrz-parser";

// Re-export document validation utilities
export {
	validateDocument,
	hasMRZ,
	detectDocumentType,
	type DocumentValidationResult,
	type ValidationChecks,
	type ValidatableDocumentType,
} from "./document-validator";

// Legacy export for backward compatibility
export function preloadOpenCV(): void {
	// No-op - kept for backward compatibility
}

// =============================================================================
// DOCUMENT COMPARISON UTILITIES
// For use in external forms to highlight mismatches
// =============================================================================

export interface DocumentComparisonResult {
	/** Field name */
	field: string;
	/** Label for display */
	label: string;
	/** Value from document (OCR/MRZ) */
	documentValue: string | null;
	/** Value from user-supplied personal info */
	personalValue: string | null;
	/** Whether the values match */
	matches: boolean;
	/** Source of the document value */
	source: "MRZ" | "OCR" | "AI" | "NONE";
	/** Confidence of the extracted value (0-1) */
	confidence: number;
}

/**
 * Compare document extraction results with personal data
 * Returns a list of field comparisons with match status
 *
 * This can be used by external forms to highlight mismatches:
 * - Green: matches
 * - Yellow: partial match or low confidence
 * - Red: mismatch
 *
 * @param ocrResult - The OCR result from document scanning
 * @param personalData - User-supplied personal data
 * @returns Array of field comparison results
 */
export function compareDocumentWithPersonalData(
	ocrResult: import("./TesseractLoader").OCRResult,
	personalData: import("./TesseractLoader").PersonalData,
): DocumentComparisonResult[] {
	const results: DocumentComparisonResult[] = [];

	// Normalize strings for comparison
	const normalize = (s?: string | null): string =>
		(s || "")
			.toUpperCase()
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.trim();

	// Fuzzy match function
	const fuzzyMatch = (a?: string | null, b?: string | null): boolean => {
		if (!a || !b) return false;
		const na = normalize(a);
		const nb = normalize(b);
		return na === nb || na.includes(nb) || nb.includes(na);
	};

	const hasMRZ = !!ocrResult.mrzData?.success;
	const mrzConfidence = ocrResult.mrzData?.confidence ?? 0;

	// Full Name
	const docName =
		ocrResult.detectedFields?.fullName || ocrResult.mrzData?.fullName;
	const expectedName = [personalData.firstName, personalData.lastName]
		.filter(Boolean)
		.join(" ");
	results.push({
		field: "fullName",
		label: "Nombre Completo",
		documentValue: docName || null,
		personalValue: expectedName || null,
		matches: fuzzyMatch(docName, expectedName),
		source:
			hasMRZ && ocrResult.mrzData?.fullName ? "MRZ" : docName ? "OCR" : "NONE",
		confidence: hasMRZ ? mrzConfidence : ocrResult.confidence / 100,
	});

	// CURP
	if (personalData.curp || ocrResult.detectedFields?.curp) {
		results.push({
			field: "curp",
			label: "CURP",
			documentValue: ocrResult.detectedFields?.curp || null,
			personalValue: personalData.curp || null,
			matches: fuzzyMatch(ocrResult.detectedFields?.curp, personalData.curp),
			source: ocrResult.detectedFields?.curp ? "OCR" : "NONE",
			confidence: ocrResult.confidence / 100,
		});
	}

	// Birth Date
	if (
		personalData.birthDate ||
		ocrResult.detectedFields?.birthDate ||
		ocrResult.mrzData?.birthDate
	) {
		const docBirthDate =
			ocrResult.mrzData?.birthDate || ocrResult.detectedFields?.birthDate;
		results.push({
			field: "birthDate",
			label: "Fecha de Nacimiento",
			documentValue: docBirthDate || null,
			personalValue: personalData.birthDate || null,
			matches: docBirthDate === personalData.birthDate,
			source:
				hasMRZ && ocrResult.mrzData?.birthDate
					? "MRZ"
					: docBirthDate
						? "OCR"
						: "NONE",
			confidence: hasMRZ ? mrzConfidence : ocrResult.confidence / 100,
		});
	}

	// Document Number (INE or Passport)
	const isPassport = ocrResult.documentType === "PASSPORT";
	const docNumber = isPassport
		? ocrResult.detectedFields?.passportNumber
		: ocrResult.detectedFields?.ineDocumentNumber;
	const expectedDocNumber = isPassport
		? undefined // Personal data doesn't typically have passport number
		: personalData.ineDocumentNumber;

	if (docNumber || expectedDocNumber) {
		results.push({
			field: isPassport ? "passportNumber" : "ineDocumentNumber",
			label: isPassport ? "Número de Pasaporte" : "Número de Documento INE",
			documentValue: docNumber || null,
			personalValue: expectedDocNumber || null,
			matches: expectedDocNumber
				? fuzzyMatch(docNumber, expectedDocNumber)
				: true,
			source: hasMRZ ? "MRZ" : docNumber ? "OCR" : "NONE",
			confidence: hasMRZ ? mrzConfidence : ocrResult.confidence / 100,
		});
	}

	// Gender
	if (ocrResult.detectedFields?.gender || ocrResult.mrzData?.sex) {
		const docGender =
			ocrResult.mrzData?.sex || ocrResult.detectedFields?.gender;
		results.push({
			field: "gender",
			label: "Sexo",
			documentValue: docGender || null,
			personalValue: null, // Personal data doesn't typically have gender
			matches: true, // Can't compare without expected value
			source:
				hasMRZ && ocrResult.mrzData?.sex ? "MRZ" : docGender ? "OCR" : "NONE",
			confidence: hasMRZ ? mrzConfidence : ocrResult.confidence / 100,
		});
	}

	// Expiry Date
	const docExpiry =
		ocrResult.mrzData?.expiryDate ||
		ocrResult.detectedFields?.expiryDate ||
		ocrResult.detectedFields?.validity;
	if (docExpiry) {
		results.push({
			field: "expiryDate",
			label: "Fecha de Vencimiento",
			documentValue: docExpiry,
			personalValue: personalData.expiryDate || null,
			matches: personalData.expiryDate
				? docExpiry === personalData.expiryDate
				: true,
			source: hasMRZ && ocrResult.mrzData?.expiryDate ? "MRZ" : "OCR",
			confidence: hasMRZ ? mrzConfidence : ocrResult.confidence / 100,
		});
	}

	return results;
}

/**
 * Check if a document is likely authentic based on MRZ check digits
 * Returns a confidence score 0-1
 */
export function getDocumentAuthenticityScore(
	ocrResult: import("./TesseractLoader").OCRResult,
): number {
	const mrzData = ocrResult.mrzData;

	if (!mrzData?.success) {
		// No MRZ found - lower confidence
		return 0.3;
	}

	// Start with MRZ confidence
	let score = mrzData.confidence;

	// Boost if all check digits are valid
	if (mrzData.checkDigits) {
		const checks = Object.values(mrzData.checkDigits);
		const validChecks = checks.filter(Boolean).length;
		const checkBoost = (validChecks / checks.length) * 0.2; // Up to 0.2 boost
		score = Math.min(1, score + checkBoost);
	}

	// Boost if document type matches expected
	if (ocrResult.documentTypeConfidence > 0.8) {
		score = Math.min(1, score + 0.1);
	}

	return score;
}
