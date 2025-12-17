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
import { AppSidebar } from "../layout/AppSidebar";
import { ArrowLeft, Save, X, Menu } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import type {
	TransactionType,
	VehicleType,
	PaymentMethod,
} from "../../types/transaction";
import { CatalogSelector } from "../catalogs/CatalogSelector";

interface TransactionFormData {
	clientId: string;
	date: string;
	transactionType: TransactionType | "";
	branch: string;
	vehicleType: VehicleType | "";
	brand: string;
	model: string;
	year: string;
	serialNumber: string;
	plates?: string;
	engineNumber?: string;
	registrationNumber?: string;
	flagCountry?: string;
	amount: string;
	currency: string;
	paymentMethod: PaymentMethod | "";
	paymentDate: string;
}

export function TransactionCreateView(): React.JSX.Element {
	const router = useRouter();
	const { toast } = useToast();
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	const [formData, setFormData] = useState<TransactionFormData>({
		clientId: "",
		date: new Date().toISOString().split("T")[0],
		transactionType: "",
		branch: "",
		vehicleType: "",
		brand: "",
		model: "",
		year: "",
		serialNumber: "",
		plates: "",
		engineNumber: "",
		registrationNumber: "",
		flagCountry: "México",
		amount: "",
		currency: "MXN",
		paymentMethod: "",
		paymentDate: new Date().toISOString().split("T")[0],
	});

	const handleInputChange = (
		field: keyof TransactionFormData,
		value: string,
	): void => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleSubmit = (e: React.FormEvent): void => {
		e.preventDefault();

		toast({
			title: "Transacción creada",
			description: "La nueva transacción se ha registrado exitosamente.",
		});

		router.push("/transactions");
	};

	const handleCancel = (): void => {
		router.push("/transactions");
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
									Nueva Transacción
								</h1>
								<p className="text-sm text-muted-foreground leading-relaxed">
									Registrar una nueva transacción
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
								<span className="hidden sm:inline">Crear Transacción</span>
							</Button>
						</div>
					</div>
				</header>

				<div className="flex-1 min-h-0 overflow-y-auto p-6">
					<form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
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
										<Label htmlFor="transaction-date">
											Fecha de transacción *
										</Label>
										<Input
											id="transaction-date"
											type="date"
											value={formData.date}
											onChange={(e) =>
												handleInputChange("date", e.target.value)
											}
											required
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="transaction-type">
											Tipo de transacción *
										</Label>
										<Select
											value={formData.transactionType}
											onValueChange={(value) =>
												handleInputChange("transactionType", value)
											}
											required
										>
											<SelectTrigger id="transaction-type">
												<SelectValue placeholder="Seleccionar tipo" />
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
											onChange={(e) =>
												handleInputChange("branch", e.target.value)
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
								<CardTitle className="text-lg">
									Información del Vehículo
								</CardTitle>
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
										onChange={(option) =>
											handleInputChange("brand", option?.name ?? "")
										}
									/>

									<div className="space-y-2">
										<Label htmlFor="model">Modelo *</Label>
										<Input
											id="model"
											value={formData.model}
											onChange={(e) =>
												handleInputChange("model", e.target.value)
											}
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
											onChange={(e) =>
												handleInputChange("year", e.target.value)
											}
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

									{formData.vehicleType === "TERRESTRE" && (
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
														handleInputChange(
															"registrationNumber",
															e.target.value,
														)
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
														handleInputChange("flagCountry", e.target.value)
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
											onChange={(e) =>
												handleInputChange("amount", e.target.value)
											}
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
												<SelectItem value="USD">
													USD - Dólar Americano
												</SelectItem>
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
										<Label htmlFor="payment-date">Fecha de pago *</Label>
										<Input
											id="payment-date"
											type="date"
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
			</main>
		</div>
	);
}
