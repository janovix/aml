"use client";

import * as React from "react";
import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useOrgStore } from "@/lib/org-store";
import {
	FileText,
	CheckCircle2,
	ArrowRight,
	Users,
	AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { createClientDocument } from "@/lib/api/client-documents";
import { uploadDocumentFiles } from "@/lib/api/file-upload";
import type { Client, PersonType } from "@/types/client";
import type {
	ClientDocumentType,
	ClientDocumentCreateRequest,
	DocumentFileMetadata,
} from "@/types/client-document";
import {
	SimpleDocumentUploadCard,
	type SimpleDocumentUploadData,
} from "./SimpleDocumentUploadCard";
import { IDDocumentSelector, type IDDocumentData } from "./IDDocumentSelector";
import { UBOInlineForm, type UBOWithDocuments } from "./UBOInlineForm";
import { FormActionBar } from "@/components/ui/FormActionBar";

interface DocumentsStepProps {
	clientId: string;
	client: Client;
	personType: PersonType;
	onComplete: () => void;
	onSkip: () => void;
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

export function DocumentsStep({
	clientId,
	client,
	personType,
	onComplete,
	onSkip,
}: DocumentsStepProps) {
	// Document state for each required document
	const [idDocumentData, setIdDocumentData] = useState<IDDocumentData | null>(
		null,
	);
	const [documentData, setDocumentData] = useState<
		Record<ClientDocumentType, SimpleDocumentUploadData | null>
	>({} as any);
	const [uploadedDocs, setUploadedDocs] = useState<Set<ClientDocumentType>>(
		new Set(),
	);
	const [idUploaded, setIdUploaded] = useState(false);

	// UBO state (for moral/trust entities)
	const [ubos, setUbos] = useState<UBOWithDocuments[]>([]);

	const requiredDocs = REQUIRED_DOCUMENTS[personType];
	const needsUBOs = personType === "moral" || personType === "trust";

	// Calculate progress
	const totalRequired = requiredDocs.length + 1; // +1 for ID
	const completedDocs = uploadedDocs.size + (idUploaded ? 1 : 0);
	const progress = Math.round((completedDocs / totalRequired) * 100);

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
					await fetch(
						`/api/aml-core/clients/${clientId}/documents/${createdDoc.id}`,
						{
							method: "PATCH",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({
								fileUrl: uploadResult.primary.url,
								metadata: fileMetadata,
							}),
						},
					);
				} else {
					// No files to upload, just create the document record
					await createClientDocument({ clientId, input });
				}

				setIdUploaded(true);
				toast.success("Identificación guardada exitosamente");
			} catch (error) {
				console.error("Error uploading ID document:", error);
				toast.error("Error al guardar la identificación");
				throw error;
			}
		},
		[clientId],
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
					await fetch(
						`/api/aml-core/clients/${clientId}/documents/${createdDoc.id}`,
						{
							method: "PATCH",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({
								fileUrl: uploadResult.primary.url,
								metadata: fileMetadata,
							}),
						},
					);
				} else {
					// No files to upload, just create the document record
					await createClientDocument({ clientId, input });
				}

				setUploadedDocs((prev) => new Set([...prev, data.documentType]));
				toast.success("Documento guardado exitosamente");
			} catch (error) {
				console.error("Error uploading document:", error);
				toast.error("Error al guardar el documento");
				throw error;
			}
		},
		[clientId],
	);

	const handleUBOsChange = useCallback((newUbos: UBOWithDocuments[]) => {
		setUbos(newUbos);
	}, []);

	const handleComplete = () => {
		// Check minimum requirements
		if (!idUploaded) {
			toast.error("Debes cargar una identificación oficial");
			return;
		}

		// Check if at least some documents are uploaded
		if (completedDocs < 2) {
			toast.error("Debes cargar al menos 2 documentos");
			return;
		}

		// For moral/trust, check if at least one stockholder or legal rep exists
		if (needsUBOs && ubos.length === 0) {
			toast.error(
				"Debes registrar al menos un accionista o representante legal",
			);
			return;
		}

		onComplete();
	};

	return (
		<div className="space-y-6">
			{/* Progress indicator */}
			<Card>
				<CardContent className="p-4">
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
				</CardContent>
			</Card>

			{/* ID Document Section (Physical persons only) */}
			{!needsUBOs && (
				<div className="space-y-4">
					<h3 className="text-lg font-semibold flex items-center gap-2">
						<FileText className="h-5 w-5" />
						Identificación Oficial
					</h3>
					<IDDocumentSelector
						required
						data={idDocumentData}
						onDataChange={handleIdDataChange}
						onUpload={handleIdUpload}
						clientId={clientId}
					/>
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

			{/* UBO Section (for moral/trust) */}
			{needsUBOs && (
				<div className="space-y-4">
					<h3 className="text-lg font-semibold flex items-center gap-2">
						<Users className="h-5 w-5" />
						Accionistas y Representante Legal
						<Badge
							variant="outline"
							className="text-xs bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
						>
							Requerido
						</Badge>
					</h3>
					<Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/30">
						<CardContent className="p-4">
							<div className="flex items-start gap-2">
								<AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
								<div className="text-sm text-amber-800 dark:text-amber-200 space-y-2">
									<p>
										Para personas morales y fideicomisos, es obligatorio
										registrar:
									</p>
									<ul className="list-disc list-inside space-y-1 ml-2">
										<li>
											<strong>Accionistas:</strong> Personas físicas con 25% o
											más de participación accionaria
										</li>
										<li>
											<strong>Representante Legal:</strong> Persona autorizada
											para actuar en nombre de la entidad
										</li>
									</ul>
								</div>
							</div>
						</CardContent>
					</Card>
					<UBOInlineForm
						clientId={clientId}
						ubos={ubos}
						onUBOsChange={handleUBOsChange}
					/>
				</div>
			)}

			{/* Summary and actions */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-base">Resumen del Expediente</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-2 gap-4 text-sm">
						<div className="flex items-center gap-2">
							{idUploaded ? (
								<CheckCircle2 className="h-4 w-4 text-green-600" />
							) : (
								<div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
							)}
							<span>Identificación oficial</span>
						</div>
						{requiredDocs.map((docType) => (
							<div key={docType} className="flex items-center gap-2">
								{uploadedDocs.has(docType) ? (
									<CheckCircle2 className="h-4 w-4 text-green-600" />
								) : (
									<div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
								)}
								<span>{DOCUMENT_CONFIG[docType].title}</span>
							</div>
						))}
						{needsUBOs && (
							<>
								<div className="flex items-center gap-2">
									{ubos.filter((u) => u.relationshipType === "SHAREHOLDER")
										.length > 0 ? (
										<CheckCircle2 className="h-4 w-4 text-green-600" />
									) : (
										<div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
									)}
									<span>
										Accionistas (
										{
											ubos.filter((u) => u.relationshipType === "SHAREHOLDER")
												.length
										}
										)
									</span>
								</div>
								<div className="flex items-center gap-2">
									{ubos.filter((u) => u.relationshipType === "LEGAL_REP")
										.length > 0 ? (
										<CheckCircle2 className="h-4 w-4 text-green-600" />
									) : (
										<div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
									)}
									<span>
										Representante Legal (
										{
											ubos.filter((u) => u.relationshipType === "LEGAL_REP")
												.length
										}
										)
									</span>
								</div>
							</>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Fixed Action Bar */}
			<FormActionBar
				actions={[
					{
						label: "Finalizar",
						icon: CheckCircle2,
						onClick: handleComplete,
					},
					{
						label: "Completar después",
						onClick: onSkip,
						variant: "outline",
					},
				]}
			/>
		</div>
	);
}
