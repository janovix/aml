"use client";

import { useState, useEffect } from "react";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Edit, Download, Trash2, Receipt } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import {
	getTransactionById,
	deleteTransaction,
} from "../../lib/api/transactions";
import { getClientById } from "@/lib/api/clients";
import { getClientDisplayName } from "@/types/client";
import type { Transaction } from "../../types/transaction";
import type { Client } from "@/types/client";
import { PageHero } from "@/components/page-hero";
import { PageHeroSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/components/LanguageProvider";
import type { TranslationKeys } from "@/lib/translations";

/**
 * Skeleton component for TransactionDetailsView
 * Used when loading the organization to show the appropriate skeleton
 */
export function TransactionDetailsSkeleton(): React.ReactElement {
	return (
		<div className="space-y-6">
			<PageHeroSkeleton
				showStats={false}
				showBackButton={true}
				actionCount={3}
			/>
			{/* Content skeleton */}
			<div className="grid gap-6 md:grid-cols-2">
				{[1, 2].map((i) => (
					<Card key={i}>
						<CardHeader>
							<Skeleton className="h-6 w-48" />
						</CardHeader>
						<CardContent className="space-y-4">
							{[1, 2, 3].map((j) => (
								<div key={j} className="space-y-2">
									<Skeleton className="h-4 w-24" />
									<Skeleton className="h-5 w-40" />
								</div>
							))}
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}

const getPaymentMethodBadgeVariant = (
	method: string,
): "default" | "secondary" | "destructive" | "outline" => {
	switch (method.toUpperCase()) {
		case "EFECTIVO":
			return "default";
		case "TRANSFERENCIA":
			return "secondary";
		case "CHEQUE":
			return "outline";
		case "FINANCIAMIENTO":
			return "destructive";
		default:
			return "outline";
	}
};

interface TransactionDetailsViewProps {
	transactionId: string;
}

export function TransactionDetailsView({
	transactionId,
}: TransactionDetailsViewProps): React.JSX.Element {
	const { t } = useLanguage();
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [transaction, setTransaction] = useState<Transaction | null>(null);
	const [client, setClient] = useState<Client | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const { navigateTo } = useOrgNavigation();
	const { toast } = useToast();

	// Translation helper for labels
	const operationTypeLabels: Record<Transaction["operationType"], string> = {
		purchase: t("txnOperationPurchase"),
		sale: t("txnOperationSale"),
	};

	const vehicleTypeLabels: Record<Transaction["vehicleType"], string> = {
		land: t("txnVehicleTypeLand"),
		marine: t("txnVehicleTypeMarine"),
		air: t("txnVehicleTypeAir"),
	};

	const paymentMethodLabels: Record<string, string> = {
		EFECTIVO: t("txnPaymentMethodCash"),
		TRANSFERENCIA: t("txnPaymentMethodTransfer"),
		CHEQUE: t("txnPaymentMethodCheck"),
		FINANCIAMIENTO: t("txnPaymentMethodFinancing"),
	};

	useEffect(() => {
		const fetchTransaction = async () => {
			try {
				setIsLoading(true);
				const data = await getTransactionById({ id: transactionId });
				setTransaction(data);

				// Fetch client information
				if (data.clientId) {
					try {
						const clientData = await getClientById({ id: data.clientId });
						setClient(clientData);
					} catch (error) {
						console.error("Error fetching client:", error);
						// Silently fail - we'll just show the client ID
					}
				}
			} catch (error) {
				console.error("Error fetching transaction:", error);
				toast({
					title: "Error",
					description: t("txnLoadError"),
					variant: "destructive",
				});
				navigateTo("/transactions");
			} finally {
				setIsLoading(false);
			}
		};
		fetchTransaction();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [transactionId]);

	if (isLoading) {
		return <TransactionDetailsSkeleton />;
	}

	if (!transaction) {
		return (
			<div className="space-y-6">
				<PageHero
					title="Transacción no encontrada"
					subtitle={`La transacción ${transactionId} no existe`}
					icon={Receipt}
					backButton={{
						label: "Volver a Transacciones",
						onClick: () => navigateTo("/transactions"),
					}}
				/>
			</div>
		);
	}

	const formatDateTime = (dateString: string | null | undefined): string => {
		if (!dateString) {
			return t("txnDateNotAvailable");
		}
		const date = new Date(dateString);
		if (isNaN(date.getTime())) {
			return t("txnDateInvalid");
		}
		return date.toLocaleString("es-MX", {
			day: "2-digit",
			month: "long",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const handleExport = (): void => {
		toast({
			title: t("txnExportSuccess"),
			description: t("txnExportSuccessDesc"),
		});
	};

	const handleDelete = async (): Promise<void> => {
		try {
			await deleteTransaction({ id: transactionId });
			toast({
				title: t("txnDeletedSuccess"),
				description: t("txnDeletedSuccessDesc"),
				variant: "destructive",
			});
			navigateTo("/transactions");
		} catch (error) {
			console.error("Error deleting transaction:", error);
			toast({
				title: "Error",
				description: t("txnDeleteError"),
				variant: "destructive",
			});
		}
	};

	return (
		<div className="space-y-6">
			<PageHero
				title={transaction.id}
				subtitle={t("txnDetailsSubtitle")}
				icon={Receipt}
				backButton={{
					label: t("txnBackToList"),
					onClick: () => navigateTo("/transactions"),
				}}
				actions={[
					{
						label: t("edit"),
						icon: Edit,
						onClick: () => navigateTo(`/transactions/${transaction.id}/edit`),
					},
					{
						label: t("txnExport"),
						icon: Download,
						onClick: handleExport,
						variant: "outline",
					},
					{
						label: t("delete"),
						icon: Trash2,
						onClick: () => setDeleteDialogOpen(true),
						variant: "destructive",
					},
				]}
			/>

			<div className="space-y-6">
				<div className="grid gap-6 md:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle>{t("txnInfoTitle")}</CardTitle>
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
									Cliente
								</p>
								<p className="text-base font-medium mt-1">
									{client ? getClientDisplayName(client) : transaction.clientId}
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
							<CardTitle>{t("txnPaymentTitle")}</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Monto
								</p>
								<p className="text-3xl font-bold mt-1">
									{new Intl.NumberFormat("es-MX", {
										style: "currency",
										currency: transaction.currency,
									}).format(parseFloat(transaction.amount))}
								</p>
								<p className="text-xs text-muted-foreground mt-1">
									{transaction.currency}
								</p>
							</div>
							<Separator />
							<div>
								<p className="text-sm font-medium text-muted-foreground mb-3">
									Métodos de Pago
								</p>
								<div className="space-y-2">
									{transaction.paymentMethods.map((pm, index) => (
										<div
											key={index}
											className="flex items-center justify-between py-2 px-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
										>
											<span className="text-base font-medium">
												{new Intl.NumberFormat("es-MX", {
													style: "currency",
													currency: transaction.currency,
												}).format(parseFloat(pm.amount))}
											</span>
											<Badge
												variant={getPaymentMethodBadgeVariant(pm.method)}
												className="font-medium"
											>
												{paymentMethodLabels[pm.method] || pm.method}
											</Badge>
										</div>
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
							<CardTitle>{t("txnVehicleTitle")}</CardTitle>
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
										{transaction.brandCatalog?.name || transaction.brand}
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
						<AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
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
