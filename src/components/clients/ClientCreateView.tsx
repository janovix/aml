"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Separator,
	Textarea,
} from "@algtools/ui";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import type { PersonType, ClientCreateRequest } from "../../types/client";
import { createClient } from "../../lib/api/clients";

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

export function ClientCreateView(): React.JSX.Element {
	const router = useRouter();
	const { toast } = useToast();
	const [isSubmitting, setIsSubmitting] = useState(false);

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

	const handleInputChange = (
		field: keyof ClientFormData,
		value: string,
	): void => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleSubmit = async (e: React.FormEvent): Promise<void> => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
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

			await createClient({ input: request });

			toast({
				title: "Cliente creado",
				description: "El nuevo cliente se ha registrado exitosamente.",
			});

			router.push("/clients");
		} catch (error) {
			console.error("Error creating client:", error);
			toast({
				title: "Error",
				description:
					error instanceof Error
						? error.message
						: "No se pudo crear el cliente. Por favor, intente nuevamente.",
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleCancel = (): void => {
		router.push("/clients");
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" onClick={handleCancel}>
						<ArrowLeft className="h-5 w-5" />
					</Button>
					<div>
						<h1 className="text-3xl font-bold tracking-tight">Nuevo Cliente</h1>
						<p className="text-muted-foreground">
							Registrar un nuevo cliente en el sistema
						</p>
					</div>
				</div>
				<div className="flex gap-2">
					<Button variant="outline" onClick={handleCancel}>
						Cancelar
					</Button>
					<Button
						className="gap-2"
						onClick={handleSubmit}
						disabled={isSubmitting}
					>
						<Save className="h-4 w-4" />
						{isSubmitting ? "Creando..." : "Crear Cliente"}
					</Button>
				</div>
			</div>

			<form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Tipo de Persona</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="personType">Tipo *</Label>
							<Select
								value={formData.personType}
								onValueChange={(value) =>
									handleInputChange("personType", value as PersonType)
								}
							>
								<SelectTrigger id="personType">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="physical">Persona Física</SelectItem>
									<SelectItem value="moral">Persona Moral</SelectItem>
									<SelectItem value="trust">Fideicomiso</SelectItem>
								</SelectContent>
							</Select>
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
										<Label htmlFor="firstName">Nombre *</Label>
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
										<Label htmlFor="lastName">Apellido Paterno *</Label>
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
										<Label htmlFor="secondLastName">Apellido Materno</Label>
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
										<Label htmlFor="birthDate">Fecha de Nacimiento *</Label>
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
										<Label htmlFor="curp">CURP *</Label>
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
									<Label htmlFor="businessName">Razón Social *</Label>
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
									<Label htmlFor="incorporationDate">
										Fecha de Constitución *
									</Label>
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
							<Label htmlFor="rfc">RFC *</Label>
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
							<div className="space-y-2">
								<Label htmlFor="nationality">Nacionalidad</Label>
								<Input
									id="nationality"
									value={formData.nationality}
									onChange={(e) =>
										handleInputChange("nationality", e.target.value)
									}
									placeholder="Mexicana"
								/>
							</div>
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
								<Label htmlFor="email">Email *</Label>
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
								<Label htmlFor="phone">Teléfono *</Label>
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
								<Label htmlFor="street">Calle *</Label>
								<Input
									id="street"
									value={formData.street}
									onChange={(e) => handleInputChange("street", e.target.value)}
									placeholder="Av. Constitución"
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="externalNumber">Número Ext. *</Label>
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
								<Label htmlFor="internalNumber">Número Int.</Label>
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
								<Label htmlFor="neighborhood">Colonia *</Label>
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
								<Label htmlFor="postalCode">Código Postal *</Label>
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
								<Label htmlFor="city">Ciudad *</Label>
								<Input
									id="city"
									value={formData.city}
									onChange={(e) => handleInputChange("city", e.target.value)}
									placeholder="Monterrey"
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="municipality">Municipio *</Label>
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
								<Label htmlFor="stateCode">Estado *</Label>
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
