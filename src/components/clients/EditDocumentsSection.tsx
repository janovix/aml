"use client";

import * as React from "react";
import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	FileText,
	CheckCircle2,
	AlertCircle,
	ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import {
	listClientDocuments,
	createClientDocument,
	patchClientDocument,
} from "@/lib/api/client-documents";
import { uploadDocumentFiles } from "@/lib/api/file-upload";
import { useOrgStore } from "@/lib/org-store";
import { getProxiedFileUrl } from "@/lib/utils/file-proxy";
import type { PersonType } from "@/types/client";
import type {
	ClientDocumentType,
	ClientDocumentCreateRequest,
	ClientDocument,
	DocumentFileMetadata,
} from "@/types/client-document";
import {
	SimpleDocumentUploadCard,
	type SimpleDocumentUploadData,
} from "./wizard/SimpleDocumentUploadCard";
import {
	IDDocumentSelector,
	type IDDocumentData,
} from "./wizard/IDDocumentSelector";
import { Button } from "../ui/button";

interface EditDocumentsSectionProps {
	clientId: string;
	personType: PersonType;
	className?: string;
	onDocumentChange?: () => void;
}

// Document configuration per type
const DOCUMENT_CONFIG: Record<
	ClientDocumentType,
	{
		title: string;
		description: string;
		showExpiryDate: boolean;
	}
> = {
	NATIONAL_ID: {
		title: "INE/IFE",
		description: "Credencial para Votar del INE",
		showExpiryDate: true,
	},
	PASSPORT: {
		title: "Pasaporte",
		description: "Pasaporte mexicano vigente",
		showExpiryDate: true,
	},
	DRIVERS_LICENSE: {
		title: "Licencia de Conducir",
		description: "Licencia de conducir vigente",
		showExpiryDate: true,
	},
	CEDULA_PROFESIONAL: {
		title: "Cédula Profesional",
		description: "Cédula profesional expedida por SEP",
		showExpiryDate: false,
	},
	CARTILLA_MILITAR: {
		title: "Cartilla Militar",
		description: "Cartilla del servicio militar nacional",
		showExpiryDate: false,
	},
	TAX_ID: {
		title: "Constancia de Situación Fiscal",
		description: "Constancia de situación fiscal emitida por el SAT (RFC)",
		showExpiryDate: false,
	},
	PROOF_OF_ADDRESS: {
		title: "Comprobante de Domicilio",
		description: "Recibo de servicios con antigüedad no mayor a 3 meses",
		showExpiryDate: false,
	},
	UTILITY_BILL: {
		title: "Recibo de Servicios",
		description: "Recibo de luz, agua, gas o teléfono",
		showExpiryDate: false,
	},
	BANK_STATEMENT: {
		title: "Estado de Cuenta Bancario",
		description: "Estado de cuenta bancario reciente",
		showExpiryDate: false,
	},
	ACTA_CONSTITUTIVA: {
		title: "Acta Constitutiva",
		description: "Escritura pública de constitución de la empresa",
		showExpiryDate: false,
	},
	PODER_NOTARIAL: {
		title: "Poder Notarial",
		description: "Poder otorgado ante notario público al representante legal",
		showExpiryDate: false,
	},
	TRUST_AGREEMENT: {
		title: "Contrato de Fideicomiso",
		description: "Contrato del fideicomiso debidamente protocolizado",
		showExpiryDate: false,
	},
	CORPORATE_BYLAWS: {
		title: "Estatutos Sociales",
		description: "Estatutos de la sociedad",
		showExpiryDate: false,
	},
	OTHER: {
		title: "Otro Documento",
		description: "Otro tipo de documento",
		showExpiryDate: false,
	},
};

// Required documents per person type (excluding ID which is handled separately)
const REQUIRED_DOCUMENTS: Record<PersonType, ClientDocumentType[]> = {
	physical: ["PROOF_OF_ADDRESS", "TAX_ID"],
	moral: ["ACTA_CONSTITUTIVA", "PODER_NOTARIAL", "TAX_ID", "PROOF_OF_ADDRESS"],
	trust: ["TRUST_AGREEMENT", "TAX_ID", "PROOF_OF_ADDRESS"],
};

// ID document types
const ID_DOCUMENT_TYPES: ClientDocumentType[] = ["NATIONAL_ID", "PASSPORT"];

export function EditDocumentsSection({
	clientId,
	personType,
	className,
	onDocumentChange,
}: EditDocumentsSectionProps) {
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

	const requiredDocs = REQUIRED_DOCUMENTS[personType];
	const needsUBOs = personType === "moral" || personType === "trust";

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
			const { currentOrg } = useOrgStore.getState();

			if (!currentOrg?.id) {
				toast.error("No se pudo obtener la organización actual");
				throw new Error("Organization ID not available");
			}

			try {
				// Build base document input
				const input: ClientDocumentCreateRequest = {
					documentType: data.documentType,
					documentNumber: data.documentNumber,
					status: "PENDING",
					expiryDate: data.expiryDate,
				};

				// Upload all files if available
				if (data.processedBlob) {
					// First create the document to get an ID
					const createdDoc = await createClientDocument({ clientId, input });

					const filesToUpload: Array<{
						file: Blob;
						name: string;
						type: string;
					}> = [];

					// Add rasterized images if PDF was processed
					if (data.rasterizedImages && data.rasterizedImages.length > 0) {
						data.rasterizedImages.forEach((blob, index) => {
							filesToUpload.push({
								file: blob,
								name: `rasterized_page_${index + 1}.jpg`,
								type: `rasterized_page_${index + 1}`,
							});
						});
					}

					// Add INE front/back if available
					if (data.ineFrontBlob) {
						filesToUpload.push({
							file: data.ineFrontBlob,
							name: "ine_front.jpg",
							type: "ine_front",
						});
					}
					if (data.ineBackBlob) {
						filesToUpload.push({
							file: data.ineBackBlob,
							name: "ine_back.jpg",
							type: "ine_back",
						});
					}

					// Upload all files
					const uploadResult = await uploadDocumentFiles({
						primaryFile: data.processedBlob,
						originalFile: data.originalFile,
						relatedFiles: filesToUpload.length > 0 ? filesToUpload : undefined,
						organizationId: currentOrg.id,
						clientId,
						documentId: createdDoc.id,
					});

					// Build metadata with all file URLs
					const fileMetadata: DocumentFileMetadata = {
						primaryFileUrl: uploadResult.primary.url,
						originalFileUrl: uploadResult.original?.url,
					};

					// Add INE URLs if available
					const ineFront = uploadResult.related.find((r) =>
						r.key.includes("ine_front"),
					);
					const ineBack = uploadResult.related.find((r) =>
						r.key.includes("ine_back"),
					);
					if (ineFront) fileMetadata.ineFrontUrl = ineFront.url;
					if (ineBack) fileMetadata.ineBackUrl = ineBack.url;

					// Add rasterized page URLs if available
					const rasterizedPages = uploadResult.related.filter((r) =>
						r.key.includes("rasterized_page"),
					);
					if (rasterizedPages.length > 0) {
						fileMetadata.rasterizedPageUrls = rasterizedPages.map((r) => r.url);
					}

					// Update document with file URLs using PATCH
					await patchClientDocument({
						clientId,
						documentId: createdDoc.id,
						input: {
							fileUrl: uploadResult.primary.url,
							metadata: fileMetadata as Record<string, unknown>,
						},
					});
				} else {
					// No files to upload, just create the document record
					await createClientDocument({ clientId, input });
				}

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
			const { currentOrg } = useOrgStore.getState();

			if (!currentOrg?.id) {
				toast.error("No se pudo obtener la organización actual");
				throw new Error("Organization ID not available");
			}

			try {
				// Build base document input (no document number needed for simple documents)
				const input: ClientDocumentCreateRequest = {
					documentType: data.documentType,
					documentNumber: "N/A", // Not required for these documents
					status: "PENDING",
				};

				// Upload all files if available
				if (data.rasterizedImages && data.rasterizedImages.length > 0) {
					// First create the document to get an ID
					const createdDoc = await createClientDocument({ clientId, input });

					// Prepare rasterized images for upload
					const filesToUpload: Array<{
						file: Blob;
						name: string;
						type: string;
					}> = [];
					data.rasterizedImages.forEach((blob, index) => {
						filesToUpload.push({
							file: blob,
							name: `page_${index + 1}.jpg`,
							type: `rasterized_page_${index + 1}`,
						});
					});

					// Upload all files (primary = first page, rest as related)
					const uploadResult = await uploadDocumentFiles({
						primaryFile: data.rasterizedImages[0],
						originalFile: data.originalFile,
						relatedFiles: filesToUpload.slice(1), // Skip first page as it's the primary
						organizationId: currentOrg.id,
						clientId,
						documentId: createdDoc.id,
					});

					// Build metadata with all file URLs
					const fileMetadata: DocumentFileMetadata = {
						primaryFileUrl: uploadResult.primary.url,
						originalFileUrl: uploadResult.original?.url,
					};

					// Add all rasterized page URLs
					const allPageUrls = [uploadResult.primary.url];
					if (uploadResult.related.length > 0) {
						allPageUrls.push(...uploadResult.related.map((r) => r.url));
					}
					fileMetadata.rasterizedPageUrls = allPageUrls;

					// Update document with file URLs using PATCH
					await patchClientDocument({
						clientId,
						documentId: createdDoc.id,
						input: {
							fileUrl: uploadResult.primary.url,
							metadata: fileMetadata as Record<string, unknown>,
						},
					});
				} else {
					// No files to upload, just create the document record
					await createClientDocument({ clientId, input });
				}

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
										{DOCUMENT_CONFIG[docType]?.title || docType}
									</li>
								))}
							</ul>
						</div>
					)}
				</CardContent>
			</Card>

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
							<CardContent className="p-4 space-y-3">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<CheckCircle2 className="h-5 w-5 text-green-600" />
										<div>
											<p className="font-medium">
												{DOCUMENT_CONFIG[existingIdDocument.documentType]
													?.title || existingIdDocument.documentType}
											</p>
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
									</div>
									{existingIdDocument.fileUrl && (
										<Button
											variant="outline"
											size="sm"
											onClick={() => {
												// Open in new tab with security attributes
												const newWindow = window.open(
													existingIdDocument.fileUrl!,
													"_blank",
													"noopener,noreferrer",
												);
												if (newWindow) newWindow.opener = null;
											}}
										>
											<FileText className="h-4 w-4 mr-2" />
											Ver Documento
										</Button>
									)}
								</div>

								{/* Show thumbnails if metadata has image URLs */}
								{existingIdDocument.metadata && (
									<div className="grid grid-cols-2 gap-2 pt-2">
										{(existingIdDocument.metadata as any).ineFrontUrl && (
											<div className="space-y-1">
												<p className="text-xs text-muted-foreground text-center">
													Frente
												</p>
												<div
													className="relative rounded-lg overflow-hidden bg-muted/30 border cursor-pointer group h-24"
													onClick={() =>
														window.open(
															(existingIdDocument.metadata as any).ineFrontUrl,
															"_blank",
														)
													}
												>
													<Image
														src={
															getProxiedFileUrl(
																(existingIdDocument.metadata as any)
																	.ineFrontUrl,
															) || ""
														}
														alt="Frente de INE"
														fill
														className="object-contain"
														unoptimized
													/>
													<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
														<ExternalLink className="h-6 w-6 text-white" />
													</div>
												</div>
											</div>
										)}
										{(existingIdDocument.metadata as any).ineBackUrl && (
											<div className="space-y-1">
												<p className="text-xs text-muted-foreground text-center">
													Reverso
												</p>
												<div
													className="relative rounded-lg overflow-hidden bg-muted/30 border cursor-pointer group h-24"
													onClick={() =>
														window.open(
															(existingIdDocument.metadata as any).ineBackUrl,
															"_blank",
														)
													}
												>
													<Image
														src={
															getProxiedFileUrl(
																(existingIdDocument.metadata as any).ineBackUrl,
															) || ""
														}
														alt="Reverso de INE"
														fill
														className="object-contain"
														unoptimized
													/>
													<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
														<ExternalLink className="h-6 w-6 text-white" />
													</div>
												</div>
											</div>
										)}
										{(existingIdDocument.metadata as any).primaryFileUrl &&
											!(existingIdDocument.metadata as any).ineFrontUrl && (
												<div className="col-span-2 space-y-1">
													<p className="text-xs text-muted-foreground text-center">
														Documento
													</p>
													<div
														className="relative rounded-lg overflow-hidden bg-muted/30 border cursor-pointer group h-32"
														onClick={() =>
															window.open(
																(existingIdDocument.metadata as any)
																	.primaryFileUrl,
																"_blank",
															)
														}
													>
														<Image
															src={
																getProxiedFileUrl(
																	(existingIdDocument.metadata as any)
																		.primaryFileUrl,
																) || ""
															}
															alt="Documento"
															fill
															className="object-contain"
															unoptimized
														/>
														<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
															<ExternalLink className="h-6 w-6 text-white" />
														</div>
													</div>
												</div>
											)}
									</div>
								)}
							</CardContent>
						</Card>
					) : (
						<IDDocumentSelector
							required
							data={idDocumentData}
							onDataChange={handleIdDataChange}
							onUpload={handleIdUpload}
							clientId={clientId}
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
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{requiredDocs.map((docType) => {
						const config = DOCUMENT_CONFIG[docType];
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
												{config.title}
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
												#{existingDoc.documentNumber}
											</p>
											{existingDoc.expiryDate && (
												<p className="text-xs text-muted-foreground mt-1">
													Vence:{" "}
													{new Date(existingDoc.expiryDate).toLocaleDateString(
														"es-MX",
													)}
												</p>
											)}
										</div>

										{/* Show thumbnails if available */}
										{hasImages && (
											<div className="grid grid-cols-2 gap-2">
												{/* Primary file */}
												{metadata.primaryFileUrl && (
													<div className="space-y-1">
														<p className="text-xs text-muted-foreground text-center">
															Documento
														</p>
														<div
															className="relative rounded-lg overflow-hidden bg-muted/30 border cursor-pointer group h-24"
															onClick={() =>
																window.open(metadata.primaryFileUrl!, "_blank")
															}
														>
															<Image
																src={
																	getProxiedFileUrl(metadata.primaryFileUrl) ||
																	""
																}
																alt="Documento"
																fill
																className="object-contain"
																unoptimized
															/>
															<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
																<ExternalLink className="h-6 w-6 text-white" />
															</div>
														</div>
													</div>
												)}

												{/* Rasterized pages */}
												{metadata.rasterizedPageUrls &&
													metadata.rasterizedPageUrls
														.slice(0, 3)
														.map((url, idx) => (
															<div key={idx} className="space-y-1">
																<p className="text-xs text-muted-foreground text-center">
																	Página {idx + 1}
																</p>
																<div
																	className="relative rounded-lg overflow-hidden bg-muted/30 border cursor-pointer group h-24"
																	onClick={() => window.open(url, "_blank")}
																>
																	<Image
																		src={getProxiedFileUrl(url) || ""}
																		alt={`Página ${idx + 1}`}
																		fill
																		className="object-contain"
																		unoptimized
																	/>
																	<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
																		<ExternalLink className="h-6 w-6 text-white" />
																	</div>
																</div>
															</div>
														))}

												{/* Show "more pages" indicator */}
												{metadata.rasterizedPageUrls &&
													metadata.rasterizedPageUrls.length > 3 && (
														<div className="flex items-center justify-center text-xs text-muted-foreground">
															+{metadata.rasterizedPageUrls.length - 3} más
														</div>
													)}
											</div>
										)}

										{/* View button if fileUrl exists */}
										{existingDoc.fileUrl && (
											<Button
												variant="outline"
												size="sm"
												className="w-full"
												onClick={() =>
													window.open(existingDoc.fileUrl!, "_blank")
												}
											>
												<FileText className="h-4 w-4 mr-2" />
												Ver Documento Original
											</Button>
										)}
									</CardContent>
								</Card>
							);
						}

						// Show upload card
						return (
							<SimpleDocumentUploadCard
								key={docType}
								documentType={docType}
								title={config.title}
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
		</div>
	);
}
