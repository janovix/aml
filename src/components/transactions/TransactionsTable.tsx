"use client";

import { useState, useEffect } from "react";
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
import { useIsMobile } from "@/hooks/use-mobile";
import {
	listTransactions,
	type ListTransactionsOptions,
} from "@/lib/api/transactions";
import type { Transaction } from "@/types/transaction";

interface TransactionRow {
	id: string;
	folio: string;
	type: "purchase" | "sale";
	brandId: string;
	model: string;
	year: number;
	amount: number;
	currency: string;
	clientId: string;
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
	const isMobile = useIsMobile();
	const [transactions, setTransactions] = useState<Transaction[]>([]);
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
	const transactionsData: TransactionRow[] = transactions.map((tx) => ({
		id: tx.id,
		folio: tx.id,
		type: tx.operationType,
		brandId: tx.brandId,
		model: tx.model,
		year: tx.year,
		amount: parseFloat(tx.amount),
		currency: tx.currency,
		clientId: tx.clientId,
		operationDate: tx.operationDate,
		paymentMethods: tx.paymentMethods
			.map((pm) => paymentMethodLabels[pm.method] || pm.method)
			.join(", "),
	}));

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
		return new Date(dateString).toLocaleDateString("es-MX", {
			day: "2-digit",
			month: "short",
			year: "numeric",
		});
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
				{selectedIds.size > 0 && !isMobile && (
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
			<CardContent className={cn("p-0", isMobile && "p-4")}>
				{isMobile ? (
					<div className="space-y-3">
						{isLoading ? (
							<div className="text-center py-8 text-muted-foreground">
								Cargando transacciones...
							</div>
						) : transactionsData.length === 0 ? (
							<div className="text-center py-8 text-muted-foreground">
								No hay transacciones registradas
							</div>
						) : (
							transactionsData.map((transaction) => (
								<Card
									key={transaction.id}
									className={cn(
										"transition-colors cursor-pointer",
										selectedIds.has(transaction.id) && "bg-muted/50",
									)}
									onClick={() => handleSelectOne(transaction.id)}
								>
									<CardContent className="p-4">
										<div className="flex items-start justify-between gap-3">
											<div className="flex-1 min-w-0 space-y-2">
												<div className="flex items-center gap-2">
													<Checkbox
														checked={selectedIds.has(transaction.id)}
														onCheckedChange={() => handleSelectOne(transaction.id)}
														onClick={(e) => e.stopPropagation()}
														aria-label={`Seleccionar ${transaction.folio}`}
													/>
													<Link
														href={`/transactions/${transaction.id}`}
														className="font-medium text-foreground hover:text-primary hover:underline underline-offset-2 transition-colors flex-1 min-w-0"
														onClick={(e) => e.stopPropagation()}
													>
														{transaction.folio}
													</Link>
												</div>
												<div className="space-y-1.5 pl-6">
													<div className="flex items-center gap-2">
														<span className="text-sm font-medium">
															{transaction.brandId} {transaction.model}
														</span>
														<span className="text-xs text-muted-foreground">
															{transaction.year}
														</span>
													</div>
													<div className="flex items-center gap-2 text-sm">
														<span className="text-muted-foreground">
															Monto:
														</span>
														<span className="font-medium">
															{formatCurrency(transaction.amount, transaction.currency)}
														</span>
													</div>
													<div className="flex items-center gap-2 text-sm">
														<span className="text-muted-foreground">
															Cliente:
														</span>
														<span className="font-mono text-xs">
															{transaction.clientId}
														</span>
													</div>
													<div className="flex items-center gap-2 text-sm">
														<span className="text-muted-foreground">
															Fecha:
														</span>
														<span>
															{formatDate(transaction.operationDate)}
														</span>
													</div>
												</div>
											</div>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 shrink-0"
														onClick={(e) => e.stopPropagation()}
														aria-label={`Acciones para ${transaction.folio}`}
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
										</div>
									</CardContent>
								</Card>
							))
						)}
					</div>
				) : (
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
								<TableHead className="min-w-[120px]">Folio</TableHead>
								<TableHead className="hidden md:table-cell">Tipo</TableHead>
								<TableHead className="min-w-[150px]">Vehículo</TableHead>
								<TableHead>Cliente ID</TableHead>
								<TableHead className="text-right">Monto</TableHead>
								<TableHead>Métodos de pago</TableHead>
								<TableHead className="hidden sm:table-cell">
									Fecha Operación
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
										colSpan={10}
										className="text-center py-8 text-muted-foreground"
									>
										Cargando transacciones...
									</TableCell>
								</TableRow>
							) : transactionsData.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={10}
										className="text-center py-8 text-muted-foreground"
									>
										No hay transacciones registradas
									</TableCell>
								</TableRow>
							) : (
								transactionsData.map((transaction) => (
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
												onCheckedChange={() => handleSelectOne(transaction.id)}
												aria-label={`Seleccionar ${transaction.folio}`}
											/>
										</TableCell>
										<TableCell>
											<Link
												href={`/transactions/${transaction.id}`}
												className="font-medium text-foreground hover:text-primary hover:underline underline-offset-2 transition-colors"
												onClick={(e) => e.stopPropagation()}
											>
												{transaction.folio}
											</Link>
										</TableCell>
										<TableCell className="hidden md:table-cell">
											<Badge variant="outline" className="font-medium">
												{operationTypeLabels[transaction.type]}
											</Badge>
										</TableCell>
										<TableCell>
											<div className="flex flex-col">
												<span className="font-medium">
													{transaction.brandId} {transaction.model}
												</span>
												<span className="text-xs text-muted-foreground">
													{transaction.year}
												</span>
											</div>
										</TableCell>
										<TableCell className="max-w-[200px] truncate font-mono text-sm">
											{transaction.clientId}
										</TableCell>
										<TableCell className="text-right font-medium">
											{formatCurrency(transaction.amount, transaction.currency)}
										</TableCell>
										<TableCell>
											<span className="text-sm">
												{transaction.paymentMethods}
											</span>
										</TableCell>
										<TableCell className="hidden sm:table-cell text-muted-foreground">
											{formatDate(transaction.operationDate)}
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
														aria-label={`Acciones para ${transaction.folio}`}
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
								))
							)}
						</TableBody>
					</Table>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
