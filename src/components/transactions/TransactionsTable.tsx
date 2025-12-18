"use client";

import { useState } from "react";
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
import { mockTransactions } from "@/data/mockTransactions";
import type { PaymentMethod, TransactionLegacy } from "@/types/transaction";
import { transactionToLegacy } from "@/types/transaction";

interface TransactionRow {
	id: string;
	folio: string;
	type: "COMPRA" | "VENTA";
	vin: string;
	brand: string;
	model: string;
	year: number;
	amount: number;
	clientName: string;
	date: string;
	status: "COMPLETADA" | "PENDIENTE" | "EN_REVISION";
	suspicious: boolean;
	paymentMethod: PaymentMethod;
}

const paymentMethodLabels: Record<PaymentMethod, string> = {
	EFECTIVO: "Efectivo",
	TRANSFERENCIA: "Transferencia",
	CHEQUE: "Cheque",
	FINANCIAMIENTO: "Financiamiento",
};

// Transform mockTransactions to TransactionRow format
const transactionsData: TransactionRow[] = mockTransactions.map((tx) => {
	const legacy = transactionToLegacy(tx);
	return {
		id: legacy.id,
		folio: legacy.id,
		type: legacy.transactionType,
		vin: legacy.serialNumber,
		brand: legacy.brand,
		model: legacy.model,
		year: parseInt(legacy.year, 10),
		amount: parseFloat(legacy.amount.replace(/[^0-9.-]+/g, "")),
		clientName: legacy.clientName,
		date: legacy.date,
		status: legacy.status,
		suspicious: legacy.riskFlag,
		paymentMethod: legacy.paymentMethod,
	};
});

const statusBadgeStyles = {
	COMPLETADA:
		"bg-[rgb(var(--risk-low-bg))] text-[rgb(var(--risk-low))] border-[rgb(var(--risk-low))]/30",
	PENDIENTE:
		"bg-[rgb(var(--risk-medium-bg))] text-[rgb(var(--risk-medium))] border-[rgb(var(--risk-medium))]/30",
	EN_REVISION:
		"bg-[rgb(var(--risk-high-bg))] text-[rgb(var(--risk-high))] border-[rgb(var(--risk-high))]/30",
};

export function TransactionsTable(): React.ReactElement {
	const router = useRouter();
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

	const allSelected = selectedIds.size === transactionsData.length;
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

	const formatCurrency = (amount: number): string => {
		return new Intl.NumberFormat("es-MX", {
			style: "currency",
			currency: "MXN",
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
						{transactionsData.length} transacciones en total
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
								<TableHead className="min-w-[120px]">Folio</TableHead>
								<TableHead className="hidden md:table-cell">Tipo</TableHead>
								<TableHead className="min-w-[150px]">Vehículo</TableHead>
								<TableHead className="hidden lg:table-cell">VIN</TableHead>
								<TableHead>Cliente</TableHead>
								<TableHead className="text-right">Monto</TableHead>
								<TableHead>Método de pago</TableHead>
								<TableHead className="hidden sm:table-cell">Fecha</TableHead>
								<TableHead>Estado</TableHead>
								<TableHead className="w-12 pr-6">
									<span className="sr-only">Acciones</span>
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{transactionsData.map((transaction) => (
								<TableRow
									key={transaction.id}
									className={cn(
										"cursor-pointer transition-colors",
										selectedIds.has(transaction.id) && "bg-muted/50",
										transaction.suspicious &&
											"bg-[rgb(var(--risk-high-bg))]/20",
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
											{transaction.type === "COMPRA" ? "Compra" : "Venta"}
										</Badge>
									</TableCell>
									<TableCell>
										<div className="flex flex-col">
											<span className="font-medium">
												{transaction.brand} {transaction.model}
											</span>
											<span className="text-xs text-muted-foreground">
												{transaction.year}
											</span>
										</div>
									</TableCell>
									<TableCell className="hidden lg:table-cell font-mono text-xs text-muted-foreground">
										{transaction.vin}
									</TableCell>
									<TableCell className="max-w-[200px] truncate">
										{transaction.clientName}
									</TableCell>
									<TableCell className="text-right font-medium">
										{formatCurrency(transaction.amount)}
									</TableCell>
									<TableCell>
										<Badge variant="outline" className="font-medium">
											{paymentMethodLabels[transaction.paymentMethod]}
										</Badge>
									</TableCell>
									<TableCell className="hidden sm:table-cell text-muted-foreground">
										{formatDate(transaction.date)}
									</TableCell>
									<TableCell>
										<Badge
											variant="outline"
											className={cn(
												"font-medium",
												statusBadgeStyles[transaction.status],
											)}
										>
											{transaction.status === "COMPLETADA"
												? "Completada"
												: transaction.status === "PENDIENTE"
													? "Pendiente"
													: "En Revisión"}
										</Badge>
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
														router.push(`/transactions/${transaction.id}/edit`)
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
							))}
						</TableBody>
					</Table>
				</div>
			</CardContent>
		</Card>
	);
}
