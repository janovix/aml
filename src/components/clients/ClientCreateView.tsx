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
import { AppSidebar } from "../layout/AppSidebar";
import { ArrowLeft, Save, X, Menu } from "lucide-react";
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
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
		<div className="flex h-screen w-full overflow-hidden bg-background">
			{mobileMenuOpen && (
				<div
					className="fixed inset-0 z-40 bg-black/50 lg:hidden"
					onClick={() => setMobileMenuOpen(false)}
					aria-hidden="true"
				/>
			)}

			<div
				className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:hidden
        ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
      `}
			>
				<div className="flex h-full flex-col bg-sidebar border-r">
					<div className="flex h-16 items-center justify-between border-b px-4">
						<div className="flex items-center gap-2">
							<span className="text-lg font-bold text-foreground">
								AML Platform
							</span>
						</div>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setMobileMenuOpen(false)}
							aria-label="Cerrar menú"
						>
							<X className="h-5 w-5" />
						</Button>
					</div>
					<AppSidebar
						collapsed={false}
						onToggle={() => setMobileMenuOpen(false)}
						isMobile={true}
					/>
				</div>
			</div>

			<AppSidebar
				collapsed={sidebarCollapsed}
				onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
			/>

			<main className="flex flex-1 min-h-0 min-w-0 w-full flex-col">
				<header className="sticky top-0 z-10 border-b bg-background">
					<div className="flex flex-col gap-4 px-4 py-4 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6 sm:py-0">
						<div className="flex flex-1 items-start gap-3 sm:items-center min-w-0">
							<div className="flex items-center gap-2 shrink-0">
								<Button
									variant="ghost"
									size="icon"
									className="lg:hidden"
									onClick={() => setMobileMenuOpen(true)}
									aria-label="Abrir menú"
								>
									<Menu className="h-5 w-5" />
								</Button>
								<Button
									variant="ghost"
									size="sm"
									className="gap-2 -ml-2"
									onClick={handleCancel}
								>
									<ArrowLeft className="h-4 w-4" />
									Volver
								</Button>
							</div>
							<Separator
								orientation="vertical"
								className="hidden sm:block h-6"
							/>
							<div className="min-w-0">
								<h1 className="text-xl font-semibold text-foreground">
									Nuevo Cliente
								</h1>
								<p className="text-sm text-muted-foreground leading-relaxed">
									Registrar un nuevo cliente en el sistema
								</p>
							</div>
						</div>
						<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:justify-end">
							<Button
								variant="outline"
								size="sm"
								onClick={handleCancel}
								className="w-full sm:w-auto"
							>
								Cancelar
							</Button>
							<Button
								size="sm"
								className="gap-2 w-full sm:w-auto"
								onClick={handleSubmit}
							>
								<Save className="h-4 w-4" />
								<span className="hidden sm:inline">Crear Cliente</span>
							</Button>
						</div>
					</div>
				</header>

				<div className="flex-1 min-h-0 overflow-y-auto p-6">
					<form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
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
								<CardTitle className="text-lg">
									Información de Contacto
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="email">Email *</Label>
										<Input
											id="email"
											type="email"
											value={formData.email}
											onChange={(e) =>
												handleInputChange("email", e.target.value)
											}
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
											onChange={(e) =>
												handleInputChange("phone", e.target.value)
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
										<Label htmlFor="street">Calle</Label>
										<Input
											id="street"
											value={formData.street}
											onChange={(e) =>
												handleInputChange("street", e.target.value)
											}
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
											onChange={(e) =>
												handleInputChange("zipCode", e.target.value)
											}
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
											onChange={(e) =>
												handleInputChange("city", e.target.value)
											}
											placeholder="Monterrey"
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="state">Estado</Label>
										<Input
											id="state"
											value={formData.state}
											onChange={(e) =>
												handleInputChange("state", e.target.value)
											}
											placeholder="Nuevo León"
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="country">País</Label>
										<Input
											id="country"
											value={formData.country}
											onChange={(e) =>
												handleInputChange("country", e.target.value)
											}
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
			</main>
		</div>
	);
}
