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
import { mockTransactions } from "../../data/mockTransactions";
import { CatalogSelector } from "../catalogs/CatalogSelector";

interface TransactionEditViewProps {
	transactionId: string;
}

export function TransactionEditView({
	transactionId,
}: TransactionEditViewProps): React.JSX.Element {
	const router = useRouter();
	const { toast } = useToast();

	const transaction =
		mockTransactions.find((item) => item.id === transactionId) ||
		mockTransactions[0];
	const [formData, setFormData] = useState({
		clientId: transaction.clientId,
		date: transaction.date,
		transactionType: transaction.transactionType,
		branch: transaction.branch,
		vehicleType: transaction.vehicleType,
		brand: transaction.brand,
		model: transaction.model,
		year: transaction.year,
		serialNumber: transaction.serialNumber,
		plates: transaction.plates || "",
		engineNumber: transaction.engineNumber || "",
		registrationNumber: transaction.registrationNumber || "",
		flagCountry: transaction.flagCountry || "México",
		amount: transaction.amount.replace(/[^0-9.]/g, ""),
		currency: transaction.currency,
		paymentMethod: transaction.paymentMethod,
		paymentDate: transaction.paymentDate,
	});

	const handleSubmit = (e: React.FormEvent): void => {
		e.preventDefault();
		toast({
			title: "Transacción actualizada",
			description: "Los cambios han sido guardados exitosamente.",
		});
		router.push(`/transactions/${transactionId}`);
	};

	const handleCancel = (): void => {
		router.push(`/transactions/${transactionId}`);
	};

	const handleChange = (field: string, value: string): void => {
		setFormData((prev) => ({ ...prev, [field]: value }));
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
							Editar Transacción
						</h1>
						<p className="text-sm text-muted-foreground">{transaction.id}</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm" onClick={handleCancel}>
						Cancelar
					</Button>
					<Button size="sm" className="gap-2" onClick={handleSubmit}>
						<Save className="h-4 w-4" />
						<span className="hidden sm:inline">Guardar Cambios</span>
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
								<Label htmlFor="transaction-date">Fecha de transacción *</Label>
								<Input
									id="transaction-date"
									type="date"
									value={formData.date}
									onChange={(e) => handleChange("date", e.target.value)}
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="transaction-type">Tipo de transacción *</Label>
								<Select
									value={formData.transactionType}
									onValueChange={(value) =>
										handleChange("transactionType", value)
									}
									required
								>
									<SelectTrigger id="transaction-type">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="COMPRA">Compra</SelectItem>
										<SelectItem value="VENTA">Venta</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label htmlFor="branch">Sucursal (Código Postal) *</Label>
								<Input
									id="branch"
									value={formData.branch}
									onChange={(e) => handleChange("branch", e.target.value)}
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
									<SelectItem value="TERRESTRE">Terrestre</SelectItem>
									<SelectItem value="MARITIMO">Marítimo</SelectItem>
									<SelectItem value="AEREO">Aéreo</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<Separator />

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<CatalogSelector
								catalogKey="vehicle-brands"
								label="Marca"
								value={formData.brand}
								required
								searchPlaceholder="Buscar marca..."
								onChange={(option) => handleChange("brand", option?.name ?? "")}
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

							<div className="space-y-2">
								<Label htmlFor="serial-number">Número de serie *</Label>
								<Input
									id="serial-number"
									value={formData.serialNumber}
									onChange={(e) => handleChange("serialNumber", e.target.value)}
									placeholder="VIN o número de serie"
									required
								/>
							</div>

							{formData.vehicleType === "TERRESTRE" && (
								<>
									<div className="space-y-2">
										<Label htmlFor="plates">Placas *</Label>
										<Input
											id="plates"
											value={formData.plates}
											onChange={(e) => handleChange("plates", e.target.value)}
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
												handleChange("engineNumber", e.target.value)
											}
											placeholder="Opcional"
										/>
									</div>
								</>
							)}

							{(formData.vehicleType === "MARITIMO" ||
								formData.vehicleType === "AEREO") && (
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
									<div className="space-y-2">
										<Label htmlFor="flag-country">País de bandera</Label>
										<Input
											id="flag-country"
											value={formData.flagCountry}
											onChange={(e) =>
												handleChange("flagCountry", e.target.value)
											}
											placeholder="México"
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
									onChange={(e) => handleChange("amount", e.target.value)}
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
									onValueChange={(value) => handleChange("currency", value)}
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
										handleChange("paymentMethod", value)
									}
									required
								>
									<SelectTrigger id="payment-method">
										<SelectValue />
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
									type="date"
									value={formData.paymentDate}
									onChange={(e) => handleChange("paymentDate", e.target.value)}
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
