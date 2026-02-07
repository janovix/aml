"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import {
	IDDocumentSelector,
	type IDDocumentData,
	type IDType,
} from "./wizard/IDDocumentSelector";
import type { ClientDocumentType } from "@/types/client-document";
import type { PersonalData } from "@/lib/document-scanner";

export interface LegalRepFormData {
	firstName: string;
	lastName: string;
	secondLastName: string;
	birthDate: string;
	idDocumentData: IDDocumentData | null;
}

interface LegalRepresentativeFormProps {
	/** Initial form data (for edit mode) */
	initialData?: Partial<LegalRepFormData>;
	/** Whether the form is submitting */
	isSubmitting: boolean;
	/** Submit handler */
	onSubmit: (data: LegalRepFormData) => void | Promise<void>;
	/** Cancel handler (optional - if not provided, cancel button won't be shown) */
	onCancel?: () => void;
	/** Client ID for mobile upload session */
	clientId?: string;
	/** Whether this is edit mode */
	isEditMode?: boolean;
}

const EMPTY_FORM_DATA: LegalRepFormData = {
	firstName: "",
	lastName: "",
	secondLastName: "",
	birthDate: "",
	idDocumentData: null,
};

/**
 * Unified form for capturing legal representative information including:
 * - Personal information (name, birthdate)
 * - Official identification (INE or Passport)
 *
 * This component simplifies the flow by combining what were previously
 * separate steps into a single cohesive form.
 */
export function LegalRepresentativeForm({
	initialData,
	isSubmitting,
	onSubmit,
	onCancel,
	clientId,
	isEditMode = false,
}: LegalRepresentativeFormProps) {
	const [formData, setFormData] = useState<LegalRepFormData>({
		...EMPTY_FORM_DATA,
		...initialData,
	});

	const [isUploadingDocument, setIsUploadingDocument] = useState(false);

	// Update form when initialData changes (for edit mode)
	useEffect(() => {
		if (initialData) {
			setFormData((prev) => ({
				...prev,
				...initialData,
			}));
		}
	}, [initialData]);

	const handleInputChange = (field: keyof LegalRepFormData, value: string) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const handleIDDocumentChange = (data: IDDocumentData) => {
		setFormData((prev) => ({
			...prev,
			idDocumentData: data,
		}));
	};

	const handleIDDocumentUpload = async (data: IDDocumentData) => {
		setIsUploadingDocument(true);
		try {
			// The upload is handled by the parent component through the onSubmit
			// Here we just update the local state
			setFormData((prev) => ({
				...prev,
				idDocumentData: {
					...data,
					isUploading: true,
				},
			}));
		} finally {
			setIsUploadingDocument(false);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		await onSubmit(formData);
	};

	// Prepare personal data for OCR validation
	const personalData: PersonalData = {
		firstName: formData.firstName,
		lastName: formData.lastName,
		secondLastName: formData.secondLastName || undefined,
		birthDate: formData.birthDate || undefined,
	};

	const isFormValid =
		formData.firstName.trim() !== "" &&
		formData.lastName.trim() !== "" &&
		formData.birthDate !== "";

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{/* Personal Information Section */}
			<div className="space-y-4">
				<div className="space-y-2">
					<h3 className="text-sm font-medium text-muted-foreground">
						Datos Personales
					</h3>
				</div>

				<div className="grid grid-cols-1 gap-4">
					<div className="space-y-2">
						<Label htmlFor="legalrep-firstName">Nombre *</Label>
						<Input
							id="legalrep-firstName"
							value={formData.firstName}
							onChange={(e) =>
								handleInputChange("firstName", e.target.value.toUpperCase())
							}
							placeholder="Nombre"
							required
							disabled={isSubmitting}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="legalrep-lastName">Apellido Paterno *</Label>
						<Input
							id="legalrep-lastName"
							value={formData.lastName}
							onChange={(e) =>
								handleInputChange("lastName", e.target.value.toUpperCase())
							}
							placeholder="Apellido Paterno"
							required
							disabled={isSubmitting}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="legalrep-secondLastName">Apellido Materno</Label>
						<Input
							id="legalrep-secondLastName"
							value={formData.secondLastName}
							onChange={(e) =>
								handleInputChange(
									"secondLastName",
									e.target.value.toUpperCase(),
								)
							}
							placeholder="Apellido Materno"
							disabled={isSubmitting}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="legalrep-birthDate">Fecha de Nacimiento *</Label>
						<Input
							id="legalrep-birthDate"
							type="date"
							value={formData.birthDate}
							onChange={(e) => handleInputChange("birthDate", e.target.value)}
							required
							disabled={isSubmitting}
						/>
					</div>
				</div>
			</div>

			{/* ID Document Section */}
			<div className="space-y-4">
				<div className="space-y-2">
					<h3 className="text-sm font-medium text-muted-foreground">
						Identificación Oficial del Representante Legal
					</h3>
					<p className="text-xs text-muted-foreground">
						La identificación debe pertenecer al representante legal
					</p>
				</div>

				<IDDocumentSelector
					required={true}
					disabled={isSubmitting || isUploadingDocument}
					data={formData.idDocumentData}
					onDataChange={handleIDDocumentChange}
					onUpload={handleIDDocumentUpload}
					label="Identificación Oficial del Representante Legal"
					personalData={personalData}
				/>
			</div>

			{/* Form Actions */}
			<div className="flex justify-end gap-3 pt-4">
				{onCancel && (
					<Button
						type="button"
						variant="outline"
						onClick={onCancel}
						disabled={isSubmitting || isUploadingDocument}
					>
						Cancelar
					</Button>
				)}
				<Button
					type="submit"
					disabled={!isFormValid || isSubmitting || isUploadingDocument}
				>
					{(isSubmitting || isUploadingDocument) && (
						<Loader2 className="h-4 w-4 mr-2 animate-spin" />
					)}
					{isEditMode ? "Guardar Cambios" : "Agregar Representante Legal"}
				</Button>
			</div>
		</form>
	);
}
