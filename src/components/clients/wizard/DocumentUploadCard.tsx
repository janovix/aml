"use client";

import * as React from "react";
import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Upload,
	FileText,
	CheckCircle2,
	X,
	Loader2,
	ExternalLink,
	ZoomIn,
	ChevronLeft,
	ChevronRight,
	Check,
} from "lucide-react";
import { toast } from "sonner";
import type { ClientDocumentType } from "@/types/client-document";
import {
	DocumentScannerModal,
	type DocumentExtractionData,
} from "@/components/document-scanner";
import type { PersonalData } from "@/lib/document-scanner";

export interface DocumentUploadData {
	documentType: ClientDocumentType;
	documentNumber: string;
	expiryDate?: string;
	file?: File;
	processedBlob?: Blob;
	isUploaded: boolean;
	isUploading: boolean;
	/** Original source file (e.g., PDF before rasterization) */
	originalFile?: File;
	/** Rasterized images from PDF */
	rasterizedImages?: Blob[];
	/** INE front image */
	ineFrontBlob?: Blob;
	/** INE back image */
	ineBackBlob?: Blob;
}

interface DocumentUploadCardProps {
	documentType: ClientDocumentType;
	title: string;
	description: string;
	required?: boolean;
	helpLink?: { url: string; label: string };
	showExpiryDate?: boolean;
	disabled?: boolean;
	data: DocumentUploadData | null;
	onDataChange: (data: DocumentUploadData) => void;
	onUpload: (data: DocumentUploadData) => Promise<void>;
	className?: string;
	/** Personal data for OCR validation */
	personalData?: PersonalData;
}

const FILE_ACCEPT = "application/pdf,image/*";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function DocumentUploadCard({
	documentType,
	title,
	description,
	required = false,
	helpLink,
	showExpiryDate = true,
	disabled = false,
	data,
	onDataChange,
	onUpload,
	className,
	personalData,
}: DocumentUploadCardProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [localData, setLocalData] = useState<Partial<DocumentUploadData>>({
		documentType,
		documentNumber: data?.documentNumber || "",
		expiryDate: data?.expiryDate || "",
		file: data?.file,
		processedBlob: data?.processedBlob,
		isUploaded: data?.isUploaded || false,
		isUploading: false,
	});

	const [processedPreview, setProcessedPreview] = useState<string | null>(null);

	// Scanner modal state
	const [scannerOpen, setScannerOpen] = useState(false);
	const [scannerFile, setScannerFile] = useState<File | null>(null);

	// Enlarge preview modal with gallery navigation
	const [enlargePreview, setEnlargePreview] = useState<{
		open: boolean;
		currentIndex: number;
	}>({ open: false, currentIndex: 0 });

	// Build gallery images array (processed image + rasterized pages)
	const galleryImages = React.useMemo(() => {
		const images: { src: string; title: string }[] = [];

		// Add main processed preview
		if (processedPreview) {
			images.push({
				src: processedPreview,
				title: "Documento Procesado",
			});
		}

		// Add rasterized pages if available (from PDF)
		if (localData.rasterizedImages && localData.rasterizedImages.length > 0) {
			localData.rasterizedImages.forEach((blob, index) => {
				const url = URL.createObjectURL(blob);
				images.push({
					src: url,
					title: `Página ${index + 1}`,
				});
			});
		}

		return images;
	}, [processedPreview, localData.rasterizedImages]);

	// Cleanup blob URLs when component unmounts
	React.useEffect(() => {
		return () => {
			galleryImages.forEach((img) => {
				if (img.src.startsWith("blob:")) {
					URL.revokeObjectURL(img.src);
				}
			});
		};
	}, [galleryImages]);

	const handleFileSelect = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
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
			setScannerOpen(true);

			// Reset file input
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		},
		[],
	);

	const handleScannerExtracted = useCallback(
		(extractionData: DocumentExtractionData) => {
			const previewUrl = extractionData.processedCanvas.toDataURL(
				"image/jpeg",
				0.92,
			);
			setProcessedPreview(previewUrl);

			const processedFile = new File(
				[extractionData.processedBlob],
				`${documentType}_processed.jpg`,
				{ type: "image/jpeg" },
			);

			const newData = {
				...localData,
				file: processedFile,
				processedBlob: extractionData.processedBlob,
				originalFile: extractionData.originalFile,
				rasterizedImages: extractionData.rasterizedImages,
			};

			setLocalData(newData);
			onDataChange({
				documentType,
				documentNumber: localData.documentNumber || "",
				expiryDate: localData.expiryDate,
				file: processedFile,
				processedBlob: extractionData.processedBlob,
				originalFile: extractionData.originalFile,
				rasterizedImages: extractionData.rasterizedImages,
				isUploaded: false,
				isUploading: false,
			});

			toast.success("Documento procesado exitosamente");
			setScannerFile(null);
		},
		[documentType, localData, onDataChange],
	);

	const handleRemoveFile = useCallback(() => {
		const newData = {
			...localData,
			file: undefined,
			processedBlob: undefined,
			originalFile: undefined,
			rasterizedImages: undefined,
			ineFrontBlob: undefined,
			ineBackBlob: undefined,
			isUploaded: false,
		};
		setLocalData(newData);
		setProcessedPreview(null);
		onDataChange({
			documentType,
			documentNumber: localData.documentNumber || "",
			expiryDate: localData.expiryDate,
			file: undefined,
			processedBlob: undefined,
			originalFile: undefined,
			rasterizedImages: undefined,
			ineFrontBlob: undefined,
			ineBackBlob: undefined,
			isUploaded: false,
			isUploading: false,
		});
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	}, [documentType, localData, onDataChange]);

	const handleInputChange = useCallback(
		(field: "documentNumber" | "expiryDate", value: string) => {
			const newData = { ...localData, [field]: value };
			setLocalData(newData);
			onDataChange({
				documentType,
				documentNumber:
					field === "documentNumber" ? value : localData.documentNumber || "",
				expiryDate: field === "expiryDate" ? value : localData.expiryDate,
				file: localData.file,
				processedBlob: localData.processedBlob,
				originalFile: localData.originalFile,
				rasterizedImages: localData.rasterizedImages,
				ineFrontBlob: localData.ineFrontBlob,
				ineBackBlob: localData.ineBackBlob,
				isUploaded: localData.isUploaded || false,
				isUploading: false,
			});
		},
		[documentType, localData, onDataChange],
	);

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

	const handleEnlargePreview = useCallback((index: number) => {
		setEnlargePreview({ open: true, currentIndex: index });
	}, []);

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

	const handleUploadClick = useCallback(async () => {
		if (!localData.documentNumber?.trim()) {
			toast.error("Ingresa el número de documento");
			return;
		}

		const uploadData: DocumentUploadData = {
			documentType,
			documentNumber: localData.documentNumber.trim(),
			expiryDate: localData.expiryDate,
			file: localData.file,
			processedBlob: localData.processedBlob,
			originalFile: localData.originalFile,
			rasterizedImages: localData.rasterizedImages,
			ineFrontBlob: localData.ineFrontBlob,
			ineBackBlob: localData.ineBackBlob,
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
	}, [documentType, localData, onUpload]);

	const isComplete = localData.isUploaded;
	const isUploading = localData.isUploading;
	const hasFile = !!localData.file;
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
							<FileText className="h-4 w-4" />
							{title}
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
					{/* Description */}
					<p className="text-xs text-muted-foreground">{description}</p>

					{/* Help link */}
					{helpLink && (
						<a
							href={helpLink.url}
							target="_blank"
							rel="noopener noreferrer"
							className="text-xs text-primary hover:underline flex items-center gap-1"
						>
							{helpLink.label}
							<ExternalLink className="h-3 w-3" />
						</a>
					)}

					{/* Document number input */}
					<div className="space-y-2">
						<Label htmlFor={`docNum-${documentType}`} className="text-xs">
							Número de Documento *
						</Label>
						<Input
							id={`docNum-${documentType}`}
							value={localData.documentNumber || ""}
							onChange={(e) =>
								handleInputChange("documentNumber", e.target.value)
							}
							placeholder="Ej: ABC123456"
							disabled={disabled || isComplete}
							className="text-sm"
						/>
					</div>

					{/* Expiry date input */}
					{showExpiryDate && (
						<div className="space-y-2">
							<Label htmlFor={`expiry-${documentType}`} className="text-xs">
								Fecha de Vencimiento
							</Label>
							<Input
								id={`expiry-${documentType}`}
								type="date"
								value={localData.expiryDate || ""}
								onChange={(e) =>
									handleInputChange("expiryDate", e.target.value)
								}
								disabled={disabled || isComplete}
								className="text-sm"
							/>
						</div>
					)}

					{/* File upload section */}
					<div className="space-y-2">
						<Label className="text-xs">Archivo (opcional)</Label>

						{!hasFile && !isComplete ? (
							<div className="space-y-3">
								{/* Upload button */}
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="w-full h-auto py-3 flex flex-col items-center gap-1"
									onClick={() => fileInputRef.current?.click()}
									disabled={disabled}
								>
									<Upload className="h-5 w-5" />
									<span className="text-xs">Seleccionar Archivo</span>
								</Button>

								<p className="text-xs text-muted-foreground text-center">
									PDF o imagen, máx. 10MB
								</p>
							</div>
						) : hasFile && !isComplete ? (
							<div className="space-y-2">
								{/* Thumbnail gallery */}
								{galleryImages.length > 0 && (
									<div className="grid grid-cols-2 gap-2">
										{galleryImages.map((image, index) => (
											<div key={index} className="space-y-1">
												<p className="text-xs text-muted-foreground text-center">
													{image.title}
												</p>
												<div
													className="relative rounded-lg overflow-hidden bg-muted/30 border group cursor-pointer"
													onClick={() => handleEnlargePreview(index)}
												>
													<img
														src={image.src}
														alt={image.title}
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
										))}
									</div>
								)}

								{/* File info and remove button */}
								<div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
									<div className="flex items-center gap-2 min-w-0">
										<FileText className="h-4 w-4 text-primary shrink-0" />
										<span className="text-sm truncate">
											{localData.file?.name}
										</span>
										{galleryImages.length > 1 && (
											<Badge variant="secondary" className="text-xs shrink-0">
												{galleryImages.length}{" "}
												{galleryImages.length === 1 ? "imagen" : "imágenes"}
											</Badge>
										)}
									</div>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										className="h-8 w-8 shrink-0"
										onClick={handleRemoveFile}
										disabled={disabled}
									>
										<X className="h-4 w-4" />
									</Button>
								</div>
							</div>
						) : isComplete ? (
							<div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
								<CheckCircle2 className="h-4 w-4 text-green-600" />
								<span className="text-sm text-green-700 dark:text-green-300">
									Documento registrado
								</span>
							</div>
						) : null}

						<input
							ref={fileInputRef}
							type="file"
							accept={FILE_ACCEPT}
							onChange={handleFileSelect}
							className="hidden"
							disabled={disabled || isComplete}
						/>
					</div>

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
									Guardar Documento
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
				documentType={title}
				personalData={personalData}
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
