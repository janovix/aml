"use client";

import * as React from "react";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
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
import { Plus, Trash2, Loader2, User, UserCheck, Pencil } from "lucide-react";
import { toast } from "sonner";
import { createUBO, deleteUBO } from "@/lib/api/ubos";
import type { UBOCreateRequest, UBORelationshipType } from "@/types/ubo";
import { ZipCodeAddressFields } from "../ZipCodeAddressFields";
import {
	LegalRepresentativeForm,
	type LegalRepFormData as UnifiedLegalRepFormData,
} from "../LegalRepresentativeForm";
import {
	createClientDocument,
	patchClientDocument,
} from "@/lib/api/client-documents";
import { uploadDocumentFiles } from "@/lib/api/file-upload";
import type { ClientDocument, ClientDocumentType } from "@/types/client-document";
import { useOrgStore } from "@/lib/org-store";
import { UploadedIDDocumentCard } from "../UploadedIDDocumentCard";

export interface UBOWithDocuments {
	id: string;
	firstName: string;
	lastName: string;
	secondLastName?: string;
	curp?: string;
	rfc?: string;
	relationshipType: UBORelationshipType;
	ownershipPercentage?: number;
	idDocumentId?: string;
	/** Full ID document data if available */
	idDocument?: ClientDocument;
}

interface UBOFormData {
	firstName: string;
	lastName: string;
	secondLastName: string;
	birthDate: string;
	ownershipPercentage: string;
	// Address fields (for stockholders)
	postalCode: string;
	city: string;
	municipality: string;
	stateCode: string;
	neighborhood: string;
	street: string;
	externalNumber: string;
	internalNumber: string;
	reference: string;
}

// Legacy interface kept for internal state management
interface LegacyLegalRepFormData {
	firstName: string;
	lastName: string;
	secondLastName: string;
	birthDate: string;
}

interface UBOInlineFormProps {
	clientId: string;
	ubos: UBOWithDocuments[];
	onUBOsChange: (ubos: UBOWithDocuments[]) => void;
}

const INITIAL_UBO_FORM_DATA: UBOFormData = {
	firstName: "",
	lastName: "",
	secondLastName: "",
	birthDate: "",
	ownershipPercentage: "",
	postalCode: "",
	city: "",
	municipality: "",
	stateCode: "",
	neighborhood: "",
	street: "",
	externalNumber: "",
	internalNumber: "",
	reference: "",
};

const INITIAL_LEGAL_REP_FORM_DATA: LegacyLegalRepFormData = {
	firstName: "",
	lastName: "",
	secondLastName: "",
	birthDate: "",
};

export function UBOInlineForm({
	clientId,
	ubos,
	onUBOsChange,
}: UBOInlineFormProps) {
	const [isUBODialogOpen, setIsUBODialogOpen] = useState(false);
	const [isEditingLegalRep, setIsEditingLegalRep] = useState(false);
	const [uboFormData, setUboFormData] = useState<UBOFormData>(
		INITIAL_UBO_FORM_DATA,
	);
	const [legalRepFormData, setLegalRepFormData] =
		useState<LegacyLegalRepFormData>(INITIAL_LEGAL_REP_FORM_DATA);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [deleteConfirmUBO, setDeleteConfirmUBO] =
		useState<UBOWithDocuments | null>(null);

	// Separate stockholders from legal representative
	const stockholders = ubos.filter(
		(ubo) => ubo.relationshipType === "SHAREHOLDER",
	);
	const legalRep = ubos.find((ubo) => ubo.relationshipType === "LEGAL_REP");

	const handleUBOInputChange = (field: keyof UBOFormData, value: string) => {
		setUboFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleLegalRepInputChange = (
		field: keyof LegacyLegalRepFormData,
		value: string,
	) => {
		setLegalRepFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleSubmitUBO = async (e: React.FormEvent) => {
		e.preventDefault();

		// Validation
		if (!uboFormData.firstName.trim() || !uboFormData.lastName.trim()) {
			toast.error("Nombre y apellido paterno son requeridos");
			return;
		}

		if (!uboFormData.birthDate) {
			toast.error("La fecha de nacimiento es requerida");
			return;
		}

		if (!uboFormData.ownershipPercentage) {
			toast.error("El porcentaje de participación es requerido");
			return;
		}

		const ownershipPercentage = parseFloat(uboFormData.ownershipPercentage);

		// Validate ownership percentage is at least 25% (legal requirement)
		if (ownershipPercentage < 25) {
			toast.error(
				"La ley requiere reportar solo accionistas con 25% o más de participación",
			);
			return;
		}

		// Validate cap table doesn't exceed 100%
		const currentTotal = stockholders.reduce(
			(sum, ubo) => sum + (ubo.ownershipPercentage || 0),
			0,
		);
		const newTotal = currentTotal + ownershipPercentage;

		if (newTotal > 100) {
			toast.error(
				`La tabla de capitalización excedería el 100% (actual: ${currentTotal.toFixed(2)}%, nuevo total: ${newTotal.toFixed(2)}%)`,
			);
			return;
		}

		// Validate address fields
		if (!uboFormData.street.trim() || !uboFormData.externalNumber.trim()) {
			toast.error("Calle y número exterior son requeridos");
			return;
		}

		if (!uboFormData.postalCode.trim()) {
			toast.error("Código postal es requerido");
			return;
		}

		setIsSubmitting(true);

		try {
			// Build full address string
			const addressParts = [
				uboFormData.street.trim(),
				uboFormData.externalNumber.trim(),
				uboFormData.internalNumber.trim(),
			].filter(Boolean);
			const fullAddress = addressParts.join(", ");

			const uboInput: UBOCreateRequest = {
				firstName: uboFormData.firstName.trim().toUpperCase(),
				lastName: uboFormData.lastName.trim().toUpperCase(),
				secondLastName:
					uboFormData.secondLastName.trim().toUpperCase() || undefined,
				birthDate: uboFormData.birthDate,
				relationshipType: "SHAREHOLDER",
				ownershipPercentage,
				street: fullAddress,
				city: uboFormData.city,
				stateCode: uboFormData.stateCode,
				postalCode: uboFormData.postalCode,
			};

			const createdUBO = await createUBO({ clientId, input: uboInput });

			const newUBO: UBOWithDocuments = {
				id: createdUBO.id,
				firstName: uboFormData.firstName.trim().toUpperCase(),
				lastName: uboFormData.lastName.trim().toUpperCase(),
				secondLastName:
					uboFormData.secondLastName.trim().toUpperCase() || undefined,
				relationshipType: "SHAREHOLDER",
				ownershipPercentage,
			};

			onUBOsChange([...ubos, newUBO]);
			toast.success("Accionista agregado exitosamente");

			// Reset form
			setUboFormData(INITIAL_UBO_FORM_DATA);
			setIsUBODialogOpen(false);
		} catch (error) {
			console.error("Error creating UBO:", error);
			toast.error("Error al agregar el accionista");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleSubmitLegalRep = async (formData: UnifiedLegalRepFormData) => {
		const { currentOrg } = useOrgStore.getState();

		if (!currentOrg?.id) {
			toast.error("No hay organización seleccionada");
			return;
		}

		setIsSubmitting(true);

		try {
			// First, upload the ID document if provided
			let idDocumentId: string | undefined;
			let idDocument: ClientDocument | undefined;

			if (formData.idDocumentData && formData.idDocumentData.file) {
				const idData = formData.idDocumentData;

				// Create the document record first
				const createdDoc = await createClientDocument({
					clientId,
					input: {
						documentType: idData.documentType,
						documentNumber: idData.documentNumber,
						expiryDate: idData.expiryDate || undefined,
						status: "PENDING",
					},
				});

				idDocumentId = createdDoc.id;

				// Prepare files for upload
				const relatedFiles: Array<{ file: Blob; name: string; type: string }> =
					[];

				// Add INE back if available
				if (idData.idType === "NATIONAL_ID" && idData.backFile) {
					const backBlob = idData.backProcessedBlob || idData.backFile;
					relatedFiles.push({
						file: backBlob,
						name: idData.backFile.name || "ine_back.jpg",
						type: "ine_back",
					});
				}

				// Upload all files
				const primaryFile = idData.processedBlob || idData.file;
				if (!primaryFile) {
					throw new Error("No file available for upload");
				}
				const uploadResult = await uploadDocumentFiles({
					primaryFile,
					originalFile: idData.originalFile,
					relatedFiles: relatedFiles.length > 0 ? relatedFiles : undefined,
					organizationId: currentOrg.id,
					clientId,
					documentId: createdDoc.id,
				});

				// Build metadata with file URLs for display
				const fileMetadata: Record<string, unknown> = {
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
				// For passport/INE front, use primary as front
				if (idData.idType === "NATIONAL_ID" && !ineFront) {
					fileMetadata.ineFrontUrl = uploadResult.primary.url;
				}

				// Update document with file URLs and metadata
				await patchClientDocument({
					clientId,
					documentId: createdDoc.id,
					input: {
						fileUrl: uploadResult.primary.url,
						metadata: fileMetadata,
					},
				});

				// Store document with metadata for display
				idDocument = {
					...createdDoc,
					fileUrl: uploadResult.primary.url,
					metadata: fileMetadata,
				};
			}

			// Create the legal representative UBO with the document reference
			const legalRepInput: UBOCreateRequest = {
				firstName: formData.firstName.trim().toUpperCase(),
				lastName: formData.lastName.trim().toUpperCase(),
				secondLastName:
					formData.secondLastName.trim().toUpperCase() || undefined,
				birthDate: formData.birthDate,
				relationshipType: "LEGAL_REP",
				idDocumentId,
			};

			const createdLegalRep = await createUBO({
				clientId,
				input: legalRepInput,
			});

			const newLegalRep: UBOWithDocuments = {
				id: createdLegalRep.id,
				firstName: formData.firstName.trim().toUpperCase(),
				lastName: formData.lastName.trim().toUpperCase(),
				secondLastName:
					formData.secondLastName.trim().toUpperCase() || undefined,
				relationshipType: "LEGAL_REP",
				idDocumentId,
				idDocument,
			};

			// Replace existing legal rep if any
			const updatedUBOs = ubos.filter(
				(ubo) => ubo.relationshipType !== "LEGAL_REP",
			);
			onUBOsChange([...updatedUBOs, newLegalRep]);
			toast.success(
				legalRep
					? "Representante legal actualizado exitosamente"
					: "Representante legal agregado exitosamente",
			);

			// Exit edit mode
			setIsEditingLegalRep(false);
		} catch (error) {
			console.error("Error creating legal rep:", error);
			toast.error("Error al agregar el representante legal");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDelete = async (ubo: UBOWithDocuments) => {
		try {
			await deleteUBO({ clientId, uboId: ubo.id });
			onUBOsChange(ubos.filter((u) => u.id !== ubo.id));
			toast.success("Beneficiario eliminado");
			setDeleteConfirmUBO(null);

			// If deleting legal rep, exit edit mode
			if (ubo.relationshipType === "LEGAL_REP") {
				setIsEditingLegalRep(false);
			}
		} catch (error) {
			console.error("Error deleting UBO:", error);
			toast.error("Error al eliminar el beneficiario");
		}
	};

	const handleEditLegalRep = () => {
		setIsEditingLegalRep(true);
	};

	const handleCancelLegalRep = () => {
		setIsEditingLegalRep(false);
	};

	return (
		<div className="space-y-4">
			{/* Stockholders Section */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-base flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
						<span className="flex items-center gap-2">
							<User className="h-4 w-4 shrink-0" />
							<span>Accionistas</span>
						</span>
						<Button size="sm" onClick={() => setIsUBODialogOpen(true)} className="w-full sm:w-auto">
							<Plus className="h-4 w-4 mr-1" />
							Agregar
						</Button>
					</CardTitle>
				</CardHeader>
				<CardContent>
					{stockholders.length === 0 ? (
						<div className="text-center py-6 text-muted-foreground">
							<User className="h-8 w-8 mx-auto mb-2 opacity-50" />
							<p className="text-sm">No hay accionistas registrados</p>
							<p className="text-xs mt-1">
								Se requiere al menos un accionista para completar el KYC
							</p>
						</div>
					) : (
						<div className="space-y-2">
							{stockholders.map((ubo) => (
								<div
									key={ubo.id}
									className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
								>
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-2">
											<span className="font-medium text-sm">
												{ubo.firstName} {ubo.lastName}{" "}
												{ubo.secondLastName || ""}
											</span>
										</div>
										<div className="flex items-center gap-2 mt-1">
											{ubo.ownershipPercentage && (
												<Badge variant="secondary" className="text-xs">
													{ubo.ownershipPercentage}%
												</Badge>
											)}
										</div>
									</div>
									<div className="flex items-center gap-1">
										<Button
											variant="ghost"
											size="icon"
											className="h-8 w-8 text-destructive hover:text-destructive"
											onClick={() => setDeleteConfirmUBO(ubo)}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Legal Representative Section */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-base flex items-center gap-2">
						<UserCheck className="h-4 w-4" />
						Representante Legal
					</CardTitle>
				</CardHeader>
				<CardContent>
					{!legalRep && !isEditingLegalRep ? (
						<LegalRepresentativeForm
							isSubmitting={isSubmitting}
							onSubmit={handleSubmitLegalRep}
							clientId={clientId}
							isEditMode={false}
						/>
					) : isEditingLegalRep ? (
						<LegalRepresentativeForm
							initialData={
								legalRep
									? {
											firstName: legalRep.firstName,
											lastName: legalRep.lastName,
											secondLastName: legalRep.secondLastName || "",
											birthDate: "", // We don't have birthDate in UBOWithDocuments
											idDocumentData: null,
										}
									: undefined
							}
							isSubmitting={isSubmitting}
							onSubmit={handleSubmitLegalRep}
							onCancel={handleCancelLegalRep}
							clientId={clientId}
							isEditMode={true}
						/>
					) : (
						<div className="space-y-3">
							{/* Legal Rep Name and Actions */}
							<div className="p-3 border rounded-lg bg-muted/30 flex items-center justify-between">
								<div>
									<div className="font-medium text-sm">
										{legalRep?.firstName} {legalRep?.lastName}{" "}
										{legalRep?.secondLastName || ""}
									</div>
								</div>
								<div className="flex items-center gap-1">
									<Button
										variant="ghost"
										size="icon"
										className="h-8 w-8"
										onClick={handleEditLegalRep}
									>
										<Pencil className="h-4 w-4" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										className="h-8 w-8 text-destructive hover:text-destructive"
										onClick={() => legalRep && setDeleteConfirmUBO(legalRep)}
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>
							</div>

							{/* ID Document Card for Legal Rep */}
							{legalRep?.idDocument && (
								<UploadedIDDocumentCard
									document={legalRep.idDocument}
									showDelete={false}
									compact
								/>
							)}
						</div>
					)}
				</CardContent>
			</Card>

			{/* UBO (Stockholder) Dialog */}
			<Dialog open={isUBODialogOpen} onOpenChange={setIsUBODialogOpen}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Agregar Accionista</DialogTitle>
						<DialogDescription>
							Ingresa los datos del accionista
						</DialogDescription>
					</DialogHeader>

					<form
						onSubmit={handleSubmitUBO}
						className="flex flex-col flex-1 min-h-0"
					>
						<DialogBody className="space-y-4">
							{/* Personal Information */}
							<div className="space-y-4">
								<h4 className="text-sm font-medium">Información Personal</h4>
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									<div className="space-y-2">
										<Label htmlFor="ubo-firstName">Nombre *</Label>
										<Input
											id="ubo-firstName"
											value={uboFormData.firstName}
											onChange={(e) =>
												handleUBOInputChange("firstName", e.target.value)
											}
											placeholder="Nombre"
											required
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="ubo-lastName">Apellido Paterno *</Label>
										<Input
											id="ubo-lastName"
											value={uboFormData.lastName}
											onChange={(e) =>
												handleUBOInputChange("lastName", e.target.value)
											}
											placeholder="Apellido Paterno"
											required
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="ubo-secondLastName">Apellido Materno</Label>
										<Input
											id="ubo-secondLastName"
											value={uboFormData.secondLastName}
											onChange={(e) =>
												handleUBOInputChange("secondLastName", e.target.value)
											}
											placeholder="Apellido Materno"
										/>
									</div>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="ubo-birthDate">Fecha de Nacimiento *</Label>
										<Input
											id="ubo-birthDate"
											type="date"
											value={uboFormData.birthDate}
											onChange={(e) =>
												handleUBOInputChange("birthDate", e.target.value)
											}
											required
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="ubo-ownershipPercentage">
											% Participación *
										</Label>
										<Input
											id="ubo-ownershipPercentage"
											type="number"
											min="25"
											max="100"
											step="0.01"
											value={uboFormData.ownershipPercentage}
											onChange={(e) =>
												handleUBOInputChange(
													"ownershipPercentage",
													e.target.value,
												)
											}
											placeholder="25.00"
											required
										/>
										<p className="text-xs text-muted-foreground">
											Mínimo 25% (requisito legal)
										</p>
									</div>
								</div>
							</div>

							{/* Address */}
							<div className="space-y-4">
								<h4 className="text-sm font-medium">Domicilio</h4>

								{/* Street and Numbers - First */}
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									<div className="space-y-2 md:col-span-2">
										<Label htmlFor="ubo-street">Calle *</Label>
										<Input
											id="ubo-street"
											value={uboFormData.street}
											onChange={(e) =>
												handleUBOInputChange("street", e.target.value)
											}
											placeholder="Nombre de la calle"
											required
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="ubo-externalNumber">Número Ext *</Label>
										<Input
											id="ubo-externalNumber"
											value={uboFormData.externalNumber}
											onChange={(e) =>
												handleUBOInputChange("externalNumber", e.target.value)
											}
											placeholder="123"
											required
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="ubo-internalNumber">Número Int</Label>
										<Input
											id="ubo-internalNumber"
											value={uboFormData.internalNumber}
											onChange={(e) =>
												handleUBOInputChange("internalNumber", e.target.value)
											}
											placeholder="A"
										/>
									</div>
								</div>

								{/* Zip Code and Auto-populated Fields - After */}
								<ZipCodeAddressFields
									postalCode={uboFormData.postalCode}
									onPostalCodeChange={(value) =>
										handleUBOInputChange("postalCode", value)
									}
									city={uboFormData.city}
									onCityChange={(value) => handleUBOInputChange("city", value)}
									municipality={uboFormData.municipality}
									onMunicipalityChange={(value) =>
										handleUBOInputChange("municipality", value)
									}
									stateCode={uboFormData.stateCode}
									onStateCodeChange={(value) =>
										handleUBOInputChange("stateCode", value)
									}
									neighborhood={uboFormData.neighborhood}
									onNeighborhoodChange={(value) =>
										handleUBOInputChange("neighborhood", value)
									}
									reference={uboFormData.reference}
									onReferenceChange={(value) =>
										handleUBOInputChange("reference", value)
									}
									showNeighborhood={true}
									showReference={true}
								/>
							</div>
						</DialogBody>

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setIsUBODialogOpen(false)}
								disabled={isSubmitting}
							>
								Cancelar
							</Button>
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting && (
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
								)}
								Agregar Accionista
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<AlertDialog
				open={!!deleteConfirmUBO}
				onOpenChange={() => setDeleteConfirmUBO(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Eliminar Beneficiario</AlertDialogTitle>
						<AlertDialogDescription>
							¿Estás seguro de que deseas eliminar a{" "}
							<strong>
								{deleteConfirmUBO?.firstName} {deleteConfirmUBO?.lastName}
							</strong>
							? Esta acción no se puede deshacer.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => deleteConfirmUBO && handleDelete(deleteConfirmUBO)}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Eliminar
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
