"use client";

import * as React from "react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle2, Trash2, ZoomIn } from "lucide-react";
import { PresignedImage } from "@/components/PresignedImage";
import {
	DocumentViewerDialog,
	type DocumentImage,
} from "./DocumentViewerDialog";
import { DOCUMENT_TYPE_CONFIG } from "@/lib/constants";
import type { ClientDocument, DocumentFileMetadata } from "@/types/client-document";

interface UploadedIDDocumentCardProps {
	document: ClientDocument;
	onDelete?: () => void;
	showDelete?: boolean;
	compact?: boolean;
}

/**
 * Displays an uploaded ID document (INE or Passport) with:
 * - Document type and number
 * - Expiry date
 * - Thumbnail previews (front/back for INE)
 * - Delete action
 */
export function UploadedIDDocumentCard({
	document,
	onDelete,
	showDelete = true,
	compact = false,
}: UploadedIDDocumentCardProps) {
	const [documentViewer, setDocumentViewer] = useState<{
		open: boolean;
		images: DocumentImage[];
		initialIndex: number;
		originalFileUrl?: string | null;
	}>({
		open: false,
		images: [],
		initialIndex: 0,
		originalFileUrl: null,
	});

	const metadata = document.metadata as DocumentFileMetadata | null;
	const documentLabel =
		DOCUMENT_TYPE_CONFIG[document.documentType]?.label || document.documentType;

	// Determine available image URLs (with fallbacks)
	const frontUrl = metadata?.ineFrontUrl || metadata?.primaryFileUrl || document.fileUrl;
	const backUrl = metadata?.ineBackUrl;
	const hasImages = !!frontUrl;

	// Build images array for viewer
	const buildImagesArray = (startIndex: number = 0) => {
		const images: DocumentImage[] = [];
		if (frontUrl) {
			images.push({
				src: frontUrl,
				title: backUrl ? "Frente de INE" : "Documento",
			});
		}
		if (backUrl) {
			images.push({
				src: backUrl,
				title: "Reverso de INE",
			});
		}
		return { images, initialIndex: startIndex };
	};

	const openViewer = (index: number = 0) => {
		const { images, initialIndex } = buildImagesArray(index);
		setDocumentViewer({
			open: true,
			images,
			initialIndex,
			originalFileUrl: metadata?.originalFileUrl || document.fileUrl,
		});
	};

	if (compact) {
		return (
			<>
				<div className="p-3 border rounded-lg bg-green-50/50 dark:bg-green-950/20 border-green-500/50">
					{/* Header row */}
					<div className="flex items-center justify-between gap-2 mb-2">
						<div className="flex items-center gap-2 min-w-0">
							<FileText className="h-4 w-4 text-green-600 shrink-0" />
							<span className="text-sm font-medium truncate">
								{documentLabel}
							</span>
							<Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 shrink-0">
								<CheckCircle2 className="h-3 w-3 mr-1" />
								Cargado
							</Badge>
						</div>
						{showDelete && onDelete && (
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
								onClick={onDelete}
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						)}
					</div>

					{/* Document info */}
					<p className="text-xs text-muted-foreground mb-3">
						#{document.documentNumber}
						{document.expiryDate && (
							<span className="ml-2">
								Vence:{" "}
								{new Date(document.expiryDate).toLocaleDateString("es-MX")}
							</span>
						)}
					</p>

					{/* Thumbnails with labels - horizontal scroll like regular ID */}
					{hasImages && (
						<div className="flex gap-3 overflow-x-auto pb-1">
							{frontUrl && (
								<div className="shrink-0 space-y-1">
									<p className="text-xs text-muted-foreground text-center">
										{backUrl ? "Frente" : "Documento"}
									</p>
									<div
										className="relative rounded-lg overflow-hidden bg-muted/30 border cursor-pointer group h-24"
										onClick={() => openViewer(0)}
									>
										<PresignedImage
											src={frontUrl}
											alt={backUrl ? "Frente de INE" : "Documento"}
											className="h-24 w-auto object-contain"
										/>
										<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
											<ZoomIn className="h-6 w-6 text-white" />
										</div>
									</div>
								</div>
							)}
							{backUrl && (
								<div className="shrink-0 space-y-1">
									<p className="text-xs text-muted-foreground text-center">
										Reverso
									</p>
									<div
										className="relative rounded-lg overflow-hidden bg-muted/30 border cursor-pointer group h-24"
										onClick={() => openViewer(1)}
									>
										<PresignedImage
											src={backUrl}
											alt="Reverso de INE"
											className="h-24 w-auto object-contain"
										/>
										<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
											<ZoomIn className="h-6 w-6 text-white" />
										</div>
									</div>
								</div>
							)}
						</div>
					)}
				</div>

				<DocumentViewerDialog
					open={documentViewer.open}
					onOpenChange={(open) =>
						setDocumentViewer((prev) => ({ ...prev, open }))
					}
					images={documentViewer.images}
					initialIndex={documentViewer.initialIndex}
					originalFileUrl={documentViewer.originalFileUrl}
				/>
			</>
		);
	}

	return (
		<>
			<Card className="border-green-500 bg-green-50/50 dark:bg-green-950/20">
				<CardHeader className="pb-3">
					<CardTitle className="text-sm flex items-center justify-between">
						<span className="flex items-center gap-2">
							<FileText className="h-4 w-4" />
							{documentLabel}
						</span>
						<Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
							<CheckCircle2 className="h-3 w-3 mr-1" />
							Cargado
						</Badge>
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<div>
						<p className="text-sm text-muted-foreground">
							#{document.documentNumber}
							{document.expiryDate && (
								<span className="ml-2">
									Vence:{" "}
									{new Date(document.expiryDate).toLocaleDateString("es-MX")}
								</span>
							)}
						</p>
					</div>

					{/* Show thumbnails if image URLs available */}
					{hasImages && (
						<div className="relative pt-2">
							<div className="flex gap-3 overflow-x-auto pb-2">
								{frontUrl && (
									<div className="shrink-0 space-y-1">
										<p className="text-xs text-muted-foreground text-center">
											{backUrl ? "Frente" : "Documento"}
										</p>
										<div
											className="relative rounded-lg overflow-hidden bg-muted/30 border cursor-pointer group h-24"
											onClick={() => openViewer(0)}
										>
											<PresignedImage
												src={frontUrl}
												alt={backUrl ? "Frente de INE" : "Documento"}
												className="h-24 w-auto object-contain"
											/>
											<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
												<ZoomIn className="h-6 w-6 text-white" />
											</div>
										</div>
									</div>
								)}
								{backUrl && (
									<div className="shrink-0 space-y-1">
										<p className="text-xs text-muted-foreground text-center">
											Reverso
										</p>
										<div
											className="relative rounded-lg overflow-hidden bg-muted/30 border cursor-pointer group h-24"
											onClick={() => openViewer(1)}
										>
											<PresignedImage
												src={backUrl}
												alt="Reverso de INE"
												className="h-24 w-auto object-contain"
											/>
											<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
												<ZoomIn className="h-6 w-6 text-white" />
											</div>
										</div>
									</div>
								)}
							</div>
						</div>
					)}

					{/* Action buttons */}
					{showDelete && onDelete && (
						<div className="flex flex-wrap gap-2 pt-2">
							<Button
								variant="outline"
								size="sm"
								onClick={onDelete}
								className="text-destructive hover:text-destructive"
							>
								<Trash2 className="h-4 w-4 sm:mr-2" />
								<span className="hidden sm:inline">Eliminar</span>
							</Button>
						</div>
					)}
				</CardContent>
			</Card>

			<DocumentViewerDialog
				open={documentViewer.open}
				onOpenChange={(open) =>
					setDocumentViewer((prev) => ({ ...prev, open }))
				}
				images={documentViewer.images}
				initialIndex={documentViewer.initialIndex}
				originalFileUrl={documentViewer.originalFileUrl}
			/>
		</>
	);
}
