"use client";

import { useState, useEffect, useMemo } from "react";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Button,
	Checkbox,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	Badge,
	cn,
} from "@algtools/ui";
import { MoreHorizontal, Eye, Edit, FileText, Download } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
	listTransactions,
	type ListTransactionsOptions,
} from "@/lib/api/transactions";
import { getClientByRfc } from "@/lib/api/clients";
import type { Transaction } from "@/types/transaction";
import type { Client } from "@/types/client";
import { getClientDisplayName } from "@/types/client";
import { getPersonTypeIcon } from "@/lib/person-type-icon";
import { generateShortTransactionId } from "@/lib/transaction-id";

interface TransactionRow {
	id: string;
	shortId: string;
	type: "purchase" | "sale";
	brand: string;
	model: string;
	year: number;
	amount: number;
	currency: string;
	clientId: string;
	client?: Client;
	operationDate: string;
	paymentMethods: string; // Display string for payment methods
}

const operationTypeLabels: Record<"purchase" | "sale", string> = {
	purchase: "Compra",
	sale: "Venta",
};

const paymentMethodLabels: Record<string, string> = {
	EFECTIVO: "Efectivo",
	TRANSFERENCIA: "Transferencia",
	CHEQUE: "Cheque",
	FINANCIAMIENTO: "Financiamiento",
};

interface TransactionsTableProps {
	filters?: ListTransactionsOptions;
}

export function TransactionsTable({
	filters,
}: TransactionsTableProps = {}): React.ReactElement {
	const router = useRouter();
	const { toast } = useToast();
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [clients, setClients] = useState<Map<string, Client>>(new Map());
	const [isLoading, setIsLoading] = useState(true);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

	useEffect(() => {
		const fetchTransactions = async () => {
			try {
				setIsLoading(true);
				const response = await listTransactions({
					page: 1,
					limit: 100,
					...filters,
				});
				setTransactions(response.data);

				// Fetch client information for all unique client IDs
				const uniqueClientIds = [
					...new Set(response.data.map((tx) => tx.clientId)),
				];
				const clientsMap = new Map<string, Client>();

				await Promise.all(
					uniqueClientIds.map(async (clientId) => {
						try {
							const client = await getClientByRfc({ rfc: clientId });
							clientsMap.set(clientId, client);
						} catch (error) {
							console.error(`Error fetching client ${clientId}:`, error);
							// Continue even if one client fails to load
						}
					}),
				);

				setClients(clientsMap);
			} catch (error) {
				console.error("Error fetching transactions:", error);
				toast({
					title: "Error",
					description: "No se pudieron cargar las transacciones.",
					variant: "destructive",
				});
			} finally {
				setIsLoading(false);
			}
		};
		fetchTransactions();
	}, [filters, toast]);

	// Transform Transaction to TransactionRow format
	const transactionsData: TransactionRow[] = useMemo(() => {
		return transactions.map((tx) => ({
			id: tx.id,
			shortId: generateShortTransactionId(tx.id),
			type: tx.operationType,
			brand: tx.brand,
			model: tx.model,
			year: tx.year,
			amount: parseFloat(tx.amount),
			currency: tx.currency,
			clientId: tx.clientId,
			client: clients.get(tx.clientId),
			operationDate: tx.operationDate,
			paymentMethods: tx.paymentMethods
				.map((pm) => paymentMethodLabels[pm.method] || pm.method)
				.join(", "),
		}));
	}, [transactions, clients]);

	const allSelected =
		selectedIds.size === transactionsData.length && transactionsData.length > 0;
	const someSelected = selectedIds.size > 0 && !allSelected;

	const handleSelectAll = (): void => {
		if (allSelected) {
			setSelectedIds(new Set());
		} else {
			setSelectedIds(
				new Set(transactionsData.map((transaction) => transaction.id)),
			);
		}
	};

	const handleSelectOne = (id: string): void => {
		const newSelected = new Set(selectedIds);
		if (newSelected.has(id)) {
			newSelected.delete(id);
		} else {
			newSelected.add(id);
		}
		setSelectedIds(newSelected);
	};

	const formatCurrency = (amount: number, currency: string): string => {
		return new Intl.NumberFormat("es-MX", {
			style: "currency",
			currency: currency,
		}).format(amount);
	};

	const formatDate = (dateString: string): string => {
		const date = new Date(dateString);
		const now = new Date();
		const diffTime = Math.abs(now.getTime() - date.getTime());
		const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

		if (diffDays === 0) {
			return "Hoy";
		} else if (diffDays === 1) {
			return "Ayer";
		} else if (diffDays < 7) {
			return `Hace ${diffDays} días`;
		} else if (diffDays < 30) {
			const weeks = Math.floor(diffDays / 7);
			return weeks === 1 ? "Hace 1 semana" : `Hace ${weeks} semanas`;
		} else if (diffDays < 365) {
			const months = Math.floor(diffDays / 30);
			return months === 1 ? "Hace 1 mes" : `Hace ${months} meses`;
		} else {
			return date.toLocaleDateString("es-MX", {
				day: "2-digit",
				month: "short",
				year: "numeric",
			});
		}
	};

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
				<div>
					<CardTitle className="text-lg font-semibold">
						Lista de Transacciones
					</CardTitle>
					<p className="text-sm text-muted-foreground mt-1">
						{isLoading
							? "Cargando..."
							: `${transactionsData.length} transacciones en total`}
						{selectedIds.size > 0 && ` · ${selectedIds.size} seleccionadas`}
					</p>
				</div>
				{selectedIds.size > 0 && (
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							className="gap-2 bg-transparent"
						>
							<Download className="h-4 w-4" />
							Exportar
						</Button>
					</div>
				)}
			</CardHeader>
			<CardContent className="p-0">
				<div className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow className="hover:bg-transparent">
								<TableHead className="w-12 pl-6">
									<Checkbox
										checked={allSelected}
										ref={(el) => {
											if (el)
												(
													el as HTMLButtonElement & { indeterminate: boolean }
												).indeterminate = someSelected;
										}}
										onCheckedChange={handleSelectAll}
										aria-label="Seleccionar todas las transacciones"
									/>
								</TableHead>
								<TableHead className="min-w-[250px]">Cliente</TableHead>
								<TableHead className="text-right min-w-[140px]">
									Monto
								</TableHead>
								<TableHead className="min-w-[120px]">Fecha</TableHead>
								<TableHead className="hidden md:table-cell">Tipo</TableHead>
								<TableHead className="hidden lg:table-cell min-w-[150px]">
									Vehículo
								</TableHead>
								<TableHead className="hidden xl:table-cell">
									Métodos de pago
								</TableHead>
								<TableHead className="w-12 pr-6">
									<span className="sr-only">Acciones</span>
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{isLoading ? (
								<TableRow>
									<TableCell
										colSpan={8}
										className="text-center py-8 text-muted-foreground"
									>
										Cargando transacciones...
									</TableCell>
								</TableRow>
							) : transactionsData.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={8}
										className="text-center py-8 text-muted-foreground"
									>
										No hay transacciones registradas
									</TableCell>
								</TableRow>
							) : (
								transactionsData.map((transaction) => {
									const PersonIcon = transaction.client
										? getPersonTypeIcon(transaction.client.personType)
										: null;
									const clientName = transaction.client
										? getClientDisplayName(transaction.client)
										: transaction.clientId;

									return (
										<TableRow
											key={transaction.id}
											className={cn(
												"cursor-pointer transition-colors",
												selectedIds.has(transaction.id) && "bg-muted/50",
											)}
											onClick={() => handleSelectOne(transaction.id)}
										>
											<TableCell
												className="pl-6"
												onClick={(e) => e.stopPropagation()}
											>
												<Checkbox
													checked={selectedIds.has(transaction.id)}
													onCheckedChange={() =>
														handleSelectOne(transaction.id)
													}
													aria-label={`Seleccionar ${transaction.shortId}`}
												/>
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-3">
													{PersonIcon && (
														<PersonIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
													)}
													<div className="flex flex-col min-w-0">
														<Link
															href={`/transactions/${transaction.id}`}
															className="font-semibold text-foreground hover:text-primary hover:underline underline-offset-2 transition-colors truncate"
															onClick={(e) => e.stopPropagation()}
														>
															{clientName || transaction.clientId}
														</Link>
														<span className="text-xs text-muted-foreground font-mono">
															{transaction.shortId}
														</span>
													</div>
												</div>
											</TableCell>
											<TableCell className="text-right">
												<div className="flex flex-col items-end">
													<span className="font-bold text-lg">
														{formatCurrency(
															transaction.amount,
															transaction.currency,
														)}
													</span>
													<span className="text-xs text-muted-foreground">
														{transaction.paymentMethods}
													</span>
												</div>
											</TableCell>
											<TableCell>
												<div className="flex flex-col">
													<span className="font-medium">
														{formatDate(transaction.operationDate)}
													</span>
													<span className="text-xs text-muted-foreground">
														{new Date(
															transaction.operationDate,
														).toLocaleDateString("es-MX", {
															day: "2-digit",
															month: "short",
															year: "numeric",
														})}
													</span>
												</div>
											</TableCell>
											<TableCell className="hidden md:table-cell">
												<Badge variant="outline" className="font-medium">
													{operationTypeLabels[transaction.type]}
												</Badge>
											</TableCell>
											<TableCell className="hidden lg:table-cell">
												<div className="flex flex-col">
													<span className="font-medium">
														{transaction.brand} {transaction.model}
													</span>
													<span className="text-xs text-muted-foreground">
														{transaction.year}
													</span>
												</div>
											</TableCell>
											<TableCell className="hidden xl:table-cell">
												<span className="text-sm text-muted-foreground">
													{transaction.paymentMethods}
												</span>
											</TableCell>
											<TableCell
												className="pr-6"
												onClick={(e) => e.stopPropagation()}
											>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button
															variant="ghost"
															size="icon"
															className="h-8 w-8"
															aria-label={`Acciones para ${transaction.shortId}`}
														>
															<MoreHorizontal className="h-4 w-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end" className="w-48">
														<DropdownMenuItem
															className="gap-2"
															onClick={() =>
																router.push(`/transactions/${transaction.id}`)
															}
														>
															<Eye className="h-4 w-4" />
															Ver Detalles
														</DropdownMenuItem>
														<DropdownMenuItem
															className="gap-2"
															onClick={() =>
																router.push(
																	`/transactions/${transaction.id}/edit`,
																)
															}
														>
															<Edit className="h-4 w-4" />
															Editar
														</DropdownMenuItem>
														<DropdownMenuSeparator />
														<DropdownMenuItem className="gap-2">
															<FileText className="h-4 w-4" />
															Generar Reporte
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									);
								})
							)}
						</TableBody>
					</Table>
				</div>
			</CardContent>
		</Card>
	);
}
