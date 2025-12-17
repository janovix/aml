"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Badge,
	Separator,
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@algtools/ui";
import { AppSidebar } from "../layout/AppSidebar";
import { ArrowLeft, Edit, Flag, Download, Trash2, X, Menu } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { mockTransactions } from "../../data/mockTransactions";
import type {
	TransactionType,
	VehicleType,
	PaymentMethod,
	TransactionStatus,
} from "../../types/transaction";

const transactionTypeLabels: Record<TransactionType, string> = {
	COMPRA: "Compra",
	VENTA: "Venta",
};

const vehicleTypeLabels: Record<VehicleType, string> = {
	TERRESTRE: "Terrestre",
	MARITIMO: "Marítimo",
	AEREO: "Aéreo",
};

const paymentMethodLabels: Record<PaymentMethod, string> = {
	EFECTIVO: "Efectivo",
	TRANSFERENCIA: "Transferencia",
	CHEQUE: "Cheque",
	FINANCIAMIENTO: "Financiamiento",
};

const statusLabels: Record<TransactionStatus, string> = {
	COMPLETADA: "Completada",
	PENDIENTE: "Pendiente",
	EN_REVISION: "En Revisión",
};

interface TransactionDetailsViewProps {
	transactionId: string;
}

export function TransactionDetailsView({
	transactionId,
}: TransactionDetailsViewProps): React.JSX.Element {
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const router = useRouter();
	const { toast } = useToast();

	const transaction =
		mockTransactions.find((item) => item.id === transactionId) ||
		mockTransactions[0];

	const formatDate = (dateString: string): string => {
		return new Date(dateString).toLocaleDateString("es-MX", {
			day: "2-digit",
			month: "long",
			year: "numeric",
		});
	};

	const handleToggleRiskFlag = (): void => {
		toast({
			title: transaction.riskFlag
				? "Marca removida"
				: "Transacción marcada como sospechosa",
			description: `La transacción ${transaction.id} ha sido ${transaction.riskFlag ? "desmarcada" : "marcada"}.`,
		});
	};

	const handleExport = (): void => {
		toast({
			title: "Exportación exitosa",
			description: `La transacción ${transaction.id} ha sido exportada.`,
		});
	};

	const handleDelete = (): void => {
		toast({
			title: "Transacción eliminada",
			description: `La transacción ${transaction.id} ha sido eliminada.`,
			variant: "destructive",
		});
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

			<main className="flex flex-1 min-h-0 w-full flex-col">
				<header className="sticky top-0 z-10 border-b bg-background">
					<div className="flex h-16 items-center justify-between px-6">
						<div className="flex items-center gap-4">
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
								onClick={() => router.push("/transactions")}
							>
								<ArrowLeft className="h-4 w-4" />
								Volver
							</Button>
							<Separator orientation="vertical" className="h-6" />
							<div>
								<h1 className="text-xl font-semibold text-foreground">
									{transaction.id}
								</h1>
								<p className="text-sm text-muted-foreground">
									Detalles de la transacción
								</p>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								className="gap-2 bg-transparent hidden sm:flex"
								onClick={() =>
									router.push(`/transactions/${transaction.id}/edit`)
								}
							>
								<Edit className="h-4 w-4" />
								Editar
							</Button>
							<Button
								variant="outline"
								size="sm"
								className="gap-2 bg-transparent hidden sm:flex"
								onClick={handleToggleRiskFlag}
							>
								<Flag className="h-4 w-4" />
								{transaction.riskFlag ? "Desmarcar" : "Marcar"}
							</Button>
							<Button
								variant="outline"
								size="sm"
								className="gap-2 bg-transparent hidden sm:flex"
								onClick={handleExport}
							>
								<Download className="h-4 w-4" />
								Exportar
							</Button>
							<Button
								variant="outline"
								size="sm"
								className="gap-2 text-destructive hover:text-destructive bg-transparent"
								onClick={() => setDeleteDialogOpen(true)}
							>
								<Trash2 className="h-4 w-4" />
								<span className="hidden sm:inline">Eliminar</span>
							</Button>
						</div>
					</div>
				</header>

				<div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
					<div className="grid gap-6 md:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle>Información de la Transacción</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<p className="text-sm font-medium text-muted-foreground">
										Fecha
									</p>
									<p className="text-base font-medium mt-1">
										{formatDate(transaction.date)}
									</p>
								</div>
								<Separator />
								<div>
									<p className="text-sm font-medium text-muted-foreground">
										Cliente
									</p>
									<p className="text-base font-medium mt-1">
										{transaction.clientName}
									</p>
								</div>
								<Separator />
								<div className="grid grid-cols-2 gap-4">
									<div>
										<p className="text-sm font-medium text-muted-foreground">
											Tipo de Transacción
										</p>
										<Badge
											variant={
												transaction.transactionType === "COMPRA"
													? "default"
													: "secondary"
											}
											className="mt-1"
										>
											{transactionTypeLabels[transaction.transactionType]}
										</Badge>
									</div>
									<div>
										<p className="text-sm font-medium text-muted-foreground">
											Sucursal
										</p>
										<p className="text-base font-medium mt-1">
											{transaction.branch}
										</p>
									</div>
								</div>
								<Separator />
								<div className="grid grid-cols-2 gap-4">
									<div>
										<p className="text-sm font-medium text-muted-foreground">
											Estado
										</p>
										<Badge
											variant={
												transaction.status === "COMPLETADA"
													? "default"
													: transaction.status === "EN_REVISION"
														? "destructive"
														: "secondary"
											}
											className="mt-1"
										>
											{statusLabels[transaction.status]}
										</Badge>
									</div>
									<div>
										<p className="text-sm font-medium text-muted-foreground">
											Marca de Riesgo
										</p>
										<Badge
											variant={
												transaction.riskFlag ? "destructive" : "secondary"
											}
											className="mt-1"
										>
											{transaction.riskFlag ? "Sospechosa" : "Normal"}
										</Badge>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Información de Pago</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<p className="text-sm font-medium text-muted-foreground">
										Monto
									</p>
									<p className="text-3xl font-bold mt-1">
										{transaction.amount}
									</p>
									<p className="text-xs text-muted-foreground mt-1">
										{transaction.currency}
									</p>
								</div>
								<Separator />
								<div>
									<p className="text-sm font-medium text-muted-foreground">
										Método de Pago
									</p>
									<Badge variant="secondary" className="mt-1">
										{paymentMethodLabels[transaction.paymentMethod]}
									</Badge>
								</div>
								<Separator />
								<div>
									<p className="text-sm font-medium text-muted-foreground">
										Fecha de Pago
									</p>
									<p className="text-base font-medium mt-1">
										{formatDate(transaction.paymentDate)}
									</p>
								</div>
							</CardContent>
						</Card>

						<Card className="md:col-span-2">
							<CardHeader>
								<CardTitle>Información del Vehículo</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid gap-4 md:grid-cols-3">
									<div>
										<p className="text-sm font-medium text-muted-foreground">
											Tipo de Vehículo
										</p>
										<Badge variant="outline" className="mt-1">
											{vehicleTypeLabels[transaction.vehicleType]}
										</Badge>
									</div>
									<div className="md:col-span-2">
										<p className="text-sm font-medium text-muted-foreground">
											Vehículo
										</p>
										<p className="text-lg font-medium mt-1">
											{transaction.vehicle}
										</p>
									</div>
								</div>
								<Separator />
								<div className="grid gap-4 md:grid-cols-3">
									<div>
										<p className="text-sm font-medium text-muted-foreground">
											Marca
										</p>
										<p className="text-base font-medium mt-1">
											{transaction.brand}
										</p>
									</div>
									<div>
										<p className="text-sm font-medium text-muted-foreground">
											Modelo
										</p>
										<p className="text-base font-medium mt-1">
											{transaction.model}
										</p>
									</div>
									<div>
										<p className="text-sm font-medium text-muted-foreground">
											Año
										</p>
										<p className="text-base font-medium mt-1">
											{transaction.year}
										</p>
									</div>
								</div>
								<Separator />
								<div className="grid gap-4 md:grid-cols-2">
									<div>
										<p className="text-sm font-medium text-muted-foreground">
											Número de Serie
										</p>
										<p className="text-base font-mono mt-1">
											{transaction.serialNumber}
										</p>
									</div>
									{transaction.plates && (
										<div>
											<p className="text-sm font-medium text-muted-foreground">
												Placas
											</p>
											<p className="text-base font-mono mt-1">
												{transaction.plates}
											</p>
										</div>
									)}
									{transaction.engineNumber && (
										<div>
											<p className="text-sm font-medium text-muted-foreground">
												Número de Motor
											</p>
											<p className="text-base font-mono mt-1">
												{transaction.engineNumber}
											</p>
										</div>
									)}
									{transaction.registrationNumber && (
										<div>
											<p className="text-sm font-medium text-muted-foreground">
												Número de Registro
											</p>
											<p className="text-base font-mono mt-1">
												{transaction.registrationNumber}
											</p>
										</div>
									)}
									{transaction.flagCountry && (
										<div>
											<p className="text-sm font-medium text-muted-foreground">
												País de Bandera
											</p>
											<p className="text-base font-medium mt-1">
												{transaction.flagCountry}
											</p>
										</div>
									)}
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</main>

			<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>¿Eliminar transacción?</AlertDialogTitle>
						<AlertDialogDescription>
							Esta acción no se puede deshacer. La transacción {transaction.id}{" "}
							será eliminada permanentemente del sistema.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Eliminar
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
