"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
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
import { Save, Plus, Trash2, Receipt } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { PageHeroSkeleton } from "@/components/skeletons";
import {
	getTransactionById,
	updateTransaction,
} from "../../lib/api/transactions";
import { executeMutation } from "../../lib/mutations";
import { toast } from "sonner";
import type {
	TransactionOperationType,
	TransactionVehicleType,
	TransactionUpdateRequest,
	PaymentMethodInput,
} from "../../types/transaction";
import { CatalogSelector } from "../catalogs/CatalogSelector";
import { LabelWithInfo } from "../ui/LabelWithInfo";
import { getFieldDescription } from "../../lib/field-descriptions";
import { validateVIN } from "../../lib/utils";
import { getVehicleBrandCatalogKey } from "../../lib/vehicle-utils";

interface TransactionEditViewProps {
	transactionId: string;
}

export function TransactionEditView({
	transactionId,
}: TransactionEditViewProps): React.JSX.Element {
	const { navigateTo } = useOrgNavigation();
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [formData, setFormData] = useState({
		clientId: "",
		operationDate: "",
		operationType: "purchase" as TransactionOperationType,
		branchPostalCode: "",
		vehicleType: "land" as TransactionVehicleType,
		brand: "",
		model: "",
		year: "",
		vin: "",
		repuve: "",
		plates: "",
		engineNumber: "",
		registrationNumber: "",
		flagCountryId: "",
		amount: "",
		currency: "MXN",
		paymentMethods: [
			{ method: "EFECTIVO", amount: "" },
		] as PaymentMethodInput[],
		paymentDate: "",
	});

	const [validationErrors, setValidationErrors] = useState<{
		vin?: string;
	}>({});

	useEffect(() => {
		const fetchTransaction = async () => {
			try {
				setIsLoading(true);
				const transaction = await getTransactionById({ id: transactionId });
				setFormData({
					clientId: transaction.clientId,
					operationDate:
						transaction.operationDate.split("T")[0] ||
						transaction.operationDate,
					operationType: transaction.operationType,
					branchPostalCode: transaction.branchPostalCode,
					vehicleType: transaction.vehicleType,
					brand: transaction.brand,
					model: transaction.model,
					year: String(transaction.year),
					vin: transaction.vin || "",
					repuve: transaction.repuve || "",
					plates: transaction.plates || "",
					engineNumber: transaction.engineNumber || "",
					registrationNumber: transaction.registrationNumber || "",
					flagCountryId: transaction.flagCountryId || "",
					amount: transaction.amount,
					currency: transaction.currency,
					paymentMethods: transaction.paymentMethods.map((pm) => ({
						method: pm.method,
						amount: pm.amount,
					})),
					paymentDate:
						transaction.paymentDate.split("T")[0] || transaction.paymentDate,
				});
			} catch (error) {
				console.error("Error fetching transaction:", error);
				toast.error("No se pudo cargar la transacción.");
				navigateTo("/transactions");
			} finally {
				setIsLoading(false);
			}
		};
		fetchTransaction();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [transactionId]);

	const validatePaymentMethods = (): boolean => {
		const totalAmount = parseFloat(formData.amount) || 0;
		const paymentMethodsSum = formData.paymentMethods.reduce(
			(sum, pm) => sum + (parseFloat(pm.amount) || 0),
			0,
		);

		if (paymentMethodsSum > totalAmount) {
			toast.error(
				`La suma de los métodos de pago (${paymentMethodsSum.toFixed(2)}) excede el monto total de la transacción (${totalAmount.toFixed(2)}).`,
			);
			return false;
		}
		return true;
	};

	const validateLandVehicleFields = (): boolean => {
		if (formData.vehicleType === "land") {
			const hasPlates = formData.plates && formData.plates.trim().length > 0;
			const hasVIN = formData.vin && formData.vin.trim().length > 0;
			const hasEngineNumber =
				formData.engineNumber && formData.engineNumber.trim().length > 0;

			// Validate VIN format if provided
			if (hasVIN) {
				const vinValidation = validateVIN(formData.vin || "");
				if (!vinValidation.isValid) {
					setValidationErrors({ vin: vinValidation.error });
					toast.error(vinValidation.error);
					return false;
				}
			}

			if (!hasPlates && !hasVIN && !hasEngineNumber) {
				toast.error(
					"Para vehículos terrestres, debe proporcionar al menos uno de: Placas, VIN o Número de motor.",
				);
				return false;
			}
		}
		return true;
	};

	const handleSubmit = async (e: React.FormEvent): Promise<void> => {
		e.preventDefault();

		if (!validatePaymentMethods()) {
			return;
		}

		if (!validateLandVehicleFields()) {
			return;
		}

		setIsSaving(true);
		// Format operationDate as date-only (YYYY-MM-DD) - API expects this format, not ISO date-time
		const operationDateFormatted =
			formData.operationDate || new Date().toISOString().slice(0, 10);
		const updateData: TransactionUpdateRequest = {
			operationDate: operationDateFormatted,
			operationType: formData.operationType,
			branchPostalCode: formData.branchPostalCode,
			vehicleType: formData.vehicleType,
			brand: formData.brand,
			model: formData.model,
			year: parseInt(formData.year, 10),
			amount: formData.amount,
			currency: formData.currency,
			paymentMethods: formData.paymentMethods,
			paymentDate: new Date(formData.paymentDate).toISOString(),
		};

		if (formData.vehicleType === "land") {
			// At least one of plates, VIN, or engineNumber must be provided
			if (formData.vin) updateData.vin = formData.vin;
			if (formData.repuve) updateData.repuve = formData.repuve;
			if (formData.plates) updateData.plates = formData.plates;
			if (formData.engineNumber)
				updateData.engineNumber = formData.engineNumber;
		} else {
			if (formData.registrationNumber)
				updateData.registrationNumber = formData.registrationNumber;
			if (formData.flagCountryId)
				updateData.flagCountryId = formData.flagCountryId;
		}

		try {
			await executeMutation({
				mutation: () =>
					updateTransaction({ id: transactionId, input: updateData }),
				loading: "Actualizando transacción...",
				success: "Transacción actualizada exitosamente",
				onSuccess: () => {
					navigateTo(`/transactions/${transactionId}`);
				},
			});
		} catch {
			// Error is already handled by executeMutation via Sonner
		} finally {
			setIsSaving(false);
		}
	};

	const handleCancel = (): void => {
		navigateTo(`/transactions/${transactionId}`);
	};

	const handleChange = (field: string, value: string): void => {
		setFormData((prev) => {
			// When vehicle type changes, reset the brand since catalogs are different
			if (field === "vehicleType" && prev.vehicleType !== value) {
				return {
					...prev,
					vehicleType: value as TransactionVehicleType,
					brand: "",
				};
			}
			return { ...prev, [field]: value } as typeof prev;
		});
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

	const isSaveDisabled =
		isLoading ||
		isSaving ||
		formData.paymentMethods.reduce(
			(sum, pm) => sum + (parseFloat(pm.amount) || 0),
			0,
		) > (parseFloat(formData.amount) || 0);

	if (isLoading) {
		return (
			<div className="space-y-6">
				<PageHeroSkeleton
					showStats={false}
					showBackButton={true}
					actionCount={2}
				/>
				{/* Form skeleton */}
				<div className="space-y-6">
					{[1, 2, 3].map((i) => (
						<Card key={i}>
							<CardHeader>
								<div className="h-6 w-48 bg-accent animate-pulse rounded" />
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									{[1, 2, 3, 4].map((j) => (
										<div key={j} className="space-y-2">
											<div className="h-4 w-24 bg-accent animate-pulse rounded" />
											<div className="h-10 w-full bg-accent animate-pulse rounded" />
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<PageHero
				title="Editar Transacción"
				subtitle={transactionId}
				icon={Receipt}
				backButton={{
					label: "Volver",
					onClick: handleCancel,
				}}
				actions={[
					{
						label: isSaving ? "Guardando..." : "Guardar Cambios",
						icon: Save,
						onClick: () => {
							void handleSubmit({
								preventDefault: () => {},
							} as React.FormEvent);
						},
						disabled: isSaveDisabled,
					},
					{
						label: "Cancelar",
						onClick: handleCancel,
						variant: "outline",
					},
				]}
			/>

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
									onValueChange={(value) => handleChange("clientId", value)}
									required
								>
									<SelectTrigger id="client">
										<SelectValue />
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
										handleChange("operationDate", e.target.value)
									}
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="operation-type">Tipo de operación *</Label>
								<Select
									value={formData.operationType}
									onValueChange={(value) =>
										handleChange("operationType", value)
									}
									required
								>
									<SelectTrigger id="operation-type">
										<SelectValue />
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
										handleChange("branchPostalCode", e.target.value)
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
								onValueChange={(value) => handleChange("vehicleType", value)}
								required
							>
								<SelectTrigger id="vehicle-type">
									<SelectValue />
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
								catalogKey={getVehicleBrandCatalogKey(formData.vehicleType)}
								label="Marca"
								labelDescription={getFieldDescription("brand")}
								value={formData.brand}
								searchPlaceholder="Buscar marca..."
								required
								onChange={(option) => handleChange("brand", option?.id ?? "")}
							/>

							<div className="space-y-2">
								<Label htmlFor="model">Modelo *</Label>
								<Input
									id="model"
									value={formData.model}
									onChange={(e) => handleChange("model", e.target.value)}
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
									onChange={(e) => handleChange("year", e.target.value)}
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
											onChange={(e) => {
												handleChange("vin", e.target.value);
												// Clear error when user starts typing
												if (validationErrors.vin) {
													setValidationErrors((prev) => ({
														...prev,
														vin: undefined,
													}));
												}
											}}
											placeholder="17 caracteres"
											maxLength={17}
											className={
												validationErrors.vin ? "border-destructive" : ""
											}
										/>
										{validationErrors.vin ? (
											<p className="text-xs text-destructive">
												{validationErrors.vin}
											</p>
										) : (
											<p className="text-xs text-muted-foreground">
												17 caracteres alfanuméricos (excluyendo I, O, Q)
											</p>
										)}
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
											onChange={(e) => handleChange("repuve", e.target.value)}
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
											onChange={(e) => handleChange("plates", e.target.value)}
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
												handleChange("engineNumber", e.target.value)
											}
											placeholder="Número de motor"
										/>
									</div>
									<div className="col-span-full">
										<p className="text-sm text-muted-foreground">
											<strong>Nota:</strong> Para vehículos terrestres, debe
											proporcionar al menos uno de: Placas, VIN o Número de
											motor.
										</p>
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
												handleChange("registrationNumber", e.target.value)
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
											handleChange("flagCountryId", option?.id ?? "")
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
							<div className="space-y-2">
								<Label htmlFor="amount">Monto *</Label>
								<Input
									id="amount"
									type="number"
									value={formData.amount}
									onChange={(e) => handleChange("amount", e.target.value)}
									placeholder="0.00"
									required
									min="0"
									step="0.01"
								/>
							</div>

							<CatalogSelector
								catalogKey="currencies"
								label="Moneda"
								labelDescription={getFieldDescription("currency")}
								value={formData.currency}
								required
								searchPlaceholder="Buscar moneda..."
								onChange={(option) =>
									handleChange("currency", option?.id ?? "")
								}
							/>

							<div className="space-y-2">
								<Label htmlFor="payment-date">Fecha de pago *</Label>
								<Input
									id="payment-date"
									type="datetime-local"
									value={formData.paymentDate}
									onChange={(e) => handleChange("paymentDate", e.target.value)}
									required
								/>
							</div>
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
							{formData.amount && (
								<div className="p-3 rounded-lg border bg-muted/30">
									<div className="flex items-center justify-between text-sm">
										<span className="text-muted-foreground">
											Monto total de la transacción:
										</span>
										<span className="font-medium">
											{new Intl.NumberFormat("es-MX", {
												style: "currency",
												currency: formData.currency,
											}).format(parseFloat(formData.amount) || 0)}
										</span>
									</div>
									<div className="flex items-center justify-between text-sm mt-2">
										<span className="text-muted-foreground">
											Suma de métodos de pago:
										</span>
										<span
											className={`font-medium ${
												formData.paymentMethods.reduce(
													(sum, pm) => sum + (parseFloat(pm.amount) || 0),
													0,
												) > (parseFloat(formData.amount) || 0)
													? "text-destructive"
													: "text-foreground"
											}`}
										>
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
									{formData.paymentMethods.reduce(
										(sum, pm) => sum + (parseFloat(pm.amount) || 0),
										0,
									) > (parseFloat(formData.amount) || 0) && (
										<p className="text-xs text-destructive mt-2">
											⚠️ La suma de los métodos de pago excede el monto total
										</p>
									)}
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
