"use client";

import type React from "react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { useSessionStorageForm } from "@/hooks/useSessionStorageForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, UserPlus } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import type { PersonType, ClientCreateRequest } from "../../types/client";
import { PersonTypePicker } from "./PersonTypePicker";
import { createClient } from "../../lib/api/clients";
import { executeMutation } from "../../lib/mutations";
import { LabelWithInfo } from "../ui/LabelWithInfo";
import { getFieldDescription } from "../../lib/field-descriptions";
import { CatalogSelector } from "../catalogs/CatalogSelector";
import { PhoneInput } from "../ui/phone-input";
import {
	validateRFC,
	validateCURP,
	extractBirthdateFromCURP,
	validateCURPNameMatch,
	validateCURPBirthdateMatch,
	validateRFCMatch,
} from "../../lib/utils";
import { toast } from "sonner";
import { useLanguage } from "@/components/LanguageProvider";
import { validatePhone } from "@/lib/validators/validate-phone";

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

export function ClientCreateView(): React.JSX.Element {
	const { t } = useLanguage();
	const { navigateTo, orgPath } = useOrgNavigation();
	const searchParams = useSearchParams();
	const returnUrl = searchParams.get("returnUrl");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const [formData, setFormData, clearFormStorage] =
		useSessionStorageForm<ClientFormData>(
			"client_create",
			INITIAL_CLIENT_FORM_DATA,
		);

	const [validationErrors, setValidationErrors] = useState<{
		rfc?: string;
		curp?: string;
		phone?: string;
		birthDate?: string;
		firstName?: string;
		lastName?: string;
		secondLastName?: string;
	}>({});

	const handleInputChange = (
		field: keyof ClientFormData,
		value: string,
	): void => {
		setFormData((prev) => {
			const updated = { ...prev, [field]: value };

			// Auto-fill birthdate from CURP when CURP is entered
			if (field === "curp" && updated.personType === "physical") {
				// Validate CURP format first
				const curpValidation = validateCURP(value);
				if (!curpValidation.isValid) {
					setValidationErrors((prev) => ({
						...prev,
						curp: curpValidation.error,
						birthDate: undefined,
						firstName: undefined,
						lastName: undefined,
						secondLastName: undefined,
					}));
					return updated;
				}

				// Clear CURP format error
				setValidationErrors((prev) => ({
					...prev,
					curp: undefined,
				}));

				// Auto-fill birthdate only if CURP is valid and birthdate is empty
				const extractedBirthdate = extractBirthdateFromCURP(value);
				if (extractedBirthdate && !updated.birthDate) {
					updated.birthDate = extractedBirthdate;
				}

				// Cross-validate with birthdate if both are present
				if (updated.birthDate) {
					const birthdateMatch = validateCURPBirthdateMatch(
						value,
						updated.birthDate,
					);
					if (!birthdateMatch.isValid) {
						setValidationErrors((prev) => ({
							...prev,
							birthDate: birthdateMatch.error,
						}));
					} else {
						setValidationErrors((prev) => ({
							...prev,
							birthDate: undefined,
						}));
					}
				}

				// Cross-validate with names if all are present
				if (updated.firstName && updated.lastName) {
					const nameMatch = validateCURPNameMatch(
						value,
						updated.firstName,
						updated.lastName,
						updated.secondLastName,
					);
					if (!nameMatch.isValid) {
						setValidationErrors((prev) => ({
							...prev,
							...nameMatch.errors,
						}));
					} else {
						setValidationErrors((prev) => ({
							...prev,
							firstName: undefined,
							lastName: undefined,
							secondLastName: undefined,
						}));
					}
				}
			}

			// Validate birthdate against CURP when birthdate changes
			if (
				field === "birthDate" &&
				updated.personType === "physical" &&
				updated.curp
			) {
				const curpValidation = validateCURP(updated.curp);
				if (curpValidation.isValid) {
					const birthdateMatch = validateCURPBirthdateMatch(
						updated.curp,
						value,
					);
					if (!birthdateMatch.isValid) {
						setValidationErrors((prev) => ({
							...prev,
							birthDate: birthdateMatch.error,
						}));
					} else {
						setValidationErrors((prev) => ({
							...prev,
							birthDate: undefined,
						}));
					}
				}
			}

			// Validate names against CURP when names change
			if (
				(field === "firstName" ||
					field === "lastName" ||
					field === "secondLastName") &&
				updated.personType === "physical" &&
				updated.curp
			) {
				const curpValidation = validateCURP(updated.curp);
				if (curpValidation.isValid && updated.firstName && updated.lastName) {
					const nameMatch = validateCURPNameMatch(
						updated.curp,
						updated.firstName,
						updated.lastName,
						updated.secondLastName,
					);
					if (!nameMatch.isValid) {
						setValidationErrors((prev) => ({
							...prev,
							...nameMatch.errors,
						}));
					} else {
						setValidationErrors((prev) => ({
							...prev,
							firstName: undefined,
							lastName: undefined,
							secondLastName: undefined,
						}));
					}
				}
			}

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
					if (rfcValidation.isValid) {
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
			birthDate?: string;
			firstName?: string;
			lastName?: string;
			secondLastName?: string;
		} = {};

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
				// Cross-validate birthdate
				if (formData.birthDate) {
					const birthdateMatch = validateCURPBirthdateMatch(
						formData.curp,
						formData.birthDate,
					);
					if (!birthdateMatch.isValid) {
						errors.birthDate = birthdateMatch.error;
					}
				}

				// Cross-validate names
				if (formData.firstName && formData.lastName) {
					const nameMatch = validateCURPNameMatch(
						formData.curp,
						formData.firstName,
						formData.lastName,
						formData.secondLastName,
					);
					if (!nameMatch.isValid) {
						Object.assign(errors, nameMatch.errors);
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
					if (returnUrl) {
						// Append client ID to return URL for auto-selection
						const separator = returnUrl.includes("?") ? "&" : "?";
						// returnUrl is already org-prefixed from search params
						navigateTo(
							`${returnUrl}${separator}clientId=${client.id}`.replace(
								/^\/[^/]+/,
								"",
							),
						);
					} else {
						navigateTo("/clients");
					}
				},
			});
		} catch (error) {
			// Error is already handled by executeMutation via Sonner
			console.error("Error creating client:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleCancel = (): void => {
		if (returnUrl) {
			// returnUrl is already org-prefixed from search params
			navigateTo(returnUrl.replace(/^\/[^/]+/, ""));
		} else {
			navigateTo("/clients");
		}
	};

	return (
		<div className="space-y-6">
			<PageHero
				title={t("clientNewTitle")}
				subtitle={t("clientNewSubtitle")}
				icon={UserPlus}
				backButton={{
					label: t("back"),
					onClick: handleCancel,
				}}
				actions={[
					{
						label: isSubmitting ? t("clientCreating") : t("clientCreateButton"),
						icon: Save,
						onClick: () => {
							void handleSubmit({
								preventDefault: () => {},
							} as React.FormEvent);
						},
						disabled: isSubmitting,
					},
					{
						label: t("cancel"),
						onClick: handleCancel,
						variant: "outline",
					},
				]}
			/>

			<form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
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
								<div className="grid grid-cols-1 @lg/main:grid-cols-3 gap-4">
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
												handleInputChange("firstName", e.target.value)
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
												handleInputChange("lastName", e.target.value)
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
											description={getFieldDescription("secondLastName")}
										>
											Apellido Materno
										</LabelWithInfo>
										<Input
											id="secondLastName"
											value={formData.secondLastName}
											onChange={(e) =>
												handleInputChange("secondLastName", e.target.value)
											}
											placeholder="García"
											className={
												validationErrors.secondLastName
													? "border-destructive"
													: ""
											}
										/>
										{validationErrors.secondLastName && (
											<p className="text-xs text-destructive">
												{validationErrors.secondLastName}
											</p>
										)}
									</div>
								</div>
								<div className="grid grid-cols-1 @md/main:grid-cols-2 gap-4">
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
											className={
												validationErrors.birthDate ? "border-destructive" : ""
											}
											required
										/>
										{validationErrors.birthDate && (
											<p className="text-xs text-destructive">
												{validationErrors.birthDate}
											</p>
										)}
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
											handleInputChange("businessName", e.target.value)
										}
										placeholder="Ej. Empresa S.A. de C.V."
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
									handleInputChange("rfc", e.target.value);
									// Clear error when user starts typing
									if (validationErrors.rfc) {
										setValidationErrors((prev) => ({
											...prev,
											rfc: undefined,
										}));
									}
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
								<p className="text-xs text-destructive">
									{validationErrors.rfc}
								</p>
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
						<div className="grid grid-cols-1 @md/main:grid-cols-2 gap-4">
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
						<div className="grid grid-cols-1 @lg/main:grid-cols-3 gap-4">
							<div className="@md/main:col-span-2 space-y-2">
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
									onChange={(e) => handleInputChange("street", e.target.value)}
									placeholder="Av. Constitución"
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
										handleInputChange("externalNumber", e.target.value)
									}
									placeholder="123"
									required
								/>
							</div>
						</div>
						<div className="grid grid-cols-1 @lg/main:grid-cols-3 gap-4">
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
										handleInputChange("internalNumber", e.target.value)
									}
									placeholder="A"
								/>
							</div>
							<div className="space-y-2">
								<LabelWithInfo
									htmlFor="neighborhood"
									description={getFieldDescription("neighborhood")}
									required
								>
									Colonia
								</LabelWithInfo>
								<Input
									id="neighborhood"
									value={formData.neighborhood}
									onChange={(e) =>
										handleInputChange("neighborhood", e.target.value)
									}
									placeholder="Centro"
									required
								/>
							</div>
							<div className="space-y-2">
								<LabelWithInfo
									htmlFor="postalCode"
									description={getFieldDescription("postalCode")}
									required
								>
									Código Postal
								</LabelWithInfo>
								<Input
									id="postalCode"
									value={formData.postalCode}
									onChange={(e) =>
										handleInputChange("postalCode", e.target.value)
									}
									placeholder="64000"
									required
								/>
							</div>
						</div>
						<div className="grid grid-cols-1 @lg/main:grid-cols-3 gap-4">
							<div className="space-y-2">
								<LabelWithInfo
									htmlFor="city"
									description={getFieldDescription("city")}
									required
								>
									Ciudad
								</LabelWithInfo>
								<Input
									id="city"
									value={formData.city}
									onChange={(e) => handleInputChange("city", e.target.value)}
									placeholder="Monterrey"
									required
								/>
							</div>
							<div className="space-y-2">
								<LabelWithInfo
									htmlFor="municipality"
									description={getFieldDescription("municipality")}
									required
								>
									Municipio
								</LabelWithInfo>
								<Input
									id="municipality"
									value={formData.municipality}
									onChange={(e) =>
										handleInputChange("municipality", e.target.value)
									}
									placeholder="Monterrey"
									required
								/>
							</div>
							<div className="space-y-2">
								<LabelWithInfo
									htmlFor="stateCode"
									description={getFieldDescription("stateCode")}
									required
								>
									Estado
								</LabelWithInfo>
								<Input
									id="stateCode"
									value={formData.stateCode}
									onChange={(e) =>
										handleInputChange("stateCode", e.target.value)
									}
									placeholder="NL"
									required
								/>
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="reference">Referencia</Label>
							<Input
								id="reference"
								value={formData.reference}
								onChange={(e) => handleInputChange("reference", e.target.value)}
								placeholder="Entre calles X y Y"
							/>
						</div>
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
			</form>
		</div>
	);
}
