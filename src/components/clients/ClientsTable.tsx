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
	Edit,
	Flag,
	FileText,
	Download,
	ArrowUpDown,
	Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
	Client,
	RiskLevel,
	ClientStatus,
	ReviewStatus,
} from "@/types/client";
import { getClientDisplayName } from "@/types/client";
import { mockClients } from "@/data/mockClients";

const riskBadgeStyles: Record<RiskLevel, string> = {
	BAJO: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30",
	MEDIO:
		"bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
	ALTO: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
};

const statusBadgeStyles: Record<ClientStatus, string> = {
	ACTIVO:
		"bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30",
	INACTIVO: "bg-muted text-muted-foreground border-muted-foreground/30",
	SUSPENDIDO:
		"bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
	BLOQUEADO: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
};

const reviewStatusBadgeStyles: Record<ReviewStatus, string> = {
	PENDIENTE: "bg-muted text-muted-foreground border-muted-foreground/30",
	EN_REVISION:
		"bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
	APROBADO:
		"bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30",
	RECHAZADO: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
};

export function ClientsTable(): React.ReactElement {
	const router = useRouter();
	const { toast } = useToast();
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [sortColumn, setSortColumn] = useState<string | null>(null);
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

	const allSelected = selectedIds.size === mockClients.length;
	const someSelected = selectedIds.size > 0 && !allSelected;

	const handleSelectAll = (): void => {
		if (allSelected) {
			setSelectedIds(new Set());
		} else {
			setSelectedIds(new Set(mockClients.map((c) => c.id)));
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

	const handleSort = (column: string): void => {
		if (sortColumn === column) {
			setSortDirection(sortDirection === "asc" ? "desc" : "asc");
		} else {
			setSortColumn(column);
			setSortDirection("asc");
		}
	};

	const formatDate = (dateString: string): string => {
		return new Date(dateString).toLocaleDateString("es-MX", {
			day: "2-digit",
			month: "short",
			year: "numeric",
		});
	};

	const handleViewDetails = (client: Client): void => {
		router.push(`/clients/${client.id}`);
	};

	const handleEdit = (client: Client): void => {
		router.push(`/clients/${client.id}/edit`);
	};

	const handleGenerateReport = (client: Client): void => {
		const reportData = JSON.stringify(client, null, 2);
		const blob = new Blob([reportData], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `reporte-${client.rfc}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);

		toast({
			title: "Reporte generado",
			description: `Reporte para ${getClientDisplayName(client)} descargado exitosamente.`,
		});
	};

	const handleFlagSuspicious = (client: Client): void => {
		toast({
			title: "Cliente marcado",
			description: `${getClientDisplayName(client)} ha sido marcado como sospechoso.`,
		});
	};

	const handleDeleteClick = (client: Client): void => {
		setClientToDelete(client);
		setDeleteDialogOpen(true);
	};

	const handleDeleteConfirm = (): void => {
		if (clientToDelete) {
			toast({
				title: "Cliente eliminado",
				description: `${getClientDisplayName(clientToDelete)} ha sido eliminado del sistema.`,
			});
			setDeleteDialogOpen(false);
			setClientToDelete(null);
		}
	};

	const handleBulkExport = (): void => {
		const selectedClients = mockClients.filter((c) => selectedIds.has(c.id));
		const exportData = JSON.stringify(selectedClients, null, 2);
		const blob = new Blob([exportData], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `clientes-export-${new Date().toISOString().split("T")[0]}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);

		toast({
			title: "Exportación completa",
			description: `${selectedIds.size} clientes exportados exitosamente.`,
		});
	};

	const handleBulkFlag = (): void => {
		toast({
			title: "Clientes marcados",
			description: `${selectedIds.size} clientes marcados como sospechosos.`,
		});
		setSelectedIds(new Set());
	};

	return (
		<>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
					<div>
						<CardTitle className="text-lg font-semibold">
							Lista de Clientes
						</CardTitle>
						<p className="text-sm text-muted-foreground mt-1">
							{mockClients.length} clientes en total
							{selectedIds.size > 0 && ` · ${selectedIds.size} seleccionados`}
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
											aria-label="Seleccionar todos los clientes"
										/>
									</TableHead>
									<TableHead className="min-w-[200px]">
										<Button
											variant="ghost"
											size="sm"
											className="-ml-3 h-8 gap-1 font-medium"
											onClick={() => handleSort("name")}
										>
											Cliente
											<ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
										</Button>
									</TableHead>
									<TableHead className="hidden md:table-cell">RFC</TableHead>
									<TableHead className="hidden lg:table-cell">Tipo</TableHead>
									<TableHead>
										<Button
											variant="ghost"
											size="sm"
											className="-ml-3 h-8 gap-1 font-medium"
											onClick={() => handleSort("riskLevel")}
										>
											Nivel de Riesgo
											<ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
										</Button>
									</TableHead>
									<TableHead className="hidden sm:table-cell">Estado</TableHead>
									<TableHead className="hidden xl:table-cell">
										Estado de Revisión
									</TableHead>
									<TableHead className="hidden lg:table-cell">
										Última Revisión
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
								{mockClients.map((client) => (
									<TableRow
										key={client.id}
										className={cn(
											"cursor-pointer transition-colors",
											selectedIds.has(client.id) && "bg-muted/50",
										)}
										onClick={() => handleSelectOne(client.id)}
									>
										<TableCell
											className="pl-6"
											onClick={(e) => e.stopPropagation()}
										>
											<Checkbox
												checked={selectedIds.has(client.id)}
												onCheckedChange={() => handleSelectOne(client.id)}
												aria-label={`Seleccionar ${getClientDisplayName(client)}`}
											/>
										</TableCell>
										<TableCell>
											<Link
												href={`/clients/${client.id}`}
												className="font-medium text-foreground hover:text-primary hover:underline underline-offset-2 transition-colors"
												onClick={(e) => e.stopPropagation()}
											>
												{getClientDisplayName(client)}
											</Link>
										</TableCell>
										<TableCell className="hidden md:table-cell font-mono text-sm text-muted-foreground">
											{client.rfc}
										</TableCell>
										<TableCell className="hidden lg:table-cell">
											<Badge variant="outline" className="font-medium">
												{client.personType === "FISICA" ? "Física" : "Moral"}
											</Badge>
										</TableCell>
										<TableCell>
											<Badge
												variant="outline"
												className={cn(
													"min-w-[60px] justify-center font-medium",
													riskBadgeStyles[client.riskLevel],
												)}
											>
												{client.riskLevel === "BAJO"
													? "Bajo"
													: client.riskLevel === "MEDIO"
														? "Medio"
														: "Alto"}
											</Badge>
										</TableCell>
										<TableCell className="hidden sm:table-cell">
											<Badge
												variant="outline"
												className={cn(
													"font-medium",
													statusBadgeStyles[client.status],
												)}
											>
												{client.status === "ACTIVO"
													? "Activo"
													: client.status === "INACTIVO"
														? "Inactivo"
														: client.status === "SUSPENDIDO"
															? "Suspendido"
															: "Bloqueado"}
											</Badge>
										</TableCell>
										<TableCell className="hidden xl:table-cell">
											<Badge
												variant="outline"
												className={cn(
													"font-medium",
													reviewStatusBadgeStyles[client.reviewStatus],
												)}
											>
												{client.reviewStatus === "PENDIENTE"
													? "Pendiente"
													: client.reviewStatus === "EN_REVISION"
														? "En Revisión"
														: client.reviewStatus === "APROBADO"
															? "Aprobado"
															: "Rechazado"}
											</Badge>
										</TableCell>
										<TableCell className="hidden lg:table-cell text-muted-foreground">
											{formatDate(client.lastReview)}
										</TableCell>
										<TableCell className="hidden md:table-cell text-center">
											{client.alertCount > 0 ? (
												<Badge
													variant="outline"
													className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30"
												>
													{client.alertCount}
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
														aria-label={`Acciones para ${getClientDisplayName(client)}`}
													>
														<MoreHorizontal className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end" className="w-48">
													<DropdownMenuItem
														className="gap-2"
														onClick={() => handleViewDetails(client)}
													>
														<Eye className="h-4 w-4" />
														Ver Detalles
													</DropdownMenuItem>
													<DropdownMenuItem
														className="gap-2"
														onClick={() => handleEdit(client)}
													>
														<Edit className="h-4 w-4" />
														Editar
													</DropdownMenuItem>
													<DropdownMenuItem
														className="gap-2"
														onClick={() => handleGenerateReport(client)}
													>
														<FileText className="h-4 w-4" />
														Generar Reporte
													</DropdownMenuItem>
													<DropdownMenuSeparator />
													<DropdownMenuItem
														className="gap-2 text-red-600 dark:text-red-400"
														onClick={() => handleFlagSuspicious(client)}
													>
														<Flag className="h-4 w-4" />
														Marcar como Sospechoso
													</DropdownMenuItem>
													<DropdownMenuItem
														className="gap-2 text-destructive"
														onClick={() => handleDeleteClick(client)}
													>
														<Trash2 className="h-4 w-4" />
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
						<AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
						<AlertDialogDescription>
							Esta acción eliminará permanentemente el cliente{" "}
							<strong>
								{clientToDelete?.businessName ||
									`${clientToDelete?.firstName} ${clientToDelete?.lastName} ${clientToDelete?.secondLastName || ""}`.trim()}
							</strong>{" "}
							del sistema. Esta acción no se puede deshacer.
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
