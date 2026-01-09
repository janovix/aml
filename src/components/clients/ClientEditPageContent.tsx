"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import { mockClients } from "@/data/mockClients";
import type { Client, PersonType } from "@/types/client";
import { getPersonTypeDisplay } from "@/lib/person-type";
import { validateRFC } from "@/lib/utils";
import { toast as sonnerToast } from "sonner";

interface ClientEditPageContentProps {
	clientId: string;
}

export function ClientEditPageContent({
	clientId,
}: ClientEditPageContentProps): React.ReactElement {
	const router = useRouter();
	const [client, setClient] = useState<Client | null>(null);
	const [formData, setFormData] = useState<Partial<Client>>({});
	const [loading, setLoading] = useState(false);
	const [validationErrors, setValidationErrors] = useState<{
		rfc?: string;
	}>({});

	useEffect(() => {
		const foundClient = mockClients.find((c) => c.rfc === clientId);
		if (foundClient) {
			setClient(foundClient);
			setFormData(foundClient);
		}
	}, [clientId]);

	const handleSubmit = async (e?: React.FormEvent): Promise<void> => {
		e?.preventDefault();

		// Client-side validation for RFC
		if (formData.personType && formData.rfc) {
			const rfcValidation = validateRFC(
				formData.rfc,
				formData.personType as "physical" | "moral" | "trust",
			);
			if (!rfcValidation.isValid) {
				setValidationErrors({ rfc: rfcValidation.error });
				sonnerToast.error("Por favor, corrija los errores en el formulario");
				return;
			}
		}

		setValidationErrors({});
		setLoading(true);

		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 500));

		toast.success("Los cambios se han guardado exitosamente.");

		setLoading(false);
		router.push(`/clients/${client?.rfc || clientId}`);
	};

	const handleChange = (
		field: keyof Client,
		value: string | number | PersonType | null | undefined,
	): void => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleCancel = (): void => {
		router.push(`/clients/${client?.rfc || clientId}`);
	};

	if (!client) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<Card className="w-full max-w-md">
					<CardContent className="pt-6">
						<div className="text-center space-y-4">
							<h2 className="text-2xl font-semibold">Cliente no encontrado</h2>
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
		);
	}

	const lockedPersonType = formData.personType ?? client.personType ?? null;
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
						onClick={handleSubmit}
						disabled={loading}
					>
						<Save className="h-4 w-4" />
						<span className="hidden sm:inline">
							{loading ? "Guardando..." : "Guardar Cambios"}
						</span>
					</Button>
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
											value={formData.rfc || ""}
											onChange={(e) => {
												handleChange("rfc", e.target.value);
												// Clear error when user starts typing
												if (validationErrors.rfc) {
													setValidationErrors((prev) => ({
														...prev,
														rfc: undefined,
													}));
												}
											}}
											className={
												validationErrors.rfc ? "border-destructive" : ""
											}
											required
										/>
										{validationErrors.rfc && (
											<p className="text-xs text-destructive">
												{validationErrors.rfc}
											</p>
										)}
									</div>
									<div className="space-y-2">
										<p className="text-sm font-medium leading-none">
											Tipo de Persona *
										</p>
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
								</div>

								{formData.personType === "physical" ? (
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
											onChange={(e) => handleChange("email", e.target.value)}
											required
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="phone">Teléfono *</Label>
										<PhoneInput
											id="phone"
											value={formData.phone || undefined}
											onChange={(value: string | undefined) =>
												handleChange("phone", value || "")
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
											onChange={(e) => handleChange("street", e.target.value)}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="externalNumber">Número Exterior</Label>
										<Input
											id="externalNumber"
											value={formData.externalNumber || ""}
											onChange={(e) =>
												handleChange("externalNumber", e.target.value)
											}
										/>
									</div>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
									<div className="space-y-2">
										<Label htmlFor="internalNumber">Número Interior</Label>
										<Input
											id="internalNumber"
											value={formData.internalNumber || ""}
											onChange={(e) =>
												handleChange("internalNumber", e.target.value)
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
										<Label htmlFor="postalCode">Código Postal</Label>
										<Input
											id="postalCode"
											value={formData.postalCode || ""}
											onChange={(e) =>
												handleChange("postalCode", e.target.value)
											}
										/>
									</div>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="stateCode">Estado</Label>
										<Input
											id="stateCode"
											value={formData.stateCode || ""}
											onChange={(e) =>
												handleChange("stateCode", e.target.value)
											}
										/>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</form>
			</div>
		</div>
	);
}
