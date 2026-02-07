"use client";

import * as React from "react";
import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useOrgStore } from "@/lib/org-store";
import * as Sentry from "@sentry/nextjs";
import {
	FileText,
	CheckCircle2,
	ArrowRight,
	Users,
	AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { createClientDocument } from "@/lib/api/client-documents";
import { uploadDocumentForKYC } from "@/lib/api/file-upload";
import type { Client, PersonType } from "@/types/client";
import type {
	ClientDocumentType,
	ClientDocumentCreateRequest,
} from "@/types/client-document";
import {
	DOCUMENT_TYPE_CONFIG,
	REQUIRED_DOCUMENTS,
	requiresUBOs,
} from "@/lib/constants";
import {
	SimpleDocumentUploadCard,
	type SimpleDocumentUploadData,
} from "./SimpleDocumentUploadCard";
import { IDDocumentSelector, type IDDocumentData } from "./IDDocumentSelector";
import { UBOInlineForm, type UBOWithDocuments } from "./UBOInlineForm";
import { MobileUploadCard } from "../MobileUploadCard";

interface DocumentsStepProps {
	clientId: string;
	client: Client;
	personType: PersonType;
	onComplete: () => void;
	onSkip: () => void;
}

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
	const needsUBOs = requiresUBOs(personType);
	const idRequired = !needsUBOs; // ID only required for physical persons

	// Calculate progress
	const totalRequired = requiredDocs.length + (idRequired ? 1 : 0); // +1 for ID if required
	const completedDocs = uploadedDocs.size + (idUploaded && idRequired ? 1 : 0);
	const progress = Math.round((completedDocs / totalRequired) * 100);

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
		Sentry.startSpan(
			{ op: "ui.click", name: "DocumentsStep.complete" },
			(span) => {
				span.setAttribute("clientId", clientId);
				span.setAttribute("completedDocs", completedDocs);

				// Check ID requirement (only for physical persons)
				if (idRequired && !idUploaded) {
					toast.error("Debes cargar una identificación oficial");
					return;
				}

				// Check if at least some documents are uploaded
				const minDocs = idRequired ? 2 : 1; // Physical: ID + 1 doc, Moral/Trust: 1 doc
				if (completedDocs < minDocs) {
					toast.error(
						`Debes cargar al menos ${minDocs} documento${minDocs > 1 ? "s" : ""}`,
					);
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
			},
		);
	};

	const handleSkipClick = () => {
		Sentry.startSpan({ op: "ui.click", name: "DocumentsStep.skip" }, (span) => {
			span.setAttribute("clientId", clientId);
			onSkip();
		});
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

			{/* Mobile upload link */}
			<MobileUploadCard
				clientId={clientId}
				clientName={
					client.firstName
						? `${client.firstName} ${client.lastName || ""}`.trim()
						: client.businessName || ""
				}
				clientType={personType}
				uploadedDocuments={[
					...(idUploaded ? ["NATIONAL_ID" as ClientDocumentType] : []),
					...Array.from(uploadedDocs),
				]}
				onUploadComplete={() => {
					// Refresh the page or refetch documents
					toast.info(
						"Documento recibido - actualiza la página para ver los cambios",
					);
				}}
			/>

			{/* ID Document Section (Physical persons only) */}
			{idRequired && (
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
						const config = DOCUMENT_TYPE_CONFIG[docType];
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
						{/* Only show ID for physical persons */}
						{idRequired && (
							<div className="flex items-center gap-2">
								{idUploaded ? (
									<CheckCircle2 className="h-4 w-4 text-green-600" />
								) : (
									<div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
								)}
								<span>Identificación oficial</span>
							</div>
						)}
						{requiredDocs.map((docType) => (
							<div key={docType} className="flex items-center gap-2">
								{uploadedDocs.has(docType) ? (
									<CheckCircle2 className="h-4 w-4 text-green-600" />
								) : (
									<div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
								)}
								<span>{DOCUMENT_TYPE_CONFIG[docType].label}</span>
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

			{/* Action buttons */}
			<div className="flex justify-end gap-3">
				<Button variant="outline" onClick={handleSkipClick}>
					Completar después
				</Button>
				<Button onClick={handleComplete}>
					<CheckCircle2 className="h-4 w-4 mr-2" />
					Finalizar
				</Button>
			</div>
		</div>
	);
}
