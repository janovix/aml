"use client";

import * as React from "react";
import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	FileText,
	CheckCircle2,
	X,
	Loader2,
	Upload,
	ZoomIn,
	Check,
	ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import type { ClientDocumentType } from "@/types/client-document";
import { rasterizePDF } from "@/lib/pdf/rasterizer";
import {
	DocumentViewerDialog,
	type DocumentImage,
} from "../DocumentViewerDialog";

export interface SimpleDocumentUploadData {
	documentType: ClientDocumentType;
	file?: File;
	/** Original source file (e.g., PDF before rasterization) */
	originalFile?: File;
	/** Rasterized images from PDF or single image */
	rasterizedImages?: Blob[];
	isUploaded: boolean;
	isUploading: boolean;
}

interface SimpleDocumentUploadCardProps {
	documentType: ClientDocumentType;
	title: string;
	description: string;
	required?: boolean;
	helpLink?: { url: string; label: string };
	disabled?: boolean;
	data: SimpleDocumentUploadData | null;
	onDataChange: (data: SimpleDocumentUploadData) => void;
	onUpload: (data: SimpleDocumentUploadData) => Promise<void>;
	className?: string;
}

const FILE_ACCEPT = "application/pdf,image/*";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function SimpleDocumentUploadCard({
	documentType,
	title,
	description,
	required = false,
	helpLink,
	disabled = false,
	data,
	onDataChange,
	onUpload,
	className,
}: SimpleDocumentUploadCardProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [localData, setLocalData] = useState<Partial<SimpleDocumentUploadData>>(
		{
			documentType,
			file: data?.file,
			originalFile: data?.originalFile,
			rasterizedImages: data?.rasterizedImages,
			isUploaded: data?.isUploaded || false,
			isUploading: false,
		},
	);

	const [isProcessing, setIsProcessing] = useState(false);

	// Document viewer dialog state
	const [documentViewer, setDocumentViewer] = useState<{
		open: boolean;
		images: DocumentImage[];
		initialIndex: number;
	}>({
		open: false,
		images: [],
		initialIndex: 0,
	});

	// Build gallery images array from rasterized images
	const galleryImages = React.useMemo<DocumentImage[]>(() => {
		const images: DocumentImage[] = [];

		if (localData.rasterizedImages && localData.rasterizedImages.length > 0) {
			localData.rasterizedImages.forEach((blob, index) => {
				const url = URL.createObjectURL(blob);
				images.push({
					src: url,
					title:
						localData.rasterizedImages!.length === 1
							? "Documento"
							: `Página ${index + 1}`,
				});
			});
		}

		return images;
	}, [localData.rasterizedImages]);

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
		async (e: React.ChangeEvent<HTMLInputElement>) => {
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

			setIsProcessing(true);

			try {
				let rasterizedBlobs: Blob[] = [];
				let originalFile: File | undefined = undefined;

				if (isPdf) {
					// Rasterize PDF
					toast.info("Procesando PDF...", { duration: 2000 });
					const result = await rasterizePDF(file);

					if (!result.success || result.pages.length === 0) {
						throw new Error("No se pudieron extraer páginas del PDF");
					}

					// Convert canvases to blobs
					for (const canvas of result.pages) {
						const blob = await new Promise<Blob | null>((resolve) => {
							canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92);
						});
						if (blob) {
							rasterizedBlobs.push(blob);
						}
					}

					originalFile = file;
					toast.success(`PDF procesado: ${rasterizedBlobs.length} página(s)`);
				} else {
					// Single image - convert to blob
					const canvas = document.createElement("canvas");
					const ctx = canvas.getContext("2d");
					const img = new Image();

					await new Promise((resolve, reject) => {
						img.onload = resolve;
						img.onerror = reject;
						img.src = URL.createObjectURL(file);
					});

					canvas.width = img.width;
					canvas.height = img.height;
					ctx?.drawImage(img, 0, 0);
					URL.revokeObjectURL(img.src);

					const blob = await new Promise<Blob | null>((resolve) => {
						canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92);
					});

					if (blob) {
						rasterizedBlobs.push(blob);
					}
				}

				const newData = {
					...localData,
					file,
					originalFile,
					rasterizedImages: rasterizedBlobs,
				};

				setLocalData(newData);
				onDataChange({
					documentType,
					file,
					originalFile,
					rasterizedImages: rasterizedBlobs,
					isUploaded: false,
					isUploading: false,
				});

				toast.success("Documento cargado exitosamente");
			} catch (error) {
				console.error("Error processing file:", error);
				toast.error("Error al procesar el archivo");
			} finally {
				setIsProcessing(false);
				if (fileInputRef.current) {
					fileInputRef.current.value = "";
				}
			}
		},
		[documentType, localData, onDataChange],
	);

	const handleRemoveFile = useCallback(() => {
		const newData = {
			...localData,
			file: undefined,
			originalFile: undefined,
			rasterizedImages: undefined,
			isUploaded: false,
		};
		setLocalData(newData);
		onDataChange({
			documentType,
			file: undefined,
			originalFile: undefined,
			rasterizedImages: undefined,
			isUploaded: false,
			isUploading: false,
		});
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	}, [documentType, localData, onDataChange]);

	const handleUploadClick = useCallback(async () => {
		if (
			!localData.rasterizedImages ||
			localData.rasterizedImages.length === 0
		) {
			toast.error("Por favor selecciona un archivo primero");
			return;
		}

		const uploadData: SimpleDocumentUploadData = {
			documentType,
			file: localData.file,
			originalFile: localData.originalFile,
			rasterizedImages: localData.rasterizedImages,
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
	const hasFile = galleryImages.length > 0;

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
							{required && !isComplete && (
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

					{/* File upload section */}
					<div className="space-y-2">
						{!hasFile && !isComplete ? (
							<div className="space-y-3">
								{/* Upload button */}
								<Button
									type="button"
									variant="outline"
									size="lg"
									className="w-full h-auto py-6 flex flex-col items-center gap-2"
									onClick={() => fileInputRef.current?.click()}
									disabled={disabled || isProcessing}
								>
									{isProcessing ? (
										<>
											<Loader2 className="h-8 w-8 animate-spin" />
											<span className="text-sm">Procesando...</span>
										</>
									) : (
										<>
											<Upload className="h-8 w-8" />
											<span className="text-sm font-medium">
												Seleccionar Archivo
											</span>
											<span className="text-xs text-muted-foreground">
												PDF o imagen, máx. 10MB
											</span>
										</>
									)}
								</Button>
							</div>
						) : hasFile && !isComplete ? (
							<div className="space-y-3">
								{/* Thumbnail gallery - horizontal scrolling */}
								<div className="relative">
									<div className="flex gap-3 overflow-x-auto pb-2">
										{galleryImages.map((image, index) => (
											<div key={index} className="flex-shrink-0 space-y-1">
												<p className="text-xs text-muted-foreground text-center">
													{image.title}
												</p>
												<div
													className="relative rounded-lg overflow-hidden bg-muted/30 border group cursor-pointer h-24"
													onClick={() =>
														setDocumentViewer({
															open: true,
															images: galleryImages,
															initialIndex: index,
														})
													}
												>
													<img
														src={image.src}
														alt={image.title}
														className="h-24 w-auto object-contain"
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
								</div>

								{/* File info and actions */}
								<div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
									<div className="flex items-center gap-2 min-w-0">
										<FileText className="h-4 w-4 text-primary shrink-0" />
										<span className="text-sm truncate">
											{localData.file?.name}
										</span>
										{galleryImages.length > 1 && (
											<Badge variant="secondary" className="text-xs shrink-0">
												{galleryImages.length}{" "}
												{galleryImages.length === 1 ? "página" : "páginas"}
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

								{/* Action buttons */}
								<div className="grid grid-cols-2 gap-2">
									<Button
										type="button"
										variant="outline"
										onClick={() => fileInputRef.current?.click()}
										disabled={disabled || isUploading}
									>
										<Upload className="h-4 w-4 mr-2" />
										Cambiar
									</Button>
									<Button
										type="button"
										onClick={handleUploadClick}
										disabled={disabled || isUploading}
									>
										{isUploading ? (
											<>
												<Loader2 className="h-4 w-4 mr-2 animate-spin" />
												Guardando...
											</>
										) : (
											<>
												<CheckCircle2 className="h-4 w-4 mr-2" />
												Aceptar
											</>
										)}
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
				</CardContent>
			</Card>

			{/* Document Viewer Dialog */}
			<DocumentViewerDialog
				open={documentViewer.open}
				onOpenChange={(open) =>
					setDocumentViewer((prev) => ({ ...prev, open }))
				}
				images={documentViewer.images}
				initialIndex={documentViewer.initialIndex}
			/>
		</>
	);
}
