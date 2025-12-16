"use client";

import { useState } from "react";
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
	TransactionType,
	TransactionStatus,
	TransactionChannel,
} from "@/types/transaction";

export function TransactionNewPageContent(): React.ReactElement {
	const router = useRouter();
	const { toast } = useToast();
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [formData, setFormData] = useState<{
		clientId: string;
		amount: string;
		currency: string;
		type: TransactionType | "";
		status: TransactionStatus | "";
		channel: TransactionChannel | "";
		date: string;
		description: string;
		reference: string;
		originAccount: string;
		destinationAccount: string;
	}>({
		clientId: "",
		amount: "",
		currency: "MXN",
		type: "",
		status: "",
		channel: "",
		date: new Date().toISOString().split("T")[0],
		description: "",
		reference: "",
		originAccount: "",
		destinationAccount: "",
	});
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent): Promise<void> => {
		e.preventDefault();
		setLoading(true);

		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 500));

		toast({
			title: "Transacción creada",
			description: "La transacción se ha registrado exitosamente.",
		});

		setLoading(false);
		router.push("/transactions");
	};

	const handleChange = (field: string, value: string): void => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

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
							onClick={() => router.push("/transactions")}
							className="shrink-0"
						>
							<ArrowLeft className="h-5 w-5" />
						</Button>
						<div className="min-w-0">
							<h1 className="text-xl font-semibold text-foreground truncate">
								Nueva Transacción
							</h1>
							<p className="text-sm text-muted-foreground hidden sm:block truncate">
								Registrar una nueva transacción en el sistema
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
												<Label htmlFor="clientId">Cliente *</Label>
												<Select
													value={formData.clientId}
													onValueChange={(value) =>
														handleChange("clientId", value)
													}
												>
													<SelectTrigger id="clientId">
														<SelectValue placeholder="Seleccionar cliente" />
													</SelectTrigger>
													<SelectContent>
														{mockClients.map((client) => (
															<SelectItem key={client.id} value={client.id}>
																{client.personType === "FISICA"
																	? `${client.firstName} ${client.lastName} ${client.secondLastName || ""}`.trim()
																	: client.businessName}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
											<div className="space-y-2">
												<Label htmlFor="reference">Referencia</Label>
												<Input
													id="reference"
													value={formData.reference}
													onChange={(e) =>
														handleChange("reference", e.target.value)
													}
												/>
											</div>
										</div>

										<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
											<div className="space-y-2">
												<Label htmlFor="amount">Monto *</Label>
												<Input
													id="amount"
													type="number"
													step="0.01"
													min="0"
													value={formData.amount}
													onChange={(e) =>
														handleChange("amount", e.target.value)
													}
													required
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="currency">Moneda *</Label>
												<Select
													value={formData.currency}
													onValueChange={(value) =>
														handleChange("currency", value)
													}
												>
													<SelectTrigger id="currency">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="MXN">
															MXN - Peso Mexicano
														</SelectItem>
														<SelectItem value="USD">
															USD - Dólar Estadounidense
														</SelectItem>
														<SelectItem value="EUR">EUR - Euro</SelectItem>
													</SelectContent>
												</Select>
											</div>
											<div className="space-y-2">
												<Label htmlFor="date">Fecha *</Label>
												<Input
													id="date"
													type="date"
													value={formData.date}
													onChange={(e) => handleChange("date", e.target.value)}
													required
												/>
											</div>
										</div>

										<div className="space-y-2">
											<Label htmlFor="description">Descripción</Label>
											<Input
												id="description"
												value={formData.description}
												onChange={(e) =>
													handleChange("description", e.target.value)
												}
												placeholder="Descripción de la transacción"
											/>
										</div>
									</CardContent>
								</Card>

								{/* Type and Status */}
								<Card className="shadow-sm">
									<CardHeader className="pb-4">
										<CardTitle>Tipo y Estado</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
											<div className="space-y-2">
												<Label htmlFor="type">Tipo de Transacción *</Label>
												<Select
													value={formData.type}
													onValueChange={(value) =>
														handleChange("type", value as TransactionType)
													}
												>
													<SelectTrigger id="type">
														<SelectValue placeholder="Seleccionar tipo" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="DEPOSITO">Depósito</SelectItem>
														<SelectItem value="RETIRO">Retiro</SelectItem>
														<SelectItem value="TRANSFERENCIA">
															Transferencia
														</SelectItem>
														<SelectItem value="PAGO">Pago</SelectItem>
														<SelectItem value="COBRANZA">Cobranza</SelectItem>
														<SelectItem value="OTRO">Otro</SelectItem>
													</SelectContent>
												</Select>
											</div>
											<div className="space-y-2">
												<Label htmlFor="status">Estado *</Label>
												<Select
													value={formData.status}
													onValueChange={(value) =>
														handleChange("status", value as TransactionStatus)
													}
												>
													<SelectTrigger id="status">
														<SelectValue placeholder="Seleccionar estado" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="PENDIENTE">Pendiente</SelectItem>
														<SelectItem value="COMPLETADA">
															Completada
														</SelectItem>
														<SelectItem value="EN_REVISION">
															En Revisión
														</SelectItem>
														<SelectItem value="RECHAZADA">Rechazada</SelectItem>
														<SelectItem value="CANCELADA">Cancelada</SelectItem>
													</SelectContent>
												</Select>
											</div>
											<div className="space-y-2">
												<Label htmlFor="channel">Canal *</Label>
												<Select
													value={formData.channel}
													onValueChange={(value) =>
														handleChange("channel", value as TransactionChannel)
													}
												>
													<SelectTrigger id="channel">
														<SelectValue placeholder="Seleccionar canal" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="BANCA_EN_LINEA">
															Banca en Línea
														</SelectItem>
														<SelectItem value="CAJERO_AUTOMATICO">
															Cajero Automático
														</SelectItem>
														<SelectItem value="SUCURSAL">Sucursal</SelectItem>
														<SelectItem value="MOVIL">Móvil</SelectItem>
														<SelectItem value="TRANSFERENCIA_ELECTRONICA">
															Transferencia Electrónica
														</SelectItem>
														<SelectItem value="OTRO">Otro</SelectItem>
													</SelectContent>
												</Select>
											</div>
										</div>
									</CardContent>
								</Card>

								{/* Account Information */}
								<Card className="shadow-sm">
									<CardHeader className="pb-4">
										<CardTitle>Información de Cuentas</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label htmlFor="originAccount">Cuenta Origen</Label>
												<Input
													id="originAccount"
													value={formData.originAccount}
													onChange={(e) =>
														handleChange("originAccount", e.target.value)
													}
													placeholder="****1234"
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="destinationAccount">
													Cuenta Destino
												</Label>
												<Input
													id="destinationAccount"
													value={formData.destinationAccount}
													onChange={(e) =>
														handleChange("destinationAccount", e.target.value)
													}
													placeholder="****5678"
												/>
											</div>
										</div>
									</CardContent>
								</Card>

								{/* Actions */}
								<div className="flex justify-end gap-3">
									<Button
										type="button"
										variant="outline"
										onClick={() => router.push("/transactions")}
									>
										Cancelar
									</Button>
									<Button type="submit" disabled={loading}>
										<Save className="mr-2 h-4 w-4" />
										{loading ? "Creando..." : "Crear Transacción"}
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
