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
import type { PersonType, ClientStatus } from "../../types/client";

interface ClientFormData {
	personType: PersonType;
	rfc: string;
	firstName?: string;
	lastName?: string;
	secondLastName?: string;
	businessName?: string;
	email: string;
	phone: string;
	status: ClientStatus;
	street?: string;
	extNumber?: string;
	intNumber?: string;
	neighborhood?: string;
	city?: string;
	state?: string;
	zipCode?: string;
	country?: string;
	notes: string;
}

export function ClientCreateView(): React.JSX.Element {
	const router = useRouter();
	const { toast } = useToast();

	const [formData, setFormData] = useState<ClientFormData>({
		personType: "MORAL",
		rfc: "",
		firstName: "",
		lastName: "",
		secondLastName: "",
		businessName: "",
		email: "",
		phone: "",
		status: "ACTIVO",
		street: "",
		extNumber: "",
		intNumber: "",
		neighborhood: "",
		city: "",
		state: "",
		zipCode: "",
		country: "México",
		notes: "",
	});

	const handleInputChange = (
		field: keyof ClientFormData,
		value: string,
	): void => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleSubmit = (e: React.FormEvent): void => {
		e.preventDefault();

		toast({
			title: "Cliente creado",
			description: "El nuevo cliente se ha registrado exitosamente.",
		});

		router.push("/clients");
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
					<Button className="gap-2" onClick={handleSubmit}>
						<Save className="h-4 w-4" />
						Crear Cliente
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
									<SelectItem value="FISICA">Persona Física</SelectItem>
									<SelectItem value="MORAL">Persona Moral</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-lg">
							{formData.personType === "FISICA"
								? "Datos Personales"
								: "Datos de la Empresa"}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{formData.personType === "FISICA" ? (
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
						) : (
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
						)}
						<div className="space-y-2">
							<Label htmlFor="rfc">RFC *</Label>
							<Input
								id="rfc"
								value={formData.rfc}
								onChange={(e) => handleInputChange("rfc", e.target.value)}
								className="font-mono"
								placeholder={
									formData.personType === "FISICA"
										? "PECJ850615E56"
										: "EMP850101AAA"
								}
								required
							/>
						</div>
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
								<Label htmlFor="street">Calle</Label>
								<Input
									id="street"
									value={formData.street}
									onChange={(e) => handleInputChange("street", e.target.value)}
									placeholder="Av. Constitución"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="extNumber">Número Ext.</Label>
								<Input
									id="extNumber"
									value={formData.extNumber}
									onChange={(e) =>
										handleInputChange("extNumber", e.target.value)
									}
									placeholder="123"
								/>
							</div>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="space-y-2">
								<Label htmlFor="intNumber">Número Int.</Label>
								<Input
									id="intNumber"
									value={formData.intNumber}
									onChange={(e) =>
										handleInputChange("intNumber", e.target.value)
									}
									placeholder="A"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="neighborhood">Colonia</Label>
								<Input
									id="neighborhood"
									value={formData.neighborhood}
									onChange={(e) =>
										handleInputChange("neighborhood", e.target.value)
									}
									placeholder="Centro"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="zipCode">Código Postal</Label>
								<Input
									id="zipCode"
									value={formData.zipCode}
									onChange={(e) => handleInputChange("zipCode", e.target.value)}
									placeholder="64000"
								/>
							</div>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="space-y-2">
								<Label htmlFor="city">Ciudad</Label>
								<Input
									id="city"
									value={formData.city}
									onChange={(e) => handleInputChange("city", e.target.value)}
									placeholder="Monterrey"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="state">Estado</Label>
								<Input
									id="state"
									value={formData.state}
									onChange={(e) => handleInputChange("state", e.target.value)}
									placeholder="Nuevo León"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="country">País</Label>
								<Input
									id="country"
									value={formData.country}
									onChange={(e) => handleInputChange("country", e.target.value)}
									placeholder="México"
								/>
							</div>
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
