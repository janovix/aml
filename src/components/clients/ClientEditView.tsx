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
import type { RiskLevel, ClientStatus } from "../../types/client";

interface ClientFormData {
	name: string;
	rfc: string;
	riskLevel: RiskLevel;
	status: ClientStatus;
	email: string;
	phone: string;
	address: string;
	city: string;
	state: string;
	notes: string;
}

interface ClientEditViewProps {
	clientId: string;
}

export function ClientEditView({
	clientId,
}: ClientEditViewProps): React.JSX.Element {
	const router = useRouter();
	const { toast } = useToast();
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	const [formData, setFormData] = useState<ClientFormData>({
		name: "Empresas Globales S.A. de C.V.",
		rfc: "EGL850101AAA",
		riskLevel: "ALTO",
		status: "ACTIVO",
		email: "contacto@empresasglobales.mx",
		phone: "+52 55 1234 5678",
		address: "Av. Insurgentes Sur 1234, Col. Del Valle",
		city: "Ciudad de México",
		state: "CDMX",
		notes:
			"Cliente requiere revisión periódica debido a volumen de transacciones inusuales.",
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
			title: "Cliente actualizado",
			description: "Los cambios se han guardado exitosamente.",
		});

		router.push(`/clients/${clientId}`);
	};

	const handleCancel = (): void => {
		router.push(`/clients/${clientId}`);
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
									Editar Cliente
								</h1>
								<p className="text-sm text-muted-foreground leading-relaxed sm:truncate">
									{formData.name}
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
								<span className="hidden sm:inline">Guardar Cambios</span>
							</Button>
						</div>
					</div>
				</header>

				<div className="flex-1 min-h-0 overflow-y-auto p-6">
					<form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">Datos de la Empresa</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="name">Razón Social *</Label>
										<Input
											id="name"
											value={formData.name}
											onChange={(e) =>
												handleInputChange("name", e.target.value)
											}
											required
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="rfc">RFC *</Label>
										<Input
											id="rfc"
											value={formData.rfc}
											onChange={(e) => handleInputChange("rfc", e.target.value)}
											className="font-mono"
											required
										/>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="text-lg">Evaluación de Riesgo</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="riskLevel">Nivel de Riesgo *</Label>
										<Select
											value={formData.riskLevel}
											onValueChange={(value) =>
												handleInputChange("riskLevel", value as RiskLevel)
											}
										>
											<SelectTrigger id="riskLevel">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="BAJO">Bajo</SelectItem>
												<SelectItem value="MEDIO">Medio</SelectItem>
												<SelectItem value="ALTO">Alto</SelectItem>
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-2">
										<Label htmlFor="status">Estado *</Label>
										<Select
											value={formData.status}
											onValueChange={(value) =>
												handleInputChange("status", value as ClientStatus)
											}
										>
											<SelectTrigger id="status">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="ACTIVO">Activo</SelectItem>
												<SelectItem value="INACTIVO">Inactivo</SelectItem>
												<SelectItem value="SUSPENDIDO">Suspendido</SelectItem>
												<SelectItem value="BLOQUEADO">Bloqueado</SelectItem>
											</SelectContent>
										</Select>
									</div>
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
											required
										/>
									</div>
								</div>
								<div className="space-y-2">
									<Label htmlFor="address">Dirección *</Label>
									<Input
										id="address"
										value={formData.address}
										onChange={(e) =>
											handleInputChange("address", e.target.value)
										}
										required
									/>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="city">Ciudad *</Label>
										<Input
											id="city"
											value={formData.city}
											onChange={(e) =>
												handleInputChange("city", e.target.value)
											}
											required
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="state">Estado *</Label>
										<Input
											id="state"
											value={formData.state}
											onChange={(e) =>
												handleInputChange("state", e.target.value)
											}
											required
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
