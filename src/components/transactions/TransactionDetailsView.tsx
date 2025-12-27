"use client";

import { useState, useEffect } from "react";
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
import { ArrowLeft, Edit, Download, Trash2 } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import {
	getTransactionById,
	deleteTransaction,
} from "../../lib/api/transactions";
import type { Transaction } from "../../types/transaction";

const operationTypeLabels: Record<Transaction["operationType"], string> = {
	purchase: "Compra",
	sale: "Venta",
};

const vehicleTypeLabels: Record<Transaction["vehicleType"], string> = {
	land: "Terrestre",
	marine: "Marítimo",
	air: "Aéreo",
};

const paymentMethodLabels: Record<string, string> = {
	EFECTIVO: "Efectivo",
	TRANSFERENCIA: "Transferencia",
	CHEQUE: "Cheque",
	FINANCIAMIENTO: "Financiamiento",
};

interface TransactionDetailsViewProps {
	transactionId: string;
}

export function TransactionDetailsView({
	transactionId,
}: TransactionDetailsViewProps): React.JSX.Element {
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [transaction, setTransaction] = useState<Transaction | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const router = useRouter();
	const { toast } = useToast();

	useEffect(() => {
		const fetchTransaction = async () => {
			try {
				setIsLoading(true);
				const data = await getTransactionById({ id: transactionId });
				setTransaction(data);
			} catch (error) {
				console.error("Error fetching transaction:", error);
				toast({
					title: "Error",
					description: "No se pudo cargar la transacción.",
					variant: "destructive",
				});
				router.push("/transactions");
			} finally {
				setIsLoading(false);
			}
		};
		fetchTransaction();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [transactionId]);

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<Button
						variant="ghost"
						size="sm"
						className="gap-2"
						onClick={() => router.push("/transactions")}
					>
						<ArrowLeft className="h-4 w-4" />
						Volver
					</Button>
					<Separator orientation="vertical" className="h-6" />
					<div>
						<h1 className="text-xl font-semibold text-foreground">
							Cargando...
						</h1>
					</div>
				</div>
			</div>
		);
	}

	if (!transaction) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<Button
						variant="ghost"
						size="sm"
						className="gap-2"
						onClick={() => router.push("/transactions")}
					>
						<ArrowLeft className="h-4 w-4" />
						Volver
					</Button>
					<Separator orientation="vertical" className="h-6" />
					<div>
						<h1 className="text-xl font-semibold text-foreground">
							Transacción no encontrada
						</h1>
					</div>
				</div>
			</div>
		);
	}

	const formatDate = (dateString: string): string => {
		return new Date(dateString).toLocaleDateString("es-MX", {
			day: "2-digit",
			month: "long",
			year: "numeric",
		});
	};

	const formatDateTime = (dateString: string): string => {
		return new Date(dateString).toLocaleString("es-MX", {
			day: "2-digit",
			month: "long",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const handleExport = (): void => {
		toast({
			title: "Exportación exitosa",
			description: `La transacción ${transaction.id} ha sido exportada.`,
		});
	};

	const handleDelete = async (): Promise<void> => {
		try {
			await deleteTransaction({ id: transactionId });
			toast({
				title: "Transacción eliminada",
				description: `La transacción ${transaction.id} ha sido eliminada.`,
				variant: "destructive",
			});
			router.push("/transactions");
		} catch (error) {
			console.error("Error deleting transaction:", error);
			toast({
				title: "Error",
				description: "No se pudo eliminar la transacción.",
				variant: "destructive",
			});
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-4">
					<Button
						variant="ghost"
						size="sm"
						className="gap-2"
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
						className="gap-2 hidden sm:flex"
						onClick={() => router.push(`/transactions/${transaction.id}/edit`)}
					>
						<Edit className="h-4 w-4" />
						Editar
					</Button>
					<Button
						variant="outline"
						size="sm"
						className="gap-2 hidden sm:flex"
						onClick={handleExport}
					>
						<Download className="h-4 w-4" />
						Exportar
					</Button>
					<Button
						variant="outline"
						size="sm"
						className="gap-2 text-destructive hover:text-destructive"
						onClick={() => setDeleteDialogOpen(true)}
					>
						<Trash2 className="h-4 w-4" />
						<span className="hidden sm:inline">Eliminar</span>
					</Button>
				</div>
			</div>

			<div className="space-y-6">
				<div className="grid gap-6 md:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle>Información de la Transacción</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Fecha de Operación
								</p>
								<p className="text-base font-medium mt-1">
									{formatDateTime(transaction.operationDate)}
								</p>
							</div>
							<Separator />
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Cliente ID
								</p>
								<p className="text-base font-medium mt-1">
									{transaction.clientId}
								</p>
							</div>
							<Separator />
							<div className="grid grid-cols-2 gap-4">
								<div>
									<p className="text-sm font-medium text-muted-foreground">
										Tipo de Operación
									</p>
									<Badge
										variant={
											transaction.operationType === "purchase"
												? "default"
												: "secondary"
										}
										className="mt-1"
									>
										{operationTypeLabels[transaction.operationType]}
									</Badge>
								</div>
								<div>
									<p className="text-sm font-medium text-muted-foreground">
										Código Postal Sucursal
									</p>
									<p className="text-base font-medium mt-1">
										{transaction.branchPostalCode}
									</p>
								</div>
							</div>
							<Separator />
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Creado
								</p>
								<p className="text-base font-medium mt-1">
									{formatDateTime(transaction.createdAt)}
								</p>
							</div>
							{transaction.deletedAt && (
								<>
									<Separator />
									<div>
										<p className="text-sm font-medium text-muted-foreground">
											Eliminado
										</p>
										<p className="text-base font-medium mt-1">
											{formatDateTime(transaction.deletedAt)}
										</p>
									</div>
								</>
							)}
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
								<p className="text-3xl font-bold mt-1">{transaction.amount}</p>
								<p className="text-xs text-muted-foreground mt-1">
									{transaction.currency}
								</p>
							</div>
							<Separator />
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Métodos de Pago
								</p>
								<div className="flex flex-wrap gap-2 mt-1">
									{transaction.paymentMethods.map((pm, index) => (
										<Badge
											key={index}
											variant="secondary"
											className="font-medium"
										>
											{paymentMethodLabels[pm.method] || pm.method}:{" "}
											{new Intl.NumberFormat("es-MX", {
												style: "currency",
												currency: transaction.currency,
											}).format(parseFloat(pm.amount))}
										</Badge>
									))}
								</div>
							</div>
							<Separator />
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Fecha de Pago
								</p>
								<p className="text-base font-medium mt-1">
									{formatDateTime(transaction.paymentDate)}
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
								{transaction.armorLevel && (
									<div>
										<p className="text-sm font-medium text-muted-foreground">
											Nivel de Blindaje
										</p>
										<p className="text-base font-medium mt-1">
											{transaction.armorLevel}
										</p>
									</div>
								)}
							</div>
							<Separator />
							<div className="grid gap-4 md:grid-cols-2">
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
								{transaction.flagCountryId && (
									<div>
										<p className="text-sm font-medium text-muted-foreground">
											País de Bandera ID
										</p>
										<p className="text-base font-medium mt-1">
											{transaction.flagCountryId}
										</p>
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

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
