"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Input,
	Label,
	Separator,
	Textarea,
} from "@algtools/ui";
import { ArrowLeft, Save } from "lucide-react";
import type {
	PersonType,
	ClientCreateRequest,
	Client,
} from "../../types/client";
import { useToast } from "../../hooks/use-toast";
import { getClientByRfc, updateClient } from "../../lib/api/clients";
import { executeMutation } from "../../lib/mutations";
import { getPersonTypeDisplay } from "../../lib/person-type";
import { LabelWithInfo } from "../ui/LabelWithInfo";
import { getFieldDescription } from "../../lib/field-descriptions";
import { CatalogSelector } from "../catalogs/CatalogSelector";

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
	const router = useRouter();
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

	useEffect(() => {
		const fetchClient = async () => {
			try {
				setIsLoading(true);
				const data = await getClientByRfc({
					rfc: clientId,
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
		setIsSubmitting(true);

		const currentPersonType = client?.personType ?? formData.personType;

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
						rfc: clientId,
						input: request,
					}),
				loading: "Actualizando cliente...",
				success: "Cliente actualizado exitosamente",
				onSuccess: () => {
					router.push(`/clients/${clientId}`);
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
		router.push(`/clients/${clientId}`);
	};

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" onClick={handleCancel}>
						<ArrowLeft className="h-5 w-5" />
					</Button>
					<div>
						<h1 className="text-3xl font-bold tracking-tight">
							Editar Cliente
						</h1>
						<p className="text-muted-foreground">
							Cargando información del cliente...
						</p>
					</div>
				</div>
			</div>
		);
	}

	if (!client) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => router.push("/clients")}
					>
						<ArrowLeft className="h-5 w-5" />
					</Button>
					<div>
						<h1 className="text-3xl font-bold tracking-tight">
							Cliente no encontrado
						</h1>
						<p className="text-muted-foreground">
							El cliente con ID {clientId} no existe.
						</p>
					</div>
				</div>
			</div>
		);
	}

	const lockedPersonType = formData.personType ?? client.personType;
	const { label: personTypeLabel, helper: personTypeHelper } =
		getPersonTypeDisplay(lockedPersonType);

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-4">
					<Button
						variant="ghost"
						size="sm"
						className="gap-2"
						onClick={handleCancel}
					>
						<ArrowLeft className="h-4 w-4" />
						<span className="hidden sm:inline">Volver</span>
					</Button>
					<Separator orientation="vertical" className="hidden h-6 sm:block" />
					<div>
						<h1 className="text-xl font-semibold text-foreground">
							Editar Cliente
						</h1>
						<p className="text-sm text-muted-foreground">
							Modificar información del cliente
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm" onClick={handleCancel}>
						Cancelar
					</Button>
					<Button
						size="sm"
						className="gap-2"
						type="button"
						onClick={handleToolbarSubmit}
						disabled={isSubmitting}
					>
						<Save className="h-4 w-4" />
						<span className="hidden sm:inline">
							{isSubmitting ? "Guardando..." : "Guardar Cambios"}
						</span>
					</Button>
				</div>
			</div>

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
					<CardHeader>
						<CardTitle className="text-lg">Tipo de Persona</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label className="text-sm font-medium leading-none">Tipo *</Label>
							<div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-muted bg-muted/60 p-3">
								<Badge
									variant="outline"
									className="px-3 py-1 text-sm font-medium"
								>
									{personTypeLabel}
								</Badge>
								<p className="text-sm text-muted-foreground">
									{personTypeHelper}
								</p>
							</div>
						</div>
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
											onChange={(e) =>
												handleInputChange("curp", e.target.value)
											}
											placeholder="PECJ850615HDFRRN09"
											required
										/>
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
								onChange={(e) => handleInputChange("rfc", e.target.value)}
								className="font-mono uppercase"
								placeholder={
									formData.personType === "physical"
										? "PECJ850615E56"
										: "EMP850101AAA"
								}
								maxLength={formData.personType === "physical" ? 13 : 12}
								required
							/>
							<p className="text-xs text-muted-foreground">
								{formData.personType === "physical"
									? "13 caracteres para persona física"
									: "12 caracteres para persona moral/fideicomiso"}
							</p>
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
								<Input
									id="phone"
									type="tel"
									value={formData.phone}
									onChange={(e) => handleInputChange("phone", e.target.value)}
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
