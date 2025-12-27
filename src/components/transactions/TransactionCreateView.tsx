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
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { createTransaction } from "../../lib/api/transactions";
import type {
	TransactionOperationType,
	TransactionVehicleType,
	TransactionCreateRequest,
	PaymentMethodInput,
} from "../../types/transaction";
import { CatalogSelector } from "../catalogs/CatalogSelector";
import { ClientSelector } from "../clients/ClientSelector";
import { LabelWithInfo } from "../ui/LabelWithInfo";
import { getFieldDescription } from "../../lib/field-descriptions";

interface TransactionFormData {
	clientId: string;
	operationDate: string;
	operationType: TransactionOperationType | "";
	branchPostalCode: string;
	vehicleType: TransactionVehicleType | "";
	brandId: string;
	model: string;
	year: string;
	vin?: string;
	repuve?: string;
	plates?: string;
	engineNumber?: string;
	registrationNumber?: string;
	flagCountryId?: string;
	amount: string;
	currency: string;
	paymentMethods: PaymentMethodInput[];
}

export function TransactionCreateView(): React.JSX.Element {
	const router = useRouter();
	const { toast } = useToast();
	const [isSaving, setIsSaving] = useState(false);

	const [formData, setFormData] = useState<TransactionFormData>({
		clientId: "",
		operationDate: new Date().toISOString().slice(0, 10), // Date only (YYYY-MM-DD)
		operationType: "sale", // Default to "Venta"
		branchPostalCode: "",
		vehicleType: "",
		brandId: "",
		model: "",
		year: "",
		vin: "",
		repuve: "",
		plates: "",
		engineNumber: "",
		registrationNumber: "",
		flagCountryId: "",
		amount: "", // Calculated from payment methods on submit
		currency: "MXN",
		paymentMethods: [{ method: "EFECTIVO", amount: "" }],
	});

	const handleInputChange = (
		field: keyof TransactionFormData,
		value: string | PaymentMethodInput[],
	): void => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handlePaymentMethodChange = (
		index: number,
		field: "method" | "amount",
		value: string,
	): void => {
		setFormData((prev) => {
			const newPaymentMethods = [...prev.paymentMethods];
			newPaymentMethods[index] = {
				...newPaymentMethods[index],
				[field]: value,
			};
			return { ...prev, paymentMethods: newPaymentMethods };
		});
	};

	const handleAddPaymentMethod = (): void => {
		setFormData((prev) => ({
			...prev,
			paymentMethods: [
				...prev.paymentMethods,
				{ method: "EFECTIVO", amount: "" },
			],
		}));
	};

	const handleRemovePaymentMethod = (index: number): void => {
		setFormData((prev) => ({
			...prev,
			paymentMethods: prev.paymentMethods.filter((_, i) => i !== index),
		}));
	};

	const calculateAmountFromPaymentMethods = (): string => {
		const paymentMethodsSum = formData.paymentMethods.reduce(
			(sum, pm) => sum + (parseFloat(pm.amount) || 0),
			0,
		);
		return paymentMethodsSum.toFixed(2);
	};

	const validatePaymentMethods = (): boolean => {
		const paymentMethodsSum = formData.paymentMethods.reduce(
			(sum, pm) => sum + (parseFloat(pm.amount) || 0),
			0,
		);

		if (paymentMethodsSum <= 0) {
			toast({
				title: "Error de validación",
				description:
					"Debe ingresar al menos un método de pago con un monto mayor a cero.",
				variant: "destructive",
			});
			return false;
		}
		return true;
	};

	const handleSubmit = async (e: React.FormEvent): Promise<void> => {
		e.preventDefault();

		if (!validatePaymentMethods()) {
			return;
		}

		try {
			setIsSaving(true);
			const calculatedAmount = calculateAmountFromPaymentMethods();
			// Format operationDate as date-only (YYYY-MM-DD) - convert to ISO date string at midnight UTC
			const operationDateISO = formData.operationDate
				? new Date(formData.operationDate + "T00:00:00.000Z").toISOString()
				: new Date().toISOString();
			const createData: TransactionCreateRequest = {
				clientId: formData.clientId,
				operationDate: operationDateISO,
				operationType: "sale", // Always set to "Venta"
				branchPostalCode: formData.branchPostalCode,
				vehicleType: formData.vehicleType as TransactionVehicleType,
				brandId: formData.brandId,
				model: formData.model,
				year: parseInt(formData.year, 10),
				amount: calculatedAmount,
				currency: formData.currency,
				paymentMethods: formData.paymentMethods,
			};

			if (formData.vehicleType === "land") {
				if (formData.vin) createData.vin = formData.vin;
				if (formData.repuve) createData.repuve = formData.repuve;
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
								<ClientSelector
									label="Cliente"
									value={formData.clientId}
									placeholder="Seleccionar cliente"
									searchPlaceholder="Buscar cliente por nombre o RFC..."
									onValueChange={(value) =>
										handleInputChange("clientId", value || "")
									}
									required
								/>
							</div>

							<div className="space-y-2">
								<LabelWithInfo
									htmlFor="operation-date"
									description={getFieldDescription("operationDate")}
									required
								>
									Fecha de operación
								</LabelWithInfo>
								<Input
									id="operation-date"
									type="date"
									value={formData.operationDate}
									onChange={(e) =>
										handleInputChange("operationDate", e.target.value)
									}
									required
								/>
							</div>

							<div className="space-y-2">
								<LabelWithInfo
									htmlFor="branch-postal-code"
									description={getFieldDescription("branchPostalCode")}
									required
								>
									Código Postal Sucursal
								</LabelWithInfo>
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
							<LabelWithInfo
								htmlFor="vehicle-type"
								description={getFieldDescription("vehicleType")}
								required
							>
								Tipo de vehículo
							</LabelWithInfo>
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
								labelDescription={getFieldDescription("brandId")}
								value={formData.brandId}
								required
								searchPlaceholder="Buscar marca..."
								onChange={(option) =>
									handleInputChange("brandId", option?.id ?? "")
								}
							/>

							<div className="space-y-2">
								<LabelWithInfo
									htmlFor="model"
									description={getFieldDescription("model")}
									required
								>
									Modelo
								</LabelWithInfo>
								<Input
									id="model"
									value={formData.model}
									onChange={(e) => handleInputChange("model", e.target.value)}
									placeholder="Corolla, X5, etc."
									required
								/>
							</div>

							<div className="space-y-2">
								<LabelWithInfo
									htmlFor="year"
									description={getFieldDescription("year")}
									required
								>
									Año
								</LabelWithInfo>
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

							{formData.vehicleType === "land" && (
								<>
									<div className="space-y-2">
										<LabelWithInfo
											htmlFor="vin"
											description={getFieldDescription("vin")}
										>
											VIN (Número de Identificación Vehicular)
										</LabelWithInfo>
										<Input
											id="vin"
											value={formData.vin}
											onChange={(e) => handleInputChange("vin", e.target.value)}
											placeholder="17 caracteres"
											maxLength={17}
										/>
									</div>
									<div className="space-y-2">
										<LabelWithInfo
											htmlFor="repuve"
											description={getFieldDescription("repuve")}
										>
											REPUVE (Registro Público Vehicular)
										</LabelWithInfo>
										<Input
											id="repuve"
											value={formData.repuve}
											onChange={(e) =>
												handleInputChange("repuve", e.target.value)
											}
											placeholder="8 caracteres"
											maxLength={8}
										/>
									</div>
									<div className="space-y-2">
										<LabelWithInfo
											htmlFor="plates"
											description={getFieldDescription("plates")}
										>
											Placas
										</LabelWithInfo>
										<Input
											id="plates"
											value={formData.plates}
											onChange={(e) =>
												handleInputChange("plates", e.target.value)
											}
											placeholder="ABC-123-D"
										/>
									</div>
									<div className="space-y-2">
										<LabelWithInfo
											htmlFor="engine-number"
											description={getFieldDescription("engineNumber")}
										>
											Número de motor
										</LabelWithInfo>
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
										<LabelWithInfo
											htmlFor="registration-number"
											description={getFieldDescription("registrationNumber")}
											required
										>
											Número de registro
										</LabelWithInfo>
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
									<CatalogSelector
										catalogKey="countries"
										label="País de bandera"
										labelDescription={getFieldDescription("flagCountryId")}
										value={formData.flagCountryId}
										searchPlaceholder="Buscar país..."
										onChange={(option) =>
											handleInputChange("flagCountryId", option?.id ?? "")
										}
									/>
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
							<CatalogSelector
								catalogKey="currencies"
								label="Moneda"
								labelDescription={getFieldDescription("currency")}
								value={formData.currency}
								required
								searchPlaceholder="Buscar moneda..."
								onChange={(option) =>
									handleInputChange("currency", option?.id ?? "")
								}
							/>
						</div>

						<Separator />

						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<Label>Métodos de Pago *</Label>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={handleAddPaymentMethod}
									className="gap-2"
								>
									<Plus className="h-4 w-4" />
									Agregar Método
								</Button>
							</div>

							{/* Payment methods summary */}
							{formData.paymentMethods.some(
								(pm) => parseFloat(pm.amount) > 0,
							) && (
								<div className="p-3 rounded-lg border bg-muted/30">
									<div className="flex items-center justify-between text-sm">
										<span className="text-muted-foreground">
											Monto total de la transacción (calculado):
										</span>
										<span className="font-medium">
											{new Intl.NumberFormat("es-MX", {
												style: "currency",
												currency: formData.currency,
											}).format(
												formData.paymentMethods.reduce(
													(sum, pm) => sum + (parseFloat(pm.amount) || 0),
													0,
												),
											)}
										</span>
									</div>
								</div>
							)}

							{formData.paymentMethods.map((pm, index) => (
								<div
									key={index}
									className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg"
								>
									<div className="space-y-2">
										<Label htmlFor={`payment-method-${index}`}>
											Método {index + 1} *
										</Label>
										<Select
											value={pm.method}
											onValueChange={(value) =>
												handlePaymentMethodChange(index, "method", value)
											}
											required
										>
											<SelectTrigger id={`payment-method-${index}`}>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="EFECTIVO">Efectivo</SelectItem>
												<SelectItem value="TRANSFERENCIA">
													Transferencia
												</SelectItem>
												<SelectItem value="CHEQUE">Cheque</SelectItem>
												<SelectItem value="FINANCIAMIENTO">
													Financiamiento
												</SelectItem>
											</SelectContent>
										</Select>
									</div>

									<div className="space-y-2">
										<Label htmlFor={`payment-amount-${index}`}>
											Monto {index + 1} *
										</Label>
										<Input
											id={`payment-amount-${index}`}
											type="number"
											value={pm.amount}
											onChange={(e) =>
												handlePaymentMethodChange(
													index,
													"amount",
													e.target.value,
												)
											}
											placeholder="0.00"
											required
											min="0"
											step="0.01"
										/>
									</div>

									<div className="flex items-end">
										{formData.paymentMethods.length > 1 && (
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() => handleRemovePaymentMethod(index)}
												className="gap-2 text-destructive"
											>
												<Trash2 className="h-4 w-4" />
												Eliminar
											</Button>
										)}
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</form>
		</div>
	);
}
