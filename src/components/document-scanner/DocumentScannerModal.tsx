"use client";

import * as React from "react";
import { useState, useCallback, useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import {
	X,
	Loader2,
	ChevronLeft,
	ChevronRight,
	RotateCcw,
	Check,
	AlertCircle,
	FileText,
	ImageIcon,
	CheckCircle2,
	XCircle,
	Camera,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
	detectCorners,
	extractDocument,
	validateQuality,
	loadImageToCanvas,
	getDefaultCorners,
	useOpenCV,
	performOCR,
	extractWithAI,
	isAIExtractionAvailable,
	normalizeAIFields,
	type OCRResult,
	type PersonalData,
	type AIExtractionResult,
} from "@/lib/document-scanner";
import type {
	CornerPoints,
	ScannerStage,
	QualityResult,
} from "@/lib/document-scanner/types";
import {
	rasterizePDF,
	isPDFFile,
	isImageFile,
} from "@/lib/document-scanner/pdf-rasterizer";
import { ScannerCanvas } from "./ScannerCanvas";
import { ScannerSteps } from "./ScannerSteps";

/**
 * Helper component to display a field row with found/not found indicator
 */
function FieldRow({
	label,
	value,
	found,
	critical = false,
	expired = false,
}: {
	label: string;
	value?: string;
	found: boolean;
	critical?: boolean;
	expired?: boolean;
}) {
	return (
		<div
			className={cn(
				"flex items-center justify-between p-2 rounded text-sm",
				found ? "bg-green-500/5" : "bg-muted/30",
				critical && !found && "bg-red-500/10",
			)}
		>
			<div className="flex items-center gap-2 min-w-0 flex-1">
				{found ? (
					<CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
				) : (
					<XCircle className="h-4 w-4 text-muted-foreground shrink-0" />
				)}
				<span
					className={cn(
						"text-muted-foreground",
						critical && !found && "text-destructive",
					)}
				>
					{label}:
				</span>
			</div>
			<div className="flex items-center gap-2 shrink-0">
				{found ? (
					<>
						<span
							className={cn(
								"font-mono text-xs max-w-[200px] truncate",
								expired && "text-destructive line-through",
							)}
						>
							{value}
						</span>
						{expired && (
							<Badge variant="destructive" className="text-xs">
								Vencido
							</Badge>
						)}
					</>
				) : (
					<span className="text-xs text-muted-foreground italic">
						No detectado
					</span>
				)}
			</div>
		</div>
	);
}

/**
 * Display AI extraction results in a clean, user-friendly format
 */
function AIExtractionDisplay({
	aiResult,
	onSecretClick,
	devMode,
}: {
	aiResult: AIExtractionResult;
	onSecretClick: () => void;
	devMode: boolean;
}) {
	const fields = normalizeAIFields(aiResult.extraction);
	const rawFields = aiResult.extraction.fields;

	// Check if document is expired
	const isExpired = React.useMemo(() => {
		if (fields.expiryDate) {
			const expiry = new Date(fields.expiryDate);
			return expiry < new Date();
		}
		return false;
	}, [fields.expiryDate]);

	// Calculate found/total fields
	const foundCount = Object.values(fields).filter(Boolean).length;
	const totalFields = Object.keys(fields).length;

	// Map document type for display
	const docTypeLabel =
		aiResult.documentType === "mx_ine"
			? "INE/IFE"
			: aiResult.documentType === "passport"
				? "Pasaporte"
				: aiResult.documentType || "Documento";

	return (
		<div className="space-y-3">
			{/* Success message */}
			<Alert variant={isExpired ? "destructive" : "default"}>
				{isExpired ? (
					<AlertCircle className="h-4 w-4" />
				) : (
					<CheckCircle2 className="h-4 w-4" />
				)}
				<AlertDescription>
					<div className="space-y-1">
						<p className="font-medium">
							{isExpired
								? "⚠ Documento vencido"
								: "✓ Datos extraídos correctamente"}
						</p>
						<p className="text-sm">
							{isExpired
								? `El documento expiró el ${fields.expiryDate}. Por favor proporcione un documento vigente.`
								: `Se identificaron ${foundCount} campos del ${docTypeLabel}.`}
						</p>
						{/* Easter egg: tap to enable dev mode */}
						<p
							className="text-xs text-muted-foreground cursor-default select-none"
							onClick={onSecretClick}
						>
							{devMode && "🔧 "} Extracción con IA • {docTypeLabel}
						</p>
					</div>
				</AlertDescription>
			</Alert>

			{/* Fields display - clean and simple */}
			<div className="rounded-lg border bg-card p-4 space-y-3">
				<div className="flex items-center justify-between">
					<h4 className="text-sm font-medium">Información del Documento</h4>
					<Badge variant="outline" className="text-xs">
						{foundCount} campos
					</Badge>
				</div>

				<div className="grid gap-2">
					{/* Name - always show prominently */}
					{fields.fullName && (
						<div className="flex justify-between items-center py-1.5 border-b last:border-0">
							<span className="text-sm text-muted-foreground">Nombre</span>
							<span className="text-sm font-medium">{fields.fullName}</span>
						</div>
					)}

					{/* CURP */}
					{fields.curp && (
						<div className="flex justify-between items-center py-1.5 border-b last:border-0">
							<span className="text-sm text-muted-foreground">CURP</span>
							<span className="text-sm font-mono">{fields.curp}</span>
						</div>
					)}

					{/* Passport Number */}
					{fields.passportNumber && (
						<div className="flex justify-between items-center py-1.5 border-b last:border-0">
							<span className="text-sm text-muted-foreground">
								No. Pasaporte
							</span>
							<span className="text-sm font-mono">{fields.passportNumber}</span>
						</div>
					)}

					{/* INE Document Number */}
					{fields.ineDocumentNumber && (
						<div className="flex justify-between items-center py-1.5 border-b last:border-0 bg-primary/5 -mx-2 px-2 rounded">
							<span className="text-sm font-medium text-primary">
								No. Documento INE
							</span>
							<span className="text-sm font-mono font-medium">
								{fields.ineDocumentNumber}
							</span>
						</div>
					)}

					{/* Birth Date */}
					{fields.birthDate && (
						<div className="flex justify-between items-center py-1.5 border-b last:border-0">
							<span className="text-sm text-muted-foreground">
								Fecha de Nacimiento
							</span>
							<span className="text-sm">{fields.birthDate}</span>
						</div>
					)}

					{/* Gender */}
					{fields.gender && (
						<div className="flex justify-between items-center py-1.5 border-b last:border-0">
							<span className="text-sm text-muted-foreground">Sexo</span>
							<span className="text-sm">
								{fields.gender === "M" || fields.gender === "male"
									? "Masculino"
									: fields.gender === "F" || fields.gender === "female"
										? "Femenino"
										: fields.gender}
							</span>
						</div>
					)}

					{/* Nationality */}
					{fields.nationality && (
						<div className="flex justify-between items-center py-1.5 border-b last:border-0">
							<span className="text-sm text-muted-foreground">
								Nacionalidad
							</span>
							<span className="text-sm">{fields.nationality}</span>
						</div>
					)}

					{/* Address */}
					{fields.address && (
						<div className="flex justify-between items-start py-1.5 border-b last:border-0">
							<span className="text-sm text-muted-foreground shrink-0">
								Domicilio
							</span>
							<span className="text-sm text-right max-w-[60%]">
								{fields.address}
							</span>
						</div>
					)}

					{/* Expiry Date */}
					{fields.expiryDate && (
						<div className="flex justify-between items-center py-1.5 border-b last:border-0">
							<span className="text-sm text-muted-foreground">
								Fecha de Vencimiento
							</span>
							<div className="flex items-center gap-2">
								<span
									className={cn(
										"text-sm",
										isExpired && "text-destructive line-through",
									)}
								>
									{fields.expiryDate}
								</span>
								{isExpired ? (
									<Badge variant="destructive" className="text-xs">
										Vencido
									</Badge>
								) : (
									<Badge variant="default" className="bg-green-500 text-xs">
										Vigente
									</Badge>
								)}
							</div>
						</div>
					)}
				</div>

				{/* Dev mode: Show confidence scores */}
				{devMode && (
					<div className="mt-3 pt-3 border-t">
						<p className="text-xs text-muted-foreground mb-2">
							🔧 Confianza por campo:
						</p>
						<div className="grid grid-cols-2 gap-1 text-xs">
							{Object.entries(rawFields).map(([key, field]) => (
								<div key={key} className="flex justify-between">
									<span className="text-muted-foreground truncate">{key}:</span>
									<span
										className={cn(
											"font-mono",
											field.confidence >= 0.8
												? "text-green-600"
												: field.confidence >= 0.5
													? "text-yellow-600"
													: "text-red-600",
										)}
									>
										{(field.confidence * 100).toFixed(0)}%
									</span>
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

// Easter egg: Dev mode storage key
const DEV_MODE_KEY = "janovix-ocr-dev-mode";
const DEV_MODE_CLICKS_NEEDED = 5;

/**
 * Hook to manage dev mode easter egg
 * Tap the confidence percentage 5 times to unlock
 */
function useDevMode() {
	const [devMode, setDevMode] = React.useState(false);
	const [clickCount, setClickCount] = React.useState(0);
	const clickTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

	// Check localStorage on mount
	React.useEffect(() => {
		if (typeof window !== "undefined") {
			const stored = localStorage.getItem(DEV_MODE_KEY);
			if (stored === "true") {
				setDevMode(true);
			}
		}
	}, []);

	// Clear timeout on unmount to prevent memory leaks
	React.useEffect(() => {
		return () => {
			if (clickTimeoutRef.current) {
				clearTimeout(clickTimeoutRef.current);
			}
		};
	}, []);

	const handleSecretClick = React.useCallback(() => {
		// Reset timeout on each click
		if (clickTimeoutRef.current) {
			clearTimeout(clickTimeoutRef.current);
		}

		const newCount = clickCount + 1;
		setClickCount(newCount);

		if (newCount >= DEV_MODE_CLICKS_NEEDED) {
			const newDevMode = !devMode;
			setDevMode(newDevMode);
			localStorage.setItem(DEV_MODE_KEY, newDevMode.toString());
			setClickCount(0);

			// Show toast notification
			if (newDevMode) {
				toast.success("🔧 Modo desarrollador activado", {
					description: "Ahora puedes ver opciones avanzadas de procesamiento",
				});
			} else {
				toast.info("Modo desarrollador desactivado");
			}
		} else if (newCount >= 3) {
			// Hint after 3 clicks
			toast.info(`${DEV_MODE_CLICKS_NEEDED - newCount} más...`, {
				duration: 1000,
			});
		}

		// Reset count after 2 seconds of no clicks
		clickTimeoutRef.current = setTimeout(() => {
			setClickCount(0);
		}, 2000);
	}, [clickCount, devMode]);

	return { devMode, handleSecretClick };
}

/**
 * Display combined INE data from front and back sides
 */
function INECombinedDisplay({
	combinedData,
	onSecretClick,
	devMode,
}: {
	combinedData: INEState["combinedData"];
	onSecretClick: () => void;
	devMode: boolean;
}) {
	// Check if document is expired - MUST be called before early return to satisfy Rules of Hooks
	const isExpired = React.useMemo(() => {
		if (combinedData?.expiryDate) {
			const expiry = new Date(combinedData.expiryDate);
			return expiry < new Date();
		}
		return false;
	}, [combinedData?.expiryDate]);

	if (!combinedData) return null;

	return (
		<div className="space-y-3">
			{/* Success message */}
			<Alert variant={isExpired ? "destructive" : "default"}>
				{isExpired ? (
					<AlertCircle className="h-4 w-4" />
				) : (
					<CheckCircle2 className="h-4 w-4" />
				)}
				<AlertDescription>
					<div className="space-y-1">
						<p className="font-medium">
							{isExpired ? "⚠ INE vencida" : "✓ INE escaneada correctamente"}
						</p>
						<p className="text-sm">
							{isExpired
								? `La INE expiró el ${combinedData.expiryDate}. Por favor proporcione una vigente.`
								: "Se capturaron ambos lados de la INE."}
						</p>
						{/* Easter egg trigger */}
						<p
							className="text-xs text-muted-foreground cursor-default select-none"
							onClick={onSecretClick}
						>
							{devMode && "🔧 "} Datos extraídos de MRZ
						</p>
					</div>
				</AlertDescription>
			</Alert>

			{/* Fields display */}
			<div className="rounded-lg border bg-card p-4 space-y-3">
				<div className="flex items-center justify-between">
					<h4 className="text-sm font-medium">Información de la INE</h4>
					<Badge variant="outline" className="text-xs">
						MRZ + OCR
					</Badge>
				</div>

				<div className="grid gap-2">
					{/* Document Number - KEY FIELD */}
					{combinedData.ineDocumentNumber && (
						<div className="flex justify-between items-center py-1.5 border-b last:border-0 bg-primary/5 -mx-2 px-2 rounded">
							<span className="text-sm font-medium text-primary">
								No. Documento
							</span>
							<span className="text-sm font-mono font-medium">
								{combinedData.ineDocumentNumber}
							</span>
						</div>
					)}

					{/* Name */}
					{combinedData.fullName && (
						<div className="flex justify-between items-center py-1.5 border-b last:border-0">
							<span className="text-sm text-muted-foreground">Nombre</span>
							<span className="text-sm font-medium">
								{combinedData.fullName}
							</span>
						</div>
					)}

					{/* CURP */}
					{combinedData.curp && (
						<div className="flex justify-between items-center py-1.5 border-b last:border-0">
							<span className="text-sm text-muted-foreground">CURP</span>
							<span className="text-sm font-mono">{combinedData.curp}</span>
						</div>
					)}

					{/* Birth Date */}
					{combinedData.birthDate && (
						<div className="flex justify-between items-center py-1.5 border-b last:border-0">
							<span className="text-sm text-muted-foreground">
								Fecha de Nacimiento
							</span>
							<span className="text-sm">{combinedData.birthDate}</span>
						</div>
					)}

					{/* Gender */}
					{combinedData.gender && (
						<div className="flex justify-between items-center py-1.5 border-b last:border-0">
							<span className="text-sm text-muted-foreground">Sexo</span>
							<span className="text-sm">
								{combinedData.gender === "M" ? "Masculino" : "Femenino"}
							</span>
						</div>
					)}

					{/* Address */}
					{combinedData.address && (
						<div className="flex justify-between items-start py-1.5 border-b last:border-0">
							<span className="text-sm text-muted-foreground shrink-0">
								Domicilio
							</span>
							<span className="text-sm text-right max-w-[60%]">
								{combinedData.address}
							</span>
						</div>
					)}

					{/* Expiry Date */}
					{combinedData.expiryDate && (
						<div className="flex justify-between items-center py-1.5 border-b last:border-0">
							<span className="text-sm text-muted-foreground">Vigencia</span>
							<div className="flex items-center gap-2">
								<span
									className={cn(
										"text-sm",
										isExpired && "text-destructive line-through",
									)}
								>
									{combinedData.expiryDate}
								</span>
								{isExpired ? (
									<Badge variant="destructive" className="text-xs">
										Vencida
									</Badge>
								) : (
									<Badge variant="default" className="bg-green-500 text-xs">
										Vigente
									</Badge>
								)}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

/**
 * Simple image preview for regular users (no dev tools)
 */
function SimpleImagePreview({ canvas }: { canvas: HTMLCanvasElement }) {
	const canvasRef = React.useRef<HTMLCanvasElement>(null);

	React.useEffect(() => {
		const displayCanvas = canvasRef.current;
		const ctx = displayCanvas?.getContext("2d");
		if (!displayCanvas || !ctx) return;

		displayCanvas.width = canvas.width;
		displayCanvas.height = canvas.height;
		ctx.drawImage(canvas, 0, 0);
	}, [canvas]);

	return (
		<canvas
			ref={canvasRef}
			className="w-full h-auto object-contain rounded-lg"
		/>
	);
}

/** INE-specific extraction data (both sides) */
export interface INEExtractionData {
	frontBlob: Blob;
	frontCanvas: HTMLCanvasElement;
	backBlob: Blob;
	backCanvas: HTMLCanvasElement;
	ocrResult?: OCRResult;
}

/** Complete extraction data including all source files */
export interface DocumentExtractionData {
	/** The processed/extracted image blob */
	processedBlob: Blob;
	/** The processed/extracted canvas */
	processedCanvas: HTMLCanvasElement;
	/** OCR result if available */
	ocrResult?: OCRResult;
	/** INE-specific data (both front and back) */
	ineData?: INEExtractionData;
	/** Original source file (PDF or image) */
	originalFile?: File;
	/** Rasterized image files from PDF (if source was PDF) */
	rasterizedImages?: Blob[];
}

interface DocumentScannerModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** File to process */
	file: File | null;
	/** Callback when document is successfully extracted */
	onExtracted: (data: DocumentExtractionData) => void;
	/** Document type being scanned (for display) */
	documentType?: string;
	/** Personal data for OCR comparison */
	personalData?: PersonalData;
}

interface PageState {
	canvas: HTMLCanvasElement;
	corners: CornerPoints | null;
	autoCorners: CornerPoints | null;
	extractedCanvas: HTMLCanvasElement | null;
	extractedBlob: Blob | null;
	quality: QualityResult | null;
	ocrResult: OCRResult | null;
	aiResult: AIExtractionResult | null;
	/** Which side of the document (for INE front/back) */
	side?: "front" | "back";
}

/** INE state for front/back capture */
interface INEState {
	/** Front side data */
	front: {
		canvas: HTMLCanvasElement;
		blob: Blob;
		ocrResult?: OCRResult | null;
		aiResult?: AIExtractionResult | null;
	} | null;
	/** Back side data */
	back: {
		canvas: HTMLCanvasElement;
		blob: Blob;
		ocrResult?: OCRResult | null;
		aiResult?: AIExtractionResult | null;
	} | null;
	/** Combined extracted data from both sides */
	combinedData?: {
		ineDocumentNumber?: string;
		fullName?: string;
		curp?: string;
		birthDate?: string;
		gender?: string;
		address?: string;
		expiryDate?: string;
	};
}

export function DocumentScannerModal({
	open,
	onOpenChange,
	file,
	onExtracted,
	documentType = "Documento",
	personalData,
}: DocumentScannerModalProps) {
	const [stage, setStage] = useState<ScannerStage>("idle");
	const [isProcessing, setIsProcessing] = useState(false);
	const [pages, setPages] = useState<PageState[]>([]);
	const [currentPageIndex, setCurrentPageIndex] = useState(0);
	const [error, setError] = useState<string | null>(null);
	const [ocrProgress, setOcrProgress] = useState<{
		stage: string;
		percent: number;
	} | null>(null);

	// Track original file and rasterized images
	const [originalFile, setOriginalFile] = useState<File | null>(null);
	const [rasterizedImages, setRasterizedImages] = useState<Blob[]>([]);

	// INE front/back capture state
	const [ineState, setIneState] = useState<INEState>({
		front: null,
		back: null,
	});
	const [currentIneSide, setCurrentIneSide] = useState<"front" | "back">(
		"front",
	);
	const [backSideFile, setBackSideFile] = useState<File | null>(null);
	const backSideInputRef = React.useRef<HTMLInputElement>(null);
	const isINEDocument =
		documentType.toLowerCase().includes("ine") ||
		documentType.toLowerCase().includes("ife");

	// Easter egg: Dev mode for OCR visualization tools
	const { devMode, handleSecretClick } = useDevMode();

	// Get OpenCV loading state from context
	const {
		isLoaded: isOpenCVLoaded,
		isLoading: isOpenCVLoading,
		error: openCVError,
		loadOpenCV,
	} = useOpenCV();

	const currentPage = pages[currentPageIndex] || null;

	// Load OpenCV and process file when modal opens
	useEffect(() => {
		if (!open) {
			// Reset state when closed
			setStage("idle");
			setPages([]);
			setCurrentPageIndex(0);
			setError(null);
			setOcrProgress(null);
			setIneState({ front: null, back: null });
			setCurrentIneSide("front");
			setBackSideFile(null);
			setOriginalFile(null);
			setRasterizedImages([]);
			return;
		}

		if (!file) return;

		// Load OpenCV then process file
		const loadAndProcess = async () => {
			try {
				if (!isOpenCVLoaded) {
					setStage("idle");
					await loadOpenCV();
				}
				processFile(file);
			} catch (err) {
				Sentry.captureException(err);
				Sentry.logger.error(Sentry.logger.fmt`Failed to load OpenCV: ${err}`);
				setError("Error al cargar la librería de procesamiento");
			}
		};

		loadAndProcess();
	}, [open, file, isOpenCVLoaded, loadOpenCV]);

	// Process back side file when selected (INE flow)
	useEffect(() => {
		if (!backSideFile || stage !== "waiting_for_back") return;

		const processBackSide = async () => {
			try {
				if (!isOpenCVLoaded) {
					await loadOpenCV();
				}
				processFile(backSideFile);
			} catch (err) {
				Sentry.captureException(err);
				Sentry.logger.error(
					Sentry.logger.fmt`Failed to process back side: ${err}`,
				);
				setError("Error al procesar el reverso");
			}
		};

		processBackSide();
	}, [backSideFile, stage, isOpenCVLoaded, loadOpenCV]);

	// Handler for back side file input
	const handleBackSideFileSelect = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const selectedFile = event.target.files?.[0];
			if (selectedFile) {
				setBackSideFile(selectedFile);
			}
			// Reset input so the same file can be selected again if needed
			event.target.value = "";
		},
		[],
	);

	const processFile = async (file: File) => {
		setIsProcessing(true);
		setError(null);
		setStage("detecting");

		try {
			// Validate file exists
			if (!file) {
				throw new Error("No se seleccionó ningún archivo");
			}

			// Store original file
			setOriginalFile(file);

			let canvases: HTMLCanvasElement[] = [];
			let rasterizedBlobs: Blob[] = [];

			if (isPDFFile(file)) {
				// Rasterize PDF pages
				toast.info("Convirtiendo PDF a imágenes...", { duration: 2000 });

				const result = await rasterizePDF(file);

				if (!result.success) {
					throw new Error(
						result.message ||
							"Error al procesar el PDF. Por favor, intenta con una imagen JPG o PNG.",
					);
				}

				if (result.pages.length === 0) {
					throw new Error(
						"No se pudieron extraer páginas del PDF. Por favor, intenta con una imagen JPG o PNG.",
					);
				}

				canvases = result.pages;

				// Convert canvases to blobs for storage
				for (const canvas of canvases) {
					const blob = await new Promise<Blob | null>((resolve) => {
						canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92);
					});
					if (blob) {
						rasterizedBlobs.push(blob);
					}
				}
				setRasterizedImages(rasterizedBlobs);

				if (result.message) {
					toast.info(result.message);
				} else {
					toast.success(`PDF convertido: ${result.pages.length} página(s)`);
				}
			} else if (isImageFile(file)) {
				// Load single image
				const canvas = await loadImageToCanvas(file);

				// Validate canvas
				if (!canvas || canvas.width === 0 || canvas.height === 0) {
					throw new Error(
						"No se pudo cargar la imagen. Por favor, verifica que el archivo sea válido.",
					);
				}

				canvases = [canvas];
			} else {
				throw new Error(
					"Tipo de archivo no soportado. Por favor, usa JPG, PNG o PDF.",
				);
			}

			// Validate we have at least one canvas
			if (canvases.length === 0) {
				throw new Error(
					"No se pudo procesar el archivo. Por favor, intenta con otro archivo.",
				);
			}

			// Detect corners for each page
			const pageStates: PageState[] = [];

			for (const canvas of canvases) {
				try {
					const detection = await detectCorners(canvas);
					const corners = detection.success
						? detection.corners
						: getDefaultCorners(canvas.width, canvas.height);

					pageStates.push({
						canvas,
						corners,
						autoCorners: detection.corners,
						extractedCanvas: null,
						extractedBlob: null,
						quality: null,
						ocrResult: null,
						aiResult: null,
					});
				} catch (cornerErr) {
					Sentry.captureException(cornerErr);
					Sentry.logger.warn(
						Sentry.logger
							.fmt`Error detecting corners, using defaults: ${cornerErr}`,
					);
					// Use default corners if detection fails
					pageStates.push({
						canvas,
						corners: getDefaultCorners(canvas.width, canvas.height),
						autoCorners: null,
						extractedCanvas: null,
						extractedBlob: null,
						quality: null,
						ocrResult: null,
						aiResult: null,
					});
				}
			}

			// Validate we have at least one page state
			if (pageStates.length === 0) {
				throw new Error("No se pudo procesar ninguna página del documento.");
			}

			setPages(pageStates);
			setCurrentPageIndex(0);
			setStage("adjusting");
		} catch (err) {
			Sentry.captureException(err);
			Sentry.logger.error(Sentry.logger.fmt`Error processing file: ${err}`);
			const errorMessage =
				err instanceof Error ? err.message : "Error al procesar archivo";
			setError(errorMessage);
			toast.error(errorMessage);
			setStage("idle");
		} finally {
			setIsProcessing(false);
		}
	};

	const handleCornersChange = useCallback(
		(corners: CornerPoints) => {
			setPages((prev) => {
				const updated = [...prev];
				if (updated[currentPageIndex]) {
					updated[currentPageIndex] = {
						...updated[currentPageIndex],
						corners,
					};
				}
				return updated;
			});
		},
		[currentPageIndex],
	);

	const handleResetCorners = useCallback(() => {
		if (currentPage?.autoCorners) {
			handleCornersChange(currentPage.autoCorners);
			toast.info("Esquinas restauradas a detección automática");
		} else if (currentPage?.canvas) {
			handleCornersChange(
				getDefaultCorners(currentPage.canvas.width, currentPage.canvas.height),
			);
		}
	}, [currentPage, handleCornersChange]);

	const handleNextStage = useCallback(async () => {
		if (!currentPage?.corners) return;

		if (stage === "adjusting") {
			setStage("highlighting");
		} else if (stage === "highlighting") {
			// Extract document
			setIsProcessing(true);
			setStage("extracting");

			try {
				const result = await extractDocument(
					currentPage.canvas,
					currentPage.corners,
				);

				if (!result.success || !result.canvas || !result.blob) {
					throw new Error(result.message || "Error al extraer documento");
				}

				// Store canvas in local variable for type safety
				const extractedCanvas = result.canvas;
				const extractedBlob = result.blob;

				// Validate quality
				const quality = validateQuality(
					extractedCanvas,
					currentPage.corners,
					currentPage.canvas.width,
					currentPage.canvas.height,
				);

				setPages((prev) => {
					const updated = [...prev];
					updated[currentPageIndex] = {
						...updated[currentPageIndex],
						extractedCanvas,
						extractedBlob,
						quality,
					};
					return updated;
				});

				// Move to validation
				setStage("validating");
				setOcrProgress({
					stage: "Conectando con servicio de IA...",
					percent: 10,
				});

				// Try AI extraction first (more accurate), fall back to OCR
				try {
					Sentry.logger.info("[DocumentScanner] Starting field extraction...");

					// Check if AI service is available
					const aiAvailable = await isAIExtractionAvailable();
					Sentry.logger.info(
						`[DocumentScanner] AI service available: ${aiAvailable}`,
					);

					if (aiAvailable) {
						// Use AI extraction (primary method) - wrap in Sentry span
						await Sentry.startSpan(
							{
								name: "AI Document Extraction",
								op: "ai.extraction",
								attributes: { documentType },
							},
							async () => {
								setOcrProgress({
									stage: "Extrayendo datos con IA...",
									percent: 30,
								});
								const aiResult = await extractWithAI(
									extractedCanvas,
									documentType,
								);

								if (aiResult.success) {
									Sentry.logger.info(
										"[DocumentScanner] AI extraction complete",
									);

									setPages((prev) => {
										const updated = [...prev];
										updated[currentPageIndex] = {
											...updated[currentPageIndex],
											aiResult,
										};
										return updated;
									});

									// For INE documents, ALWAYS run OCR to extract MRZ fields from back side
									// Otherwise, only run OCR in dev mode for comparison
									if (isINEDocument || devMode) {
										setOcrProgress({
											stage: isINEDocument
												? "Extrayendo MRZ de INE..."
												: "Ejecutando OCR (modo dev)...",
											percent: 60,
										});
										const ocrResult = await performOCR(
											extractedCanvas,
											documentType,
											personalData,
											(stage, percent) => {
												setOcrProgress({ stage, percent: 60 + percent * 0.4 });
											},
										);

										setPages((prev) => {
											const updated = [...prev];
											updated[currentPageIndex] = {
												...updated[currentPageIndex],
												ocrResult,
											};
											return updated;
										});
									}
								} else {
									// AI failed, fall back to OCR
									Sentry.logger.warn(
										"[DocumentScanner] AI extraction failed, falling back to OCR",
									);
									throw new Error(aiResult.error || "AI extraction failed");
								}
							},
						);
					} else {
						// AI not available, use OCR
						Sentry.logger.info(
							"[DocumentScanner] AI not available, using OCR...",
						);
						throw new Error("AI service not available");
					}
				} catch (aiErr) {
					// Fall back to OCR
					Sentry.logger.info("[DocumentScanner] Falling back to OCR...");
					setOcrProgress({ stage: "Preprocesando imagen...", percent: 20 });

					try {
						await Sentry.startSpan(
							{
								name: "OCR Document Processing",
								op: "ocr.processing",
								attributes: { documentType },
							},
							async () => {
								const ocrResult = await performOCR(
									extractedCanvas,
									documentType,
									personalData,
									(stage, percent) => {
										setOcrProgress({ stage, percent });
									},
								);

								Sentry.logger.info(
									`[DocumentScanner] OCR complete: ${ocrResult.isValid ? "Valid" : "Invalid"}`,
								);

								setPages((prev) => {
									const updated = [...prev];
									updated[currentPageIndex] = {
										...updated[currentPageIndex],
										ocrResult,
									};
									return updated;
								});
							},
						);
					} catch (ocrErr) {
						Sentry.captureException(ocrErr);
						Sentry.logger.error(Sentry.logger.fmt`OCR error: ${ocrErr}`);
						// Show error but don't block - validation is optional
					}
				} finally {
					setOcrProgress(null);
				}

				// For INE documents, handle front/back flow
				if (isINEDocument && extractedCanvas && extractedBlob) {
					if (currentIneSide === "front") {
						// Save front side data
						const frontCanvas = extractedCanvas; // Capture for closure
						const frontBlob = extractedBlob;
						setIneState((prev) => ({
							...prev,
							front: {
								canvas: frontCanvas,
								blob: frontBlob,
								ocrResult: pages[currentPageIndex]?.ocrResult ?? null,
								aiResult: pages[currentPageIndex]?.aiResult ?? null,
							},
						}));

						// Go to waiting_for_back stage
						setCurrentIneSide("back");
						setStage("waiting_for_back");
						setPages([]); // Clear pages for back side processing
						return; // Don't go to complete yet
					} else {
						// Back side completed - combine data
						const frontData = ineState.front;
						const backOcr = pages[currentPageIndex]?.ocrResult;
						const backAi = pages[currentPageIndex]?.aiResult;
						const backCanvas = extractedCanvas; // Capture for closure
						const backBlob = extractedBlob;

						// Save back side data
						setIneState((prev) => ({
							...prev,
							back: {
								canvas: backCanvas,
								blob: backBlob,
								ocrResult: backOcr ?? null,
								aiResult: backAi ?? null,
							},
							combinedData: {
								// Prefer MRZ data from back side for key fields
								ineDocumentNumber: backOcr?.detectedFields?.ineDocumentNumber,
								fullName:
									backOcr?.detectedFields?.fullName ||
									frontData?.ocrResult?.detectedFields?.fullName,
								curp:
									frontData?.ocrResult?.detectedFields?.curp ||
									backOcr?.detectedFields?.curp,
								birthDate:
									backOcr?.detectedFields?.birthDate ||
									frontData?.ocrResult?.detectedFields?.birthDate,
								gender:
									backOcr?.detectedFields?.gender ||
									frontData?.ocrResult?.detectedFields?.gender,
								address: frontData?.ocrResult?.detectedFields?.address,
								expiryDate:
									backOcr?.detectedFields?.validity ||
									frontData?.ocrResult?.detectedFields?.validity,
							},
						}));
					}
				}

				setStage("complete");
			} catch (err) {
				Sentry.captureException(err);
				Sentry.logger.error(
					Sentry.logger.fmt`Error extracting document: ${err}`,
				);
				toast.error(
					err instanceof Error ? err.message : "Error al extraer documento",
				);
				setStage("highlighting");
			} finally {
				setIsProcessing(false);
			}
		}
	}, [
		stage,
		currentPage,
		currentPageIndex,
		documentType,
		personalData,
		devMode,
		isINEDocument,
		currentIneSide,
		ineState,
		pages,
	]);

	const handlePrevStage = useCallback(() => {
		if (stage === "highlighting") {
			setStage("adjusting");
		} else if (
			stage === "extracting" ||
			stage === "validating" ||
			stage === "complete"
		) {
			setStage("highlighting");
		}
	}, [stage]);

	const handleAccept = useCallback(() => {
		if (currentPage?.extractedBlob && currentPage?.extractedCanvas) {
			// Pass OCR result for prefilling form fields
			const ocrResult =
				currentPage.ocrResult ||
				(ineState.back?.ocrResult ?? ineState.front?.ocrResult);

			// For INE with both sides, pass INE-specific data
			let ineData: INEExtractionData | undefined;
			if (
				ineState.front?.canvas &&
				ineState.front?.blob &&
				ineState.back?.canvas &&
				ineState.back?.blob
			) {
				ineData = {
					frontBlob: ineState.front.blob,
					frontCanvas: ineState.front.canvas,
					backBlob: ineState.back.blob,
					backCanvas: ineState.back.canvas,
					ocrResult:
						ineState.back?.ocrResult ?? ineState.front?.ocrResult ?? undefined,
				};
			}

			// Return all extraction data
			const extractionData: DocumentExtractionData = {
				processedBlob: currentPage.extractedBlob,
				processedCanvas: currentPage.extractedCanvas,
				ocrResult: ocrResult ?? undefined,
				ineData,
				originalFile: originalFile ?? undefined,
				rasterizedImages:
					rasterizedImages.length > 0 ? rasterizedImages : undefined,
			};

			onExtracted(extractionData);
			onOpenChange(false);
		}
	}, [
		currentPage,
		onExtracted,
		onOpenChange,
		ineState,
		originalFile,
		rasterizedImages,
	]);

	const handleClose = useCallback(() => {
		onOpenChange(false);
	}, [onOpenChange]);

	// Note: highlighting is now handled directly by ScannerCanvas
	// when showHighlight={true}, so we don't need highlightedCanvas anymore

	// Render content based on stage
	const renderContent = () => {
		// Show OpenCV loading state
		if (isOpenCVLoading || !isOpenCVLoaded) {
			return (
				<div className="flex flex-col items-center justify-center py-20">
					<Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
					<p className="text-muted-foreground">Cargando...</p>
					<p className="text-xs text-muted-foreground mt-1">
						Esto puede tardar unos segundos la primera vez
					</p>
				</div>
			);
		}

		// Show OpenCV error
		if (openCVError) {
			return (
				<div className="flex flex-col items-center justify-center py-20">
					<AlertCircle className="h-12 w-12 text-destructive mb-4" />
					<p className="text-destructive font-medium">
						Error al cargar módulo CV
					</p>
					<p className="text-sm text-muted-foreground mt-1">{openCVError}</p>
					<Button onClick={handleClose} className="mt-4" variant="outline">
						Cerrar
					</Button>
				</div>
			);
		}

		if (isProcessing && stage === "detecting") {
			return (
				<div className="flex flex-col items-center justify-center py-20">
					<Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
					<p className="text-muted-foreground">Procesando imagen...</p>
					<p className="text-xs text-muted-foreground mt-1">
						Detectando esquinas del documento
					</p>
				</div>
			);
		}

		if (error) {
			return (
				<div className="flex flex-col items-center justify-center py-20">
					<AlertCircle className="h-12 w-12 text-destructive mb-4" />
					<p className="text-destructive font-medium">Error</p>
					<p className="text-sm text-muted-foreground mt-1">{error}</p>
					<Button onClick={handleClose} className="mt-4" variant="outline">
						Cerrar
					</Button>
				</div>
			);
		}

		// INE: Waiting for back side - show front preview and upload button
		if (stage === "waiting_for_back" && ineState.front) {
			return (
				<div className="space-y-6">
					{/* Progress indicator */}
					<div className="flex items-center justify-center gap-4">
						<div className="flex items-center gap-2">
							<div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
								<Check className="w-4 h-4" />
							</div>
							<span className="text-sm font-medium">Frente</span>
						</div>
						<div className="w-8 border-t border-dashed border-muted-foreground" />
						<div className="flex items-center gap-2">
							<div className="w-8 h-8 rounded-full border-2 border-primary text-primary flex items-center justify-center text-sm font-medium">
								2
							</div>
							<span className="text-sm font-medium text-primary">Reverso</span>
						</div>
					</div>

					{/* Front side preview */}
					<div className="space-y-2">
						<p className="text-sm text-muted-foreground text-center">
							Frente de la INE capturado
						</p>
						<div className="relative bg-black/90 rounded-lg overflow-hidden">
							<SimpleImagePreview canvas={ineState.front.canvas} />
							<div className="absolute top-2 right-2">
								<Badge variant="default" className="bg-green-500">
									<Check className="w-3 h-3 mr-1" />
									Listo
								</Badge>
							</div>
						</div>
					</div>

					{/* Back side upload prompt */}
					<div className="space-y-4">
						<div className="text-center space-y-1">
							<p className="font-medium">Ahora captura el reverso</p>
							<p className="text-sm text-muted-foreground">
								El reverso contiene el código MRZ con información importante
							</p>
						</div>

						{/* Hidden file input */}
						<input
							ref={backSideInputRef}
							type="file"
							accept="image/*,.pdf"
							onChange={handleBackSideFileSelect}
							className="hidden"
						/>

						{/* Upload buttons */}
						<div className="flex flex-col gap-3">
							<Button
								onClick={() => backSideInputRef.current?.click()}
								className="w-full"
								size="lg"
							>
								<ImageIcon className="w-4 h-4 mr-2" />
								Seleccionar imagen del reverso
							</Button>

							{/* Camera option for mobile */}
							<Button
								onClick={() => {
									// Create a temporary file input with capture attribute
									const input = document.createElement("input");
									input.type = "file";
									input.accept = "image/*";
									input.capture = "environment";
									input.onchange = (e) => {
										const file = (e.target as HTMLInputElement).files?.[0];
										if (file) setBackSideFile(file);
									};
									input.click();
								}}
								variant="outline"
								className="w-full"
								size="lg"
							>
								<Camera className="w-4 h-4 mr-2" />
								Tomar foto con cámara
							</Button>
						</div>
					</div>
				</div>
			);
		}

		if (!currentPage) {
			return (
				<div className="flex flex-col items-center justify-center py-20">
					<FileText className="h-12 w-12 text-muted-foreground mb-4" />
					<p className="text-muted-foreground">No hay documento cargado</p>
				</div>
			);
		}

		// Show extracted result
		if (stage === "complete" && currentPage.extractedCanvas) {
			// Check if this is INE with both sides captured
			const hasINEBothSides = isINEDocument && ineState.front && ineState.back;

			return (
				<div className="space-y-4">
					{/* Quality warnings */}
					{currentPage.quality && !currentPage.quality.isValid && (
						<Alert variant="destructive">
							<AlertCircle className="h-4 w-4" />
							<AlertDescription>
								<ul className="list-disc list-inside">
									{currentPage.quality.issues.map((issue, i) => (
										<li key={i}>{issue}</li>
									))}
								</ul>
							</AlertDescription>
						</Alert>
					)}

					{/* INE: Show both sides */}
					{hasINEBothSides ? (
						<div className="space-y-3">
							<div className="grid grid-cols-2 gap-3">
								{/* Front side */}
								<div className="space-y-1">
									<p className="text-xs text-muted-foreground text-center">
										Frente
									</p>
									<div className="relative bg-black/90 rounded-lg overflow-hidden flex items-center justify-center min-h-[150px] sm:min-h-[200px]">
										<SimpleImagePreview canvas={ineState.front!.canvas} />
									</div>
								</div>
								{/* Back side */}
								<div className="space-y-1">
									<p className="text-xs text-muted-foreground text-center">
										Reverso
									</p>
									<div className="relative bg-black/90 rounded-lg overflow-hidden flex items-center justify-center min-h-[150px] sm:min-h-[200px]">
										<SimpleImagePreview canvas={ineState.back!.canvas} />
									</div>
								</div>
							</div>

							{/* Combined INE data display */}
							{ineState.combinedData && (
								<INECombinedDisplay
									combinedData={ineState.combinedData}
									onSecretClick={handleSecretClick}
									devMode={devMode}
								/>
							)}
						</div>
					) : (
						/* Regular single-side preview */
						<div className="relative bg-black/90 rounded-lg overflow-hidden flex items-center justify-center min-h-[250px] sm:min-h-[400px]">
							<SimpleImagePreview canvas={currentPage.extractedCanvas} />
						</div>
					)}

					{/* MRZ validation badges */}
					{currentPage.ocrResult && (
						<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
							{currentPage.ocrResult.mrzData?.success && (
								<Badge
									variant="outline"
									className={cn(
										"text-xs",
										currentPage.ocrResult.mrzData.confidence >= 0.8
											? "border-green-500 text-green-600"
											: currentPage.ocrResult.mrzData.confidence >= 0.5
												? "border-yellow-500 text-yellow-600"
												: "border-red-500 text-red-600",
									)}
								>
									MRZ:{" "}
									{(currentPage.ocrResult.mrzData.confidence * 100).toFixed(0)}%
								</Badge>
							)}
							{currentPage.ocrResult.documentTypeConfidence !== undefined && (
								<Badge
									variant="outline"
									className={cn(
										"text-xs",
										currentPage.ocrResult.documentTypeConfidence >= 0.8
											? "border-green-500 text-green-600"
											: currentPage.ocrResult.documentTypeConfidence >= 0.5
												? "border-yellow-500 text-yellow-600"
												: "border-red-500 text-red-600",
									)}
								>
									Doc:{" "}
									{(currentPage.ocrResult.documentTypeConfidence * 100).toFixed(
										0,
									)}
									%
								</Badge>
							)}
						</div>
					)}

					{/* Quality info - only show details in dev mode, but always show if quality is bad */}
					{currentPage.quality && (devMode || !currentPage.quality.isValid) && (
						<div className="flex items-center gap-4 text-sm text-muted-foreground">
							{devMode && (
								<span>
									Resolución: {currentPage.quality.resolution.width} x{" "}
									{currentPage.quality.resolution.height}
								</span>
							)}
							<Badge
								variant={
									currentPage.quality.isValid ? "default" : "destructive"
								}
							>
								{currentPage.quality.isValid ? "Calidad OK" : "Calidad Baja"}
							</Badge>
						</div>
					)}

					{/* AI Extraction Results (for regular users) */}
					{currentPage.aiResult?.success && (
						<AIExtractionDisplay
							aiResult={currentPage.aiResult}
							onSecretClick={handleSecretClick}
							devMode={devMode}
						/>
					)}

					{/* OCR Validation Result (fallback or dev mode) */}
					{currentPage.ocrResult && !currentPage.aiResult?.success && (
						<div className="space-y-3">
							<Alert
								variant={
									currentPage.ocrResult.isValid ? "default" : "destructive"
								}
							>
								<AlertCircle className="h-4 w-4" />
								<AlertDescription>
									<div className="space-y-1">
										<p className="font-medium">
											{currentPage.ocrResult.isValid
												? "✓ Documento validado"
												: "⚠ Validación OCR"}
										</p>
										<p className="text-sm">{currentPage.ocrResult.message}</p>
										{/* Easter egg: tap 5 times to enable dev mode */}
										<p
											className="text-xs text-muted-foreground cursor-default select-none"
											onClick={handleSecretClick}
										>
											{devMode && "🔧 "} Confianza OCR:{" "}
											{currentPage.ocrResult.confidence.toFixed(0)}%
										</p>
									</div>
								</AlertDescription>
							</Alert>

							{/* Document Fields Accordion - Dev mode only (OCR details are noisy for regular users) */}
							{devMode && (
								<Accordion
									type="single"
									collapsible
									defaultValue="fields"
									className="w-full"
								>
									<AccordionItem value="fields" className="border rounded-lg">
										<AccordionTrigger className="px-3 py-2 hover:no-underline">
											<div className="flex items-center gap-2">
												<span className="text-sm font-medium">
													🔧 Campos Extraídos (OCR)
												</span>
												<Badge variant="outline" className="text-xs">
													{currentPage.ocrResult.foundFields.length} encontrados
												</Badge>
												{currentPage.ocrResult.missingFields.length > 0 && (
													<Badge variant="secondary" className="text-xs">
														{currentPage.ocrResult.missingFields.length}{" "}
														faltantes
													</Badge>
												)}
											</div>
										</AccordionTrigger>
										<AccordionContent className="px-3 pb-3">
											<div className="space-y-3">
												{/* Document Type Badge */}
												<div className="flex items-center gap-2">
													<Badge variant="outline">
														{currentPage.ocrResult.documentType === "PASSPORT"
															? "Pasaporte"
															: currentPage.ocrResult.documentType === "INE"
																? "INE/IFE"
																: "Documento"}
													</Badge>
													<span className="text-xs text-muted-foreground">
														Confianza:{" "}
														{currentPage.ocrResult.confidence.toFixed(0)}%
													</span>
												</div>

												{/* All Fields Grid */}
												<div className="grid grid-cols-1 gap-2 text-sm">
													{/* Common Fields */}
													<FieldRow
														label="Nombre Completo"
														value={
															currentPage.ocrResult.detectedFields.fullName
														}
														found={
															!!currentPage.ocrResult.detectedFields.fullName
														}
													/>
													<FieldRow
														label="CURP"
														value={currentPage.ocrResult.detectedFields.curp}
														found={!!currentPage.ocrResult.detectedFields.curp}
													/>
													<FieldRow
														label="Fecha de Nacimiento"
														value={
															currentPage.ocrResult.detectedFields.birthDate
														}
														found={
															!!currentPage.ocrResult.detectedFields.birthDate
														}
													/>
													<FieldRow
														label="Sexo"
														value={
															currentPage.ocrResult.detectedFields.gender
																? currentPage.ocrResult.detectedFields
																		.gender === "M"
																	? "Masculino"
																	: "Femenino"
																: undefined
														}
														found={
															!!currentPage.ocrResult.detectedFields.gender
														}
													/>

													{/* Passport-specific Fields */}
													{currentPage.ocrResult.documentType ===
														"PASSPORT" && (
														<>
															<FieldRow
																label="Número de Pasaporte"
																value={
																	currentPage.ocrResult.detectedFields
																		.passportNumber
																}
																found={
																	!!currentPage.ocrResult.detectedFields
																		.passportNumber
																}
																critical
															/>
															<FieldRow
																label="Nacionalidad"
																value={
																	currentPage.ocrResult.detectedFields
																		.nationality
																}
																found={
																	!!currentPage.ocrResult.detectedFields
																		.nationality
																}
															/>
															<FieldRow
																label="Fecha de Expedición"
																value={
																	currentPage.ocrResult.detectedFields.issueDate
																}
																found={
																	!!currentPage.ocrResult.detectedFields
																		.issueDate
																}
															/>
															<FieldRow
																label="Fecha de Expiración"
																value={
																	currentPage.ocrResult.detectedFields
																		.expiryDate
																}
																found={
																	!!currentPage.ocrResult.detectedFields
																		.expiryDate
																}
																expired={currentPage.ocrResult.isExpired}
															/>
														</>
													)}

													{/* INE-specific Fields */}
													{currentPage.ocrResult.documentType !==
														"PASSPORT" && (
														<>
															<FieldRow
																label="No. Documento INE"
																value={
																	currentPage.ocrResult.detectedFields
																		.ineDocumentNumber
																}
																found={
																	!!currentPage.ocrResult.detectedFields
																		.ineDocumentNumber
																}
																critical
															/>
															<FieldRow
																label="Domicilio"
																value={
																	currentPage.ocrResult.detectedFields.address
																}
																found={
																	!!currentPage.ocrResult.detectedFields.address
																}
															/>
															<FieldRow
																label="Sección"
																value={
																	currentPage.ocrResult.detectedFields.section
																}
																found={
																	!!currentPage.ocrResult.detectedFields.section
																}
															/>
															<FieldRow
																label="Vigencia"
																value={
																	currentPage.ocrResult.detectedFields.validity
																		? currentPage.ocrResult.detectedFields.validity.endsWith(
																				"-12-31",
																			)
																			? `Hasta ${currentPage.ocrResult.detectedFields.validity.substring(0, 4)}`
																			: currentPage.ocrResult.detectedFields
																					.validity
																		: undefined
																}
																found={
																	!!currentPage.ocrResult.detectedFields
																		.validity
																}
																expired={currentPage.ocrResult.isExpired}
															/>
														</>
													)}
												</div>
											</div>
										</AccordionContent>
									</AccordionItem>

									{/* Comparisons Accordion (if personal data provided) */}
									{currentPage.ocrResult.comparisons.length > 0 && (
										<AccordionItem
											value="comparisons"
											className="border rounded-lg mt-2"
										>
											<AccordionTrigger className="px-3 py-2 hover:no-underline">
												<div className="flex items-center gap-2">
													<span className="text-sm font-medium">
														Comparación con Datos
													</span>
													{(() => {
														const matches =
															currentPage.ocrResult.comparisons.filter(
																(c) => c.matches === true,
															).length;
														const total =
															currentPage.ocrResult.comparisons.filter(
																(c) => c.matches !== null,
															).length;
														return (
															<Badge
																variant={
																	matches === total ? "default" : "secondary"
																}
																className={cn(
																	"text-xs",
																	matches === total && "bg-green-500",
																)}
															>
																{matches}/{total} coinciden
															</Badge>
														);
													})()}
												</div>
											</AccordionTrigger>
											<AccordionContent className="px-3 pb-3">
												<div className="space-y-1">
													{currentPage.ocrResult.comparisons.map(
														(comparison) => (
															<div
																key={comparison.field}
																className={cn(
																	"flex items-center justify-between text-sm p-2 rounded",
																	comparison.matches === true &&
																		"bg-green-500/10",
																	comparison.matches === false &&
																		"bg-red-500/10",
																	comparison.matches === null && "bg-muted/50",
																)}
															>
																<div className="flex-1 min-w-0">
																	<span className="text-muted-foreground">
																		{comparison.label}:
																	</span>
																	<div className="flex flex-col sm:flex-row sm:gap-4 text-xs">
																		<span className="truncate">
																			<span className="text-muted-foreground">
																				Doc:
																			</span>{" "}
																			<span className="font-mono">
																				{comparison.extractedValue || "—"}
																			</span>
																		</span>
																		<span className="truncate">
																			<span className="text-muted-foreground">
																				Esperado:
																			</span>{" "}
																			<span className="font-mono">
																				{comparison.expectedValue || "—"}
																			</span>
																		</span>
																	</div>
																</div>
																<div className="ml-2 shrink-0">
																	{comparison.matches === true && (
																		<CheckCircle2 className="h-4 w-4 text-green-500" />
																	)}
																	{comparison.matches === false && (
																		<XCircle className="h-4 w-4 text-destructive" />
																	)}
																	{comparison.matches === null && (
																		<span className="text-muted-foreground">
																			?
																		</span>
																	)}
																</div>
															</div>
														),
													)}
												</div>
											</AccordionContent>
										</AccordionItem>
									)}
								</Accordion>
							)}
						</div>
					)}
				</div>
			);
		}

		// Show scanner canvas
		return (
			<ScannerCanvas
				sourceCanvas={currentPage.canvas}
				corners={currentPage.corners}
				onCornersChange={handleCornersChange}
				adjustable={stage === "adjusting"}
				showHighlight={stage === "highlighting"}
				className="min-h-[250px] sm:min-h-[400px] max-h-[50vh] sm:max-h-[60vh] flex-1"
			/>
		);
	};

	// Render action buttons based on stage
	const renderActions = () => {
		if (isProcessing) {
			return (
				<Button disabled>
					<Loader2 className="h-4 w-4 mr-2 animate-spin" />
					Procesando...
				</Button>
			);
		}

		// For waiting_for_back, show only cancel button (main actions are in content)
		if (stage === "waiting_for_back") {
			return (
				<div className="flex items-center justify-end w-full">
					<Button
						variant="outline"
						size="sm"
						onClick={handleClose}
						className="px-2 sm:px-4"
					>
						<span className="hidden sm:inline">Cancelar</span>
						<span className="sm:hidden">✕</span>
					</Button>
				</div>
			);
		}

		if (error || !currentPage) {
			return null;
		}

		return (
			<div className="flex items-center justify-between w-full gap-2">
				<div className="flex items-center gap-1 sm:gap-2">
					{stage === "adjusting" && (
						<Button
							variant="outline"
							size="sm"
							onClick={handleResetCorners}
							className="px-2 sm:px-3"
						>
							<RotateCcw className="h-4 w-4 sm:mr-2" />
							<span className="hidden sm:inline">Restablecer</span>
						</Button>
					)}

					{(stage === "highlighting" || stage === "complete") && (
						<Button
							variant="outline"
							size="sm"
							onClick={handlePrevStage}
							className="px-2 sm:px-3"
						>
							<ChevronLeft className="h-4 w-4 sm:mr-2" />
							<span className="hidden sm:inline">Atrás</span>
						</Button>
					)}
				</div>

				<div className="flex items-center gap-1 sm:gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={handleClose}
						className="px-2 sm:px-4"
					>
						<span className="hidden sm:inline">Cancelar</span>
						<span className="sm:hidden">✕</span>
					</Button>

					{stage === "adjusting" && (
						<Button
							size="sm"
							onClick={handleNextStage}
							className="px-3 sm:px-4"
						>
							<span className="hidden sm:inline">Siguiente</span>
							<span className="sm:hidden">→</span>
							<ChevronRight className="h-4 w-4 ml-1 hidden sm:inline" />
						</Button>
					)}

					{stage === "highlighting" && (
						<Button
							size="sm"
							onClick={handleNextStage}
							className="px-3 sm:px-4"
						>
							<span className="hidden sm:inline">Extraer</span>
							<span className="sm:hidden">Extraer</span>
							<ChevronRight className="h-4 w-4 ml-1" />
						</Button>
					)}

					{stage === "complete" && (
						<Button
							size="sm"
							onClick={handleAccept}
							disabled={
								currentPage.quality ? !currentPage.quality.isValid : false
							}
							className="px-3 sm:px-4"
						>
							<Check className="h-4 w-4 sm:mr-2" />
							<span className="hidden sm:inline">Aceptar</span>
						</Button>
					)}
				</div>
			</div>
		);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl max-h-[90vh] flex flex-col sm:max-h-[90vh] max-sm:h-dvh max-sm:max-h-dvh max-sm:w-full max-sm:max-w-full max-sm:rounded-none max-sm:border-0 max-sm:p-4">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<ImageIcon className="h-5 w-5" />
						Procesar{" "}
						{isINEDocument
							? `INE/IFE (${currentIneSide === "front" ? "Frente" : "Reverso"})`
							: documentType}
					</DialogTitle>
					<DialogDescription>
						{!isOpenCVLoaded &&
							"Cargando librería de procesamiento de documentos..."}
						{isOpenCVLoaded &&
							stage === "idle" &&
							(isINEDocument
								? currentIneSide === "front"
									? "Escanea el FRENTE de tu INE (lado con tu foto)"
									: "Ahora escanea el REVERSO de tu INE (lado con el código de barras y MRZ)"
								: "Preparando...")}
						{isOpenCVLoaded &&
							stage === "detecting" &&
							"Detectando esquinas del documento..."}
						{isOpenCVLoaded &&
							stage === "adjusting" &&
							(isINEDocument
								? `Ajusta las esquinas del ${currentIneSide === "front" ? "frente" : "reverso"} de la INE`
								: "Ajusta las esquinas del documento arrastrando los puntos")}
						{isOpenCVLoaded &&
							stage === "highlighting" &&
							"Previsualiza el área seleccionada del documento"}
						{isOpenCVLoaded &&
							stage === "extracting" &&
							"Extrayendo documento..."}
						{isOpenCVLoaded &&
							stage === "validating" &&
							(ocrProgress
								? `${ocrProgress.stage} (${ocrProgress.percent}%)`
								: "Validando texto del documento con OCR...")}
						{isOpenCVLoaded &&
							stage === "waiting_for_back" &&
							"Frente capturado ✓ — Ahora necesitamos el reverso de la INE"}
						{isOpenCVLoaded &&
							stage === "complete" &&
							(isINEDocument && ineState.front && ineState.back
								? "Revisa ambos lados de la INE extraídos"
								: "Revisa el documento extraído antes de continuar")}
					</DialogDescription>
				</DialogHeader>

				{/* Steps indicator - hide during waiting_for_back since it has its own progress UI */}
				{stage !== "idle" && stage !== "waiting_for_back" && !error && (
					<div className="py-4 border-b">
						<ScannerSteps currentStage={stage} />
					</div>
				)}

				{/* Page indicator for PDFs */}
				{pages.length > 1 && (
					<div className="flex items-center justify-center gap-2 py-2">
						<Button
							variant="ghost"
							size="icon"
							disabled={currentPageIndex === 0}
							onClick={() => setCurrentPageIndex((i) => i - 1)}
						>
							<ChevronLeft className="h-4 w-4" />
						</Button>
						<span className="text-sm text-muted-foreground">
							Página {currentPageIndex + 1} de {pages.length}
						</span>
						<Button
							variant="ghost"
							size="icon"
							disabled={currentPageIndex === pages.length - 1}
							onClick={() => setCurrentPageIndex((i) => i + 1)}
						>
							<ChevronRight className="h-4 w-4" />
						</Button>
					</div>
				)}

				{/* Main content area */}
				<div className="flex-1 overflow-auto py-4 px-2">{renderContent()}</div>

				{/* Actions */}
				<div className="flex justify-end gap-2 px-3 py-2 border-t">
					{renderActions()}
				</div>
			</DialogContent>
		</Dialog>
	);
}
