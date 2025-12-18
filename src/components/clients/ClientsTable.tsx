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
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	cn,
} from "@algtools/ui";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
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
import type { Client } from "@/types/client";
import { getClientDisplayName } from "@/types/client";
import { listClients, deleteClient } from "@/lib/api/clients";

export function ClientsTable(): React.ReactElement {
	const router = useRouter();
	const { toast } = useToast();
	const isMobile = useIsMobile();
	const [clients, setClients] = useState<Client[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [sortColumn, setSortColumn] = useState<string | null>(null);
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

	useEffect(() => {
		const fetchClients = async () => {
			try {
				setIsLoading(true);
				const response = await listClients({ page: 1, limit: 100 });
				setClients(response.data);
			} catch (error) {
				console.error("Error fetching clients:", error);
				toast({
					title: "Error",
					description: "No se pudieron cargar los clientes.",
					variant: "destructive",
				});
			} finally {
				setIsLoading(false);
			}
		};
		fetchClients();
	}, [toast]);

	const allSelected = selectedIds.size === clients.length && clients.length > 0;
	const someSelected = selectedIds.size > 0 && !allSelected;

	const handleSelectAll = (): void => {
		if (allSelected) {
			setSelectedIds(new Set());
		} else {
			setSelectedIds(new Set(clients.map((c) => c.rfc)));
		}
	};

	const handleSelectOne = (rfc: string): void => {
		const newSelected = new Set(selectedIds);
		if (newSelected.has(rfc)) {
			newSelected.delete(rfc);
		} else {
			newSelected.add(rfc);
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
		router.push(`/clients/${client.rfc}`);
	};

	const handleEdit = (client: Client): void => {
		router.push(`/clients/${client.rfc}/edit`);
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

	const handleDeleteConfirm = async (): Promise<void> => {
		if (clientToDelete) {
			try {
				await deleteClient({ rfc: clientToDelete.rfc });
				setClients(clients.filter((c) => c.rfc !== clientToDelete.rfc));
				toast({
					title: "Cliente eliminado",
					description: `${getClientDisplayName(clientToDelete)} ha sido eliminado del sistema.`,
				});
			} catch (error) {
				console.error("Error deleting client:", error);
				toast({
					title: "Error",
					description: "No se pudo eliminar el cliente.",
					variant: "destructive",
				});
			} finally {
				setDeleteDialogOpen(false);
				setClientToDelete(null);
			}
		}
	};

	const handleBulkExport = (): void => {
		const selectedClients = clients.filter((c) => selectedIds.has(c.rfc));
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
							{isLoading
								? "Cargando..."
								: `${clients.length} clientes en total`}
							{selectedIds.size > 0 && ` · ${selectedIds.size} seleccionados`}
						</p>
					</div>
					{selectedIds.size > 0 && !isMobile && (
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
				<CardContent className={cn("p-0", isMobile && "p-4")}>
					{isMobile ? (
						<div className="space-y-3">
							{isLoading ? (
								<div className="text-center py-8 text-muted-foreground">
									Cargando clientes...
								</div>
							) : clients.length === 0 ? (
								<div className="text-center py-8 text-muted-foreground">
									No hay clientes registrados
								</div>
							) : (
								clients.map((client) => (
									<Card
										key={client.rfc}
										className={cn(
											"transition-colors cursor-pointer",
											selectedIds.has(client.rfc) && "bg-muted/50",
										)}
										onClick={() => handleSelectOne(client.rfc)}
									>
										<CardContent className="p-4">
											<div className="flex items-start justify-between gap-3">
												<div className="flex-1 min-w-0 space-y-2">
													<div className="flex items-center gap-2">
														<Checkbox
															checked={selectedIds.has(client.rfc)}
															onCheckedChange={() =>
																handleSelectOne(client.rfc)
															}
															onClick={(e) => e.stopPropagation()}
															aria-label={`Seleccionar ${getClientDisplayName(client)}`}
														/>
														<Link
															href={`/clients/${client.rfc}`}
															className="font-medium text-foreground hover:text-primary hover:underline underline-offset-2 transition-colors flex-1 min-w-0"
															onClick={(e) => e.stopPropagation()}
														>
															{getClientDisplayName(client)}
														</Link>
													</div>
													<div className="space-y-1.5 pl-6">
														<div className="flex items-center gap-2 text-sm">
															<span className="text-muted-foreground font-mono">
																RFC:
															</span>
															<span className="text-foreground font-mono">
																{client.rfc}
															</span>
														</div>
														<div className="flex items-center gap-2">
															<Badge variant="outline" className="font-medium">
																—
															</Badge>
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
															className="gap-2 text-[rgb(var(--risk-high))]"
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
															el as HTMLButtonElement & {
																indeterminate: boolean;
															}
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
										<TableHead className="hidden sm:table-cell">
											Estado
										</TableHead>
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
									{isLoading ? (
										<TableRow>
											<TableCell
												colSpan={10}
												className="text-center py-8 text-muted-foreground"
											>
												Cargando clientes...
											</TableCell>
										</TableRow>
									) : clients.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={10}
												className="text-center py-8 text-muted-foreground"
											>
												No hay clientes registrados
											</TableCell>
										</TableRow>
									) : (
										clients.map((client) => (
											<TableRow
												key={client.rfc}
												className={cn(
													"cursor-pointer transition-colors",
													selectedIds.has(client.rfc) && "bg-muted/50",
												)}
												onClick={() => handleSelectOne(client.rfc)}
											>
												<TableCell
													className="pl-6"
													onClick={(e) => e.stopPropagation()}
												>
													<Checkbox
														checked={selectedIds.has(client.rfc)}
														onCheckedChange={() => handleSelectOne(client.rfc)}
														aria-label={`Seleccionar ${getClientDisplayName(client)}`}
													/>
												</TableCell>
												<TableCell>
													<Link
														href={`/clients/${client.rfc}`}
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
														{client.personType === "physical"
															? "Física"
															: client.personType === "moral"
																? "Moral"
																: "Fideicomiso"}
													</Badge>
												</TableCell>
												<TableCell>
													<Badge
														variant="outline"
														className="min-w-[60px] justify-center font-medium"
													>
														—
													</Badge>
												</TableCell>
												<TableCell className="hidden sm:table-cell">
													<Badge variant="outline" className="font-medium">
														—
													</Badge>
												</TableCell>
												<TableCell className="hidden xl:table-cell">
													<Badge variant="outline" className="font-medium">
														—
													</Badge>
												</TableCell>
												<TableCell className="hidden lg:table-cell text-muted-foreground">
													{formatDate(client.createdAt)}
												</TableCell>
												<TableCell className="hidden md:table-cell text-center">
													<span className="text-muted-foreground">—</span>
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
																className="gap-2 text-[rgb(var(--risk-high))]"
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
										))
									)}
								</TableBody>
							</Table>
						</div>
					)}
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
