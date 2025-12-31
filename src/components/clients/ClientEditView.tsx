"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, User, Lock, Hash } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { PageHeroSkeleton } from "@/components/skeletons";
import type {
	PersonType,
	ClientCreateRequest,
	Client,
} from "../../types/client";
import { useToast } from "../../hooks/use-toast";
import { getClientById, updateClient } from "../../lib/api/clients";
import { executeMutation } from "../../lib/mutations";
import { getPersonTypeStyle } from "../../lib/person-type-icon";
import { LabelWithInfo } from "../ui/LabelWithInfo";
import { getFieldDescription } from "../../lib/field-descriptions";
import { CatalogSelector } from "../catalogs/CatalogSelector";
import { PhoneInput } from "../ui/phone-input";
import { validateRFC, validateCURP } from "../../lib/utils";
import { toast as sonnerToast } from "sonner";

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

interface ClientEditViewProps {
	clientId: string;
}

export function ClientEditView({
	clientId,
}: ClientEditViewProps): React.JSX.Element {
	const { navigateTo } = useOrgNavigation();
	const { toast } = useToast();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [client, setClient] = useState<Client | null>(null);
	const formRef = useRef<HTMLFormElement | null>(null);
	const hiddenSubmitButtonRef = useRef<HTMLButtonElement | null>(null);
	const handleToolbarSubmit = (): void => {
		const form = formRef.current;
		if (!form) return;

		if (typeof form.requestSubmit === "function") {
			form.requestSubmit();
		}

		hiddenSubmitButtonRef.current?.click();
	};

	const [formData, setFormData] = useState<ClientFormData>({
		personType: "moral",
		rfc: "",
		firstName: "",
		lastName: "",
		secondLastName: "",
		birthDate: "",
		curp: "",
		businessName: "",
		incorporationDate: "",
		nationality: "",
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
	});

	const [validationErrors, setValidationErrors] = useState<{
		rfc?: string;
		curp?: string;
	}>({});

	useEffect(() => {
		const fetchClient = async () => {
			try {
				setIsLoading(true);
				const data = await getClientById({
					id: clientId,
				});
				setClient(data);

				// Convert date-time to date format for inputs
				const birthDate = data.birthDate
					? new Date(data.birthDate).toISOString().split("T")[0]
					: "";
				const incorporationDate = data.incorporationDate
					? new Date(data.incorporationDate).toISOString().split("T")[0]
					: "";

				setFormData({
					personType: data.personType,
					rfc: data.rfc,
					firstName: data.firstName ?? "",
					lastName: data.lastName ?? "",
					secondLastName: data.secondLastName ?? "",
					birthDate,
					curp: data.curp ?? "",
					businessName: data.businessName ?? "",
					incorporationDate,
					nationality: data.nationality ?? "",
					email: data.email,
					phone: data.phone,
					stateCode: data.stateCode,
					city: data.city,
					municipality: data.municipality,
					neighborhood: data.neighborhood,
					street: data.street,
					externalNumber: data.externalNumber,
					internalNumber: data.internalNumber ?? "",
					postalCode: data.postalCode,
					reference: data.reference ?? "",
					notes: data.notes ?? "",
				});
			} catch (error) {
				console.error("Error fetching client:", error);
				toast({
					title: "No se pudo cargar la información del cliente.",
					variant: "destructive",
				});
			} finally {
				setIsLoading(false);
			}
		};
		fetchClient();
	}, [clientId, toast]);

	const handleInputChange = (
		field: keyof ClientFormData,
		value: string,
	): void => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleSubmit = async (e: React.FormEvent): Promise<void> => {
		e.preventDefault();
		if (isSubmitting) return;

		const currentPersonType = client?.personType ?? formData.personType;

		// Client-side validation
		const errors: { rfc?: string; curp?: string } = {};

		// Validate RFC
		const rfcValidation = validateRFC(formData.rfc, currentPersonType);
		if (!rfcValidation.isValid) {
			errors.rfc = rfcValidation.error;
		}

		// Validate CURP (only for physical persons)
		if (currentPersonType === "physical" && formData.curp) {
			const curpValidation = validateCURP(formData.curp);
			if (!curpValidation.isValid) {
				errors.curp = curpValidation.error;
			}
		}

		// If there are validation errors, show them and prevent submission
		if (Object.keys(errors).length > 0) {
			setValidationErrors(errors);
			sonnerToast.error("Por favor, corrija los errores en el formulario");
			return;
		}

		setValidationErrors({});
		setIsSubmitting(true);

		if (!currentPersonType) {
			toast({
				title: "Tipo de persona no disponible",
				variant: "destructive",
			});
			setIsSubmitting(false);
			return;
		}

		// Build the request payload based on personType
		const request: ClientCreateRequest = {
			personType: currentPersonType,
			rfc: formData.rfc,
			email: formData.email,
			phone: formData.phone,
			country: client?.country ?? "MX",
			stateCode: formData.stateCode,
			city: formData.city,
			municipality: formData.municipality,
			neighborhood: formData.neighborhood,
			street: formData.street,
			externalNumber: formData.externalNumber,
			postalCode: formData.postalCode,
		};

		// Add personType-specific fields
		if (currentPersonType === "physical") {
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
				mutation: () =>
					updateClient({
						id: clientId,
						input: request,
					}),
				loading: "Actualizando cliente...",
				success: "Cliente actualizado exitosamente",
				onSuccess: () => {
					navigateTo(`/clients/${clientId}`);
				},
			});
		} catch (error) {
			// Error is already handled by executeMutation via Sonner
			console.error("Error updating client:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleCancel = (): void => {
		navigateTo(`/clients/${clientId}`);
	};

	if (isLoading) {
		return (
			<div className="space-y-6">
				<PageHeroSkeleton
					showStats={false}
					showBackButton={true}
					actionCount={2}
				/>
				{/* Form skeleton */}
				<div className="max-w-4xl space-y-6">
					{[1, 2, 3].map((i) => (
						<Card key={i}>
							<CardHeader>
								<div className="h-6 w-48 bg-accent animate-pulse rounded" />
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									{[1, 2, 3, 4].map((j) => (
										<div key={j} className="space-y-2">
											<div className="h-4 w-24 bg-accent animate-pulse rounded" />
											<div className="h-10 w-full bg-accent animate-pulse rounded" />
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		);
	}

	if (!client) {
		return (
			<div className="space-y-6">
				<PageHero
					title="Cliente no encontrado"
					subtitle={`El cliente con ID ${clientId} no existe`}
					icon={User}
					backButton={{
						label: "Volver a Clientes",
						onClick: () => navigateTo("/clients"),
					}}
				/>
			</div>
		);
	}

	const lockedPersonType = formData.personType ?? client.personType;
	const personTypeStyle = getPersonTypeStyle(lockedPersonType);
	const PersonTypeIcon = personTypeStyle.icon;

	return (
		<div className="space-y-6">
			<PageHero
				title="Editar Cliente"
				subtitle="Modificar información del cliente"
				icon={User}
				backButton={{
					label: "Volver",
					onClick: handleCancel,
				}}
				actions={[
					{
						label: isSubmitting ? "Guardando..." : "Guardar Cambios",
						icon: Save,
						onClick: handleToolbarSubmit,
						disabled: isSubmitting,
					},
					{
						label: "Cancelar",
						onClick: handleCancel,
						variant: "outline",
					},
				]}
			/>

			<form
				id="client-edit-form"
				ref={formRef}
				onSubmit={handleSubmit}
				className="max-w-4xl space-y-6"
			>
				<button
					ref={hiddenSubmitButtonRef}
					type="submit"
					tabIndex={-1}
					aria-hidden="true"
					className="sr-only"
				/>
				<Card>
					<CardContent className="p-6">
						<div className="flex flex-col sm:flex-row sm:items-center gap-6">
							{/* Person Type Section - Locked */}
							<div
								className={`flex items-center gap-4 rounded-xl border ${personTypeStyle.borderColor} ${personTypeStyle.bgColor} p-4 sm:min-w-[240px]`}
							>
								<div
									className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${personTypeStyle.bgColor}`}
								>
									<PersonTypeIcon
										className={`h-6 w-6 ${personTypeStyle.iconColor}`}
									/>
								</div>
								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-2">
										<p className={`font-semibold ${personTypeStyle.iconColor}`}>
											{personTypeStyle.label}
										</p>
										<Lock className="h-3.5 w-3.5 text-muted-foreground" />
									</div>
									<p className="text-xs text-muted-foreground">
										{personTypeStyle.description}
									</p>
								</div>
							</div>

							{/* RFC Section */}
							<div className="flex items-center gap-4 rounded-xl border border-border bg-muted/30 p-4 flex-1">
								<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
									<Hash className="h-6 w-6 text-muted-foreground" />
								</div>
								<div className="min-w-0 flex-1">
									<p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
										RFC
									</p>
									<p className="font-mono text-lg font-semibold tracking-wide">
										{formData.rfc}
									</p>
								</div>
							</div>
						</div>
						<p className="mt-4 text-xs text-muted-foreground flex items-center gap-1.5">
							<Lock className="h-3 w-3" />
							El tipo de persona no se puede modificar después de crear el
							cliente.
						</p>
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
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
											required
										/>
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
											required
										/>
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
										/>
									</div>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
												handleInputChange("curp", e.target.value);
												// Clear error when user starts typing
												if (validationErrors.curp) {
													setValidationErrors((prev) => ({
														...prev,
														curp: undefined,
													}));
												}
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
						<CardTitle className="text-lg">Información de Contacto</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
									onChange={(value: string | undefined) =>
										handleInputChange("phone", value || "")
									}
									placeholder="+52 55 1234 5678"
									required
								/>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Dirección</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="md:col-span-2 space-y-2">
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
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
						<CardTitle className="text-lg">Notas de Cumplimiento</CardTitle>
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
