"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import type { PersonType } from "@/types/client";
import { validateRFC } from "@/lib/utils";
import { toast as sonnerToast } from "sonner";

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
		street?: string;
		extNumber?: string;
		intNumber?: string;
		neighborhood?: string;
		city?: string;
		state?: string;
		zipCode?: string;
	}>({
		rfc: "",
		personType: "",
		email: "",
		phone: "",
	});
	const [loading, setLoading] = useState(false);
	const [validationErrors, setValidationErrors] = useState<{
		rfc?: string;
	}>({});

	const handleSubmit = async (e?: React.FormEvent): Promise<void> => {
		e?.preventDefault();

		// Client-side validation for RFC
		if (formData.personType) {
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

		toast({
			title: "Cliente creado",
			description: "El cliente se ha creado exitosamente.",
		});

		setLoading(false);
		router.push("/clients");
	};

	const handleChange = (field: string, value: string | PersonType): void => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleCancel = (): void => {
		router.push("/clients");
	};

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
							Nuevo Cliente
						</h1>
						<p className="text-sm text-muted-foreground">
							Registrar un nuevo cliente en el sistema
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
							{loading ? "Creando..." : "Crear Cliente"}
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
											value={formData.rfc}
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
												<SelectItem value="physical">Persona Física</SelectItem>
												<SelectItem value="moral">Persona Moral</SelectItem>
												<SelectItem value="trust">Fideicomiso</SelectItem>
											</SelectContent>
										</Select>
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
								) : formData.personType === "moral" ||
								  formData.personType === "trust" ? (
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
								</div>
							</CardContent>
						</Card>
					</div>
				</form>
			</div>
		</div>
	);
}
