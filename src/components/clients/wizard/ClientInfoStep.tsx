"use client";

import type React from "react";
import { useState } from "react";
import { useSessionStorageForm } from "@/hooks/useSessionStorageForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight } from "lucide-react";
import type { PersonType, ClientCreateRequest, Client } from "@/types/client";
import { PersonTypePicker } from "../PersonTypePicker";
import { createClient } from "@/lib/api/clients";
import { executeMutation } from "@/lib/mutations";
import { LabelWithInfo } from "@/components/ui/LabelWithInfo";
import { getFieldDescription } from "@/lib/field-descriptions";
import { CatalogSelector } from "@/components/catalogs/CatalogSelector";
import { PhoneInput } from "@/components/ui/phone-input";
import {
	validateRFC,
	validateCURP,
	extractBirthdateFromCURP,
	validateCURPNameMatch,
	validateCURPBirthdateMatch,
	validateRFCMatch,
} from "@/lib/utils";
import { toast } from "sonner";
import { useLanguage } from "@/components/LanguageProvider";
import { validatePhone } from "@/lib/validators/validate-phone";
import { ZipCodeAddressFields } from "../ZipCodeAddressFields";

interface ClientInfoStepProps {
	onClientCreated: (client: Client) => void;
	onCancel: () => void;
	onPersonTypeChange: (personType: PersonType) => void;
	initialPersonType: PersonType;
}

interface ClientFormData {
	personType: PersonType;
	// Physical person fields
	firstName?: string;
	lastName?: string;
	secondLastName?: string;
	birthDate?: string; // date format YYYY-MM-DD
	curp?: string;
	// Moral/Trust fields
	businessName?: string;
	incorporationDate?: string; // date format YYYY-MM-DD
	// Common fields
	rfc: string;
	nationality?: string;
	email: string;
	phone: string;
	stateCode: string;
	city: string;
	municipality: string;
	neighborhood: string;
	street: string;
	externalNumber: string;
	internalNumber?: string;
	postalCode: string;
	reference?: string;
	notes?: string;
}

const INITIAL_CLIENT_FORM_DATA: ClientFormData = {
	personType: "moral",
	rfc: "",
	firstName: "",
	lastName: "",
	secondLastName: "",
	birthDate: "",
	curp: "",
	businessName: "",
	incorporationDate: "",
	nationality: "MX", // Default to Mexico
	email: "",
	phone: "",
	stateCode: "",
	city: "",
	municipality: "",
	neighborhood: "",
	street: "",
	externalNumber: "",
	internalNumber: "",
	postalCode: "",
	reference: "",
	notes: "",
};

export function ClientInfoStep({
	onClientCreated,
	onCancel,
	onPersonTypeChange,
	initialPersonType,
}: ClientInfoStepProps): React.JSX.Element {
	const { t } = useLanguage();
	const [isSubmitting, setIsSubmitting] = useState(false);

	const [formData, setFormData, clearFormStorage] =
		useSessionStorageForm<ClientFormData>("client_create", {
			...INITIAL_CLIENT_FORM_DATA,
			personType: initialPersonType,
		});

	const [validationErrors, setValidationErrors] = useState<{
		rfc?: string;
		curp?: string;
		phone?: string;
		firstName?: string;
		lastName?: string;
		secondLastName?: string;
	}>({});

	const handleInputChange = (
		field: keyof ClientFormData,
		value: string,
	): void => {
		// Notify parent of person type change BEFORE updating state
		if (field === "personType") {
			onPersonTypeChange(value as PersonType);
		}

		setFormData((prev) => {
			const updated = { ...prev, [field]: value };

			// Validate CURP when CURP or related fields change
			if (
				(field === "curp" ||
					field === "firstName" ||
					field === "lastName" ||
					field === "secondLastName" ||
					field === "birthDate") &&
				updated.personType === "physical"
			) {
				if (updated.curp) {
					// Validate CURP format first
					const curpValidation = validateCURP(updated.curp);
					if (!curpValidation.isValid) {
						setValidationErrors((prev) => ({
							...prev,
							curp: curpValidation.error,
						}));
					} else {
						// CURP format is valid, check for data mismatches
						const mismatchErrors: string[] = [];

						// Check birthdate match
						if (updated.birthDate) {
							const birthdateMatch = validateCURPBirthdateMatch(
								updated.curp,
								updated.birthDate,
							);
							if (!birthdateMatch.isValid) {
								mismatchErrors.push(
									"La fecha de nacimiento no coincide con el CURP",
								);
							}
						}

						// Check name match
						if (updated.firstName && updated.lastName) {
							const nameMatch = validateCURPNameMatch(
								updated.curp,
								updated.firstName,
								updated.lastName,
								updated.secondLastName,
							);
							if (!nameMatch.isValid) {
								mismatchErrors.push(
									"El nombre no coincide con el CURP proporcionado",
								);
							}
						}

						// Set combined error or clear
						setValidationErrors((prev) => ({
							...prev,
							curp: mismatchErrors.length > 0 ? mismatchErrors[0] : undefined,
						}));
					}

					// Auto-fill birthdate only when CURP field changes and birthdate is empty
					if (field === "curp") {
						const extractedBirthdate = extractBirthdateFromCURP(updated.curp);
						if (extractedBirthdate && !updated.birthDate) {
							updated.birthDate = extractedBirthdate;
						}
					}
				} else if (field === "curp") {
					// CURP is empty, clear any previous error
					setValidationErrors((prev) => ({
						...prev,
						curp: undefined,
					}));
				}
			}

			// Validate RFC when relevant fields change
			if (
				field === "rfc" ||
				field === "firstName" ||
				field === "lastName" ||
				field === "secondLastName" ||
				field === "birthDate" ||
				field === "businessName" ||
				field === "incorporationDate"
			) {
				if (updated.rfc) {
					const rfcValidation = validateRFC(updated.rfc, updated.personType);
					if (!rfcValidation.isValid) {
						// Show format validation error
						setValidationErrors((prev) => ({
							...prev,
							rfc: rfcValidation.error,
						}));
					} else {
						// RFC format is valid, now check if it matches the provided data
						const rfcMatch = validateRFCMatch(updated.rfc, updated.personType, {
							firstName: updated.firstName,
							lastName: updated.lastName,
							secondLastName: updated.secondLastName,
							birthDate: updated.birthDate,
							businessName: updated.businessName,
							incorporationDate: updated.incorporationDate,
						});
						setValidationErrors((prev) => ({
							...prev,
							rfc: rfcMatch.isValid ? undefined : rfcMatch.error,
						}));
					}
				} else {
					// RFC is empty, clear any previous error (will be caught on submit)
					setValidationErrors((prev) => ({
						...prev,
						rfc: undefined,
					}));
				}
			}

			// Validate name fields for physical persons
			if (updated.personType === "physical") {
				if (field === "firstName") {
					const trimmed = value.trim();
					if (trimmed.length > 0 && trimmed.length < 2) {
						setValidationErrors((prev) => ({
							...prev,
							firstName: "El nombre debe tener al menos 2 caracteres",
						}));
					} else {
						setValidationErrors((prev) => ({
							...prev,
							firstName: undefined,
						}));
					}
				}

				if (field === "lastName") {
					const trimmed = value.trim();
					if (trimmed.length > 0 && trimmed.length < 2) {
						setValidationErrors((prev) => ({
							...prev,
							lastName: "El apellido paterno debe tener al menos 2 caracteres",
						}));
					} else {
						setValidationErrors((prev) => ({
							...prev,
							lastName: undefined,
						}));
					}
				}

				if (field === "secondLastName") {
					const trimmed = value.trim();
					// Fixed: condition was impossible (length > 0 && length < 1)
					// Should validate minimum length of 2 characters for second last name
					if (trimmed.length > 0 && trimmed.length < 2) {
						setValidationErrors((prev) => ({
							...prev,
							secondLastName:
								"El apellido materno debe tener al menos 2 caracteres",
						}));
					} else {
						setValidationErrors((prev) => ({
							...prev,
							secondLastName: undefined,
						}));
					}
				}
			}

			return updated;
		});
	};

	const handleSubmit = async (e: React.FormEvent): Promise<void> => {
		e.preventDefault();

		// Client-side validation
		const errors: {
			rfc?: string;
			curp?: string;
			phone?: string;
			firstName?: string;
			lastName?: string;
			secondLastName?: string;
		} = {};

		// Validate name fields for physical persons
		if (formData.personType === "physical") {
			const firstNameTrimmed = (formData.firstName ?? "").trim();
			if (firstNameTrimmed.length < 2) {
				errors.firstName = "El nombre debe tener al menos 2 caracteres";
			}

			const lastNameTrimmed = (formData.lastName ?? "").trim();
			if (lastNameTrimmed.length < 2) {
				errors.lastName =
					"El apellido paterno debe tener al menos 2 caracteres";
			}

			const secondLastNameTrimmed = (formData.secondLastName ?? "").trim();
			if (secondLastNameTrimmed.length < 1) {
				errors.secondLastName =
					"El apellido materno es requerido (usa X si no existe)";
			}
		}

		// Validate RFC
		const rfcValidation = validateRFC(formData.rfc, formData.personType);
		if (!rfcValidation.isValid) {
			errors.rfc = rfcValidation.error;
		} else {
			const rfcMatch = validateRFCMatch(formData.rfc, formData.personType, {
				firstName: formData.firstName,
				lastName: formData.lastName,
				secondLastName: formData.secondLastName,
				birthDate: formData.birthDate,
				businessName: formData.businessName,
				incorporationDate: formData.incorporationDate,
			});
			if (!rfcMatch.isValid) {
				errors.rfc = rfcMatch.error;
			}
		}

		// Validate CURP and cross-validate with names and birthdate (only for physical persons)
		if (formData.personType === "physical" && formData.curp) {
			const curpValidation = validateCURP(formData.curp);
			if (!curpValidation.isValid) {
				errors.curp = curpValidation.error;
			} else {
				// Cross-validate birthdate - show error under CURP field
				if (formData.birthDate) {
					const birthdateMatch = validateCURPBirthdateMatch(
						formData.curp,
						formData.birthDate,
					);
					if (!birthdateMatch.isValid) {
						errors.curp = "La fecha de nacimiento no coincide con el CURP";
					}
				}

				// Cross-validate names - show error under CURP field
				if (!errors.curp && formData.firstName && formData.lastName) {
					const nameMatch = validateCURPNameMatch(
						formData.curp,
						formData.firstName,
						formData.lastName,
						formData.secondLastName,
					);
					if (!nameMatch.isValid) {
						errors.curp = "El nombre no coincide con el CURP proporcionado";
					}
				}
			}
		}

		// Validate phone
		const phoneValidation = validatePhone(formData.phone);
		if (!phoneValidation.isValid) {
			errors.phone = phoneValidation.error;
		}

		// If there are validation errors, show them and prevent submission
		if (Object.keys(errors).length > 0) {
			setValidationErrors(errors);
			toast.error("Por favor, corrija los errores en el formulario");
			return;
		}

		setValidationErrors({});
		setIsSubmitting(true);

		// Build the request payload based on personType
		const request: ClientCreateRequest = {
			personType: formData.personType,
			rfc: formData.rfc,
			email: formData.email,
			phone: formData.phone,
			country: "MX",
			stateCode: formData.stateCode,
			city: formData.city,
			municipality: formData.municipality,
			neighborhood: formData.neighborhood,
			street: formData.street,
			externalNumber: formData.externalNumber,
			postalCode: formData.postalCode,
		};

		// Add personType-specific fields
		if (formData.personType === "physical") {
			request.firstName = formData.firstName;
			request.lastName = formData.lastName;
			if (formData.secondLastName)
				request.secondLastName = formData.secondLastName;
			if (formData.birthDate) request.birthDate = formData.birthDate;
			if (formData.curp) request.curp = formData.curp;
		} else {
			// moral or trust
			request.businessName = formData.businessName;
			if (formData.incorporationDate) {
				// Convert date (YYYY-MM-DD) to date-time format (YYYY-MM-DDTHH:mm:ss.sssZ)
				// Use midnight UTC to avoid timezone issues
				const date = new Date(`${formData.incorporationDate}T00:00:00.000Z`);
				request.incorporationDate = date.toISOString();
			}
		}

		// Add optional fields
		if (formData.nationality) request.nationality = formData.nationality;
		if (formData.internalNumber)
			request.internalNumber = formData.internalNumber;
		if (formData.reference) request.reference = formData.reference;
		if (formData.notes) request.notes = formData.notes;

		try {
			await executeMutation({
				mutation: () => createClient({ input: request }),
				loading: "Creando cliente...",
				success: "Cliente creado exitosamente",
				onSuccess: (client) => {
					// Clear session storage on successful submission
					clearFormStorage();
					// Notify parent to move to step 2
					onClientCreated(client);
				},
			});
		} catch (error) {
			// Error is already handled by executeMutation via Sonner
			console.error("Error creating client:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<form id="client-info-form" onSubmit={handleSubmit} className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">{t("clientPersonType")}</CardTitle>
				</CardHeader>
				<CardContent>
					<PersonTypePicker
						value={formData.personType}
						onChange={(value) => handleInputChange("personType", value)}
					/>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="text-lg">
						{formData.personType === "physical"
							? "Datos Personales"
							: "Datos de la Empresa"}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{formData.personType === "physical" ? (
						<>
							<div className="grid grid-cols-1 @2xl/main:grid-cols-3 gap-4">
								<div className="space-y-2">
									<LabelWithInfo
										htmlFor="firstName"
										description={getFieldDescription("firstName")}
										required
									>
										Nombre
									</LabelWithInfo>
									<Input
										id="firstName"
										value={formData.firstName}
										onChange={(e) =>
											handleInputChange(
												"firstName",
												e.target.value.toUpperCase(),
											)
										}
										placeholder="Juan"
										className={
											validationErrors.firstName ? "border-destructive" : ""
										}
										required
									/>
									{validationErrors.firstName && (
										<p className="text-xs text-destructive">
											{validationErrors.firstName}
										</p>
									)}
								</div>
								<div className="space-y-2">
									<LabelWithInfo
										htmlFor="lastName"
										description={getFieldDescription("lastName")}
										required
									>
										Apellido Paterno
									</LabelWithInfo>
									<Input
										id="lastName"
										value={formData.lastName}
										onChange={(e) =>
											handleInputChange(
												"lastName",
												e.target.value.toUpperCase(),
											)
										}
										placeholder="Pérez"
										className={
											validationErrors.lastName ? "border-destructive" : ""
										}
										required
									/>
									{validationErrors.lastName && (
										<p className="text-xs text-destructive">
											{validationErrors.lastName}
										</p>
									)}
								</div>
								<div className="space-y-2">
									<LabelWithInfo
										htmlFor="secondLastName"
										description={`${getFieldDescription("secondLastName")} Coloca una X en caso de no existir para el cliente.`}
										required
									>
										Apellido Materno
									</LabelWithInfo>
									<Input
										id="secondLastName"
										value={formData.secondLastName}
										onChange={(e) =>
											handleInputChange(
												"secondLastName",
												e.target.value.toUpperCase(),
											)
										}
										placeholder="García"
										className={
											validationErrors.secondLastName
												? "border-destructive"
												: ""
										}
										required
									/>
									{validationErrors.secondLastName && (
										<p className="text-xs text-destructive">
											{validationErrors.secondLastName}
										</p>
									)}
								</div>
							</div>
							<div className="grid grid-cols-1 @xl/main:grid-cols-2 gap-4">
								<div className="space-y-2">
									<LabelWithInfo
										htmlFor="birthDate"
										description={getFieldDescription("birthDate")}
										required
									>
										Fecha de Nacimiento
									</LabelWithInfo>
									<Input
										id="birthDate"
										type="date"
										value={formData.birthDate}
										onChange={(e) =>
											handleInputChange("birthDate", e.target.value)
										}
										required
									/>
								</div>
								<div className="space-y-2">
									<LabelWithInfo
										htmlFor="curp"
										description={getFieldDescription("curp")}
										required
									>
										CURP
									</LabelWithInfo>
									<Input
										id="curp"
										value={formData.curp}
										onChange={(e) => {
											handleInputChange("curp", e.target.value.toUpperCase());
										}}
										placeholder="PECJ850615HDFRRN09"
										className={
											validationErrors.curp ? "border-destructive" : ""
										}
										required
									/>
									{validationErrors.curp && (
										<p className="text-xs text-destructive">
											{validationErrors.curp}
										</p>
									)}
								</div>
							</div>
						</>
					) : (
						<>
							<div className="space-y-2">
								<LabelWithInfo
									htmlFor="businessName"
									description={getFieldDescription("businessName")}
									required
								>
									Razón Social
								</LabelWithInfo>
								<Input
									id="businessName"
									value={formData.businessName}
									onChange={(e) =>
										handleInputChange(
											"businessName",
											e.target.value.toUpperCase(),
										)
									}
									placeholder="Ej. EMPRESA S.A. DE C.V."
									required
								/>
							</div>
							<div className="space-y-2">
								<LabelWithInfo
									htmlFor="incorporationDate"
									description={getFieldDescription("incorporationDate")}
									required
								>
									Fecha de Constitución
								</LabelWithInfo>
								<Input
									id="incorporationDate"
									type="date"
									value={formData.incorporationDate}
									onChange={(e) =>
										handleInputChange("incorporationDate", e.target.value)
									}
									required
								/>
							</div>
						</>
					)}
					<div className="space-y-2">
						<LabelWithInfo
							htmlFor="rfc"
							description={getFieldDescription("rfc")}
							required
						>
							RFC
						</LabelWithInfo>
						<Input
							id="rfc"
							value={formData.rfc}
							onChange={(e) => {
								handleInputChange("rfc", e.target.value.toUpperCase());
							}}
							className={`font-mono uppercase ${
								validationErrors.rfc ? "border-destructive" : ""
							}`}
							placeholder={
								formData.personType === "physical"
									? "PECJ850615E56"
									: "EMP850101AAA"
							}
							maxLength={formData.personType === "physical" ? 13 : 12}
							required
						/>
						{validationErrors.rfc ? (
							<p className="text-xs text-destructive">{validationErrors.rfc}</p>
						) : (
							<p className="text-xs text-muted-foreground">
								{formData.personType === "physical"
									? "13 caracteres para persona física"
									: "12 caracteres para persona moral/fideicomiso"}
							</p>
						)}
					</div>
					{formData.personType === "physical" && (
						<CatalogSelector
							catalogKey="countries"
							label="Nacionalidad"
							labelDescription={getFieldDescription("nationality")}
							value={formData.nationality}
							searchPlaceholder="Buscar país..."
							onChange={(option) =>
								handleInputChange("nationality", option?.id ?? "")
							}
						/>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="text-lg">{t("clientContactInfo")}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 @xl/main:grid-cols-2 gap-4">
						<div className="space-y-2">
							<LabelWithInfo
								htmlFor="email"
								description={getFieldDescription("email")}
								required
							>
								Email
							</LabelWithInfo>
							<Input
								id="email"
								type="email"
								value={formData.email}
								onChange={(e) => handleInputChange("email", e.target.value)}
								placeholder="contacto@empresa.com"
								required
							/>
						</div>
						<div className="space-y-2">
							<LabelWithInfo
								htmlFor="phone"
								description={getFieldDescription("phone")}
								required
							>
								Teléfono
							</LabelWithInfo>
							<PhoneInput
								id="phone"
								value={formData.phone || undefined}
								onChange={(value: string | undefined) => {
									handleInputChange("phone", value || "");
									if (validationErrors.phone) {
										setValidationErrors((prev) => ({
											...prev,
											phone: undefined,
										}));
									}
								}}
								placeholder="+52 55 1234 5678"
								required
							/>
							{validationErrors.phone && (
								<p className="text-xs text-destructive">
									{validationErrors.phone}
								</p>
							)}
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="text-lg">{t("clientAddressInfo")}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 @md/main:grid-cols-[1fr_150px_150px] gap-4">
						<div className="space-y-2">
							<LabelWithInfo
								htmlFor="street"
								description={getFieldDescription("street")}
								required
							>
								Calle
							</LabelWithInfo>
							<Input
								id="street"
								value={formData.street}
								onChange={(e) =>
									handleInputChange("street", e.target.value.toUpperCase())
								}
								placeholder="AV. CONSTITUCIÓN"
								required
							/>
						</div>
						<div className="space-y-2">
							<LabelWithInfo
								htmlFor="externalNumber"
								description={getFieldDescription("externalNumber")}
								required
							>
								Número Ext.
							</LabelWithInfo>
							<Input
								id="externalNumber"
								value={formData.externalNumber}
								onChange={(e) =>
									handleInputChange(
										"externalNumber",
										e.target.value.toUpperCase(),
									)
								}
								placeholder="123"
								required
							/>
						</div>
						<div className="space-y-2">
							<LabelWithInfo
								htmlFor="internalNumber"
								description={getFieldDescription("internalNumber")}
							>
								Número Int.
							</LabelWithInfo>
							<Input
								id="internalNumber"
								value={formData.internalNumber}
								onChange={(e) =>
									handleInputChange(
										"internalNumber",
										e.target.value.toUpperCase(),
									)
								}
								placeholder="A"
							/>
						</div>
					</div>
					<ZipCodeAddressFields
						postalCode={formData.postalCode}
						onPostalCodeChange={(value) =>
							handleInputChange("postalCode", value)
						}
						city={formData.city}
						onCityChange={(value) => handleInputChange("city", value)}
						municipality={formData.municipality}
						onMunicipalityChange={(value) =>
							handleInputChange("municipality", value)
						}
						stateCode={formData.stateCode}
						onStateCodeChange={(value) => handleInputChange("stateCode", value)}
						neighborhood={formData.neighborhood}
						onNeighborhoodChange={(value) =>
							handleInputChange("neighborhood", value)
						}
						reference={formData.reference}
						onReferenceChange={(value) => handleInputChange("reference", value)}
						showNeighborhood={true}
						showReference={true}
					/>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="text-lg">
						{t("clientComplianceNotes")}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						<Label htmlFor="notes">Observaciones</Label>
						<Textarea
							id="notes"
							value={formData.notes}
							onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
								handleInputChange("notes", e.target.value)
							}
							rows={4}
							placeholder="Agregue notas relevantes sobre el cliente..."
						/>
					</div>
				</CardContent>
			</Card>

			{/* Action buttons */}
			<div className="flex justify-end gap-3">
				<Button
					type="button"
					variant="outline"
					onClick={onCancel}
					disabled={isSubmitting}
				>
					Cancelar
				</Button>
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? (
						<>
							<span className="animate-spin mr-2">⏳</span>
							Creando...
						</>
					) : (
						<>
							Guardar y Continuar
							<ArrowRight className="h-4 w-4 ml-2" />
						</>
					)}
				</Button>
			</div>
		</form>
	);
}
