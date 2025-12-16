"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import { mockClients } from "@/data/mockClients";
import type {
	Client,
	PersonType,
	RiskLevel,
	ClientStatus,
	ReviewStatus,
} from "@/types/client";

interface ClientEditPageContentProps {
	clientId: string;
}

export function ClientEditPageContent({
	clientId,
}: ClientEditPageContentProps): React.ReactElement {
	const router = useRouter();
	const { toast } = useToast();
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [client, setClient] = useState<Client | null>(null);
	const [formData, setFormData] = useState<Partial<Client>>({});
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const foundClient = mockClients.find((c) => c.id === clientId);
		if (foundClient) {
			setClient(foundClient);
			setFormData(foundClient);
		}
	}, [clientId]);

	const handleSubmit = async (e: React.FormEvent): Promise<void> => {
		e.preventDefault();
		setLoading(true);

		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 500));

		toast({
			title: "Cliente actualizado",
			description: "Los cambios se han guardado exitosamente.",
		});

		setLoading(false);
		router.push(`/clients/${clientId}`);
	};

	const handleChange = (
		field: keyof Client,
		value:
			| string
			| number
			| PersonType
			| RiskLevel
			| ClientStatus
			| ReviewStatus,
	): void => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	if (!client) {
		return (
			<div className="flex h-screen w-full overflow-hidden bg-background">
				<AppSidebar
					collapsed={sidebarCollapsed}
					onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
				/>
				<main className="flex flex-1 min-h-0 min-w-0 w-full flex-col">
					<div className="flex-1 flex items-center justify-center">
						<Card className="w-full max-w-md">
							<CardContent className="pt-6">
								<div className="text-center space-y-4">
									<h2 className="text-2xl font-semibold">
										Cliente no encontrado
									</h2>
									<p className="text-muted-foreground">
										El cliente con ID {clientId} no existe.
									</p>
									<Button
										onClick={() => router.push("/clients")}
										className="w-full"
									>
										<ArrowLeft className="mr-2 h-4 w-4" />
										Volver a Clientes
									</Button>
								</div>
							</CardContent>
						</Card>
					</div>
				</main>
			</div>
		);
	}

	return (
		<div className="flex h-screen w-full overflow-hidden bg-background">
			<AppSidebar
				collapsed={sidebarCollapsed}
				onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
			/>

			<main className="flex flex-1 min-h-0 min-w-0 w-full flex-col">
				<header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-3 sm:px-6">
					<div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => router.push(`/clients/${clientId}`)}
							className="shrink-0"
						>
							<ArrowLeft className="h-5 w-5" />
						</Button>
						<div className="min-w-0">
							<h1 className="text-xl font-semibold text-foreground truncate">
								Editar Cliente
							</h1>
							<p className="text-sm text-muted-foreground hidden sm:block truncate">
								Modificar información del cliente
							</p>
						</div>
					</div>
				</header>

				<div className="flex-1 min-h-0 overflow-x-hidden overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">
					<div className="max-w-5xl mx-auto">
						<form onSubmit={handleSubmit}>
							<div className="space-y-6">
								{/* Basic Information */}
								<Card className="shadow-sm">
									<CardHeader className="pb-4">
										<CardTitle>Información Básica</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label htmlFor="rfc">RFC *</Label>
												<Input
													id="rfc"
													value={formData.rfc || ""}
													onChange={(e) => handleChange("rfc", e.target.value)}
													required
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="personType">Tipo de Persona *</Label>
												<Select
													value={formData.personType}
													onValueChange={(value) =>
														handleChange("personType", value as PersonType)
													}
												>
													<SelectTrigger id="personType">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="FISICA">
															Persona Física
														</SelectItem>
														<SelectItem value="MORAL">Persona Moral</SelectItem>
													</SelectContent>
												</Select>
											</div>
										</div>

										{formData.personType === "FISICA" ? (
											<>
												<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
													<div className="space-y-2">
														<Label htmlFor="firstName">Nombre *</Label>
														<Input
															id="firstName"
															value={formData.firstName || ""}
															onChange={(e) =>
																handleChange("firstName", e.target.value)
															}
															required
														/>
													</div>
													<div className="space-y-2">
														<Label htmlFor="lastName">Apellido Paterno *</Label>
														<Input
															id="lastName"
															value={formData.lastName || ""}
															onChange={(e) =>
																handleChange("lastName", e.target.value)
															}
															required
														/>
													</div>
													<div className="space-y-2">
														<Label htmlFor="secondLastName">
															Apellido Materno
														</Label>
														<Input
															id="secondLastName"
															value={formData.secondLastName || ""}
															onChange={(e) =>
																handleChange("secondLastName", e.target.value)
															}
														/>
													</div>
												</div>
											</>
										) : (
											<div className="space-y-2">
												<Label htmlFor="businessName">Razón Social *</Label>
												<Input
													id="businessName"
													value={formData.businessName || ""}
													onChange={(e) =>
														handleChange("businessName", e.target.value)
													}
													required
												/>
											</div>
										)}

										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label htmlFor="email">Email *</Label>
												<Input
													id="email"
													type="email"
													value={formData.email || ""}
													onChange={(e) =>
														handleChange("email", e.target.value)
													}
													required
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="phone">Teléfono *</Label>
												<Input
													id="phone"
													type="tel"
													value={formData.phone || ""}
													onChange={(e) =>
														handleChange("phone", e.target.value)
													}
													required
												/>
											</div>
										</div>
									</CardContent>
								</Card>

								{/* Address Information */}
								<Card className="shadow-sm">
									<CardHeader className="pb-4">
										<CardTitle>Dirección</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
											<div className="md:col-span-2 space-y-2">
												<Label htmlFor="street">Calle</Label>
												<Input
													id="street"
													value={formData.street || ""}
													onChange={(e) =>
														handleChange("street", e.target.value)
													}
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="extNumber">Número Exterior</Label>
												<Input
													id="extNumber"
													value={formData.extNumber || ""}
													onChange={(e) =>
														handleChange("extNumber", e.target.value)
													}
												/>
											</div>
										</div>
										<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
											<div className="space-y-2">
												<Label htmlFor="intNumber">Número Interior</Label>
												<Input
													id="intNumber"
													value={formData.intNumber || ""}
													onChange={(e) =>
														handleChange("intNumber", e.target.value)
													}
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="neighborhood">Colonia</Label>
												<Input
													id="neighborhood"
													value={formData.neighborhood || ""}
													onChange={(e) =>
														handleChange("neighborhood", e.target.value)
													}
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="city">Ciudad</Label>
												<Input
													id="city"
													value={formData.city || ""}
													onChange={(e) => handleChange("city", e.target.value)}
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="zipCode">Código Postal</Label>
												<Input
													id="zipCode"
													value={formData.zipCode || ""}
													onChange={(e) =>
														handleChange("zipCode", e.target.value)
													}
												/>
											</div>
										</div>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label htmlFor="state">Estado</Label>
												<Input
													id="state"
													value={formData.state || ""}
													onChange={(e) =>
														handleChange("state", e.target.value)
													}
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="country">País</Label>
												<Input
													id="country"
													value={formData.country || ""}
													onChange={(e) =>
														handleChange("country", e.target.value)
													}
												/>
											</div>
										</div>
									</CardContent>
								</Card>

								{/* Status Information */}
								<Card className="shadow-sm">
									<CardHeader className="pb-4">
										<CardTitle>Estado y Riesgo</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
											<div className="space-y-2">
												<Label htmlFor="riskLevel">Nivel de Riesgo *</Label>
												<Select
													value={formData.riskLevel}
													onValueChange={(value) =>
														handleChange("riskLevel", value as RiskLevel)
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
														handleChange("status", value as ClientStatus)
													}
												>
													<SelectTrigger id="status">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="ACTIVO">Activo</SelectItem>
														<SelectItem value="INACTIVO">Inactivo</SelectItem>
														<SelectItem value="SUSPENDIDO">
															Suspendido
														</SelectItem>
														<SelectItem value="BLOQUEADO">Bloqueado</SelectItem>
													</SelectContent>
												</Select>
											</div>
											<div className="space-y-2">
												<Label htmlFor="reviewStatus">
													Estado de Revisión *
												</Label>
												<Select
													value={formData.reviewStatus}
													onValueChange={(value) =>
														handleChange("reviewStatus", value as ReviewStatus)
													}
												>
													<SelectTrigger id="reviewStatus">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="PENDIENTE">Pendiente</SelectItem>
														<SelectItem value="EN_REVISION">
															En Revisión
														</SelectItem>
														<SelectItem value="APROBADO">Aprobado</SelectItem>
														<SelectItem value="RECHAZADO">Rechazado</SelectItem>
													</SelectContent>
												</Select>
											</div>
										</div>
									</CardContent>
								</Card>

								{/* Actions */}
								<div className="flex justify-end gap-3">
									<Button
										type="button"
										variant="outline"
										onClick={() => router.push(`/clients/${clientId}`)}
									>
										Cancelar
									</Button>
									<Button type="submit" disabled={loading}>
										<Save className="mr-2 h-4 w-4" />
										{loading ? "Guardando..." : "Guardar Cambios"}
									</Button>
								</div>
							</div>
						</form>
					</div>
				</div>
			</main>
		</div>
	);
}
