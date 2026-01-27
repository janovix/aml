"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
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
import {
	Users,
	Plus,
	Pencil,
	Trash2,
	Loader2,
	AlertCircle,
	ShieldCheck,
	ShieldAlert,
	ShieldQuestion,
	UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
	listClientUBOs,
	createUBO,
	updateUBO,
	deleteUBO,
} from "@/lib/api/ubos";
import type { UBO, UBOCreateRequest } from "@/types/ubo";
import { ZipCodeAddressFields } from "./ZipCodeAddressFields";
import {
	LegalRepresentativeForm,
	type LegalRepFormData as UnifiedLegalRepFormData,
} from "./LegalRepresentativeForm";
import { createClientDocument } from "@/lib/api/client-documents";
import { uploadDocumentFiles } from "@/lib/api/file-upload";
import type { ClientDocumentType } from "@/types/client-document";
import { useOrgStore } from "@/lib/org-store";

interface UBOSectionProps {
	clientId: string;
	personType: string;
	className?: string;
	/** Callback when UBO list changes (for refreshing KYC status) */
	onUBOChange?: () => void;
}

interface UBOFormData {
	firstName: string;
	lastName: string;
	secondLastName: string;
	birthDate: string;
	ownershipPercentage: string;
	// Address fields
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

const PEP_STATUS_CONFIG = {
	PENDING: { icon: ShieldQuestion, color: "text-gray-500" },
	CONFIRMED: { icon: ShieldAlert, color: "text-red-500" },
	NOT_PEP: { icon: ShieldCheck, color: "text-green-500" },
	ERROR: { icon: AlertCircle, color: "text-amber-500" },
};

export function UBOSection({
	clientId,
	personType,
	className,
	onUBOChange,
}: UBOSectionProps) {
	const [ubos, setUbos] = useState<UBO[]>([]);
	const [legalRep, setLegalRep] = useState<UBO | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Dialog states for UBOs (stockholders)
	const [isUBODialogOpen, setIsUBODialogOpen] = useState(false);
	const [editingUBO, setEditingUBO] = useState<UBO | null>(null);
	const [uboFormData, setUboFormData] = useState<UBOFormData>(
		INITIAL_UBO_FORM_DATA,
	);
	const [deleteConfirmUBO, setDeleteConfirmUBO] = useState<UBO | null>(null);

	// State for Legal Representative editing
	const [isEditingLegalRep, setIsEditingLegalRep] = useState(false);
	const [legalRepFormData, setLegalRepFormData] =
		useState<LegacyLegalRepFormData>(INITIAL_LEGAL_REP_FORM_DATA);

	// Only show for moral/trust entities
	const shouldShow = personType === "moral" || personType === "trust";

	const fetchUBOs = useCallback(async () => {
		if (!shouldShow) return;

		try {
			setIsLoading(true);
			setError(null);
			const response = await listClientUBOs({ clientId });
			// Separate stockholders from legal representative
			const stockholders = response.data.filter(
				(ubo) => ubo.relationshipType === "SHAREHOLDER",
			);
			const legalRepresentative = response.data.find(
				(ubo) => ubo.relationshipType === "LEGAL_REP",
			);
			setUbos(stockholders);
			setLegalRep(legalRepresentative || null);
		} catch (err) {
			console.error("Error fetching UBOs:", err);
			setError("Error al cargar los beneficiarios finales");
		} finally {
			setIsLoading(false);
		}
	}, [clientId, shouldShow]);

	useEffect(() => {
		fetchUBOs();
	}, [fetchUBOs]);

	// UBO (Stockholder) handlers
	const handleOpenCreateUBO = () => {
		setEditingUBO(null);
		setUboFormData(INITIAL_UBO_FORM_DATA);
		setIsUBODialogOpen(true);
	};

	const handleOpenEditUBO = (ubo: UBO) => {
		setEditingUBO(ubo);
		// Parse address from street field (format: "Street, ExtNum, IntNum")
		const addressParts = (ubo.street || "").split(",").map((p) => p.trim());
		setUboFormData({
			firstName: ubo.firstName,
			lastName: ubo.lastName,
			secondLastName: ubo.secondLastName || "",
			birthDate: ubo.birthDate
				? new Date(ubo.birthDate).toISOString().split("T")[0]
				: "",
			ownershipPercentage: ubo.ownershipPercentage?.toString() || "",
			postalCode: ubo.postalCode || "",
			city: ubo.city || "",
			municipality: "",
			stateCode: ubo.stateCode || "",
			neighborhood: "",
			street: addressParts[0] || "",
			externalNumber: addressParts[1] || "",
			internalNumber: addressParts[2] || "",
			reference: "",
		});
		setIsUBODialogOpen(true);
	};

	const handleCloseUBODialog = () => {
		setIsUBODialogOpen(false);
		setEditingUBO(null);
		setUboFormData(INITIAL_UBO_FORM_DATA);
	};

	const handleUBOInputChange = (field: keyof UBOFormData, value: string) => {
		setUboFormData((prev) => ({ ...prev, [field]: value }));
	};

	// Legal Representative handlers
	const handleEditLegalRep = () => {
		setIsEditingLegalRep(true);
	};

	const handleCancelLegalRep = () => {
		setIsEditingLegalRep(false);
	};

	const handleLegalRepInputChange = (
		field: keyof LegacyLegalRepFormData,
		value: string,
	) => {
		setLegalRepFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleSubmitUBO = async (e: React.FormEvent) => {
		e.preventDefault();

		// Basic validation
		if (!uboFormData.firstName.trim() || !uboFormData.lastName.trim()) {
			toast.error("Nombre y apellido son requeridos");
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
		const currentTotal = ubos
			.filter((ubo) => ubo.id !== editingUBO?.id) // Exclude current UBO if editing
			.reduce((sum, ubo) => sum + (ubo.ownershipPercentage || 0), 0);

		const newTotal = currentTotal + ownershipPercentage;

		if (newTotal > 100) {
			toast.error(
				`La tabla de capitalización excedería el 100% (actual: ${currentTotal.toFixed(2)}%, nuevo total: ${newTotal.toFixed(2)}%)`,
			);
			return;
		}

		if (!uboFormData.birthDate) {
			toast.error("La fecha de nacimiento es requerida");
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

			const input: UBOCreateRequest = {
				firstName: uboFormData.firstName.trim().toUpperCase(),
				lastName: uboFormData.lastName.trim().toUpperCase(),
				secondLastName: uboFormData.secondLastName.trim().toUpperCase() || null,
				birthDate: uboFormData.birthDate || null,
				ownershipPercentage,
				relationshipType: "SHAREHOLDER",
				country: "MX",
				stateCode: uboFormData.stateCode.trim().toUpperCase() || null,
				city: uboFormData.city.trim().toUpperCase() || null,
				street: fullAddress || null,
				postalCode: uboFormData.postalCode.trim() || null,
			};

			if (editingUBO) {
				await updateUBO({ clientId, uboId: editingUBO.id, input });
				toast.success("Accionista actualizado exitosamente");
			} else {
				await createUBO({ clientId, input });
				toast.success("Accionista agregado exitosamente");
			}

			handleCloseUBODialog();
			fetchUBOs();
			onUBOChange?.();
		} catch (err) {
			console.error("Error saving UBO:", err);
			toast.error("Error al guardar el accionista");
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
				await uploadDocumentFiles({
					primaryFile,
					originalFile: idData.originalFile,
					relatedFiles: relatedFiles.length > 0 ? relatedFiles : undefined,
					organizationId: currentOrg.id,
					clientId,
					documentId: createdDoc.id,
				});
			}

			const input: UBOCreateRequest = {
				firstName: formData.firstName.trim().toUpperCase(),
				lastName: formData.lastName.trim().toUpperCase(),
				secondLastName: formData.secondLastName.trim().toUpperCase() || null,
				birthDate: formData.birthDate || null,
				relationshipType: "LEGAL_REP",
				country: "MX",
				idDocumentId,
			};

			if (legalRep) {
				await updateUBO({ clientId, uboId: legalRep.id, input });
				toast.success("Representante legal actualizado exitosamente");
			} else {
				await createUBO({ clientId, input });
				toast.success("Representante legal agregado exitosamente");
			}

			setIsEditingLegalRep(false);
			fetchUBOs();
			onUBOChange?.();
		} catch (err) {
			console.error("Error saving legal rep:", err);
			toast.error("Error al guardar el representante legal");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDelete = async (ubo: UBO) => {
		try {
			await deleteUBO({ clientId, uboId: ubo.id });
			toast.success("Beneficiario eliminado exitosamente");
			setDeleteConfirmUBO(null);

			// If deleting legal rep, exit edit mode
			if (ubo.relationshipType === "LEGAL_REP") {
				setIsEditingLegalRep(false);
			}

			fetchUBOs();
			onUBOChange?.();
		} catch (err) {
			console.error("Error deleting UBO:", err);
			toast.error("Error al eliminar el beneficiario");
		}
	};

	if (!shouldShow) {
		return null;
	}

	if (isLoading) {
		return (
			<Card className={className}>
				<CardContent className="p-4 flex items-center justify-center">
					<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Card className={className}>
				<CardContent className="p-4 text-amber-600 flex items-center gap-2">
					<AlertCircle className="h-4 w-4" />
					<span className="text-sm">{error}</span>
				</CardContent>
			</Card>
		);
	}

	// Calculate total ownership percentage
	const totalOwnership = ubos.reduce(
		(sum, ubo) => sum + (ubo.ownershipPercentage || 0),
		0,
	);
	const isCapTableValid = totalOwnership <= 100;

	return (
		<>
			{/* Stockholders (UBOs) Section */}
			<Card className={className}>
				<CardHeader className="pb-3">
					<CardTitle className="text-base flex items-center justify-between">
						<span className="flex items-center gap-2">
							<Users className="h-4 w-4" />
							Accionistas
							{ubos.length > 0 && (
								<Badge
									variant={isCapTableValid ? "secondary" : "destructive"}
									className="ml-2"
								>
									Total: {totalOwnership.toFixed(2)}%
								</Badge>
							)}
						</span>
						<Button size="sm" onClick={handleOpenCreateUBO}>
							<Plus className="h-4 w-4 mr-1" />
							Agregar Accionista
						</Button>
					</CardTitle>
				</CardHeader>
				<CardContent>
					{ubos.length === 0 ? (
						<div className="text-center py-6 text-muted-foreground">
							<Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
							<p className="text-sm">No hay accionistas registrados</p>
							<p className="text-xs mt-1">
								Se requiere al menos un accionista para completar el KYC
							</p>
						</div>
					) : (
						<div className="space-y-3">
							{ubos.map((ubo) => {
								const PEPIcon =
									PEP_STATUS_CONFIG[ubo.pepStatus]?.icon || ShieldQuestion;
								const pepColor =
									PEP_STATUS_CONFIG[ubo.pepStatus]?.color || "text-gray-500";

								return (
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
												<PEPIcon className={cn("h-4 w-4", pepColor)} />
											</div>
											<div className="flex items-center gap-2 mt-1">
												{ubo.ownershipPercentage && (
													<Badge variant="secondary" className="text-xs">
														{ubo.ownershipPercentage}%
													</Badge>
												)}
												{ubo.birthDate && (
													<span className="text-xs text-muted-foreground">
														{new Date(ubo.birthDate).toLocaleDateString(
															"es-MX",
														)}
													</span>
												)}
											</div>
										</div>
										<div className="flex items-center gap-1">
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8"
												onClick={() => handleOpenEditUBO(ubo)}
											>
												<Pencil className="h-4 w-4" />
											</Button>
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
								);
							})}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Legal Representative Section */}
			<Card className={cn("mt-4", className)}>
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
											birthDate: legalRep.birthDate
												? new Date(legalRep.birthDate)
														.toISOString()
														.split("T")[0]
												: "",
											idDocumentData: null, // TODO: Load existing document if available
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
							<div className="p-3 border rounded-lg bg-muted/30">
								<div className="flex items-center justify-between">
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-2">
											<span className="font-medium text-sm">
												{legalRep?.firstName} {legalRep?.lastName}{" "}
												{legalRep?.secondLastName || ""}
											</span>
											{legalRep?.isPEP && (
												<Badge variant="destructive" className="text-xs">
													PEP
												</Badge>
											)}
										</div>
										{legalRep?.birthDate && (
											<div className="text-xs text-muted-foreground mt-1">
												{new Date(legalRep.birthDate).toLocaleDateString(
													"es-MX",
												)}
											</div>
										)}
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
											onClick={() => setDeleteConfirmUBO(legalRep)}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</div>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* UBO (Stockholder) Dialog */}
			<Dialog open={isUBODialogOpen} onOpenChange={setIsUBODialogOpen}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>
							{editingUBO ? "Editar Accionista" : "Agregar Accionista"}
						</DialogTitle>
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
												handleUBOInputChange(
													"firstName",
													e.target.value.toUpperCase(),
												)
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
												handleUBOInputChange(
													"lastName",
													e.target.value.toUpperCase(),
												)
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
												handleUBOInputChange(
													"secondLastName",
													e.target.value.toUpperCase(),
												)
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
												handleUBOInputChange(
													"street",
													e.target.value.toUpperCase(),
												)
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
												handleUBOInputChange(
													"externalNumber",
													e.target.value.toUpperCase(),
												)
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
												handleUBOInputChange(
													"internalNumber",
													e.target.value.toUpperCase(),
												)
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
								onClick={handleCloseUBODialog}
								disabled={isSubmitting}
							>
								Cancelar
							</Button>
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting && (
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
								)}
								{editingUBO ? "Guardar Cambios" : "Agregar Accionista"}
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
		</>
	);
}
