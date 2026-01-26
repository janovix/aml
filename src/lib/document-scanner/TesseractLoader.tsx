"use client";

/**
 * Tesseract.js loader for OCR functionality
 *
 * Loads Tesseract.js via CDN and provides OCR capabilities.
 * Following the same approach as OpenCVProvider.
 *
 * Note: Preprocessing runs on main thread (fast with OpenCV), while Tesseract.js
 * uses its own internal Web Worker for the heavy OCR work (already non-blocking).
 *
 * https://github.com/naptha/tesseract.js
 */

import * as React from "react";
import {
	createContext,
	useContext,
	useState,
	useCallback,
	useRef,
} from "react";
import {
	parseMRZ,
	parsePassportMRZ,
	parseAnyMRZ,
	detectMRZType,
	extractCURP,
	type MRZResult,
	type MRZDocumentType,
} from "./mrz-parser";

const TESSERACT_URL =
	"https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";

interface TesseractContextValue {
	isLoaded: boolean;
	isLoading: boolean;
	error: string | null;
	loadTesseract: () => Promise<void>;
}

const TesseractContext = createContext<TesseractContextValue>({
	isLoaded: false,
	isLoading: false,
	error: null,
	loadTesseract: async () => {},
});

export function useTesseract(): TesseractContextValue {
	return useContext(TesseractContext);
}

interface TesseractProviderProps {
	children: React.ReactNode;
}

/**
 * Check if Tesseract is loaded and ready
 */
function isTesseractReady(): boolean {
	if (typeof window === "undefined") return false;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const Tesseract = (window as any).Tesseract;
	return Tesseract && typeof Tesseract.createWorker === "function";
}

/**
 * Load a script and return a promise
 */
function loadScript(id: string, src: string): Promise<void> {
	return new Promise((resolve, reject) => {
		if (document.getElementById(id)) {
			resolve();
			return;
		}

		const script = document.createElement("script");
		script.id = id;
		script.src = src;
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

	throw new Error("Timeout waiting for condition");
}

export function TesseractProvider({
	children,
}: TesseractProviderProps): React.JSX.Element {
	const [isLoaded, setIsLoaded] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const loadPromiseRef = useRef<Promise<void> | null>(null);

	const loadTesseract = useCallback(async (): Promise<void> => {
		// Already loaded
		if (isLoaded && isTesseractReady()) {
			return;
		}

		// Already loading
		if (loadPromiseRef.current) {
			return loadPromiseRef.current;
		}

		setIsLoading(true);
		setError(null);

		loadPromiseRef.current = (async () => {
			try {
				console.log("[Tesseract] Loading script...");
				await loadScript("tesseract-js", TESSERACT_URL);
				console.log("[Tesseract] Script loaded");

				// Wait for Tesseract to be available
				await waitFor(isTesseractReady, 10000);
				console.log("[Tesseract] Ready!");

				setIsLoaded(true);
				setIsLoading(false);
			} catch (err) {
				const errorMsg =
					err instanceof Error ? err.message : "Failed to load Tesseract";
				console.error("[Tesseract] Error:", errorMsg);
				setError(errorMsg);
				setIsLoading(false);
				throw err;
			} finally {
				loadPromiseRef.current = null;
			}
		})();

		return loadPromiseRef.current;
	}, [isLoaded]);

	const contextValue: TesseractContextValue = {
		isLoaded,
		isLoading,
		error,
		loadTesseract,
	};

	return (
		<TesseractContext.Provider value={contextValue}>
			{children}
		</TesseractContext.Provider>
	);
}

/**
 * Check if Tesseract is ready (for use outside React)
 */
export function isTesseractLoaded(): boolean {
	return isTesseractReady();
}

/**
 * Get Tesseract object (for use outside React)
 */
export function getTesseract(): unknown | null {
	if (!isTesseractReady()) return null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (window as any).Tesseract;
}

/**
 * Load Tesseract imperatively (for use outside React)
 */
export async function loadTesseractScript(): Promise<void> {
	if (typeof window === "undefined") {
		throw new Error("Cannot load in server environment");
	}

	if (isTesseractReady()) {
		return;
	}

	if (!document.getElementById("tesseract-js")) {
		console.log("[Tesseract] Loading script...");
		await loadScript("tesseract-js", TESSERACT_URL);
	}

	await waitFor(isTesseractReady, 10000);
	console.log("[Tesseract] Ready!");
}

/**
 * Personal data for comparison with OCR results
 */
export interface PersonalData {
	firstName?: string;
	lastName?: string;
	secondLastName?: string;
	curp?: string;
	birthDate?: string; // YYYY-MM-DD format
	expiryDate?: string; // YYYY-MM-DD format (document expiration)
	ineDocumentNumber?: string; // IDMEX number from INE MRZ
	address?: string;
}

/**
 * Field comparison result
 */
export interface FieldComparison {
	field: string;
	label: string;
	extractedValue: string | null;
	expectedValue: string | null;
	matches: boolean | null; // null = couldn't compare
}

/**
 * OCR result for a document
 * Simplified for MRZ-focused extraction
 */
export interface OCRResult {
	success: boolean;
	text: string;
	confidence: number;
	/** Document type detected */
	documentType: "INE" | "PASSPORT" | "UNKNOWN";
	/** Confidence that the document is actually the claimed type (0-1) */
	documentTypeConfidence: number;
	/** Detected fields from the document */
	detectedFields: {
		// Common fields
		fullName?: string;
		firstName?: string;
		lastName?: string;
		secondLastName?: string;
		curp?: string;
		birthDate?: string;
		gender?: string; // "M" (male/masculino) or "F" (female/femenino)
		nationality?: string;
		// INE specific
		ineDocumentNumber?: string; // IDMEX number from MRZ (key identifier)
		address?: string;
		section?: string;
		validity?: string;
		// Passport specific
		passportNumber?: string;
		expiryDate?: string;
		issueDate?: string;
	};
	/** MRZ parsing result with detailed field extraction */
	mrzData?: MRZResult;
	/** Which side of the document (for INE front/back) */
	side?: "front" | "back";
	/** Field comparisons with personal data */
	comparisons: FieldComparison[];
	/** List of expected fields that were found */
	foundFields: string[];
	/** List of expected fields that were NOT found */
	missingFields: string[];
	/** Whether the document passes validation */
	isValid: boolean;
	/** Whether the document is expired */
	isExpired: boolean;
	/** Validation message */
	message: string;
}

/**
 * Progress callback for OCR processing
 */
export type OCRProgressCallback = (stage: string, percent: number) => void;

/**
 * Expected fields for Mexican INE/IFE (front side)
 */
const INE_FRONT_EXPECTED_FIELDS = [
	"NOMBRE",
	"CURP",
	"DOMICILIO",
	"SEXO",
	"FECHA DE NACIMIENTO",
	"VIGENCIA",
];

/**
 * Expected fields for Mexican INE/IFE (back side - MRZ)
 */
const INE_BACK_EXPECTED_FIELDS = [
	"NÚMERO DE DOCUMENTO",
	"NOMBRE (MRZ)",
	"FECHA DE NACIMIENTO (MRZ)",
	"SEXO (MRZ)",
	"FECHA DE VENCIMIENTO",
];

/**
 * Expected fields for Passport
 */
const PASSPORT_EXPECTED_FIELDS = [
	"NOMBRE",
	"NÚMERO DE PASAPORTE",
	"FECHA DE NACIMIENTO",
	"SEXO",
	"NACIONALIDAD",
	"FECHA DE EXPEDICIÓN",
	"FECHA DE EXPIRACIÓN",
	"CURP", // Mexican passports
];

/**
 * Normalize string for comparison (remove accents, lowercase, trim)
 */
function normalizeForComparison(str: string): string {
	return str
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "") // Remove accents
		.replace(/[^a-z0-9]/g, "") // Keep only alphanumeric
		.trim();
}

/**
 * Check if two strings match (fuzzy)
 */
function fuzzyMatch(
	a: string | null | undefined,
	b: string | null | undefined,
): boolean | null {
	if (!a || !b) return null;
	const normA = normalizeForComparison(a);
	const normB = normalizeForComparison(b);
	if (!normA || !normB) return null;

	// Exact match
	if (normA === normB) return true;

	// One contains the other (for partial name matches)
	if (normA.includes(normB) || normB.includes(normA)) return true;

	return false;
}

/**
 * Common OCR character corrections (O/0, I/1, etc.)
 */
function correctOCRErrors(text: string): string {
	// In CURP context, the second-to-last position should be a digit
	// Common OCR errors: O->0, I->1, S->5, B->8
	return text;
}

/**
 * Clean up an extracted name by removing OCR noise and artifacts
 * INE cards have watermarks, patterns, and holographic elements that create noise
 */
function cleanupName(rawName: string): string {
	if (!rawName) return "";

	// Step 1: Remove common OCR noise characters and symbols
	// Keep only: letters (including accented), spaces, and hyphens (for compound names)
	let cleaned = rawName
		// Remove common noise symbols
		.replace(/[¿?¡!£€$@#%&*()[\]{}|\\/<>+=_~`'"«»„""'';:,.·•°^]/g, " ")
		// Remove numbers (names don't have numbers)
		.replace(/\d/g, " ")
		// Remove standalone accents/diacritics
		.replace(/[´¨`^~]/g, "")
		// Normalize various dash types to regular hyphen
		.replace(/[—–−]/g, "-")
		// Remove isolated hyphens (not between words)
		.replace(/\s+-\s+/g, " ")
		.replace(/^-+|-+$/g, "")
		// Collapse multiple spaces
		.replace(/\s+/g, " ")
		.trim();

	// Step 2: Split into words and filter out noise
	const words = cleaned.split(/\s+/).filter((word) => {
		// Remove very short words (likely noise) - but keep single Ñ or accented letters which could be valid
		if (word.length < 2) return false;

		// Remove words that are mostly non-letters
		const letterCount = (word.match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g) || []).length;
		if (letterCount < word.length * 0.5) return false;

		// Remove common OCR noise patterns that look like words
		const noisePatterns = [
			/^[IlL1]+$/i, // Just I/l/L/1 characters
			/^[oO0]+$/, // Just O/0 characters
			/^[aeiou]+$/i, // Just vowels (unlikely to be a name)
			/^(am|ma|ue|em|et|rz|tt|ocio|if|íf)$/i, // Common noise from the samples
		];
		for (const pattern of noisePatterns) {
			if (pattern.test(word)) return false;
		}

		return true;
	});

	// Step 3: Proper case each word (SPESIA -> Spesia)
	const properCased = words.map((word) => {
		// Handle hyphenated names (e.g., MARIA-JOSE -> María-José)
		if (word.includes("-")) {
			return word
				.split("-")
				.map(
					(part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase(),
				)
				.join("-");
		}
		return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
	});

	// Step 4: Filter out remaining noise - words that don't look like Spanish names
	// Spanish names typically have at least 2 letters and follow certain patterns
	const validNames = properCased.filter((word) => {
		// Must have at least 2 characters
		if (word.length < 2) return false;
		// Must start with a letter
		if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(word)) return false;
		return true;
	});

	return validNames.join(" ");
}

/**
 * Extract name from OCR text
 */
function extractName(
	text: string,
	isPassport: boolean = false,
): {
	fullName?: string;
	firstName?: string;
	lastName?: string;
	secondLastName?: string;
} {
	const lines = text
		.split("\n")
		.map((l) => l.trim())
		.filter(Boolean);

	if (isPassport) {
		// First try: extract from MRZ line (most reliable)
		// MRZ format: P<MEXSURNAME<SECONDSURNAME<<GIVENNAME<<<...
		// or: P<MEXRUIZ<CARCANO<<FEDERICO<<<...
		for (const line of lines) {
			// Match the MRZ pattern - surname parts separated by <, then << before given name
			const mrzMatch = line.match(/P<MEX([A-Z<]+)<<([A-Z]+)/);
			if (mrzMatch) {
				const [, mrzSurnamePart, mrzGiven] = mrzMatch;
				// Surname parts are separated by single <
				const surnameParts = mrzSurnamePart.split("<").filter(Boolean);
				const lastName = surnameParts[0] || "";
				const secondLastName = surnameParts[1] || "";
				const fullSurname = surnameParts.join(" ");

				console.log("[OCR] Extracted from MRZ:", {
					mrzGiven,
					fullSurname,
					lastName,
					secondLastName,
				});

				return {
					fullName: `${mrzGiven} ${fullSurname}`.trim(),
					firstName: mrzGiven,
					lastName: lastName || undefined,
					secondLastName: secondLastName || undefined,
				};
			}
		}

		// Second try: look for labeled fields
		let surname = "";
		let givenNames = "";

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			const upperLine = line.toUpperCase();

			// Look for surname (Apellidos) - check this line and next
			if (upperLine.includes("APELLIDO") || upperLine.includes("SURNAME")) {
				// Try to extract from same line first (after the label)
				const sameLineMatch = line.match(/(?:apellidos?|surname)[\/\s:]+(.+)/i);
				if (
					sameLineMatch &&
					sameLineMatch[1].length > 2 &&
					!sameLineMatch[1].includes("/")
				) {
					surname = sameLineMatch[1].trim();
				} else if (i + 1 < lines.length) {
					// Check next line for actual surname
					const nextLine = lines[i + 1].trim();
					// Make sure it's not another label (no / or common label words)
					if (
						!nextLine.includes("/") &&
						!nextLine.toUpperCase().includes("NOMBRE") &&
						nextLine.length > 1
					) {
						surname = nextLine;
					}
				}
			}

			// Look for given names (Nombres) - must not also contain Apellido
			if (
				(upperLine.includes("NOMBRES") || upperLine.includes("GIVEN")) &&
				!upperLine.includes("APELLIDO") &&
				!upperLine.includes("SURNAME")
			) {
				// Try to extract from same line first
				const sameLineMatch = line.match(
					/(?:nombres?|given\s*names?)[\/\s:]+(.+)/i,
				);
				if (
					sameLineMatch &&
					sameLineMatch[1].length > 1 &&
					!sameLineMatch[1].includes("/")
				) {
					givenNames = sameLineMatch[1].trim();
				} else if (i + 1 < lines.length) {
					// Check next line for actual given name
					const nextLine = lines[i + 1].trim();
					// Make sure it's not another label
					if (
						!nextLine.includes("/") &&
						!nextLine.toUpperCase().includes("NACIONAL") &&
						nextLine.length > 1
					) {
						givenNames = nextLine;
					}
				}
			}
		}

		if (surname || givenNames) {
			// Clean up the extracted parts
			const cleanedSurname = cleanupName(surname);
			const cleanedGivenNames = cleanupName(givenNames);
			const fullName = [cleanedGivenNames, cleanedSurname]
				.filter(Boolean)
				.join(" ");
			const surnameParts = cleanedSurname
				.split(/\s+/)
				.filter((p) => p.length > 1);
			console.log("[OCR] Extracted from labels:", {
				cleanedGivenNames,
				cleanedSurname,
				surnameParts,
			});
			return {
				fullName: fullName || undefined,
				firstName: cleanedGivenNames || undefined,
				lastName: surnameParts[0] || undefined,
				secondLastName: surnameParts[1] || undefined,
			};
		}
	}

	// For INE/IFE - look for NOMBRE label
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].toUpperCase();
		if (
			line.includes("NOMBRE") &&
			!line.includes("FECHA") &&
			!line.includes("GIVEN")
		) {
			// Name might be on the same line after NOMBRE or on next lines
			let namePart = line.replace(/.*NOMBRE\s*/i, "").trim();

			// Skip if it's just "SEXO" or other single fields
			if (namePart.match(/^SEXO\s*[HMF]?$/i) || namePart.length < 3) {
				namePart = "";
			}

			// If the name part is empty or too short, check next lines
			if (namePart.length < 3 && i + 1 < lines.length) {
				// Collect potential name lines (usually 1-3 lines after NOMBRE)
				const nameLines: string[] = [];
				for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
					const nextLine = lines[j].trim();
					// Stop if we hit another field label or SEXO marker
					if (
						nextLine.match(
							/^(DOMICILIO|CLAVE|CURP|FECHA|SECCI|VIGENCIA|AÑO|SEXO\s*[HMF]?$)/i,
						)
					)
						break;
					// Skip lines that are just "SEXO H" or "SEXO M"
					if (nextLine.match(/^SEXO\s*[HMF]?$/i)) continue;
					if (nextLine.length > 2) nameLines.push(nextLine);
				}
				namePart = nameLines.join(" ");
			}

			// Clean up: remove any trailing SEXO marker
			namePart = namePart.replace(/\s*SEXO\s*[HMF]?\s*$/i, "").trim();

			// Apply name cleanup to remove OCR noise
			const cleanedName = cleanupName(namePart);
			console.log(
				"[OCR] INE name extraction - raw:",
				namePart,
				"-> cleaned:",
				cleanedName,
			);

			if (cleanedName.length > 2) {
				// INE typically shows: APELLIDO_PATERNO / APELLIDO_MATERNO / NOMBRE(S)
				// But can also be: NOMBRE / APELLIDO_PATERNO / APELLIDO_MATERNO
				const parts = cleanedName.split(/\s+/).filter((p) => p.length > 1);

				// Mexican INE format: first parts are surnames, last part(s) are given names
				// Usually: PATERNO MATERNO NOMBRE [SEGUNDO_NOMBRE]
				if (parts.length >= 3) {
					return {
						fullName: cleanedName,
						lastName: parts[0],
						secondLastName: parts[1],
						firstName: parts.slice(2).join(" "),
					};
				} else if (parts.length === 2) {
					return {
						fullName: cleanedName,
						lastName: parts[0],
						firstName: parts[1],
					};
				}
				return {
					fullName: cleanedName,
					firstName: parts[0],
				};
			}
		}
	}

	return {};
}

/**
 * Extract date from text (various formats)
 */
function extractDate(text: string, label: string): string | undefined {
	const lines = text.split("\n");

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (line.toUpperCase().includes(label.toUpperCase())) {
			// Look for date in this line or adjacent lines
			const searchLines = [line, lines[i + 1] || ""].join(" ");

			// Look for date patterns: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
			const dateMatch = searchLines.match(
				/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
			);
			if (dateMatch) {
				const [, d, m, y] = dateMatch;
				return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
			}

			// Look for passport format: DD MM YYYY (spaces instead of separators)
			const spaceMatch = searchLines.match(/(\d{2})\s+(\d{2})\s+(\d{4})/);
			if (spaceMatch) {
				const [, d, m, y] = spaceMatch;
				return `${y}-${m}-${d}`;
			}

			// Look for written format: 01 ENE 1990
			const writtenMatch = searchLines.match(
				/(\d{1,2})\s+(ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC)\w*\s+(\d{4})/i,
			);
			if (writtenMatch) {
				const months: Record<string, string> = {
					ENE: "01",
					FEB: "02",
					MAR: "03",
					ABR: "04",
					MAY: "05",
					JUN: "06",
					JUL: "07",
					AGO: "08",
					SEP: "09",
					OCT: "10",
					NOV: "11",
					DIC: "12",
				};
				const [, d, m, y] = writtenMatch;
				const monthNum = months[m.toUpperCase().substring(0, 3)] || "01";
				return `${y}-${monthNum}-${d.padStart(2, "0")}`;
			}
		}
	}

	return undefined;
}

/**
 * Extract all dates from passport text with context
 * Uses smart logic to differentiate between birth date, issue date, and expiry date
 */
function extractPassportDates(text: string): {
	birthDate?: string;
	issueDate?: string;
	expiryDate?: string;
} {
	const result: {
		birthDate?: string;
		issueDate?: string;
		expiryDate?: string;
	} = {};
	const lines = text.split("\n");
	const currentYear = new Date().getFullYear();

	// Find all dates in the text with their contexts
	const allDates: {
		date: string;
		year: number;
		context: string;
		lineIndex: number;
	}[] = [];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const searchText = [lines[i - 1] || "", line, lines[i + 1] || ""].join(" ");

		// Find DD MM YYYY format (passport style with spaces)
		const spaceMatches = line.matchAll(/(\d{2})\s+(\d{2})\s+(\d{4})/g);
		for (const match of spaceMatches) {
			const [fullMatch, d, m, y] = match;
			const year = parseInt(y, 10);
			const dateStr = `${y}-${m}-${d}`;
			allDates.push({
				date: dateStr,
				year,
				context: searchText.toUpperCase(),
				lineIndex: i,
			});
		}
	}

	// Now categorize the dates based on context and logic
	for (const dateInfo of allDates) {
		const { date, year, context } = dateInfo;

		// Birth date: contains NACIMIENTO or BIRTH, year typically 1940-2010
		if (
			(context.includes("NACIMIENTO") || context.includes("BIRTH")) &&
			year >= 1940 &&
			year <= 2010 &&
			!result.birthDate
		) {
			result.birthDate = date;
			continue;
		}

		// Expiry date: contains CADUCIDAD or EXPIRY, year should be in future or recent past
		if (
			(context.includes("CADUCIDAD") || context.includes("EXPIRY")) &&
			year >= currentYear - 1 &&
			!result.expiryDate
		) {
			result.expiryDate = date;
			continue;
		}

		// Issue date: contains EXPEDICION or ISSUE, year should be in the past
		if (
			(context.includes("EXPEDICI") || context.includes("ISSUE")) &&
			year <= currentYear &&
			year >= currentYear - 15 &&
			!result.issueDate
		) {
			result.issueDate = date;
			continue;
		}
	}

	// If we still don't have expiry but have multiple dates, use logic:
	// - Expiry should be the date furthest in the future
	// - Issue should be in the past
	if (!result.expiryDate && allDates.length > 0) {
		const futureDates = allDates.filter((d) => d.year > currentYear);
		if (futureDates.length > 0) {
			// Take the one with highest year (furthest expiry)
			const expiry = futureDates.reduce((max, d) =>
				d.year > max.year ? d : max,
			);
			result.expiryDate = expiry.date;
		}
	}

	if (!result.issueDate && allDates.length > 0) {
		const pastDates = allDates.filter(
			(d) =>
				d.year <= currentYear &&
				d.year > currentYear - 15 &&
				d.date !== result.birthDate &&
				d.date !== result.expiryDate,
		);
		if (pastDates.length > 0) {
			result.issueDate = pastDates[0].date;
		}
	}

	console.log("[OCR] Extracted passport dates:", result);
	return result;
}

/**
 * Safely delete an OpenCV Mat object
 */
function deleteMat(mat: unknown): void {
	try {
		if (mat && typeof (mat as { delete?: () => void }).delete === "function") {
			(mat as { delete: () => void }).delete();
		}
	} catch {
		// Ignore cleanup errors
	}
}

/**
 * Simplified document preprocessing
 *
 * Simple adaptive threshold preprocessing that works well for both
 * ID documents (INE) and passports. The MRZ parser will find and
 * extract the MRZ lines from the full OCR text.
 *
 * Pipeline:
 * 1. Optional upscaling for small images
 * 2. Convert to grayscale
 * 3. Simple adaptive threshold
 * 4. Light morphological cleanup
 */
function preprocessDocument(canvas: HTMLCanvasElement): HTMLCanvasElement {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const cv = (window as any).cv;

	if (!cv || typeof cv.imread !== "function") {
		console.log("[OCR] OpenCV not available, skipping preprocessing");
		return canvas;
	}

	console.log(
		`[OCR] Preprocessing document (${canvas.width}x${canvas.height})...`,
	);
	const mats: unknown[] = [];

	try {
		// Read full image
		const src = cv.imread(canvas);
		mats.push(src);

		// Step 1: Optional upscaling for small images (improves OCR accuracy)
		let workSrc = src;
		const MIN_WIDTH = 1000;
		const MIN_HEIGHT = 600;

		if (canvas.width < MIN_WIDTH || canvas.height < MIN_HEIGHT) {
			const scaleFactor = Math.min(
				Math.max(MIN_WIDTH / canvas.width, MIN_HEIGHT / canvas.height),
				2.0,
			);
			if (scaleFactor > 1) {
				const newSize = new cv.Size(
					Math.round(canvas.width * scaleFactor),
					Math.round(canvas.height * scaleFactor),
				);
				const upscaled = new cv.Mat();
				mats.push(upscaled);
				cv.resize(src, upscaled, newSize, 0, 0, cv.INTER_CUBIC);
				workSrc = upscaled;
				console.log(`[OCR] Upscaled to ${newSize.width}x${newSize.height}`);
			}
		}

		// Step 2: Convert to grayscale
		const gray = new cv.Mat();
		mats.push(gray);
		cv.cvtColor(workSrc, gray, cv.COLOR_RGBA2GRAY);

		// Step 3: Adaptive threshold
		// Works well for both regular text and MRZ OCR-B font
		const binary = new cv.Mat();
		mats.push(binary);
		cv.adaptiveThreshold(
			gray,
			binary,
			255,
			cv.ADAPTIVE_THRESH_GAUSSIAN_C,
			cv.THRESH_BINARY,
			21, // Block size
			8, // Constant
		);

		// Step 4: Light morphological cleanup - remove small specks
		const kernel = cv.Mat.ones(2, 2, cv.CV_8U);
		mats.push(kernel);
		const cleaned = new cv.Mat();
		mats.push(cleaned);
		cv.morphologyEx(binary, cleaned, cv.MORPH_OPEN, kernel);

		// Output canvas
		const outputCanvas = document.createElement("canvas");
		outputCanvas.width = cleaned.cols;
		outputCanvas.height = cleaned.rows;
		cv.imshow(outputCanvas, cleaned);

		console.log("[OCR] Preprocessing complete");
		return outputCanvas;
	} catch (err) {
		console.error("[OCR] Preprocessing error:", err);
		return canvas;
	} finally {
		for (const mat of mats) {
			deleteMat(mat);
		}
	}
}

/**
 * Run OCR on a canvas and return text + confidence
 * Simplified version that doesn't extract word bounding boxes
 */
async function runOCR(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	Tesseract: any,
	canvas: HTMLCanvasElement,
): Promise<{ text: string; confidence: number }> {
	console.log("[OCR] Running Tesseract OCR...");
	const worker = await Tesseract.createWorker("spa");
	const result = await worker.recognize(canvas);
	await worker.terminate();
	console.log(`[OCR] OCR confidence: ${result.data.confidence.toFixed(1)}%`);

	return {
		text: result.data.text,
		confidence: result.data.confidence,
	};
}

/**
 * Run OCR optimized specifically for MRZ zone
 * Uses character whitelist and optimal settings for OCR-B font
 */
async function runMRZOptimizedOCR(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	Tesseract: any,
	canvas: HTMLCanvasElement,
): Promise<{ text: string; confidence: number }> {
	console.log("[OCR-MRZ] Running MRZ-optimized Tesseract OCR...");

	// Create worker with English (better for OCR-B monospace font used in MRZ)
	const worker = await Tesseract.createWorker("eng");

	// Configure Tesseract for MRZ:
	// - PSM 6: Assume a single uniform block of text
	// - Whitelist: Only valid MRZ characters (A-Z, 0-9, <)
	// - Disable dictionaries since MRZ isn't real words
	await worker.setParameters({
		tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
		tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<",
		load_system_dawg: "0",
		load_freq_dawg: "0",
	});

	const result = await worker.recognize(canvas);
	await worker.terminate();

	console.log(
		`[OCR-MRZ] MRZ OCR confidence: ${result.data.confidence.toFixed(1)}%`,
	);
	console.log(`[OCR-MRZ] MRZ text:\n${result.data.text}`);

	return {
		text: result.data.text,
		confidence: result.data.confidence,
	};
}

/**
 * Preprocess specifically for MRZ zone - higher contrast, larger upscale
 */
function preprocessMRZZone(canvas: HTMLCanvasElement): HTMLCanvasElement {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const cv = (window as any).cv;
	if (!cv || typeof cv.imread !== "function") {
		return canvas;
	}

	console.log(
		`[OCR-MRZ] Preprocessing MRZ zone (${canvas.width}x${canvas.height})...`,
	);
	const mats: unknown[] = [];

	try {
		const src = cv.imread(canvas);
		mats.push(src);

		// MRZ needs higher resolution for accurate character recognition
		// Upscale to at least 3x for small images
		let workSrc = src;
		const targetHeight = 150; // Target ~50px per MRZ line (3 lines)
		const scaleFactor = Math.max(targetHeight / canvas.height, 2.0);

		if (scaleFactor > 1) {
			const newSize = new cv.Size(
				Math.round(canvas.width * scaleFactor),
				Math.round(canvas.height * scaleFactor),
			);
			const upscaled = new cv.Mat();
			mats.push(upscaled);
			cv.resize(src, upscaled, newSize, 0, 0, cv.INTER_CUBIC);
			workSrc = upscaled;
			console.log(
				`[OCR-MRZ] Upscaled MRZ to ${newSize.width}x${newSize.height}`,
			);
		}

		// Convert to grayscale
		const gray = new cv.Mat();
		mats.push(gray);
		cv.cvtColor(workSrc, gray, cv.COLOR_RGBA2GRAY);

		// Apply OTSU thresholding - often better for MRZ than adaptive
		const binary = new cv.Mat();
		mats.push(binary);
		cv.threshold(gray, binary, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);

		// Invert if needed (MRZ should be dark text on light background)
		const mean = cv.mean(binary);
		if (mean[0] < 127) {
			// More black than white, invert
			cv.bitwise_not(binary, binary);
			console.log("[OCR-MRZ] Inverted MRZ image");
		}

		// Light morphological cleanup
		const kernel = cv.Mat.ones(2, 2, cv.CV_8U);
		mats.push(kernel);
		const cleaned = new cv.Mat();
		mats.push(cleaned);
		cv.morphologyEx(binary, cleaned, cv.MORPH_CLOSE, kernel);

		const outputCanvas = document.createElement("canvas");
		outputCanvas.width = cleaned.cols;
		outputCanvas.height = cleaned.rows;
		cv.imshow(outputCanvas, cleaned);

		console.log("[OCR-MRZ] MRZ preprocessing complete");
		return outputCanvas;
	} catch (err) {
		console.error("[OCR-MRZ] MRZ preprocessing error:", err);
		return canvas;
	} finally {
		for (const mat of mats) {
			deleteMat(mat);
		}
	}
}

/**
 * Extract the bottom portion of an image where MRZ is located
 */
function extractMRZZone(
	canvas: HTMLCanvasElement,
	bottomPercent: number = 30,
): HTMLCanvasElement {
	const mrzCanvas = document.createElement("canvas");
	const ctx = mrzCanvas.getContext("2d");
	if (!ctx) return canvas;

	// MRZ is at the bottom ~25-30% of the document
	const mrzHeight = Math.round(canvas.height * (bottomPercent / 100));
	const startY = canvas.height - mrzHeight;

	mrzCanvas.width = canvas.width;
	mrzCanvas.height = mrzHeight;

	ctx.drawImage(
		canvas,
		0,
		startY,
		canvas.width,
		mrzHeight, // Source
		0,
		0,
		canvas.width,
		mrzHeight, // Destination
	);

	console.log(
		`[OCR-MRZ] Extracted MRZ zone: ${mrzCanvas.width}x${mrzCanvas.height} (bottom ${bottomPercent}%)`,
	);
	return mrzCanvas;
}

/**
 * Perform OCR on a canvas and validate document fields
 *
 * Simplified pipeline:
 * 1. Simple adaptive threshold preprocessing (optimized for MRZ)
 * 2. Single OCR pass
 * 3. MRZ parsing with ICAO validation
 *
 * Note: Tesseract.js uses its own internal Web Worker for OCR.
 */
export async function performOCR(
	canvas: HTMLCanvasElement,
	documentType: string = "INE/IFE",
	personalData?: PersonalData,
	onProgress?: OCRProgressCallback,
): Promise<OCRResult> {
	// Ensure Tesseract is loaded
	onProgress?.("Cargando Tesseract...", 10);
	await loadTesseractScript();

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const Tesseract = (window as any).Tesseract;
	if (!Tesseract) {
		throw new Error("Tesseract not loaded");
	}

	console.log("[OCR] Starting OCR with two-pass approach...");

	onProgress?.("Preprocesando imagen...", 20);

	try {
		// Pass 1: General document OCR for CURP, document type detection, etc.
		onProgress?.("Preparando imagen...", 25);
		const preprocessedCanvas = preprocessDocument(canvas);

		onProgress?.("Ejecutando OCR general...", 35);
		const generalOcrResult = await runOCR(Tesseract, preprocessedCanvas);
		const generalText = generalOcrResult.text;
		const generalConfidence = generalOcrResult.confidence;

		console.log("[OCR] General OCR complete, confidence:", generalConfidence);
		console.log("[OCR] Full text:\n", generalText);

		// Pass 2: MRZ-optimized OCR on the bottom zone
		onProgress?.("Procesando zona MRZ...", 55);
		const mrzZone = extractMRZZone(canvas, 35); // Bottom 35% for MRZ
		const mrzPreprocessed = preprocessMRZZone(mrzZone);

		onProgress?.("Leyendo MRZ...", 65);
		const mrzOcrResult = await runMRZOptimizedOCR(Tesseract, mrzPreprocessed);
		const mrzText = mrzOcrResult.text;
		const mrzConfidence = mrzOcrResult.confidence;

		// Combine results: use MRZ text for MRZ parsing, general text for everything else
		// Also append MRZ text to general text in case MRZ wasn't found in general pass
		const text = generalText + "\n" + mrzText;
		const confidence = Math.max(generalConfidence, mrzConfidence);

		console.log("[OCR] Combined OCR complete, best confidence:", confidence);

		onProgress?.("Extrayendo campos...", 75);

		// Normalize text for matching
		const normalizedText = text.toUpperCase();

		// Determine document type
		const isPassport =
			documentType.toLowerCase().includes("pasaporte") ||
			normalizedText.includes("PASAPORTE") ||
			normalizedText.includes("PASSPORT");

		const detectedDocumentType: "INE" | "PASSPORT" | "UNKNOWN" = isPassport
			? "PASSPORT"
			: normalizedText.includes("INSTITUTO NACIONAL ELECTORAL") ||
				  normalizedText.includes("CREDENCIAL") ||
				  normalizedText.includes("ELECTOR") ||
				  normalizedText.includes("IDMEX")
				? "INE"
				: "UNKNOWN";

		// Use appropriate expected fields
		const expectedFields = isPassport
			? PASSPORT_EXPECTED_FIELDS
			: INE_FRONT_EXPECTED_FIELDS;

		const foundFields: string[] = [];
		const missingFields: string[] = [];

		// Extract specific values using patterns
		const detectedFields: OCRResult["detectedFields"] = {};

		// Extract name
		const nameInfo = extractName(text, isPassport);
		if (nameInfo.fullName) detectedFields.fullName = nameInfo.fullName;
		if (nameInfo.firstName) detectedFields.firstName = nameInfo.firstName;
		if (nameInfo.lastName) detectedFields.lastName = nameInfo.lastName;
		if (nameInfo.secondLastName)
			detectedFields.secondLastName = nameInfo.secondLastName;

		// Try to extract CURP (18 characters)
		// CURP format: XXXX000000XYYYYY0Z where X=letter, 0=digit, Y=letter/digit, Z=digit
		// OCR often confuses O/0, so we use a flexible pattern and correct afterwards
		// Pattern allows O where digits should be, then we correct
		const curpFlexPattern = /[A-Z]{4}[O0-9]{6}[HM][A-Z]{5}[A-Z0-9][O0-9]/g;
		const curpMatches = normalizedText.match(curpFlexPattern);
		if (curpMatches) {
			// Take the first match and correct O->0 in digit positions
			let curp = curpMatches[0];
			// Positions 5-10 (indices 4-9) should be digits - correct O to 0
			const chars = curp.split("");
			for (let i = 4; i <= 9; i++) {
				if (chars[i] === "O") chars[i] = "0";
			}
			// Position 18 (index 17) should be a digit - correct O to 0
			if (chars[17] === "O") chars[17] = "0";
			detectedFields.curp = chars.join("");
		}

		// Try to extract MRZ data - use appropriate parser based on document type
		// Prioritize the MRZ-optimized OCR result, fall back to general text
		let mrzResult: MRZResult;
		let documentTypeConfidence = 0.5; // Default confidence

		if (isPassport) {
			// Use passport MRZ parser (TD3 format)
			// Try MRZ-optimized text first, then fall back to combined text
			mrzResult = parsePassportMRZ(mrzText);
			if (!mrzResult.success) {
				console.log(
					"[OCR] MRZ-optimized parse failed, trying combined text...",
				);
				mrzResult = parsePassportMRZ(text);
			}

			if (mrzResult.success) {
				console.log("[OCR] Passport MRZ parsed successfully:", mrzResult);
				documentTypeConfidence = mrzResult.confidence;

				// Extract passport number from MRZ
				if (mrzResult.documentNumber) {
					detectedFields.passportNumber = mrzResult.documentNumber;
					console.log(
						"[OCR] Passport Number from MRZ:",
						mrzResult.documentNumber,
					);
				}

				// MRZ provides more reliable name extraction
				if (mrzResult.fullName && !detectedFields.fullName) {
					detectedFields.fullName = mrzResult.fullName;
				}
				if (mrzResult.firstName && !detectedFields.firstName) {
					detectedFields.firstName = mrzResult.firstName;
				}
				if (mrzResult.lastName && !detectedFields.lastName) {
					detectedFields.lastName = mrzResult.lastName;
				}
				if (mrzResult.secondLastName && !detectedFields.secondLastName) {
					detectedFields.secondLastName = mrzResult.secondLastName;
				}

				// MRZ dates are more reliable
				if (mrzResult.birthDate) {
					detectedFields.birthDate = mrzResult.birthDate;
				}
				if (mrzResult.expiryDate) {
					detectedFields.expiryDate = mrzResult.expiryDate;
					detectedFields.validity = mrzResult.expiryDate;
				}
				if (mrzResult.sex) {
					detectedFields.gender = mrzResult.sex;
				}
				if (mrzResult.nationality) {
					detectedFields.nationality = mrzResult.nationality;
				}
			}
		} else {
			// Use INE MRZ parser (TD1 format)
			// Try MRZ-optimized text first, then fall back to combined text
			mrzResult = parseMRZ(mrzText);
			if (!mrzResult.success) {
				console.log(
					"[OCR] MRZ-optimized parse failed, trying combined text...",
				);
				mrzResult = parseMRZ(text);
			}

			if (mrzResult.success) {
				documentTypeConfidence = mrzResult.confidence;
			}
		}

		// For INE, extract document number from MRZ
		if (!isPassport && mrzResult.success && mrzResult.documentNumber) {
			detectedFields.ineDocumentNumber = mrzResult.documentNumber;
			console.log(
				"[OCR] INE Document Number from MRZ:",
				mrzResult.documentNumber,
			);

			// MRZ also provides more reliable name, birth date, sex, expiry
			if (mrzResult.fullName && !detectedFields.fullName) {
				detectedFields.fullName = mrzResult.fullName;
			}
			if (mrzResult.firstName && !detectedFields.firstName) {
				detectedFields.firstName = mrzResult.firstName;
			}
			if (mrzResult.lastName && !detectedFields.lastName) {
				detectedFields.lastName = mrzResult.lastName;
			}
			if (mrzResult.secondLastName && !detectedFields.secondLastName) {
				detectedFields.secondLastName = mrzResult.secondLastName;
			}
			if (mrzResult.birthDate && !detectedFields.birthDate) {
				detectedFields.birthDate = mrzResult.birthDate;
			}
			if (mrzResult.sex && !detectedFields.gender) {
				detectedFields.gender = mrzResult.sex;
			}
			if (mrzResult.expiryDate) {
				detectedFields.validity = mrzResult.expiryDate;
			}
		}

		// Try to extract CURP if not found in MRZ (usually on front side)
		if (!detectedFields.curp) {
			const curpFromText = extractCURP(text);
			if (curpFromText) {
				detectedFields.curp = curpFromText;
			}
		}

		// Extract dates and document-specific fields
		if (isPassport) {
			// Use smart date extraction for passports
			const passportDates = extractPassportDates(text);
			if (passportDates.birthDate) {
				detectedFields.birthDate = passportDates.birthDate;
			}
			if (passportDates.expiryDate) {
				detectedFields.expiryDate = passportDates.expiryDate;
				detectedFields.validity = passportDates.expiryDate;
			}
			if (passportDates.issueDate) {
				detectedFields.issueDate = passportDates.issueDate;
			}

			// Extract passport number (usually 9 characters, alphanumeric)
			// Mexican passport: starts with G followed by 8 digits, or other formats
			const passportPatterns = [
				/(?:PASSPORT\s*NO\.?|PASAPORTE\s*NO\.?|NO\.?\s*DE\s*PASAPORTE)[:\s]*([A-Z0-9]{6,12})/i,
				/(?:^|\s)([G][O0-9]{8})(?:\s|$)/m, // Mexican passport format: G + 8 digits
				/(?:^|\s)([A-Z]{1,2}[O0-9]{6,9})(?:\s|$)/m, // General format
				/<([A-Z0-9]{9})</m, // MRZ format
			];

			for (const pattern of passportPatterns) {
				const match = normalizedText.match(pattern);
				if (match) {
					let passportNum = match[1].replace(/O/g, "0"); // Common O/0 confusion
					// Validate length
					if (passportNum.length >= 6 && passportNum.length <= 12) {
						detectedFields.passportNumber = passportNum;
						console.log("[OCR] Passport number found:", passportNum);
						break;
					}
				}
			}

			// Try MRZ line for passport number (line starting with P<)
			if (!detectedFields.passportNumber) {
				const mrzMatch = text.match(/P<MEX([A-Z0-9]{9})/);
				if (mrzMatch) {
					detectedFields.passportNumber = mrzMatch[1].replace(/O/g, "0");
				}
			}

			// Extract gender from passport (M = Male/Masculino, F = Female/Femenino)
			const passportGenderMatch = normalizedText.match(
				/(?:SEX[O]?|GENDER)[:\s]*([MF])/i,
			);
			if (passportGenderMatch) {
				detectedFields.gender = passportGenderMatch[1].toUpperCase();
			} else {
				// Try MRZ - gender is after birth date
				const mrzGenderMatch = text.match(/[<]([MF])[<]/);
				if (mrzGenderMatch) {
					detectedFields.gender = mrzGenderMatch[1];
				}
			}

			// Extract nationality
			const nationalityPatterns = [
				/(?:NATIONALITY|NACIONALIDAD)[:\s]*([A-Z]{2,20})/i,
				/(?:NAC\.?)[:\s]*([A-Z]{2,15})/i,
			];
			for (const pattern of nationalityPatterns) {
				const match = text.match(pattern);
				if (match && match[1].length >= 2) {
					detectedFields.nationality = match[1].trim();
					break;
				}
			}
			// Default to Mexican for Mexican passports
			if (!detectedFields.nationality && normalizedText.includes("MEXICANA")) {
				detectedFields.nationality = "MEXICANA";
			}
		} else {
			// INE/IFE date extraction
			const birthDate =
				extractDate(text, "FECHA DE NACIMIENTO") ||
				extractDate(text, "NACIMIENTO");
			if (birthDate) {
				detectedFields.birthDate = birthDate;
			}

			// INE VIGENCIA shows as a year range like "2022-2032" or "2022 - 2032"
			const vigenciaRangeMatch = normalizedText.match(
				/VIGENCIA[:\s]*(\d{4})\s*[-–—]\s*(\d{4})/,
			);
			if (vigenciaRangeMatch) {
				const [, startYear, endYear] = vigenciaRangeMatch;
				// Store the end year as the expiry date (December 31 of that year)
				detectedFields.validity = `${endYear}-12-31`;
				console.log("[OCR] INE Vigencia range:", startYear, "-", endYear);
			} else {
				// Fallback to date format
				const validity = extractDate(text, "VIGENCIA");
				if (validity) {
					detectedFields.validity = validity;
				}
			}

			// Extract gender from INE (H = Hombre, M = Mujer)
			const ineGenderMatch = normalizedText.match(/(?:SEXO)[:\s]*([HM])/i);
			if (ineGenderMatch) {
				// Convert H/M to M/F for consistency
				const ineGender = ineGenderMatch[1].toUpperCase();
				detectedFields.gender = ineGender === "H" ? "M" : "F"; // H(ombre)->M(ale), M(ujer)->F(emale)
				console.log(
					"[OCR] INE Gender:",
					ineGender,
					"->",
					detectedFields.gender,
				);
			}

			// Extract address (DOMICILIO)
			const addressMatch = text.match(
				/DOMICILIO[:\s]*\n?([\s\S]+?)(?:\n[A-Z]{3,}|\nCOL|$)/i,
			);
			if (addressMatch) {
				let address = addressMatch[1].trim();
				// Clean up the address - remove garbage, keep only meaningful lines
				address = address
					.split("\n")
					.map((l) => l.trim())
					.filter((l) => l.length > 3 && !/^[0-9]+$/.test(l))
					.slice(0, 3) // Max 3 lines
					.join(", ");
				if (address.length > 10) {
					detectedFields.address = address;
				}
			}
		}

		// Build comparisons with personal data
		const comparisons: FieldComparison[] = [];

		if (personalData) {
			// Compare CURP
			if (personalData.curp || detectedFields.curp) {
				comparisons.push({
					field: "curp",
					label: "CURP",
					extractedValue: detectedFields.curp || null,
					expectedValue: personalData.curp || null,
					matches: fuzzyMatch(detectedFields.curp, personalData.curp),
				});
			}

			// Compare first name
			if (personalData.firstName || detectedFields.firstName) {
				comparisons.push({
					field: "firstName",
					label: "Nombre",
					extractedValue: detectedFields.firstName || null,
					expectedValue: personalData.firstName || null,
					matches: fuzzyMatch(detectedFields.firstName, personalData.firstName),
				});
			}

			// Compare last name (paterno)
			if (personalData.lastName || detectedFields.lastName) {
				comparisons.push({
					field: "lastName",
					label: "Apellido Paterno",
					extractedValue: detectedFields.lastName || null,
					expectedValue: personalData.lastName || null,
					matches: fuzzyMatch(detectedFields.lastName, personalData.lastName),
				});
			}

			// Compare second last name (materno)
			if (personalData.secondLastName || detectedFields.secondLastName) {
				comparisons.push({
					field: "secondLastName",
					label: "Apellido Materno",
					extractedValue: detectedFields.secondLastName || null,
					expectedValue: personalData.secondLastName || null,
					matches: fuzzyMatch(
						detectedFields.secondLastName,
						personalData.secondLastName,
					),
				});
			}

			// Compare birth date
			if (personalData.birthDate || detectedFields.birthDate) {
				comparisons.push({
					field: "birthDate",
					label: "Fecha de Nacimiento",
					extractedValue: detectedFields.birthDate || null,
					expectedValue: personalData.birthDate || null,
					matches: fuzzyMatch(detectedFields.birthDate, personalData.birthDate),
				});
			}

			// Compare INE document number
			if (personalData.ineDocumentNumber || detectedFields.ineDocumentNumber) {
				comparisons.push({
					field: "ineDocumentNumber",
					label: "Número de Documento INE",
					extractedValue: detectedFields.ineDocumentNumber || null,
					expectedValue: personalData.ineDocumentNumber || null,
					matches: fuzzyMatch(
						detectedFields.ineDocumentNumber,
						personalData.ineDocumentNumber,
					),
				});
			}

			// Compare expiry date
			if (personalData.expiryDate || detectedFields.validity) {
				comparisons.push({
					field: "expiryDate",
					label: "Fecha de Vencimiento",
					extractedValue: detectedFields.validity || null,
					expectedValue: personalData.expiryDate || null,
					matches: fuzzyMatch(detectedFields.validity, personalData.expiryDate),
				});
			}
		}

		// Check if document is expired
		let isExpired = false;
		if (detectedFields.validity) {
			try {
				const expiryDate = new Date(detectedFields.validity);
				const today = new Date();
				today.setHours(0, 0, 0, 0); // Compare dates only, not time
				isExpired = expiryDate < today;
			} catch {
				// If date parsing fails, assume not expired
				isExpired = false;
			}
		}

		// Build found/missing fields based on actual extracted values
		if (isPassport) {
			if (detectedFields.fullName) foundFields.push("NOMBRE");
			else missingFields.push("NOMBRE");

			if (detectedFields.passportNumber)
				foundFields.push("NÚMERO DE PASAPORTE");
			else missingFields.push("NÚMERO DE PASAPORTE");

			if (detectedFields.birthDate) foundFields.push("FECHA DE NACIMIENTO");
			else missingFields.push("FECHA DE NACIMIENTO");

			if (detectedFields.gender) foundFields.push("SEXO");
			else missingFields.push("SEXO");

			if (detectedFields.nationality) foundFields.push("NACIONALIDAD");
			else missingFields.push("NACIONALIDAD");

			if (detectedFields.expiryDate) foundFields.push("FECHA DE EXPIRACIÓN");
			else missingFields.push("FECHA DE EXPIRACIÓN");

			if (detectedFields.issueDate) foundFields.push("FECHA DE EXPEDICIÓN");
			else missingFields.push("FECHA DE EXPEDICIÓN");

			if (detectedFields.curp) foundFields.push("CURP");
			// CURP is optional for non-Mexican passports
		} else {
			// INE fields
			if (detectedFields.fullName) foundFields.push("NOMBRE");
			else missingFields.push("NOMBRE");

			if (detectedFields.curp) foundFields.push("CURP");
			else missingFields.push("CURP");

			if (detectedFields.address) foundFields.push("DOMICILIO");
			else missingFields.push("DOMICILIO");

			if (detectedFields.gender) foundFields.push("SEXO");
			else missingFields.push("SEXO");

			if (detectedFields.ineDocumentNumber)
				foundFields.push("NÚMERO DE DOCUMENTO");
			else missingFields.push("NÚMERO DE DOCUMENTO");

			if (detectedFields.birthDate) foundFields.push("FECHA DE NACIMIENTO");
			else missingFields.push("FECHA DE NACIMIENTO");

			if (detectedFields.validity) foundFields.push("VIGENCIA");
			else missingFields.push("VIGENCIA");
		}

		// Validation: at least 50% of critical fields should be found
		const criticalFields = isPassport
			? ["NÚMERO DE PASAPORTE", "NOMBRE", "FECHA DE NACIMIENTO"]
			: ["CURP", "NOMBRE"];
		const criticalFound = criticalFields.filter((f) =>
			foundFields.includes(f),
		).length;
		const fieldRatio =
			foundFields.length / (foundFields.length + missingFields.length);

		const matchingComparisons = comparisons.filter(
			(c) => c.matches === true,
		).length;
		const totalComparisons = comparisons.filter(
			(c) => c.matches !== null,
		).length;

		const hasDataMatch =
			totalComparisons === 0 || matchingComparisons >= totalComparisons * 0.5;
		// Document is invalid if expired
		const hasCriticalFields = criticalFound >= criticalFields.length * 0.5;
		const isValid =
			hasCriticalFields && confidence > 40 && hasDataMatch && !isExpired;

		let message = "";
		if (isExpired) {
			message = `⚠️ El documento está vencido (expiró el ${detectedFields.validity || detectedFields.expiryDate}). Por favor, proporcione un documento vigente.`;
		} else if (isValid) {
			if (totalComparisons > 0) {
				message = `Documento validado. ${matchingComparisons}/${totalComparisons} campos coinciden con los datos ingresados.`;
			} else {
				message = `Documento validado correctamente. Se encontraron ${foundFields.length} campos.`;
			}
		} else if (confidence < 40) {
			message = `La imagen no es suficientemente clara (confianza: ${confidence.toFixed(0)}%). Por favor, tome una foto con mejor iluminación.`;
		} else if (!hasDataMatch && totalComparisons > 0) {
			message = `Los datos del documento no coinciden con la información ingresada. Verifique que el documento corresponde a la persona correcta.`;
		} else if (!hasCriticalFields) {
			const missing = criticalFields.filter((f) => !foundFields.includes(f));
			message = `No se encontraron campos críticos: ${missing.join(", ")}`;
		} else {
			message = `No se pudieron identificar suficientes campos del documento.`;
		}

		onProgress?.("Validación completa", 100);

		return {
			success: true,
			text,
			confidence,
			documentType: detectedDocumentType,
			documentTypeConfidence,
			detectedFields,
			mrzData: mrzResult.success ? mrzResult : undefined,
			comparisons,
			foundFields,
			missingFields,
			isValid,
			isExpired,
			message,
		};
	} catch (err) {
		console.error("[MRZ] Error:", err);
		return {
			success: false,
			text: "",
			confidence: 0,
			documentType: "UNKNOWN",
			documentTypeConfidence: 0,
			detectedFields: {},
			comparisons: [],
			foundFields: [],
			missingFields: INE_FRONT_EXPECTED_FIELDS,
			isValid: false,
			isExpired: false,
			message:
				err instanceof Error ? err.message : "Error al procesar el documento",
		};
	}
}
