"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
	MoreHorizontal,
	Eye,
	FileText,
	Download,
	ArrowUpDown,
	Trash2,
	Flag,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
	Transaction,
	TransactionStatus,
	TransactionType,
} from "@/types/transaction";
import {
	getTransactionTypeLabel,
	getTransactionStatusLabel,
	getTransactionChannelLabel,
	formatCurrency,
} from "@/types/transaction";
import { mockTransactions } from "@/data/mockTransactions";

const statusBadgeStyles: Record<TransactionStatus, string> = {
	COMPLETADA:
		"bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30",
	PENDIENTE:
		"bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
	EN_REVISION:
		"bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
	RECHAZADA: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
	CANCELADA: "bg-muted text-muted-foreground border-muted-foreground/30",
};

const typeBadgeStyles: Record<TransactionType, string> = {
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

interface TransactionsTableProps {
	searchQuery?: string;
	typeFilter?: string;
	statusFilter?: string;
	channelFilter?: string;
}

export function TransactionsTable({
	searchQuery = "",
	typeFilter = "",
	statusFilter = "",
	channelFilter = "",
}: TransactionsTableProps = {}): React.ReactElement {
	const router = useRouter();
	const { toast } = useToast();
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [sortColumn, setSortColumn] = useState<string | null>(null);
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [transactionToDelete, setTransactionToDelete] =
		useState<Transaction | null>(null);

	const handleSelectOne = (id: string): void => {
		const newSelected = new Set(selectedIds);
		if (newSelected.has(id)) {
			newSelected.delete(id);
		} else {
			newSelected.add(id);
		}
		setSelectedIds(newSelected);
	};

	const handleSort = (column: string): void => {
		if (sortColumn === column) {
			setSortDirection(sortDirection === "asc" ? "desc" : "asc");
		} else {
			setSortColumn(column);
			setSortDirection("asc");
		}
	};

	// Filter transactions
	const filteredTransactions = mockTransactions.filter((transaction) => {
		// Search filter
		if (searchQuery) {
			const searchLower = searchQuery.toLowerCase();
			const matchesSearch =
				transaction.clientName.toLowerCase().includes(searchLower) ||
				transaction.clientRfc.toLowerCase().includes(searchLower) ||
				transaction.reference?.toLowerCase().includes(searchLower) ||
				transaction.description?.toLowerCase().includes(searchLower);
			if (!matchesSearch) return false;
		}

		// Type filter
		if (typeFilter && typeFilter !== "all") {
			if (transaction.type !== typeFilter) return false;
		}

		// Status filter
		if (statusFilter && statusFilter !== "all") {
			if (transaction.status !== statusFilter) return false;
		}

		// Channel filter
		if (channelFilter && channelFilter !== "all") {
			if (transaction.channel !== channelFilter) return false;
		}

		return true;
	});

	// Sort transactions
	const sortedTransactions = [...filteredTransactions].sort((a, b) => {
		if (!sortColumn) return 0;

		let aValue: string | number;
		let bValue: string | number;

		switch (sortColumn) {
			case "clientName":
				aValue = a.clientName.toLowerCase();
				bValue = b.clientName.toLowerCase();
				break;
			case "amount":
				aValue = a.amount;
				bValue = b.amount;
				break;
			case "status":
				aValue = a.status;
				bValue = b.status;
				break;
			case "date":
				aValue = new Date(a.date).getTime();
				bValue = new Date(b.date).getTime();
				break;
			default:
				return 0;
		}

		if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
		if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
		return 0;
	});

	const allSelected =
		sortedTransactions.length > 0 &&
		selectedIds.size === sortedTransactions.length;
	const someSelected = selectedIds.size > 0 && !allSelected;

	const handleSelectAll = (): void => {
		if (allSelected) {
			setSelectedIds(new Set());
		} else {
			setSelectedIds(new Set(sortedTransactions.map((t) => t.id)));
		}
	};

	const formatDate = (dateString: string): string => {
		return new Date(dateString).toLocaleDateString("es-MX", {
			day: "2-digit",
			month: "short",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const handleViewDetails = (transaction: Transaction): void => {
		router.push(`/transactions/${transaction.id}`);
	};

	const handleGenerateReport = (transaction: Transaction): void => {
		const reportData = JSON.stringify(transaction, null, 2);
		const blob = new Blob([reportData], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `reporte-transaccion-${transaction.reference || transaction.id}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);

		toast({
			title: "Reporte generado",
			description: `Reporte para transacción ${transaction.reference || transaction.id} descargado exitosamente.`,
		});
	};

	const handleFlagSuspicious = (transaction: Transaction): void => {
		toast({
			title: "Transacción marcada",
			description: `Transacción ${transaction.reference || transaction.id} ha sido marcada como sospechosa.`,
		});
	};

	const handleDeleteClick = (transaction: Transaction): void => {
		setTransactionToDelete(transaction);
		setDeleteDialogOpen(true);
	};

	const handleDeleteConfirm = (): void => {
		if (transactionToDelete) {
			toast({
				title: "Transacción eliminada",
				description: `Transacción ${transactionToDelete.reference || transactionToDelete.id} ha sido eliminada del sistema.`,
			});
			setDeleteDialogOpen(false);
			setTransactionToDelete(null);
		}
	};

	const handleBulkExport = (): void => {
		const selectedTransactions = sortedTransactions.filter((t) =>
			selectedIds.has(t.id),
		);
		const exportData = JSON.stringify(selectedTransactions, null, 2);
		const blob = new Blob([exportData], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `transacciones-export-${new Date().toISOString().split("T")[0]}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);

		toast({
			title: "Exportación completa",
			description: `${selectedIds.size} transacciones exportadas exitosamente.`,
		});
	};

	const handleBulkFlag = (): void => {
		toast({
			title: "Transacciones marcadas",
			description: `${selectedIds.size} transacciones marcadas como sospechosas.`,
		});
		setSelectedIds(new Set());
	};

	return (
		<>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
					<div>
						<CardTitle className="text-lg font-semibold">
							Lista de Transacciones
						</CardTitle>
						<p className="text-sm text-muted-foreground mt-1">
							{sortedTransactions.length} de {mockTransactions.length}{" "}
							transacciones
							{selectedIds.size > 0 && ` · ${selectedIds.size} seleccionadas`}
						</p>
					</div>
					{selectedIds.size > 0 && (
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								className="gap-2 bg-transparent"
								onClick={handleBulkExport}
							>
								<Download className="h-4 w-4" />
								Exportar
							</Button>
							<Button
								variant="outline"
								size="sm"
								className="gap-2 bg-transparent"
								onClick={handleBulkFlag}
							>
								<Flag className="h-4 w-4" />
								Marcar
							</Button>
						</div>
					)}
				</CardHeader>
				<CardContent className="p-0">
					<div className="overflow-x-auto rounded-lg border-t">
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
									<TableHead className="min-w-[200px]">
										<Button
											variant="ghost"
											size="sm"
											className="-ml-3 h-8 gap-1 font-medium"
											onClick={() => handleSort("clientName")}
										>
											Cliente
											<ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
										</Button>
									</TableHead>
									<TableHead className="hidden md:table-cell">
										<Button
											variant="ghost"
											size="sm"
											className="-ml-3 h-8 gap-1 font-medium"
											onClick={() => handleSort("amount")}
										>
											Monto
											<ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
										</Button>
									</TableHead>
									<TableHead className="hidden lg:table-cell">Tipo</TableHead>
									<TableHead>
										<Button
											variant="ghost"
											size="sm"
											className="-ml-3 h-8 gap-1 font-medium"
											onClick={() => handleSort("status")}
										>
											Estado
											<ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
										</Button>
									</TableHead>
									<TableHead className="hidden sm:table-cell">Canal</TableHead>
									<TableHead className="hidden xl:table-cell">
										<Button
											variant="ghost"
											size="sm"
											className="-ml-3 h-8 gap-1 font-medium"
											onClick={() => handleSort("date")}
										>
											Fecha
											<ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
										</Button>
									</TableHead>
									<TableHead className="hidden lg:table-cell">
										Referencia
									</TableHead>
									<TableHead className="hidden md:table-cell text-center">
										Avisos
									</TableHead>
									<TableHead className="w-12 pr-6">
										<span className="sr-only">Acciones</span>
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{sortedTransactions.map((transaction) => (
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
												aria-label={`Seleccionar transacción ${transaction.reference || transaction.id}`}
											/>
										</TableCell>
										<TableCell>
											<Link
												href={`/clients/${transaction.clientId}`}
												className="font-medium text-foreground hover:text-primary hover:underline underline-offset-2 transition-colors"
												onClick={(e) => e.stopPropagation()}
											>
												{transaction.clientName}
											</Link>
											<p className="text-xs text-muted-foreground font-mono mt-0.5">
												{transaction.clientRfc}
											</p>
										</TableCell>
										<TableCell className="hidden md:table-cell">
											<span className="font-semibold">
												{formatCurrency(
													transaction.amount,
													transaction.currency,
												)}
											</span>
											{transaction.riskScore !== undefined && (
												<p className="text-xs text-muted-foreground mt-0.5">
													Riesgo: {transaction.riskScore}
												</p>
											)}
										</TableCell>
										<TableCell className="hidden lg:table-cell">
											<Badge
												variant="outline"
												className={cn(
													"font-medium",
													typeBadgeStyles[transaction.type],
												)}
											>
												{getTransactionTypeLabel(transaction.type)}
											</Badge>
										</TableCell>
										<TableCell>
											<Badge
												variant="outline"
												className={cn(
													"font-medium",
													statusBadgeStyles[transaction.status],
												)}
											>
												{getTransactionStatusLabel(transaction.status)}
											</Badge>
										</TableCell>
										<TableCell className="hidden sm:table-cell">
											<span className="text-sm text-muted-foreground">
												{getTransactionChannelLabel(transaction.channel)}
											</span>
										</TableCell>
										<TableCell className="hidden xl:table-cell text-muted-foreground text-sm">
											{formatDate(transaction.date)}
										</TableCell>
										<TableCell className="hidden lg:table-cell font-mono text-sm text-muted-foreground">
											{transaction.reference || "—"}
										</TableCell>
										<TableCell className="hidden md:table-cell text-center">
											{transaction.alertCount > 0 ? (
												<Badge
													variant="outline"
													className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30"
												>
													{transaction.alertCount}
												</Badge>
											) : (
												<span className="text-muted-foreground">—</span>
											)}
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
														aria-label={`Acciones para transacción ${transaction.reference || transaction.id}`}
													>
														<MoreHorizontal className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem
														onClick={() => handleViewDetails(transaction)}
													>
														<Eye className="mr-2 h-4 w-4" />
														Ver Detalles
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() => handleGenerateReport(transaction)}
													>
														<FileText className="mr-2 h-4 w-4" />
														Generar Reporte
													</DropdownMenuItem>
													<DropdownMenuSeparator />
													<DropdownMenuItem
														onClick={() => handleFlagSuspicious(transaction)}
													>
														<Flag className="mr-2 h-4 w-4" />
														Marcar como Sospechosa
													</DropdownMenuItem>
													<DropdownMenuSeparator />
													<DropdownMenuItem
														onClick={() => handleDeleteClick(transaction)}
														className="text-destructive focus:text-destructive"
													>
														<Trash2 className="mr-2 h-4 w-4" />
														Eliminar
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>

			<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>¿Eliminar transacción?</AlertDialogTitle>
						<AlertDialogDescription>
							Esta acción no se puede deshacer. La transacción{" "}
							{transactionToDelete?.reference || transactionToDelete?.id} será
							eliminada permanentemente del sistema.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteConfirm}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Eliminar
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
