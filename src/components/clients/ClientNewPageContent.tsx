"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import type {
	PersonType,
	RiskLevel,
	ClientStatus,
	ReviewStatus,
} from "@/types/client";

export function ClientNewPageContent(): React.ReactElement {
	const router = useRouter();
	const { toast } = useToast();
	const [formData, setFormData] = useState<{
		rfc: string;
		personType: PersonType | "";
		firstName?: string;
		lastName?: string;
		secondLastName?: string;
		businessName?: string;
		email: string;
		phone: string;
		riskLevel: RiskLevel | "";
		status: ClientStatus | "";
		reviewStatus: ReviewStatus | "";
		street?: string;
		extNumber?: string;
		intNumber?: string;
		neighborhood?: string;
		city?: string;
		state?: string;
		zipCode?: string;
		country?: string;
	}>({
		rfc: "",
		personType: "",
		email: "",
		phone: "",
		riskLevel: "",
		status: "",
		reviewStatus: "",
	});
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent): Promise<void> => {
		e.preventDefault();
		setLoading(true);

		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 500));

		toast({
			title: "Cliente creado",
			description: "El cliente se ha creado exitosamente.",
		});

		setLoading(false);
		router.push("/clients");
	};

	const handleChange = (
		field: string,
		value: string | PersonType | RiskLevel | ClientStatus | ReviewStatus,
	): void => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

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
					<h1 className="text-3xl font-bold tracking-tight">Nuevo Cliente</h1>
					<p className="text-muted-foreground">
						Crear un nuevo cliente en el sistema
					</p>
				</div>
			</div>

			<div className="max-w-5xl">
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
											value={formData.rfc}
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
												<SelectValue placeholder="Seleccionar tipo" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="FISICA">Persona Física</SelectItem>
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
												<Label htmlFor="secondLastName">Apellido Materno</Label>
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
								) : formData.personType === "MORAL" ? (
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
								) : null}

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="email">Email *</Label>
										<Input
											id="email"
											type="email"
											value={formData.email}
											onChange={(e) => handleChange("email", e.target.value)}
											required
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="phone">Teléfono *</Label>
										<Input
											id="phone"
											type="tel"
											value={formData.phone}
											onChange={(e) => handleChange("phone", e.target.value)}
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
											onChange={(e) => handleChange("street", e.target.value)}
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
											onChange={(e) => handleChange("zipCode", e.target.value)}
										/>
									</div>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="state">Estado</Label>
										<Input
											id="state"
											value={formData.state || ""}
											onChange={(e) => handleChange("state", e.target.value)}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="country">País</Label>
										<Input
											id="country"
											value={formData.country || ""}
											onChange={(e) => handleChange("country", e.target.value)}
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
												<SelectValue placeholder="Seleccionar nivel" />
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
												<SelectValue placeholder="Seleccionar estado" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="ACTIVO">Activo</SelectItem>
												<SelectItem value="INACTIVO">Inactivo</SelectItem>
												<SelectItem value="SUSPENDIDO">Suspendido</SelectItem>
												<SelectItem value="BLOQUEADO">Bloqueado</SelectItem>
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-2">
										<Label htmlFor="reviewStatus">Estado de Revisión *</Label>
										<Select
											value={formData.reviewStatus}
											onValueChange={(value) =>
												handleChange("reviewStatus", value as ReviewStatus)
											}
										>
											<SelectTrigger id="reviewStatus">
												<SelectValue placeholder="Seleccionar estado" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="PENDIENTE">Pendiente</SelectItem>
												<SelectItem value="EN_REVISION">En Revisión</SelectItem>
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
								onClick={() => router.push("/clients")}
							>
								Cancelar
							</Button>
							<Button type="submit" disabled={loading}>
								<Save className="mr-2 h-4 w-4" />
								{loading ? "Creando..." : "Crear Cliente"}
							</Button>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
}
