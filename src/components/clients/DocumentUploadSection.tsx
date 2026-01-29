"use client";

import * as React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Dialog,
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
	FileText,
	Plus,
	Trash2,
	Loader2,
	AlertCircle,
	CheckCircle2,
	Clock,
	X,
	Upload,
	FileWarning,
} from "lucide-react";
import { toast } from "sonner";
import {
	listClientDocuments,
	createClientDocument,
	deleteClientDocument,
} from "@/lib/api/client-documents";
import type {
	ClientDocument,
	ClientDocumentType,
	ClientDocumentCreateRequest,
} from "@/types/client-document";
import type { PersonType } from "@/types/client";
import {
	DOCUMENT_TYPE_CONFIG,
	REQUIRED_DOCUMENTS,
	AVAILABLE_DOCUMENTS,
} from "@/lib/constants";

interface DocumentUploadSectionProps {
	clientId: string;
	personType: PersonType;
	className?: string;
	/** Callback when document list changes (for refreshing KYC status) */
	onDocumentChange?: () => void;
}

// Document status config with icons (component-specific)
const DOCUMENT_STATUS_CONFIG = {
	PENDING: {
		label: "Pendiente",
		color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
		icon: Clock,
	},
	VERIFIED: {
		label: "Verificado",
		color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
		icon: CheckCircle2,
	},
	REJECTED: {
		label: "Rechazado",
		color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
		icon: X,
	},
	EXPIRED: {
		label: "Expirado",
		color:
			"bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
		icon: AlertCircle,
	},
};

export function DocumentUploadSection({
	clientId,
	personType,
	className,
	onDocumentChange,
}: DocumentUploadSectionProps) {
	const [documents, setDocuments] = useState<ClientDocument[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Dialog states
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [selectedDocType, setSelectedDocType] =
		useState<ClientDocumentType | null>(null);
	const [documentNumber, setDocumentNumber] = useState("");
	const [expiryDate, setExpiryDate] = useState("");
	const [deleteConfirmDoc, setDeleteConfirmDoc] =
		useState<ClientDocument | null>(null);

	// File upload ref
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);

	const requiredDocs = REQUIRED_DOCUMENTS[personType] || [];
	const availableDocs = AVAILABLE_DOCUMENTS[personType] || [];

	const fetchDocuments = useCallback(async () => {
		try {
			setIsLoading(true);
			setError(null);
			const response = await listClientDocuments({ clientId });
			setDocuments(response.data);
		} catch (err) {
			console.error("Error fetching documents:", err);
			setError("Error al cargar los documentos");
		} finally {
			setIsLoading(false);
		}
	}, [clientId]);

	useEffect(() => {
		fetchDocuments();
	}, [fetchDocuments]);

	const handleOpenUpload = () => {
		setSelectedDocType(null);
		setDocumentNumber("");
		setExpiryDate("");
		setSelectedFile(null);
		setIsDialogOpen(true);
	};

	const handleCloseDialog = () => {
		setIsDialogOpen(false);
		setSelectedDocType(null);
		setDocumentNumber("");
		setExpiryDate("");
		setSelectedFile(null);
	};

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			// Validate file type
			const isPdf = file.type === "application/pdf";
			const isImage = file.type.startsWith("image/");

			if (!isPdf && !isImage) {
				toast.error("Solo se permiten archivos PDF o imágenes");
				return;
			}

			// Validate file size (max 10MB)
			if (file.size > 10 * 1024 * 1024) {
				toast.error("El archivo no puede exceder 10MB");
				return;
			}

			setSelectedFile(file);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!selectedDocType) {
			toast.error("Selecciona un tipo de documento");
			return;
		}

		if (!documentNumber.trim()) {
			toast.error("Ingresa el número de documento");
			return;
		}

		setIsSubmitting(true);

		try {
			// For now, we'll create the document record without file upload
			// In a full implementation, you would upload the file to R2 first
			// and then include the fileUrl in the request
			const input: ClientDocumentCreateRequest = {
				documentType: selectedDocType,
				documentNumber: documentNumber.trim(),
				status: "PENDING",
				expiryDate: expiryDate || undefined,
			};

			// TODO: Upload file to R2/doc-svc and get URL
			// if (selectedFile) {
			//   const fileUrl = await uploadDocument(selectedFile);
			//   input.fileUrl = fileUrl;
			// }

			await createClientDocument({ clientId, input });
			toast.success("Documento agregado exitosamente");

			handleCloseDialog();
			fetchDocuments();
			onDocumentChange?.();
		} catch (err) {
			console.error("Error creating document:", err);
			toast.error("Error al agregar el documento");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDelete = async (doc: ClientDocument) => {
		try {
			await deleteClientDocument({ clientId, documentId: doc.id });
			toast.success("Documento eliminado exitosamente");
			setDeleteConfirmDoc(null);
			fetchDocuments();
			onDocumentChange?.();
		} catch (err) {
			console.error("Error deleting document:", err);
			toast.error("Error al eliminar el documento");
		}
	};

	// Calculate missing required documents
	const uploadedDocTypes = documents.map((d) => d.documentType);
	const missingRequired = requiredDocs.filter(
		(docType) => !uploadedDocTypes.includes(docType),
	);

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

	return (
		<>
			<Card className={className}>
				<CardHeader className="pb-3">
					<CardTitle className="text-base flex items-center justify-between">
						<span className="flex items-center gap-2">
							<FileText className="h-4 w-4" />
							Documentos KYC
						</span>
						<Button size="sm" onClick={handleOpenUpload}>
							<Plus className="h-4 w-4 mr-1" />
							Agregar
						</Button>
					</CardTitle>
				</CardHeader>
				<CardContent>
					{/* Missing required documents warning */}
					{missingRequired.length > 0 && (
						<div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
							<p className="text-sm font-medium text-amber-800 dark:text-amber-200 flex items-center gap-2 mb-2">
								<FileWarning className="h-4 w-4" />
								Documentos requeridos faltantes
							</p>
							<ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
								{missingRequired.map((docType) => (
									<li key={docType} className="flex items-center gap-1">
										<span className="w-1 h-1 rounded-full bg-amber-500" />
										{DOCUMENT_TYPE_CONFIG[docType]?.label || docType}
									</li>
								))}
							</ul>
						</div>
					)}

					{/* Documents list */}
					{documents.length === 0 ? (
						<div className="text-center py-6 text-muted-foreground">
							<FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
							<p className="text-sm">No hay documentos cargados</p>
							<p className="text-xs mt-1">
								Agrega los documentos requeridos para completar el KYC
							</p>
						</div>
					) : (
						<div className="space-y-3">
							{documents.map((doc) => {
								const config = DOCUMENT_TYPE_CONFIG[doc.documentType];
								const statusConfig =
									DOCUMENT_STATUS_CONFIG[doc.status] ||
									DOCUMENT_STATUS_CONFIG.PENDING;
								const StatusIcon = statusConfig.icon;
								const isRequired = requiredDocs.includes(doc.documentType);

								return (
									<div
										key={doc.id}
										className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
									>
										<div className="min-w-0 flex-1">
											<div className="flex items-center gap-2">
												<span className="font-medium text-sm">
													{config?.label || doc.documentType}
												</span>
												{isRequired && (
													<Badge
														variant="outline"
														className="text-xs bg-blue-50"
													>
														Requerido
													</Badge>
												)}
											</div>
											<div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
												<span>#{doc.documentNumber}</span>
												{doc.expiryDate && (
													<span>
														Vence:{" "}
														{new Date(doc.expiryDate).toLocaleDateString(
															"es-MX",
														)}
													</span>
												)}
											</div>
										</div>
										<div className="flex items-center gap-2">
											<Badge className={cn("text-xs", statusConfig.color)}>
												<StatusIcon className="h-3 w-3 mr-1" />
												{statusConfig.label}
											</Badge>
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8 text-destructive hover:text-destructive"
												onClick={() => setDeleteConfirmDoc(doc)}
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

			{/* Upload Dialog */}
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Agregar Documento</DialogTitle>
						<DialogDescription>
							Selecciona el tipo de documento y completa la información
						</DialogDescription>
					</DialogHeader>

					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label>Tipo de Documento *</Label>
							<Select
								value={selectedDocType || ""}
								onValueChange={(value) =>
									setSelectedDocType(value as ClientDocumentType)
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Seleccionar tipo" />
								</SelectTrigger>
								<SelectContent>
									{availableDocs.map((docType) => {
										const config = DOCUMENT_TYPE_CONFIG[docType];
										const isAlreadyUploaded =
											uploadedDocTypes.includes(docType);
										return (
											<SelectItem
												key={docType}
												value={docType}
												disabled={isAlreadyUploaded}
											>
												{config?.label || docType}
												{isAlreadyUploaded && " (ya cargado)"}
											</SelectItem>
										);
									})}
								</SelectContent>
							</Select>
							{selectedDocType && DOCUMENT_TYPE_CONFIG[selectedDocType] && (
								<p className="text-xs text-muted-foreground">
									{DOCUMENT_TYPE_CONFIG[selectedDocType].description}
								</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="documentNumber">Número de Documento *</Label>
							<Input
								id="documentNumber"
								value={documentNumber}
								onChange={(e) => setDocumentNumber(e.target.value)}
								placeholder="Ej: ABC123456"
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="expiryDate">Fecha de Vencimiento</Label>
							<Input
								id="expiryDate"
								type="date"
								value={expiryDate}
								onChange={(e) => setExpiryDate(e.target.value)}
							/>
						</div>

						{/* File upload (optional - placeholder for now) */}
						<div className="space-y-2">
							<Label>Archivo (opcional)</Label>
							<div
								className={cn(
									"border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors",
									selectedFile
										? "border-green-500 bg-green-50"
										: "border-muted",
								)}
								onClick={() => fileInputRef.current?.click()}
							>
								{selectedFile ? (
									<div className="flex items-center justify-center gap-2 text-green-600">
										<CheckCircle2 className="h-5 w-5" />
										<span className="text-sm">{selectedFile.name}</span>
									</div>
								) : (
									<div className="text-muted-foreground">
										<Upload className="h-6 w-6 mx-auto mb-1" />
										<p className="text-sm">Clic para seleccionar archivo</p>
										<p className="text-xs">PDF o imagen, máx. 10MB</p>
									</div>
								)}
							</div>
							<input
								ref={fileInputRef}
								type="file"
								accept="application/pdf,image/*"
								onChange={handleFileSelect}
								className="hidden"
							/>
						</div>

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={handleCloseDialog}
								disabled={isSubmitting}
							>
								Cancelar
							</Button>
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting && (
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
								)}
								Agregar
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<AlertDialog
				open={!!deleteConfirmDoc}
				onOpenChange={() => setDeleteConfirmDoc(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Eliminar Documento</AlertDialogTitle>
						<AlertDialogDescription>
							¿Estás seguro de que deseas eliminar este documento? Esta acción
							no se puede deshacer.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => deleteConfirmDoc && handleDelete(deleteConfirmDoc)}
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
