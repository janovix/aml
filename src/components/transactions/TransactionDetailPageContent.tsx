"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
	ArrowLeft,
	FileText,
	AlertTriangle,
	Calendar,
	CreditCard,
	Building2,
	ArrowRightLeft,
	CheckCircle2,
	XCircle,
	Clock,
	Ban,
} from "lucide-react";
import Link from "next/link";
import { mockTransactions } from "@/data/mockTransactions";
import type { Transaction } from "@/types/transaction";
import {
	getTransactionTypeLabel,
	getTransactionStatusLabel,
	getTransactionChannelLabel,
	formatCurrency,
} from "@/types/transaction";
import { cn } from "@/lib/utils";

const statusBadgeStyles: Record<string, string> = {
	COMPLETADA:
		"bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30",
	PENDIENTE:
		"bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
	EN_REVISION:
		"bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
	RECHAZADA: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
	CANCELADA: "bg-muted text-muted-foreground border-muted-foreground/30",
};

const typeBadgeStyles: Record<string, string> = {
	DEPOSITO:
		"bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
	RETIRO:
		"bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30",
	TRANSFERENCIA:
		"bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
	PAGO: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30",
	COBRANZA:
		"bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30",
	OTRO: "bg-muted text-muted-foreground border-muted-foreground/30",
};

const getStatusIcon = (status: string) => {
	switch (status) {
		case "COMPLETADA":
			return (
				<CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
			);
		case "RECHAZADA":
			return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
		case "CANCELADA":
			return <Ban className="h-5 w-5 text-muted-foreground" />;
		case "PENDIENTE":
		case "EN_REVISION":
			return <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
		default:
			return <Clock className="h-5 w-5" />;
	}
};

interface TransactionDetailPageContentProps {
	transactionId: string;
}

export function TransactionDetailPageContent({
	transactionId,
}: TransactionDetailPageContentProps): React.ReactElement {
	const router = useRouter();
	const [transaction, setTransaction] = useState<Transaction | null>(null);
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

	useEffect(() => {
		const foundTransaction = mockTransactions.find(
			(t) => t.id === transactionId,
		);
		setTransaction(foundTransaction || null);
	}, [transactionId]);

	if (!transaction) {
		return (
			<div className="flex h-screen w-full overflow-hidden bg-background">
				<AppSidebar
					collapsed={sidebarCollapsed}
					onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
				/>
				<main className="flex flex-1 min-h-0 min-w-0 w-full flex-col">
					<div className="flex-1 flex items-center justify-center">
						<Card className="w-full max-w-md">
							<CardContent className="pt-6">
								<div className="text-center space-y-4">
									<AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground" />
									<h2 className="text-2xl font-semibold">
										Transacción no encontrada
									</h2>
									<p className="text-muted-foreground">
										La transacción con ID {transactionId} no existe.
									</p>
									<Button
										onClick={() => router.push("/transactions")}
										className="w-full"
									>
										<ArrowLeft className="mr-2 h-4 w-4" />
										Volver a Transacciones
									</Button>
								</div>
							</CardContent>
						</Card>
					</div>
				</main>
			</div>
		);
	}

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
								Transacción {transaction.reference || transaction.id}
							</h1>
							<p className="text-sm text-muted-foreground hidden sm:block truncate">
								Detalles de la transacción
							</p>
						</div>
					</div>
					<Button variant="outline" className="gap-2 shrink-0 ml-2">
						<FileText className="h-4 w-4" />
						<span className="hidden sm:inline">Generar Reporte</span>
					</Button>
				</header>

				<div className="flex-1 min-h-0 overflow-x-hidden overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">
					<div className="max-w-5xl mx-auto space-y-6">
						{/* Header Card */}
						<Card className="border-2">
							<CardHeader className="pb-4">
								<div className="flex items-start justify-between">
									<div className="space-y-2">
										<div className="flex items-center gap-3">
											<CreditCard className="h-8 w-8 text-primary" />
											<div>
												<CardTitle className="text-2xl">
													{formatCurrency(
														transaction.amount,
														transaction.currency,
													)}
												</CardTitle>
												<p className="text-sm text-muted-foreground mt-1">
													{transaction.description || "Sin descripción"}
												</p>
											</div>
										</div>
									</div>
									<div className="flex flex-col gap-2 items-end">
										<Badge
											variant="outline"
											className={cn(
												"font-medium",
												typeBadgeStyles[transaction.type],
											)}
										>
											{getTransactionTypeLabel(transaction.type)}
										</Badge>
										<Badge
											variant="outline"
											className={cn(
												"font-medium",
												statusBadgeStyles[transaction.status],
											)}
										>
											<div className="flex items-center gap-1.5">
												{getStatusIcon(transaction.status)}
												{getTransactionStatusLabel(transaction.status)}
											</div>
										</Badge>
									</div>
								</div>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<p className="text-sm text-muted-foreground mb-1">
											Referencia
										</p>
										<p className="font-medium font-mono">
											{transaction.reference || "N/A"}
										</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground mb-1">Canal</p>
										<p className="font-medium">
											{getTransactionChannelLabel(transaction.channel)}
										</p>
									</div>
									{transaction.riskScore !== undefined && (
										<div>
											<p className="text-sm text-muted-foreground mb-1">
												Puntuación de Riesgo
											</p>
											<p className="font-medium">{transaction.riskScore}/100</p>
										</div>
									)}
								</div>
							</CardContent>
						</Card>

						{/* Client Information */}
						<Card className="shadow-sm">
							<CardHeader className="pb-4">
								<CardTitle className="text-lg flex items-center gap-2">
									<Building2 className="h-5 w-5" />
									Información del Cliente
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div className="flex items-center justify-between">
										<div>
											<p className="text-sm text-muted-foreground">Cliente</p>
											<Link
												href={`/clients/${transaction.clientId}`}
												className="font-medium hover:text-primary hover:underline"
											>
												{transaction.clientName}
											</Link>
										</div>
										<div className="text-right">
											<p className="text-sm text-muted-foreground">RFC</p>
											<p className="font-medium font-mono text-sm">
												{transaction.clientRfc}
											</p>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Account Information */}
						{(transaction.originAccount || transaction.destinationAccount) && (
							<Card className="shadow-sm">
								<CardHeader className="pb-4">
									<CardTitle className="text-lg flex items-center gap-2">
										<ArrowRightLeft className="h-5 w-5" />
										Información de Cuentas
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										{transaction.originAccount && (
											<div>
												<p className="text-sm text-muted-foreground mb-1">
													Cuenta Origen
												</p>
												<p className="font-medium font-mono">
													{transaction.originAccount}
												</p>
											</div>
										)}
										{transaction.destinationAccount && (
											<div>
												<p className="text-sm text-muted-foreground mb-1">
													Cuenta Destino
												</p>
												<p className="font-medium font-mono">
													{transaction.destinationAccount}
												</p>
											</div>
										)}
									</div>
								</CardContent>
							</Card>
						)}

						{/* Status and Dates */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<Card className="shadow-sm">
								<CardHeader className="pb-4">
									<CardTitle className="text-lg flex items-center gap-2">
										<Calendar className="h-5 w-5" />
										Fechas
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<div>
										<p className="text-sm text-muted-foreground mb-1">
											Fecha de Transacción
										</p>
										<p className="font-medium">
											{new Date(transaction.date).toLocaleDateString("es-MX", {
												day: "2-digit",
												month: "long",
												year: "numeric",
												hour: "2-digit",
												minute: "2-digit",
											})}
										</p>
									</div>
									<Separator />
									<div>
										<p className="text-sm text-muted-foreground mb-1">Creada</p>
										<p className="font-medium">
											{new Date(transaction.createdAt).toLocaleDateString(
												"es-MX",
												{
													day: "2-digit",
													month: "long",
													year: "numeric",
													hour: "2-digit",
													minute: "2-digit",
												},
											)}
										</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground mb-1">
											Última Actualización
										</p>
										<p className="font-medium">
											{new Date(transaction.updatedAt).toLocaleDateString(
												"es-MX",
												{
													day: "2-digit",
													month: "long",
													year: "numeric",
													hour: "2-digit",
													minute: "2-digit",
												},
											)}
										</p>
									</div>
								</CardContent>
							</Card>

							<Card className="shadow-sm">
								<CardHeader className="pb-4">
									<CardTitle className="text-lg flex items-center gap-2">
										<AlertTriangle className="h-5 w-5" />
										Avisos
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										<div>
											<p className="text-3xl font-bold">
												{transaction.alertCount}
											</p>
											<p className="text-sm text-muted-foreground">
												avisos activos
											</p>
										</div>
										{transaction.alertCount > 0 && (
											<Button variant="outline" className="w-full">
												<FileText className="mr-2 h-4 w-4" />
												Ver Avisos
											</Button>
										)}
									</div>
								</CardContent>
							</Card>
						</div>

						{/* Additional Information */}
						<Card className="shadow-sm">
							<CardHeader className="pb-4">
								<CardTitle className="text-lg">Información Adicional</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<p className="text-sm text-muted-foreground mb-1">
											ID de Transacción
										</p>
										<p className="font-medium font-mono text-sm">
											{transaction.id}
										</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground mb-1">Moneda</p>
										<p className="font-medium">{transaction.currency}</p>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</main>
		</div>
	);
}
