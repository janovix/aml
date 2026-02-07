"use client";

import * as React from "react";
import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
	FileText,
	CheckCircle2,
	AlertCircle,
	ExternalLink,
	Trash2,
	ZoomIn,
} from "lucide-react";
import { toast } from "sonner";
import {
	listClientDocuments,
	createClientDocument,
	deleteClientDocument,
} from "@/lib/api/client-documents";
import { uploadDocumentForKYC } from "@/lib/api/file-upload";
import { useOrgStore } from "@/lib/org-store";
import { DocSvcImage } from "@/components/DocSvcImage";
import type { PersonType } from "@/types/client";
import type {
	ClientDocumentType,
	ClientDocumentCreateRequest,
	ClientDocument,
	DocumentFileMetadata,
} from "@/types/client-document";
import {
	DOCUMENT_TYPE_CONFIG,
	REQUIRED_DOCUMENTS,
	ID_DOCUMENT_TYPES,
	requiresUBOs,
} from "@/lib/constants";
import {
	SimpleDocumentUploadCard,
	type SimpleDocumentUploadData,
} from "./wizard/SimpleDocumentUploadCard";
import {
	IDDocumentSelector,
	type IDDocumentData,
} from "./wizard/IDDocumentSelector";
import { Button } from "../ui/button";
import {
	DocumentViewerDialog,
	type DocumentImage,
} from "./DocumentViewerDialog";
import { MobileUploadCard } from "./MobileUploadCard";

interface EditDocumentsSectionProps {
	clientId: string;
	personType: PersonType;
	clientName?: string;
	className?: string;
	onDocumentChange?: () => void;
}

export function EditDocumentsSection({
	clientId,
	personType,
	clientName,
	className,
	onDocumentChange,
}: EditDocumentsSectionProps) {
	const { currentOrg } = useOrgStore();
	const [existingDocuments, setExistingDocuments] = useState<ClientDocument[]>(
		[],
	);
	const [isLoading, setIsLoading] = useState(true);

	// Document state for each required document
	const [idDocumentData, setIdDocumentData] = useState<IDDocumentData | null>(
		null,
	);
	const [documentData, setDocumentData] = useState<
		Record<ClientDocumentType, SimpleDocumentUploadData | null>
	>({} as Record<ClientDocumentType, SimpleDocumentUploadData | null>);
	const [documentToDelete, setDocumentToDelete] =
		useState<ClientDocument | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	// Document viewer dialog state
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

	const requiredDocs = REQUIRED_DOCUMENTS[personType];
	const needsUBOs = requiresUBOs(personType);

	// Fetch existing documents
	const fetchDocuments = useCallback(async () => {
		try {
			setIsLoading(true);
			const response = await listClientDocuments({ clientId });
			setExistingDocuments(response.data);
		} catch (error) {
			console.error("Error fetching documents:", error);
		} finally {
			setIsLoading(false);
		}
	}, [clientId]);

	useEffect(() => {
		fetchDocuments();
	}, [fetchDocuments]);

	// Check which documents are already uploaded
	const uploadedDocTypes = new Set(
		existingDocuments.map((d) => d.documentType),
	);
	const hasIdDocument = ID_DOCUMENT_TYPES.some((type) =>
		uploadedDocTypes.has(type),
	);
	const existingIdDocument = existingDocuments.find((d) =>
		ID_DOCUMENT_TYPES.includes(d.documentType),
	);

	// Calculate progress
	const totalRequired = requiredDocs.length + (needsUBOs ? 0 : 1); // +1 for ID (physical persons only)
	const completedDocs =
		requiredDocs.filter((d) => uploadedDocTypes.has(d)).length +
		(needsUBOs ? 0 : hasIdDocument ? 1 : 0); // Only count ID for physical persons
	const progress = Math.round((completedDocs / totalRequired) * 100);

	// Calculate missing documents
	const missingDocs = requiredDocs.filter((d) => !uploadedDocTypes.has(d));

	const handleIdDataChange = useCallback((data: IDDocumentData) => {
		setIdDocumentData(data);
	}, []);

	const handleIdUpload = useCallback(
		async (data: IDDocumentData) => {
			const { currentOrg, currentUserId } = useOrgStore.getState();

			if (!currentOrg?.id) {
				toast.error("No se pudo obtener la organización actual");
				throw new Error("Organization ID not available");
			}

			const userId = currentUserId || "unknown";

			try {
				// Upload files to doc-svc if available
				let docSvcDocumentId: string | undefined;
				let docSvcJobId: string | undefined;

				if (data.processedBlob) {
					// Build related files for doc-svc upload
					const relatedFiles: Array<{
						file: Blob;
						name: string;
						type: string;
					}> = [];

					// Add rasterized images if PDF was processed
					if (data.rasterizedImages && data.rasterizedImages.length > 0) {
						data.rasterizedImages.forEach((blob, index) => {
							relatedFiles.push({
								file: blob,
								name: `rasterized_page_${index + 1}.jpg`,
								type: `rasterized_page_${index + 1}`,
							});
						});
					}

					// Add INE front/back if available
					if (data.ineFrontBlob) {
						relatedFiles.push({
							file: data.ineFrontBlob,
							name: "ine_front.jpg",
							type: "ine_front",
						});
					}
					if (data.ineBackBlob) {
						relatedFiles.push({
							file: data.ineBackBlob,
							name: "ine_back.jpg",
							type: "ine_back",
						});
					}

					// Upload to doc-svc
					const uploadResult = await uploadDocumentForKYC({
						organizationId: currentOrg.id,
						userId,
						primaryFile: data.processedBlob,
						fileName: data.originalFile?.name || "id_document.jpg",
						originalPdf:
							data.originalFile?.type === "application/pdf"
								? data.originalFile
								: null,
						relatedFiles: relatedFiles.length > 0 ? relatedFiles : undefined,
						waitForProcessing: false, // Don't block - webhook will update
					});

					docSvcDocumentId = uploadResult.documentId;
					docSvcJobId = uploadResult.jobId;
				}

				// Create client document record with doc-svc references
				const input: ClientDocumentCreateRequest = {
					documentType: data.documentType,
					documentNumber: data.documentNumber,
					status: "PENDING",
					expiryDate: data.expiryDate,
					docSvcDocumentId,
					docSvcJobId,
				};

				await createClientDocument({ clientId, input });

				toast.success("Identificación guardada exitosamente");
				fetchDocuments();
				onDocumentChange?.();
			} catch (error) {
				console.error("Error uploading ID document:", error);
				toast.error("Error al guardar la identificación");
				throw error;
			}
		},
		[clientId, fetchDocuments, onDocumentChange],
	);

	const handleDocDataChange = useCallback(
		(docType: ClientDocumentType, data: SimpleDocumentUploadData) => {
			setDocumentData((prev) => ({
				...prev,
				[docType]: data,
			}));
		},
		[],
	);

	const handleDocUpload = useCallback(
		async (data: SimpleDocumentUploadData) => {
			const { currentOrg, currentUserId } = useOrgStore.getState();

			if (!currentOrg?.id) {
				toast.error("No se pudo obtener la organización actual");
				throw new Error("Organization ID not available");
			}

			const userId = currentUserId || "unknown";

			try {
				// Upload files to doc-svc if available
				let docSvcDocumentId: string | undefined;
				let docSvcJobId: string | undefined;

				if (data.rasterizedImages && data.rasterizedImages.length > 0) {
					// Prepare rasterized images for upload
					const relatedFiles: Array<{
						file: Blob;
						name: string;
						type: string;
					}> = [];
					data.rasterizedImages.forEach((blob, index) => {
						relatedFiles.push({
							file: blob,
							name: `page_${index + 1}.jpg`,
							type: `rasterized_page_${index + 1}`,
						});
					});

					// Upload to doc-svc
					const uploadResult = await uploadDocumentForKYC({
						organizationId: currentOrg.id,
						userId,
						primaryFile: data.rasterizedImages[0],
						fileName: data.originalFile?.name || "document.jpg",
						originalPdf:
							data.originalFile?.type === "application/pdf"
								? data.originalFile
								: null,
						relatedFiles:
							relatedFiles.length > 1 ? relatedFiles.slice(1) : undefined,
						waitForProcessing: false, // Don't block - webhook will update
					});

					docSvcDocumentId = uploadResult.documentId;
					docSvcJobId = uploadResult.jobId;
				}

				// Create client document record with doc-svc references
				const input: ClientDocumentCreateRequest = {
					documentType: data.documentType,
					documentNumber: "N/A", // Not required for these documents
					status: "PENDING",
					docSvcDocumentId,
					docSvcJobId,
				};

				await createClientDocument({ clientId, input });

				toast.success("Documento guardado exitosamente");
				fetchDocuments();
				onDocumentChange?.();
			} catch (error) {
				console.error("Error uploading document:", error);
				toast.error("Error al guardar el documento");
				throw error;
			}
		},
		[clientId, fetchDocuments, onDocumentChange],
	);

	const handleDeleteDocument = useCallback(async () => {
		if (!documentToDelete) return;

		try {
			setIsDeleting(true);
			await deleteClientDocument({
				clientId,
				documentId: documentToDelete.id,
			});
			toast.success("Documento eliminado exitosamente");
			setDocumentToDelete(null);
			fetchDocuments();
			onDocumentChange?.();
		} catch (error) {
			console.error("Error deleting document:", error);
			toast.error("Error al eliminar el documento");
		} finally {
			setIsDeleting(false);
		}
	}, [documentToDelete, clientId, fetchDocuments, onDocumentChange]);

	if (isLoading) {
		return (
			<Card className={className}>
				<CardContent className="p-6">
					<div className="animate-pulse space-y-4">
						<div className="h-4 bg-muted rounded w-1/3" />
						<div className="h-32 bg-muted rounded" />
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className={`space-y-6 ${className || ""}`}>
			{/* Progress indicator */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-base flex items-center gap-2">
						<FileText className="h-4 w-4" />
						Documentos KYC
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between mb-2">
						<span className="text-sm font-medium">Progreso del Expediente</span>
						<span className="text-sm text-muted-foreground">
							{completedDocs} de {totalRequired} documentos
						</span>
					</div>
					<div className="w-full h-2 bg-muted rounded-full overflow-hidden">
						<div
							className="h-full bg-primary transition-all duration-300"
							style={{ width: `${progress}%` }}
						/>
					</div>

					{/* Missing documents warning */}
					{(missingDocs.length > 0 || !hasIdDocument) && (
						<div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
							<p className="text-sm font-medium text-amber-800 dark:text-amber-200 flex items-center gap-2 mb-2">
								<AlertCircle className="h-4 w-4" />
								Documentos requeridos faltantes
							</p>
							<ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
								{!needsUBOs && !hasIdDocument && (
									<li className="flex items-center gap-1">
										<span className="w-1 h-1 rounded-full bg-amber-500" />
										Identificación Oficial (INE o Pasaporte)
									</li>
								)}
								{missingDocs.map((docType) => (
									<li key={docType} className="flex items-center gap-1">
										<span className="w-1 h-1 rounded-full bg-amber-500" />
										{DOCUMENT_TYPE_CONFIG[docType]?.label || docType}
									</li>
								))}
							</ul>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Mobile upload link */}
			<MobileUploadCard
				clientId={clientId}
				clientName={clientName}
				clientType={personType}
				uploadedDocuments={Array.from(uploadedDocTypes) as ClientDocumentType[]}
				onUploadComplete={() => {
					fetchDocuments();
					onDocumentChange?.();
				}}
			/>

			{/* ID Document Section (Physical persons only) */}
			{!needsUBOs && (
				<div className="space-y-4">
					<h3 className="text-lg font-semibold flex items-center gap-2">
						<FileText className="h-5 w-5" />
						Identificación Oficial
						{hasIdDocument && (
							<Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
								<CheckCircle2 className="h-3 w-3 mr-1" />
								Cargado
							</Badge>
						)}
					</h3>
					{hasIdDocument && existingIdDocument ? (
						<Card className="border-green-500 bg-green-50/50 dark:bg-green-950/20">
							<CardHeader className="pb-3">
								<CardTitle className="text-sm flex items-center justify-between">
									<span className="flex items-center gap-2">
										<FileText className="h-4 w-4" />
										{DOCUMENT_TYPE_CONFIG[existingIdDocument.documentType]
											?.label || existingIdDocument.documentType}
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
										#{existingIdDocument.documentNumber}
										{existingIdDocument.expiryDate && (
											<span className="ml-2">
												Vence:{" "}
												{new Date(
													existingIdDocument.expiryDate,
												).toLocaleDateString("es-MX")}
											</span>
										)}
									</p>
								</div>

								{/* Show thumbnails if metadata has image URLs - horizontal scrolling */}
								{existingIdDocument.metadata && (
									<div className="relative pt-2">
										<div className="flex gap-3 overflow-x-auto pb-2">
											{(existingIdDocument.metadata as any).ineFrontUrl && (
												<div className="flex-shrink-0 space-y-1">
													<p className="text-xs text-muted-foreground text-center">
														Frente
													</p>
													<div
														className="relative rounded-lg overflow-hidden bg-muted/30 border cursor-pointer group h-24"
														onClick={() => {
															const images: DocumentImage[] = [];
															if (
																(existingIdDocument.metadata as any).ineFrontUrl
															) {
																images.push({
																	src: (existingIdDocument.metadata as any)
																		.ineFrontUrl,
																	title: "Frente de INE",
																});
															}
															if (
																(existingIdDocument.metadata as any).ineBackUrl
															) {
																images.push({
																	src: (existingIdDocument.metadata as any)
																		.ineBackUrl,
																	title: "Reverso de INE",
																});
															}
															setDocumentViewer({
																open: true,
																images,
																initialIndex: 0,
																originalFileUrl: (
																	existingIdDocument.metadata as any
																)?.originalFileUrl,
															});
														}}
													>
														{existingIdDocument.docSvcDocumentId &&
														currentOrg?.id ? (
															<DocSvcImage
																organizationId={currentOrg.id}
																documentId={existingIdDocument.docSvcDocumentId}
																imageIndex={0}
																alt="Frente de INE"
																className="h-24 w-auto object-contain"
															/>
														) : (
															<img
																src={
																	(existingIdDocument.metadata as any)
																		.ineFrontUrl
																}
																alt="Frente de INE"
																className="h-24 w-auto object-contain"
																crossOrigin="anonymous"
															/>
														)}
														<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
															<ZoomIn className="h-6 w-6 text-white" />
														</div>
													</div>
												</div>
											)}
											{(existingIdDocument.metadata as any).ineBackUrl && (
												<div className="flex-shrink-0 space-y-1">
													<p className="text-xs text-muted-foreground text-center">
														Reverso
													</p>
													<div
														className="relative rounded-lg overflow-hidden bg-muted/30 border cursor-pointer group h-24"
														onClick={() => {
															const images: DocumentImage[] = [];
															if (
																(existingIdDocument.metadata as any).ineFrontUrl
															) {
																images.push({
																	src: (existingIdDocument.metadata as any)
																		.ineFrontUrl,
																	title: "Frente de INE",
																});
															}
															if (
																(existingIdDocument.metadata as any).ineBackUrl
															) {
																images.push({
																	src: (existingIdDocument.metadata as any)
																		.ineBackUrl,
																	title: "Reverso de INE",
																});
															}
															setDocumentViewer({
																open: true,
																images,
																initialIndex: 1,
																originalFileUrl: (
																	existingIdDocument.metadata as any
																)?.originalFileUrl,
															});
														}}
													>
														{existingIdDocument.docSvcDocumentId &&
														currentOrg?.id ? (
															<DocSvcImage
																organizationId={currentOrg.id}
																documentId={existingIdDocument.docSvcDocumentId}
																imageIndex={1}
																alt="Reverso de INE"
																className="h-24 w-auto object-contain"
															/>
														) : (
															<img
																src={
																	(existingIdDocument.metadata as any)
																		.ineBackUrl
																}
																alt="Reverso de INE"
																className="h-24 w-auto object-contain"
																crossOrigin="anonymous"
															/>
														)}
														<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
															<ZoomIn className="h-6 w-6 text-white" />
														</div>
													</div>
												</div>
											)}
											{(existingIdDocument.metadata as any).primaryFileUrl &&
												!(existingIdDocument.metadata as any).ineFrontUrl && (
													<div className="flex-shrink-0 space-y-1">
														<p className="text-xs text-muted-foreground text-center">
															Documento
														</p>
														<div
															className="relative rounded-lg overflow-hidden bg-muted/30 border cursor-pointer group h-24"
															onClick={() => {
																const images: DocumentImage[] = [
																	{
																		src: (existingIdDocument.metadata as any)
																			.primaryFileUrl,
																		title: "Documento",
																	},
																];
																setDocumentViewer({
																	open: true,
																	images,
																	initialIndex: 0,
																	originalFileUrl: (
																		existingIdDocument.metadata as any
																	)?.originalFileUrl,
																});
															}}
														>
															{existingIdDocument.docSvcDocumentId &&
															currentOrg?.id ? (
																<DocSvcImage
																	organizationId={currentOrg.id}
																	documentId={
																		existingIdDocument.docSvcDocumentId
																	}
																	imageIndex={0}
																	alt="Documento"
																	className="h-24 w-auto object-contain"
																/>
															) : (
																<img
																	src={
																		(existingIdDocument.metadata as any)
																			.primaryFileUrl
																	}
																	alt="Documento"
																	className="h-24 w-auto object-contain"
																	crossOrigin="anonymous"
																/>
															)}
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
								<div className="flex flex-wrap gap-2 pt-2">
									{existingIdDocument.fileUrl && (
										<Button
											variant="outline"
											size="sm"
											onClick={() => {
												const newWindow = window.open(
													existingIdDocument.fileUrl!,
													"_blank",
													"noopener,noreferrer",
												);
												if (newWindow) newWindow.opener = null;
											}}
										>
											<FileText className="h-4 w-4 sm:mr-2" />
											<span className="hidden sm:inline">
												Ver Documento Original
											</span>
											<span className="sm:hidden">Ver Original</span>
										</Button>
									)}
									<Button
										variant="outline"
										size="sm"
										onClick={() => setDocumentToDelete(existingIdDocument)}
										className="text-destructive hover:text-destructive"
									>
										<Trash2 className="h-4 w-4 sm:mr-2" />
										<span className="hidden sm:inline">Eliminar</span>
									</Button>
								</div>
							</CardContent>
						</Card>
					) : (
						<IDDocumentSelector
							required
							data={idDocumentData}
							onDataChange={handleIdDataChange}
							onUpload={handleIdUpload}
						/>
					)}
				</div>
			)}

			{/* Other Required Documents */}
			<div className="space-y-4">
				<h3 className="text-lg font-semibold flex items-center gap-2">
					<FileText className="h-5 w-5" />
					Documentos Requeridos
				</h3>
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
					{requiredDocs.map((docType) => {
						const config = DOCUMENT_TYPE_CONFIG[docType];
						const existingDoc = existingDocuments.find(
							(d) => d.documentType === docType,
						);
						const isUploaded = !!existingDoc;

						if (isUploaded && existingDoc) {
							// Show uploaded document card with thumbnails
							const metadata =
								existingDoc.metadata as DocumentFileMetadata | null;
							const hasImages =
								metadata &&
								(metadata.primaryFileUrl ||
									(metadata.rasterizedPageUrls &&
										metadata.rasterizedPageUrls.length > 0));

							return (
								<Card
									key={docType}
									className="border-green-500 bg-green-50/50 dark:bg-green-950/20"
								>
									<CardHeader className="pb-3">
										<CardTitle className="text-sm flex items-center justify-between">
											<span className="flex items-center gap-2">
												<FileText className="h-4 w-4" />
												{config.label}
											</span>
											<Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
												<CheckCircle2 className="h-3 w-3 mr-1" />
												Cargado
											</Badge>
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-3">
										{/* Show thumbnails if available */}
										{hasImages && (
											<div className="relative">
												<div className="flex gap-3 overflow-x-auto pb-2">
													{/* Primary file */}
													{metadata.primaryFileUrl && (
														<div className="flex-shrink-0 space-y-1">
															<p className="text-xs text-muted-foreground text-center">
																Documento
															</p>
															<div
																className="relative rounded-lg overflow-hidden bg-muted/30 border cursor-pointer group h-24"
																onClick={() => {
																	const images: DocumentImage[] = [];
																	if (metadata.primaryFileUrl) {
																		images.push({
																			src: metadata.primaryFileUrl,
																			title: "Documento",
																		});
																	}
																	if (metadata.rasterizedPageUrls) {
																		(
																			metadata.rasterizedPageUrls as string[]
																		).forEach((url, idx) => {
																			images.push({
																				src: url,
																				title: `Página ${idx + 1}`,
																			});
																		});
																	}
																	setDocumentViewer({
																		open: true,
																		images,
																		initialIndex: 0,
																		originalFileUrl: metadata.originalFileUrl,
																	});
																}}
															>
																{existingDoc.docSvcDocumentId &&
																currentOrg?.id ? (
																	<DocSvcImage
																		organizationId={currentOrg.id}
																		documentId={existingDoc.docSvcDocumentId}
																		imageIndex={0}
																		alt="Documento"
																		className="h-24 w-auto object-contain"
																	/>
																) : (
																	<img
																		src={metadata.primaryFileUrl}
																		alt="Documento"
																		className="h-24 w-auto object-contain"
																		crossOrigin="anonymous"
																	/>
																)}
																<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
																	<ZoomIn className="h-6 w-6 text-white" />
																</div>
															</div>
														</div>
													)}

													{/* Rasterized pages */}
													{metadata.rasterizedPageUrls &&
														(metadata.rasterizedPageUrls as string[]).map(
															(url, idx) => (
																<div
																	key={idx}
																	className="flex-shrink-0 space-y-1"
																>
																	<p className="text-xs text-muted-foreground text-center">
																		Página {idx + 1}
																	</p>
																	<div
																		className="relative rounded-lg overflow-hidden bg-muted/30 border cursor-pointer group h-24"
																		onClick={() => {
																			const allPages =
																				metadata.rasterizedPageUrls as string[];
																			const images: DocumentImage[] =
																				allPages.map(
																					(
																						pageUrl: string,
																						pageIdx: number,
																					) => ({
																						src: pageUrl,
																						title: `Página ${pageIdx + 1}`,
																					}),
																				);
																			setDocumentViewer({
																				open: true,
																				images,
																				initialIndex: idx,
																				originalFileUrl:
																					metadata.originalFileUrl,
																			});
																		}}
																	>
																		{existingDoc.docSvcDocumentId &&
																		currentOrg?.id ? (
																			<DocSvcImage
																				organizationId={currentOrg.id}
																				documentId={
																					existingDoc.docSvcDocumentId
																				}
																				imageIndex={idx + 1}
																				alt={`Página ${idx + 1}`}
																				className="h-24 w-auto object-contain"
																			/>
																		) : (
																			<img
																				src={url}
																				alt={`Página ${idx + 1}`}
																				className="h-24 w-auto object-contain"
																				crossOrigin="anonymous"
																			/>
																		)}
																		<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
																			<ZoomIn className="h-6 w-6 text-white" />
																		</div>
																	</div>
																</div>
															),
														)}
												</div>
											</div>
										)}

										{/* Action buttons */}
										<div className="flex flex-wrap gap-2">
											{existingDoc.fileUrl && (
												<Button
													variant="outline"
													size="sm"
													onClick={() =>
														window.open(existingDoc.fileUrl!, "_blank")
													}
												>
													<FileText className="h-4 w-4 sm:mr-2" />
													<span className="hidden sm:inline">
														Ver Documento Original
													</span>
													<span className="sm:hidden">Ver Original</span>
												</Button>
											)}
											<Button
												variant="outline"
												size="sm"
												onClick={() => setDocumentToDelete(existingDoc)}
												className="text-destructive hover:text-destructive"
											>
												<Trash2 className="h-4 w-4 sm:mr-2" />
												<span className="hidden sm:inline">Eliminar</span>
											</Button>
										</div>
									</CardContent>
								</Card>
							);
						}

						// Show upload card
						return (
							<SimpleDocumentUploadCard
								key={docType}
								documentType={docType}
								title={config.label}
								description={config.description}
								required
								data={documentData[docType] || null}
								onDataChange={(data) => handleDocDataChange(docType, data)}
								onUpload={handleDocUpload}
							/>
						);
					})}
				</div>
			</div>

			{/* Delete Confirmation Dialog */}
			<AlertDialog
				open={!!documentToDelete}
				onOpenChange={(open) => !open && setDocumentToDelete(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>¿Eliminar documento?</AlertDialogTitle>
						<AlertDialogDescription>
							Esta acción no se puede deshacer. El documento será eliminado
							permanentemente del expediente del cliente.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>
							Cancelar
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteDocument}
							disabled={isDeleting}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{isDeleting ? "Eliminando..." : "Eliminar"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Document Viewer Dialog */}
			<DocumentViewerDialog
				open={documentViewer.open}
				onOpenChange={(open) =>
					setDocumentViewer((prev) => ({ ...prev, open }))
				}
				images={documentViewer.images}
				initialIndex={documentViewer.initialIndex}
				originalFileUrl={documentViewer.originalFileUrl}
			/>
		</div>
	);
}
