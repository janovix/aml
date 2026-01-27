"use client";

import * as React from "react";
import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	FileText,
	CheckCircle2,
	X,
	Loader2,
	ExternalLink,
	CreditCard,
	BookOpen,
	Info,
	Scan,
	ImageIcon,
	ZoomIn,
	ChevronLeft,
	ChevronRight,
	Check,
} from "lucide-react";
import { toast } from "sonner";
import type { ClientDocumentType } from "@/types/client-document";
import {
	DocumentScannerModal,
	MobileUploadQR,
	type DocumentExtractionData,
} from "@/components/document-scanner";
import type { PersonalData, OCRResult } from "@/lib/document-scanner";

export type IDType = "NATIONAL_ID" | "PASSPORT";

export interface IDDocumentData {
	idType: IDType;
	documentType: ClientDocumentType;
	/** IDMEX number for INE, passport number for passport */
	documentNumber: string;
	expiryDate?: string;
	/** Single file for passport, front side for INE */
	file?: File;
	processedBlob?: Blob;
	/** Back side file for INE */
	backFile?: File;
	backProcessedBlob?: Blob;
	/** Preview URLs */
	frontPreview?: string;
	backPreview?: string;
	/** OCR result for validation display */
	ocrResult?: OCRResult;
	/** Original source file (e.g., PDF before rasterization) */
	originalFile?: File;
	/** Rasterized images from PDF */
	rasterizedImages?: Blob[];
	/** INE front image (separate from processed) */
	ineFrontBlob?: Blob;
	/** INE back image (separate from processed) */
	ineBackBlob?: Blob;
	isUploaded: boolean;
	isUploading: boolean;
}

interface IDDocumentSelectorProps {
	required?: boolean;
	disabled?: boolean;
	data: IDDocumentData | null;
	onDataChange: (data: IDDocumentData) => void;
	onUpload: (data: IDDocumentData) => Promise<void>;
	/** Client ID for mobile upload session */
	clientId?: string;
	className?: string;
	/** Label for this selector (default: "Identificación Oficial") */
	label?: string;
	/** Personal data for OCR validation */
	personalData?: PersonalData;
}

const FILE_ACCEPT = "application/pdf,image/*";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ID_TYPE_CONFIG: Record<
	IDType,
	{
		label: string;
		description: string;
		icon: React.ElementType;
		helpText: string;
		helpUrl?: string;
		placeholder: string;
		numberLabel: string;
	}
> = {
	NATIONAL_ID: {
		label: "INE/IFE",
		description: "Credencial para Votar del INE",
		icon: CreditCard,
		helpText:
			'El número IDMEX se encuentra en la zona MRZ del reverso de tu credencial, después de "IDMEX".',
		helpUrl: "https://ine.mx/conoce-tu-credencial-para-votar/",
		placeholder: "Número IDMEX (10 dígitos)",
		numberLabel: "IDMEX",
	},
	PASSPORT: {
		label: "Pasaporte",
		description: "Pasaporte mexicano vigente",
		icon: BookOpen,
		helpText:
			"El número de pasaporte se encuentra en la página de datos, generalmente tiene 9 caracteres.",
		placeholder: "Número de pasaporte",
		numberLabel: "Número de Pasaporte",
	},
};

export function IDDocumentSelector({
	required = true,
	disabled = false,
	data,
	onDataChange,
	onUpload,
	clientId,
	className,
	label = "Identificación Oficial",
	personalData,
}: IDDocumentSelectorProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const backFileInputRef = useRef<HTMLInputElement>(null);
	const [localData, setLocalData] = useState<Partial<IDDocumentData>>({
		idType: data?.idType || "NATIONAL_ID",
		documentType: data?.documentType || "NATIONAL_ID",
		documentNumber: data?.documentNumber || "",
		expiryDate: data?.expiryDate || "",
		file: data?.file,
		processedBlob: data?.processedBlob,
		backFile: data?.backFile,
		backProcessedBlob: data?.backProcessedBlob,
		frontPreview: data?.frontPreview,
		backPreview: data?.backPreview,
		ocrResult: data?.ocrResult,
		isUploaded: data?.isUploaded || false,
		isUploading: false,
	});

	// Scanner modal state
	const [scannerOpen, setScannerOpen] = useState(false);
	const [scannerFile, setScannerFile] = useState<File | null>(null);
	/** Which side we're scanning for INE */
	const [scanningSide, setScanningSide] = useState<"front" | "back">("front");

	// QR modal state
	const [qrModalOpen, setQrModalOpen] = useState(false);

	// Enlarge preview modal with gallery navigation
	const [enlargePreview, setEnlargePreview] = useState<{
		open: boolean;
		currentIndex: number;
	}>({ open: false, currentIndex: 0 });

	const currentConfig = ID_TYPE_CONFIG[localData.idType || "NATIONAL_ID"];
	const isINE = localData.idType === "NATIONAL_ID";

	// Build gallery images array
	const galleryImages = React.useMemo(() => {
		const images: { src: string; title: string }[] = [];
		if (localData.frontPreview) {
			images.push({
				src: localData.frontPreview,
				title: isINE ? "Frente de INE" : "Pasaporte",
			});
		}
		if (localData.backPreview && isINE) {
			images.push({
				src: localData.backPreview,
				title: "Reverso de INE",
			});
		}
		return images;
	}, [localData.frontPreview, localData.backPreview, isINE]);

	const handleIdTypeChange = useCallback(
		(value: IDType) => {
			const newData: Partial<IDDocumentData> = {
				idType: value,
				documentType: value as ClientDocumentType,
				// Reset all data when type changes
				documentNumber: "",
				expiryDate: "",
				file: undefined,
				processedBlob: undefined,
				backFile: undefined,
				backProcessedBlob: undefined,
				frontPreview: undefined,
				backPreview: undefined,
				ocrResult: undefined,
				isUploaded: false,
				isUploading: false,
			};
			setLocalData(newData);
			onDataChange(newData as IDDocumentData);
		},
		[onDataChange],
	);

	const handleFileSelect = useCallback(
		(
			e: React.ChangeEvent<HTMLInputElement>,
			side: "front" | "back" = "front",
		) => {
			const file = e.target.files?.[0];
			if (!file) return;

			// Validate file type
			const isPdf = file.type === "application/pdf";
			const isImage = file.type.startsWith("image/");

			if (!isPdf && !isImage) {
				toast.error("Solo se permiten archivos PDF o imágenes");
				return;
			}

			// Validate file size
			if (file.size > MAX_FILE_SIZE) {
				toast.error("El archivo no puede exceder 10MB");
				return;
			}

			// Open scanner modal for processing
			setScannerFile(file);
			setScanningSide(side);
			setScannerOpen(true);

			// Reset file input
			if (side === "front" && fileInputRef.current) {
				fileInputRef.current.value = "";
			} else if (side === "back" && backFileInputRef.current) {
				backFileInputRef.current.value = "";
			}
		},
		[],
	);

	const handleScannerExtracted = useCallback(
		(extractionData: DocumentExtractionData) => {
			let newData: Partial<IDDocumentData>;

			// If we have INE data with both sides, use that
			if (isINE && extractionData.ineData) {
				const ineData = extractionData.ineData;
				const frontPreviewUrl = ineData.frontCanvas.toDataURL(
					"image/jpeg",
					0.92,
				);
				const backPreviewUrl = ineData.backCanvas.toDataURL("image/jpeg", 0.92);

				const frontFile = new File(
					[ineData.frontBlob],
					`${localData.idType}_front_processed.jpg`,
					{ type: "image/jpeg" },
				);
				const backFile = new File(
					[ineData.backBlob],
					`${localData.idType}_back_processed.jpg`,
					{ type: "image/jpeg" },
				);

				newData = {
					...localData,
					file: frontFile,
					processedBlob: ineData.frontBlob,
					frontPreview: frontPreviewUrl,
					backFile: backFile,
					backProcessedBlob: ineData.backBlob,
					backPreview: backPreviewUrl,
					ocrResult: ineData.ocrResult,
					originalFile: extractionData.originalFile,
					rasterizedImages: extractionData.rasterizedImages,
					ineFrontBlob: ineData.frontBlob,
					ineBackBlob: ineData.backBlob,
				};

				// Prefill from MRZ (typically on back)
				if (ineData.ocrResult?.detectedFields?.ineDocumentNumber) {
					newData.documentNumber =
						ineData.ocrResult.detectedFields.ineDocumentNumber;
				}
				if (
					ineData.ocrResult?.mrzData?.expiryDate ||
					ineData.ocrResult?.detectedFields?.validity
				) {
					newData.expiryDate =
						ineData.ocrResult.mrzData?.expiryDate ||
						ineData.ocrResult.detectedFields?.validity;
				}
			} else {
				// Single document (passport or single side)
				const previewUrl = extractionData.processedCanvas.toDataURL(
					"image/jpeg",
					0.92,
				);
				const processedFile = new File(
					[extractionData.processedBlob],
					`${localData.idType}_processed.jpg`,
					{ type: "image/jpeg" },
				);

				newData = {
					...localData,
					file: processedFile,
					processedBlob: extractionData.processedBlob,
					frontPreview: previewUrl,
					ocrResult: extractionData.ocrResult,
					originalFile: extractionData.originalFile,
					rasterizedImages: extractionData.rasterizedImages,
				};

				// Prefill from OCR for passport
				if (extractionData.ocrResult?.detectedFields?.passportNumber) {
					newData.documentNumber =
						extractionData.ocrResult.detectedFields.passportNumber;
				}
				if (
					extractionData.ocrResult?.mrzData?.expiryDate ||
					extractionData.ocrResult?.detectedFields?.expiryDate
				) {
					newData.expiryDate =
						extractionData.ocrResult.mrzData?.expiryDate ||
						extractionData.ocrResult.detectedFields?.expiryDate;
				}
			}

			setLocalData(newData);
			onDataChange({
				idType: localData.idType || "NATIONAL_ID",
				documentType: localData.documentType || "NATIONAL_ID",
				documentNumber:
					newData.documentNumber || localData.documentNumber || "",
				expiryDate: newData.expiryDate || localData.expiryDate,
				file: newData.file,
				processedBlob: newData.processedBlob,
				backFile: newData.backFile,
				backProcessedBlob: newData.backProcessedBlob,
				frontPreview: newData.frontPreview,
				backPreview: newData.backPreview,
				ocrResult: newData.ocrResult,
				originalFile: newData.originalFile,
				rasterizedImages: newData.rasterizedImages,
				ineFrontBlob: newData.ineFrontBlob,
				ineBackBlob: newData.ineBackBlob,
				isUploaded: false,
				isUploading: false,
			});

			toast.success("Identificación procesada exitosamente");
			setScannerFile(null);
		},
		[localData, onDataChange, isINE],
	);

	const handleRemoveFile = useCallback(
		(side: "front" | "back" = "front") => {
			let newData: Partial<IDDocumentData>;

			if (side === "back") {
				newData = {
					...localData,
					backFile: undefined,
					backProcessedBlob: undefined,
					backPreview: undefined,
				};
				if (backFileInputRef.current) {
					backFileInputRef.current.value = "";
				}
			} else {
				newData = {
					...localData,
					file: undefined,
					processedBlob: undefined,
					frontPreview: undefined,
				};
				if (fileInputRef.current) {
					fileInputRef.current.value = "";
				}
			}

			newData.isUploaded = false;
			setLocalData(newData);
			onDataChange({
				idType: localData.idType || "NATIONAL_ID",
				documentType: localData.documentType || "NATIONAL_ID",
				documentNumber: localData.documentNumber || "",
				expiryDate: localData.expiryDate,
				file: newData.file,
				processedBlob: newData.processedBlob,
				backFile: newData.backFile,
				backProcessedBlob: newData.backProcessedBlob,
				frontPreview: newData.frontPreview,
				backPreview: newData.backPreview,
				ocrResult: localData.ocrResult,
				isUploaded: false,
				isUploading: false,
			});
		},
		[localData, onDataChange],
	);

	const handleInputChange = useCallback(
		(field: "documentNumber" | "expiryDate", value: string) => {
			const newData = { ...localData, [field]: value };
			setLocalData(newData);
			// Preserve all fields including back files, previews, OCR, original/rasterized data
			onDataChange({
				...localData,
				idType: localData.idType || "NATIONAL_ID",
				documentType: localData.documentType || "NATIONAL_ID",
				documentNumber: localData.documentNumber || "",
				[field]: value,
				isUploading: false,
			} as IDDocumentData);
		},
		[localData, onDataChange],
	);

	const validateDocumentNumber = useCallback((): boolean => {
		const docNum = localData.documentNumber?.trim() || "";

		if (localData.idType === "NATIONAL_ID") {
			// INE IDMEX: typically 10 digits
			if (docNum.length < 8 || docNum.length > 15) {
				toast.error("El número IDMEX debe tener entre 8 y 15 caracteres");
				return false;
			}
			if (!/^[A-Z0-9]+$/i.test(docNum)) {
				toast.error("El número IDMEX solo debe contener letras y números");
				return false;
			}
		} else if (localData.idType === "PASSPORT") {
			// Passport: typically 9 characters but can vary
			if (docNum.length < 6 || docNum.length > 12) {
				toast.error(
					"El número de pasaporte debe tener entre 6 y 12 caracteres",
				);
				return false;
			}
		}

		return true;
	}, [localData.documentNumber, localData.idType]);

	const handleUploadClick = useCallback(async () => {
		if (!localData.documentNumber?.trim()) {
			toast.error("Ingresa el número de documento");
			return;
		}

		if (!validateDocumentNumber()) {
			return;
		}

		// Include all fields: original/rasterized/INE blobs for upload
		const uploadData: IDDocumentData = {
			...localData,
			idType: localData.idType || "NATIONAL_ID",
			documentType: localData.documentType || "NATIONAL_ID",
			documentNumber: localData.documentNumber.trim().toUpperCase(),
			isUploaded: false,
			isUploading: true,
		};

		setLocalData((prev) => ({ ...prev, isUploading: true }));

		try {
			await onUpload(uploadData);
			setLocalData((prev) => ({
				...prev,
				isUploaded: true,
				isUploading: false,
			}));
		} catch (error) {
			setLocalData((prev) => ({ ...prev, isUploading: false }));
		}
	}, [localData, onUpload, validateDocumentNumber]);

	// Enlarge preview handler - opens gallery at specific index
	const handleEnlargePreview = useCallback((index: number) => {
		setEnlargePreview({ open: true, currentIndex: index });
	}, []);

	// Gallery navigation
	const handleGalleryPrev = useCallback(() => {
		setEnlargePreview((prev) => ({
			...prev,
			currentIndex:
				prev.currentIndex > 0
					? prev.currentIndex - 1
					: galleryImages.length - 1,
		}));
	}, [galleryImages.length]);

	const handleGalleryNext = useCallback(() => {
		setEnlargePreview((prev) => ({
			...prev,
			currentIndex:
				prev.currentIndex < galleryImages.length - 1
					? prev.currentIndex + 1
					: 0,
		}));
	}, [galleryImages.length]);

	// Keyboard navigation for gallery
	React.useEffect(() => {
		if (!enlargePreview.open || galleryImages.length <= 1) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "ArrowLeft") {
				e.preventDefault();
				handleGalleryPrev();
			} else if (e.key === "ArrowRight") {
				e.preventDefault();
				handleGalleryNext();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [
		enlargePreview.open,
		galleryImages.length,
		handleGalleryPrev,
		handleGalleryNext,
	]);

	const isComplete = localData.isUploaded;
	const isUploading = localData.isUploading;
	const hasFrontFile = !!localData.file || !!localData.frontPreview;
	const hasBackFile = !!localData.backFile || !!localData.backPreview;
	const hasFile = hasFrontFile || (isINE ? hasBackFile : false);
	const hasDocNumber = !!localData.documentNumber?.trim();

	return (
		<>
			<Card
				className={cn(
					"relative transition-all",
					isComplete && "border-green-500 bg-green-50/50 dark:bg-green-950/20",
					className,
				)}
			>
				<CardHeader className="pb-3">
					<CardTitle className="text-sm flex items-center justify-between">
						<span className="flex items-center gap-2">
							<CreditCard className="h-4 w-4" />
							{label}
						</span>
						<div className="flex items-center gap-2">
							{required && (
								<Badge
									variant="outline"
									className="text-xs bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
								>
									Requerido
								</Badge>
							)}
							{isComplete && (
								<Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
									<CheckCircle2 className="h-3 w-3 mr-1" />
									Cargado
								</Badge>
							)}
						</div>
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* ID Type Selection */}
					<div className="space-y-3">
						<Label className="text-xs">Tipo de Identificación</Label>
						<RadioGroup
							value={localData.idType}
							onValueChange={(value) => handleIdTypeChange(value as IDType)}
							disabled={disabled || isComplete}
							className="grid grid-cols-2 gap-3"
						>
							{(Object.keys(ID_TYPE_CONFIG) as IDType[]).map((type) => {
								const config = ID_TYPE_CONFIG[type];
								const Icon = config.icon;
								const isSelected = localData.idType === type;

								return (
									<label
										key={type}
										className={cn(
											"flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all",
											isSelected && "border-primary bg-primary/5",
											!isSelected && "hover:bg-muted/50",
											(disabled || isComplete) &&
												"opacity-50 cursor-not-allowed",
										)}
									>
										<RadioGroupItem value={type} id={type} />
										<div className="flex items-center gap-2">
											<Icon className="h-4 w-4 text-muted-foreground" />
											<div>
												<p className="text-sm font-medium">{config.label}</p>
												<p className="text-xs text-muted-foreground">
													{config.description}
												</p>
											</div>
										</div>
									</label>
								);
							})}
						</RadioGroup>
					</div>

					{/* Help info */}
					<div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
						<Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
						<div className="text-xs text-blue-800 dark:text-blue-200">
							<p>{currentConfig.helpText}</p>
							{currentConfig.helpUrl && (
								<a
									href={currentConfig.helpUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-1 mt-1 text-blue-600 hover:underline"
								>
									Más información
									<ExternalLink className="h-3 w-3" />
								</a>
							)}
						</div>
					</div>

					{/* Main content - responsive layout */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
						{/* Left column: Document info */}
						<div className="space-y-4">
							{/* Document number input */}
							<div className="space-y-2">
								<Label
									htmlFor={`idNum-${localData.idType}`}
									className="text-xs"
								>
									{currentConfig.numberLabel} *
								</Label>
								<Input
									id={`idNum-${localData.idType}`}
									value={localData.documentNumber || ""}
									onChange={(e) =>
										handleInputChange(
											"documentNumber",
											e.target.value.toUpperCase(),
										)
									}
									placeholder={currentConfig.placeholder}
									disabled={disabled || isComplete}
									className="text-sm font-mono uppercase"
									maxLength={isINE ? 15 : 12}
								/>
							</div>

							{/* Expiry date input */}
							<div className="space-y-2">
								<Label htmlFor={`expiry-id`} className="text-xs">
									Fecha de Vencimiento
								</Label>
								<Input
									id={`expiry-id`}
									type="date"
									value={localData.expiryDate || ""}
									onChange={(e) =>
										handleInputChange("expiryDate", e.target.value)
									}
									disabled={disabled || isComplete}
									className="text-sm"
								/>
							</div>
						</div>

						{/* Right column: File upload / preview */}
						<div className="space-y-3">
							<Label className="text-xs">
								{isINE ? "Archivos (frente y reverso)" : "Archivo"} (opcional)
							</Label>

							{/* Show previews if we have them */}
							{localData.frontPreview || localData.backPreview ? (
								<div className={isINE ? "grid grid-cols-2 gap-3" : ""}>
									{/* Front preview */}
									{localData.frontPreview && (
										<div className="space-y-1">
											{isINE && (
												<p className="text-xs text-muted-foreground text-center">
													Frente
												</p>
											)}
											<div
												className="relative rounded-lg overflow-hidden bg-muted/30 border group cursor-pointer"
												onClick={() => handleEnlargePreview(0)}
											>
												<img
													src={localData.frontPreview}
													alt={isINE ? "Frente de INE" : "Pasaporte"}
													className="w-full h-24 object-contain"
												/>
												<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
													<ZoomIn className="h-6 w-6 text-white" />
												</div>
												{/* Green circular checkmark */}
												<div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center pointer-events-none shadow-sm">
													<Check
														className="h-3 w-3 text-white"
														strokeWidth={3}
													/>
												</div>
											</div>
										</div>
									)}

									{/* Back preview (INE only) */}
									{isINE && localData.backPreview && (
										<div className="space-y-1">
											<p className="text-xs text-muted-foreground text-center">
												Reverso
											</p>
											<div
												className="relative rounded-lg overflow-hidden bg-muted/30 border group cursor-pointer"
												onClick={() => handleEnlargePreview(1)}
											>
												<img
													src={localData.backPreview}
													alt="Reverso de INE"
													className="w-full h-24 object-contain"
												/>
												<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
													<ZoomIn className="h-6 w-6 text-white" />
												</div>
												{/* Green circular checkmark */}
												<div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center pointer-events-none shadow-sm">
													<Check
														className="h-3 w-3 text-white"
														strokeWidth={3}
													/>
												</div>
											</div>
										</div>
									)}

									{/* Remove button */}
									{!isComplete && (
										<div className="col-span-2 flex justify-center mt-2">
											<Button
												type="button"
												variant="ghost"
												size="sm"
												className="text-xs text-muted-foreground"
												onClick={() => {
													handleRemoveFile("front");
													handleRemoveFile("back");
												}}
												disabled={disabled}
											>
												<X className="h-3 w-3 mr-1" />
												Quitar documento
											</Button>
										</div>
									)}
								</div>
							) : !isComplete ? (
								/* No previews - show upload buttons */
								<div className="grid grid-cols-2 gap-2">
									<Button
										type="button"
										variant="outline"
										size="sm"
										className="h-auto py-3 flex flex-col items-center gap-1"
										onClick={() => {
											setScanningSide("front");
											fileInputRef.current?.click();
										}}
										disabled={disabled}
									>
										<Scan className="h-5 w-5" />
										<span className="text-xs">Seleccionar</span>
									</Button>
									<Button
										type="button"
										variant="outline"
										size="sm"
										className="h-auto py-3 flex flex-col items-center gap-1"
										onClick={() => setQrModalOpen(true)}
										disabled={disabled}
									>
										<ImageIcon className="h-5 w-5" />
										<span className="text-xs">Celular</span>
									</Button>
								</div>
							) : (
								/* Complete - show status message */
								<div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/30 rounded-lg">
									<CheckCircle2 className="h-4 w-4 text-green-600" />
									<span className="text-xs text-green-700 dark:text-green-300">
										Documento registrado
									</span>
								</div>
							)}

							{/* Upload hint */}
							{!isComplete &&
								!localData.frontPreview &&
								!localData.backPreview && (
									<p className="text-xs text-muted-foreground text-center">
										PDF o imagen, máx. 10MB
									</p>
								)}
						</div>
					</div>

					{/* Hidden file inputs */}
					<input
						ref={fileInputRef}
						type="file"
						accept={FILE_ACCEPT}
						onChange={(e) => handleFileSelect(e, "front")}
						className="hidden"
						disabled={disabled || isComplete}
					/>
					{isINE && (
						<input
							ref={backFileInputRef}
							type="file"
							accept={FILE_ACCEPT}
							onChange={(e) => handleFileSelect(e, "back")}
							className="hidden"
							disabled={disabled || isComplete}
						/>
					)}

					{/* Upload button */}
					{!isComplete && (
						<Button
							type="button"
							onClick={handleUploadClick}
							disabled={disabled || isUploading || !hasDocNumber}
							className="w-full"
							size="sm"
						>
							{isUploading ? (
								<>
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									Guardando...
								</>
							) : (
								<>
									<CheckCircle2 className="h-4 w-4 mr-2" />
									Guardar Identificación
								</>
							)}
						</Button>
					)}
				</CardContent>
			</Card>

			{/* Scanner Modal */}
			<DocumentScannerModal
				open={scannerOpen}
				onOpenChange={setScannerOpen}
				file={scannerFile}
				onExtracted={handleScannerExtracted}
				documentType={
					isINE
						? `INE/IFE (${scanningSide === "front" ? "Frente" : "Reverso"})`
						: currentConfig.label
				}
				personalData={personalData}
			/>

			{/* Mobile QR Modal */}
			<MobileUploadQR
				open={qrModalOpen}
				onOpenChange={setQrModalOpen}
				documentType={currentConfig.label}
				clientId={clientId}
			/>

			{/* Enlarge Preview Modal - Gallery */}
			<Dialog
				open={enlargePreview.open}
				onOpenChange={(open) =>
					setEnlargePreview((prev) => ({ ...prev, open }))
				}
			>
				<DialogContent className="max-w-[95vw] sm:max-w-3xl p-0 gap-0 overflow-hidden">
					<DialogHeader className="p-4 pb-2 sm:p-6 sm:pb-3">
						<DialogTitle className="text-base sm:text-lg flex items-center justify-between">
							<span>{galleryImages[enlargePreview.currentIndex]?.title}</span>
							{galleryImages.length > 1 && (
								<span className="text-xs sm:text-sm text-muted-foreground font-normal">
									{enlargePreview.currentIndex + 1} / {galleryImages.length}
								</span>
							)}
						</DialogTitle>
					</DialogHeader>

					{/* Image container with navigation */}
					<div className="relative flex items-center justify-center bg-muted/30 min-h-[50vh] sm:min-h-[60vh]">
						{/* Left arrow */}
						{galleryImages.length > 1 && (
							<Button
								variant="ghost"
								size="icon"
								className="absolute left-2 sm:left-4 z-10 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-black/50 hover:bg-black/70 text-white"
								onClick={handleGalleryPrev}
							>
								<ChevronLeft className="h-6 w-6 sm:h-8 sm:w-8" />
							</Button>
						)}

						{/* Image */}
						{galleryImages[enlargePreview.currentIndex] && (
							<img
								src={galleryImages[enlargePreview.currentIndex].src}
								alt={galleryImages[enlargePreview.currentIndex].title}
								className="max-w-full max-h-[50vh] sm:max-h-[65vh] object-contain px-12 sm:px-16 py-4"
							/>
						)}

						{/* Right arrow */}
						{galleryImages.length > 1 && (
							<Button
								variant="ghost"
								size="icon"
								className="absolute right-2 sm:right-4 z-10 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-black/50 hover:bg-black/70 text-white"
								onClick={handleGalleryNext}
							>
								<ChevronRight className="h-6 w-6 sm:h-8 sm:w-8" />
							</Button>
						)}
					</div>

					{/* Dots indicator for multiple images */}
					{galleryImages.length > 1 && (
						<div className="flex justify-center gap-2 py-3 sm:py-4 bg-background">
							{galleryImages.map((_, index) => (
								<button
									key={index}
									onClick={() =>
										setEnlargePreview((prev) => ({
											...prev,
											currentIndex: index,
										}))
									}
									className={cn(
										"w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-colors",
										index === enlargePreview.currentIndex
											? "bg-primary"
											: "bg-muted-foreground/30 hover:bg-muted-foreground/50",
									)}
									aria-label={`Ver imagen ${index + 1}`}
								/>
							))}
						</div>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}
