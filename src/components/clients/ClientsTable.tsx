"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
	Users,
	Building2,
	User,
	Landmark,
	MapPin,
	MoreHorizontal,
	Eye,
	Edit,
	Flag,
	FileText,
	Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@algtools/ui";
import { useToast } from "@/hooks/use-toast";
import { useJwt } from "@/hooks/useJwt";
import { useOrgStore } from "@/lib/org-store";
import type { Client, PersonType } from "@/types/client";
import { getClientDisplayName } from "@/types/client";
import { listClients, deleteClient } from "@/lib/api/clients";
import {
	DataTable,
	type ColumnDef,
	type FilterDef,
} from "@/components/data-table";

/**
 * Client row with computed display name
 */
interface ClientRow extends Client {
	displayName: string;
}

const personTypeConfig: Record<
	PersonType,
	{ label: string; icon: React.ReactNode; bgColor: string }
> = {
	physical: {
		label: "Persona Física",
		icon: <User className="h-4 w-4" />,
		bgColor: "bg-sky-500/20 text-sky-400",
	},
	moral: {
		label: "Persona Moral",
		icon: <Building2 className="h-4 w-4" />,
		bgColor: "bg-violet-500/20 text-violet-400",
	},
	trust: {
		label: "Fideicomiso",
		icon: <Landmark className="h-4 w-4" />,
		bgColor: "bg-amber-500/20 text-amber-400",
	},
};

export function ClientsTable(): React.ReactElement {
	const router = useRouter();
	const { toast } = useToast();
	const { jwt, isLoading: isJwtLoading } = useJwt();
	const { currentOrg } = useOrgStore();
	const [clients, setClients] = useState<Client[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
	const ITEMS_PER_PAGE = 20;

	// Initial load - refetch when organization changes
	useEffect(() => {
		// Wait for JWT to be ready
		if (isJwtLoading) return;

		const fetchClients = async () => {
			try {
				setIsLoading(true);
				setCurrentPage(1);
				// Clear existing data when org changes
				setClients([]);
				const response = await listClients({
					page: 1,
					limit: ITEMS_PER_PAGE,
					jwt: jwt ?? undefined,
				});
				setClients(response.data);
				setHasMore(response.pagination.page < response.pagination.totalPages);
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
	}, [toast, jwt, isJwtLoading, currentOrg?.id]);

	// Load more clients for infinite scroll
	const handleLoadMore = useCallback(async () => {
		if (isLoadingMore || !hasMore || isJwtLoading) return;

		try {
			setIsLoadingMore(true);
			const nextPage = currentPage + 1;
			const response = await listClients({
				page: nextPage,
				limit: ITEMS_PER_PAGE,
				jwt: jwt ?? undefined,
			});

			setClients((prev) => [...prev, ...response.data]);
			setCurrentPage(nextPage);
			setHasMore(response.pagination.page < response.pagination.totalPages);
		} catch (error) {
			console.error("Error loading more clients:", error);
			toast({
				title: "Error",
				description: "No se pudieron cargar más clientes.",
				variant: "destructive",
			});
		} finally {
			setIsLoadingMore(false);
		}
	}, [currentPage, hasMore, isLoadingMore, isJwtLoading, jwt, toast]);

	// Transform clients to include display name
	const clientsData: ClientRow[] = useMemo(() => {
		return clients.map((client) => ({
			...client,
			displayName: getClientDisplayName(client),
		}));
	}, [clients]);

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
				await deleteClient({ rfc: clientToDelete.rfc, jwt: jwt ?? undefined });
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

	// Column definitions
	const columns: ColumnDef<ClientRow>[] = useMemo(
		() => [
			{
				id: "client",
				header: "Cliente",
				accessorKey: "displayName",
				sortable: true,
				cell: (item) => {
					const config = personTypeConfig[item.personType];
					return (
						<div className="flex items-center gap-3">
							{/* Color-coded icon for person type */}
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<span
											className={`flex items-center justify-center h-8 w-8 rounded-lg ${config.bgColor}`}
										>
											{config.icon}
										</span>
									</TooltipTrigger>
									<TooltipContent side="right">
										<p>{config.label}</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
							<div className="flex flex-col min-w-0">
								<Link
									href={`/clients/${item.rfc}`}
									className="font-medium text-foreground hover:text-primary truncate"
									onClick={(e) => e.stopPropagation()}
								>
									{item.displayName}
								</Link>
								<span className="text-xs text-muted-foreground font-mono">
									{item.rfc}
								</span>
							</div>
						</div>
					);
				},
			},
			{
				id: "contact",
				header: "Contacto",
				accessorKey: "email",
				hideOnMobile: true,
				cell: (item) => (
					<div className="flex flex-col">
						<span className="text-sm text-foreground truncate max-w-[180px]">
							{item.email}
						</span>
						<span className="text-xs text-muted-foreground">{item.phone}</span>
					</div>
				),
			},
			{
				id: "location",
				header: "Ubicación",
				accessorKey: "city",
				sortable: true,
				hideOnMobile: true,
				cell: (item) => (
					<div className="flex items-center gap-1.5 text-sm text-muted-foreground">
						<MapPin className="h-3.5 w-3.5 flex-shrink-0" />
						<span className="truncate">
							{item.city}, {item.stateCode}
						</span>
					</div>
				),
			},
			{
				id: "createdAt",
				header: "Registro",
				accessorKey: "createdAt",
				sortable: true,
				cell: (item) => {
					const date = new Date(item.createdAt);
					return (
						<div className="flex flex-col">
							<span className="text-sm text-foreground tabular-nums">
								{date.toLocaleDateString("es-MX", {
									day: "2-digit",
									month: "short",
								})}
							</span>
							<span className="text-xs text-muted-foreground tabular-nums">
								{date.getFullYear()}
							</span>
						</div>
					);
				},
			},
		],
		[],
	);

	// Filter definitions
	const filterDefs: FilterDef[] = useMemo(
		() => [
			{
				id: "personType",
				label: "Tipo",
				icon: Users,
				options: [
					{
						value: "physical",
						label: "Persona Física",
						icon: (
							<span className="flex items-center justify-center h-5 w-5 rounded bg-sky-500/20 text-sky-400">
								<User className="h-3 w-3" />
							</span>
						),
					},
					{
						value: "moral",
						label: "Persona Moral",
						icon: (
							<span className="flex items-center justify-center h-5 w-5 rounded bg-violet-500/20 text-violet-400">
								<Building2 className="h-3 w-3" />
							</span>
						),
					},
					{
						value: "trust",
						label: "Fideicomiso",
						icon: (
							<span className="flex items-center justify-center h-5 w-5 rounded bg-amber-500/20 text-amber-400">
								<Landmark className="h-3 w-3" />
							</span>
						),
					},
				],
			},
			{
				id: "stateCode",
				label: "Estado",
				icon: MapPin,
				options: [
					{ value: "CDMX", label: "Ciudad de México" },
					{ value: "JAL", label: "Jalisco" },
					{ value: "NLE", label: "Nuevo León" },
					{ value: "QRO", label: "Querétaro" },
					{ value: "MEX", label: "Estado de México" },
				],
			},
		],
		[],
	);

	// Row actions
	const renderActions = (item: ClientRow) => (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
					<MoreHorizontal className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-48">
				<DropdownMenuItem
					className="gap-2"
					onClick={() => router.push(`/clients/${item.rfc}`)}
				>
					<Eye className="h-4 w-4" />
					Ver detalle
				</DropdownMenuItem>
				<DropdownMenuItem
					className="gap-2"
					onClick={() => router.push(`/clients/${item.rfc}/edit`)}
				>
					<Edit className="h-4 w-4" />
					Editar cliente
				</DropdownMenuItem>
				<DropdownMenuItem
					className="gap-2"
					onClick={() => handleGenerateReport(item)}
				>
					<FileText className="h-4 w-4" />
					Generar Reporte
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					onClick={() => router.push(`/transactions?clientId=${item.rfc}`)}
				>
					Ver transacciones
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={() => router.push(`/alerts?clientId=${item.rfc}`)}
				>
					Ver alertas
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="gap-2 text-[rgb(var(--risk-high))]"
					onClick={() => handleFlagSuspicious(item)}
				>
					<Flag className="h-4 w-4" />
					Marcar como Sospechoso
				</DropdownMenuItem>
				<DropdownMenuItem
					className="gap-2 text-destructive"
					onClick={() => handleDeleteClick(item)}
				>
					<Trash2 className="h-4 w-4" />
					Eliminar
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);

	return (
		<>
			<DataTable
				data={clientsData}
				columns={columns}
				filters={filterDefs}
				searchKeys={[
					"displayName",
					"rfc",
					"email",
					"city",
					"businessName",
					"firstName",
					"lastName",
				]}
				searchPlaceholder="Buscar por nombre, RFC, email..."
				emptyMessage="No se encontraron clientes"
				loadingMessage="Cargando clientes..."
				isLoading={isLoading}
				selectable
				getId={(item) => item.rfc}
				actions={renderActions}
				paginationMode="infinite-scroll"
				onLoadMore={handleLoadMore}
				hasMore={hasMore}
				isLoadingMore={isLoadingMore}
			/>

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
