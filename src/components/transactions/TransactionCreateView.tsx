"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
	Button,
	Card,
	CardContent,
	CardDescription,
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
} from "@algtools/ui";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { createTransaction } from "../../lib/api/transactions";
import type {
	TransactionOperationType,
	TransactionVehicleType,
	TransactionCreateRequest,
} from "../../types/transaction";
import { CatalogSelector } from "../catalogs/CatalogSelector";

interface TransactionFormData {
	clientId: string;
	operationDate: string;
	operationType: TransactionOperationType | "";
	branchPostalCode: string;
	vehicleType: TransactionVehicleType | "";
	brandId: string;
	model: string;
	year: string;
	serialNumber: string;
	plates?: string;
	engineNumber?: string;
	registrationNumber?: string;
	flagCountryId?: string;
	amount: string;
	currency: string;
	paymentMethod: string;
	paymentDate: string;
}

export function TransactionCreateView(): React.JSX.Element {
	const router = useRouter();
	const { toast } = useToast();
	const [isSaving, setIsSaving] = useState(false);

	const [formData, setFormData] = useState<TransactionFormData>({
		clientId: "",
		operationDate: new Date().toISOString().slice(0, 16),
		operationType: "",
		branchPostalCode: "",
		vehicleType: "",
		brandId: "",
		model: "",
		year: "",
		serialNumber: "",
		plates: "",
		engineNumber: "",
		registrationNumber: "",
		flagCountryId: "",
		amount: "",
		currency: "MXN",
		paymentMethod: "",
		paymentDate: new Date().toISOString().slice(0, 16),
	});

	const handleInputChange = (
		field: keyof TransactionFormData,
		value: string,
	): void => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleSubmit = async (e: React.FormEvent): Promise<void> => {
		e.preventDefault();

		try {
			setIsSaving(true);
			const createData: TransactionCreateRequest = {
				clientId: formData.clientId,
				operationDate: new Date(formData.operationDate).toISOString(),
				operationType: formData.operationType as TransactionOperationType,
				branchPostalCode: formData.branchPostalCode,
				vehicleType: formData.vehicleType as TransactionVehicleType,
				brandId: formData.brandId,
				model: formData.model,
				year: parseInt(formData.year, 10),
				serialNumber: formData.serialNumber,
				amount: formData.amount,
				currency: formData.currency,
				paymentMethod: formData.paymentMethod,
				paymentDate: new Date(formData.paymentDate).toISOString(),
			};

			if (formData.vehicleType === "land") {
				if (formData.plates) createData.plates = formData.plates;
				if (formData.engineNumber)
					createData.engineNumber = formData.engineNumber;
			} else {
				if (formData.registrationNumber)
					createData.registrationNumber = formData.registrationNumber;
				if (formData.flagCountryId)
					createData.flagCountryId = formData.flagCountryId;
			}

			await createTransaction({ input: createData });
			toast({
				title: "Transacción creada",
				description: "La nueva transacción se ha registrado exitosamente.",
			});
			router.push("/transactions");
		} catch (error) {
			console.error("Error creating transaction:", error);
			toast({
				title: "Error",
				description: "No se pudo crear la transacción.",
				variant: "destructive",
			});
		} finally {
			setIsSaving(false);
		}
	};

	const handleCancel = (): void => {
		router.push("/transactions");
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
						Volver
					</Button>
					<Separator orientation="vertical" className="h-6" />
					<div>
						<h1 className="text-xl font-semibold text-foreground">
							Nueva Transacción
						</h1>
						<p className="text-sm text-muted-foreground">
							Registrar una nueva transacción
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
						disabled={isSaving}
					>
						<Save className="h-4 w-4" />
						<span className="hidden sm:inline">
							{isSaving ? "Creando..." : "Crear Transacción"}
						</span>
					</Button>
				</div>
			</div>

			<form onSubmit={handleSubmit} className="space-y-6">
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">
							Información de la Transacción
						</CardTitle>
						<CardDescription>
							Detalles básicos de la transacción
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="client">Cliente *</Label>
								<Select
									value={formData.clientId}
									onValueChange={(value) =>
										handleInputChange("clientId", value)
									}
									required
								>
									<SelectTrigger id="client">
										<SelectValue placeholder="Seleccionar cliente" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="1">Juan Pérez García</SelectItem>
										<SelectItem value="2">María González López</SelectItem>
										<SelectItem value="3">Carlos Ramírez Santos</SelectItem>
										<SelectItem value="4">Ana Martínez Ruiz</SelectItem>
										<SelectItem value="5">Roberto Silva Castro</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label htmlFor="operation-date">Fecha de operación *</Label>
								<Input
									id="operation-date"
									type="datetime-local"
									value={formData.operationDate}
									onChange={(e) =>
										handleInputChange("operationDate", e.target.value)
									}
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="operation-type">Tipo de operación *</Label>
								<Select
									value={formData.operationType}
									onValueChange={(value) =>
										handleInputChange("operationType", value)
									}
									required
								>
									<SelectTrigger id="operation-type">
										<SelectValue placeholder="Seleccionar tipo" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="purchase">Compra</SelectItem>
										<SelectItem value="sale">Venta</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label htmlFor="branch-postal-code">
									Código Postal Sucursal *
								</Label>
								<Input
									id="branch-postal-code"
									value={formData.branchPostalCode}
									onChange={(e) =>
										handleInputChange("branchPostalCode", e.target.value)
									}
									placeholder="64000"
									required
								/>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Información del Vehículo</CardTitle>
						<CardDescription>
							Detalles del vehículo involucrado en la transacción
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="vehicle-type">Tipo de vehículo *</Label>
							<Select
								value={formData.vehicleType}
								onValueChange={(value) =>
									handleInputChange("vehicleType", value)
								}
								required
							>
								<SelectTrigger id="vehicle-type">
									<SelectValue placeholder="Seleccionar tipo" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="land">Terrestre</SelectItem>
									<SelectItem value="marine">Marítimo</SelectItem>
									<SelectItem value="air">Aéreo</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<Separator />

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<CatalogSelector
								catalogKey="vehicle-brands"
								label="Marca ID"
								value={formData.brandId}
								required
								searchPlaceholder="Buscar marca..."
								onChange={(option) =>
									handleInputChange("brandId", option?.id ?? "")
								}
							/>

							<div className="space-y-2">
								<Label htmlFor="model">Modelo *</Label>
								<Input
									id="model"
									value={formData.model}
									onChange={(e) => handleInputChange("model", e.target.value)}
									placeholder="Corolla, X5, etc."
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="year">Año *</Label>
								<Input
									id="year"
									type="number"
									value={formData.year}
									onChange={(e) => handleInputChange("year", e.target.value)}
									placeholder="2024"
									required
									min="1900"
									max="2025"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="serial-number">Número de serie *</Label>
								<Input
									id="serial-number"
									value={formData.serialNumber}
									onChange={(e) =>
										handleInputChange("serialNumber", e.target.value)
									}
									placeholder="VIN o número de serie"
									required
								/>
							</div>

							{formData.vehicleType === "land" && (
								<>
									<div className="space-y-2">
										<Label htmlFor="plates">Placas *</Label>
										<Input
											id="plates"
											value={formData.plates}
											onChange={(e) =>
												handleInputChange("plates", e.target.value)
											}
											placeholder="ABC-123-D"
											required
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="engine-number">Número de motor</Label>
										<Input
											id="engine-number"
											value={formData.engineNumber}
											onChange={(e) =>
												handleInputChange("engineNumber", e.target.value)
											}
											placeholder="Opcional"
										/>
									</div>
								</>
							)}

							{(formData.vehicleType === "marine" ||
								formData.vehicleType === "air") && (
								<>
									<div className="space-y-2">
										<Label htmlFor="registration-number">
											Número de registro *
										</Label>
										<Input
											id="registration-number"
											value={formData.registrationNumber}
											onChange={(e) =>
												handleInputChange("registrationNumber", e.target.value)
											}
											placeholder="Número de registro"
											required
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="flag-country-id">País de bandera ID</Label>
										<Input
											id="flag-country-id"
											value={formData.flagCountryId}
											onChange={(e) =>
												handleInputChange("flagCountryId", e.target.value)
											}
											placeholder="MX"
										/>
									</div>
								</>
							)}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Información de Pago</CardTitle>
						<CardDescription>
							Detalles financieros de la transacción
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="amount">Monto *</Label>
								<Input
									id="amount"
									type="number"
									value={formData.amount}
									onChange={(e) => handleInputChange("amount", e.target.value)}
									placeholder="0.00"
									required
									min="0"
									step="0.01"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="currency">Moneda *</Label>
								<Select
									value={formData.currency}
									onValueChange={(value) =>
										handleInputChange("currency", value)
									}
									required
								>
									<SelectTrigger id="currency">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
										<SelectItem value="USD">USD - Dólar Americano</SelectItem>
										<SelectItem value="EUR">EUR - Euro</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label htmlFor="payment-method">Método de pago *</Label>
								<Select
									value={formData.paymentMethod}
									onValueChange={(value) =>
										handleInputChange("paymentMethod", value)
									}
									required
								>
									<SelectTrigger id="payment-method">
										<SelectValue placeholder="Seleccionar método" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="EFECTIVO">Efectivo</SelectItem>
										<SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
										<SelectItem value="CHEQUE">Cheque</SelectItem>
										<SelectItem value="FINANCIAMIENTO">
											Financiamiento
										</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label htmlFor="payment-date">Fecha de pago *</Label>
								<Input
									id="payment-date"
									type="datetime-local"
									value={formData.paymentDate}
									onChange={(e) =>
										handleInputChange("paymentDate", e.target.value)
									}
									required
								/>
							</div>
						</div>
					</CardContent>
				</Card>
			</form>
		</div>
	);
}
