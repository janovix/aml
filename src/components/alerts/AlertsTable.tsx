"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
	AlertTriangle,
	Bell,
	FileCheck,
	Send,
	Clock,
	XCircle,
	MoreHorizontal,
	AlertCircle,
	Eye,
	FileText,
	User,
	Plus,
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
} from "@algtools/ui";
import { useToast } from "@/hooks/use-toast";
import { useJwt } from "@/hooks/useJwt";
import {
	listAlerts,
	getAlertById,
	type Alert,
	type AlertStatus,
	type AlertSeverity,
	type ListAlertsOptions,
} from "@/lib/api/alerts";
import { getClientByRfc } from "@/lib/api/clients";
import type { Client } from "@/types/client";
import { getClientDisplayName } from "@/types/client";
import {
	DataTable,
	type ColumnDef,
	type FilterDef,
} from "@/components/data-table";
import { PageHero, type StatCard } from "@/components/page-hero";

/**
 * Extended alert row with resolved client and rule names
 */
interface AlertRow {
	id: string;
	alertRuleId: string;
	ruleName: string;
	clientId: string;
	clientName: string;
	status: AlertStatus;
	severity: AlertSeverity;
	submissionDeadline?: string;
	isOverdue: boolean;
	notes?: string;
	createdAt: string;
}

const statusConfig: Record<
	AlertStatus,
	{ label: string; icon: React.ReactNode; bgColor: string }
> = {
	DETECTED: {
		label: "Detectada",
		icon: <Bell className="h-4 w-4" />,
		bgColor: "bg-amber-500/20 text-amber-400",
	},
	FILE_GENERATED: {
		label: "Archivo Generado",
		icon: <FileCheck className="h-4 w-4" />,
		bgColor: "bg-sky-500/20 text-sky-400",
	},
	SUBMITTED: {
		label: "Enviada",
		icon: <Send className="h-4 w-4" />,
		bgColor: "bg-emerald-500/20 text-emerald-400",
	},
	OVERDUE: {
		label: "Vencida",
		icon: <AlertCircle className="h-4 w-4" />,
		bgColor: "bg-red-500/20 text-red-400",
	},
	CANCELLED: {
		label: "Cancelada",
		icon: <XCircle className="h-4 w-4" />,
		bgColor: "bg-zinc-500/20 text-zinc-400",
	},
};

const severityConfig: Record<
	AlertSeverity,
	{ label: string; dotColor: string }
> = {
	LOW: { label: "Baja", dotColor: "bg-zinc-400" },
	MEDIUM: { label: "Media", dotColor: "bg-amber-400" },
	HIGH: { label: "Alta", dotColor: "bg-orange-500" },
	CRITICAL: { label: "Crítica", dotColor: "bg-red-500" },
};

interface AlertsTableProps {
	filters?: ListAlertsOptions;
}

export function AlertsTable({
	filters,
}: AlertsTableProps = {}): React.ReactElement {
	const router = useRouter();
	const { toast } = useToast();
	const { jwt, isLoading: isJwtLoading } = useJwt();
	const [alerts, setAlerts] = useState<Alert[]>([]);
	const [clients, setClients] = useState<Map<string, Client>>(new Map());
	const [isLoading, setIsLoading] = useState(true);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const ITEMS_PER_PAGE = 20;

	// Fetch client information for alerts - optimized to only fetch missing clients
	const fetchClientsForAlerts = useCallback(
		async (alertList: Alert[]) => {
			const uniqueClientIds = [
				...new Set(alertList.map((alert) => alert.clientId)),
			];

			// Filter out clients we already have
			const missingClientIds = uniqueClientIds.filter(
				(clientId) => !clients.has(clientId),
			);

			// If all clients are already loaded, skip fetching
			if (missingClientIds.length === 0) {
				return;
			}

			// Fetch only missing clients in parallel
			const clientPromises = missingClientIds.map(async (clientId) => {
				try {
					const client = await getClientByRfc({
						rfc: clientId,
						jwt: jwt ?? undefined,
					});
					return { clientId, client };
				} catch (error) {
					console.error(`Error fetching client ${clientId}:`, error);
					return null;
				}
			});

			const results = await Promise.all(clientPromises);

			setClients((prev) => {
				const merged = new Map(prev);
				results.forEach((result) => {
					if (result) {
						merged.set(result.clientId, result.client);
					}
				});
				return merged;
			});
		},
		[jwt, clients],
	);

	// Initial load
	useEffect(() => {
		// Wait for JWT to be ready
		if (isJwtLoading) return;

		const fetchAlerts = async () => {
			try {
				setIsLoading(true);
				setCurrentPage(1);
				const response = await listAlerts({
					page: 1,
					limit: ITEMS_PER_PAGE,
					jwt: jwt ?? undefined,
					...filters,
				});
				setAlerts(response.data);
				setHasMore(response.pagination.page < response.pagination.totalPages);

				await fetchClientsForAlerts(response.data);
			} catch (error) {
				console.error("Error fetching alerts:", error);
				toast({
					title: "Error",
					description: "No se pudieron cargar las alertas.",
					variant: "destructive",
				});
			} finally {
				setIsLoading(false);
			}
		};
		fetchAlerts();
	}, [filters, toast, jwt, isJwtLoading, fetchClientsForAlerts]);

	// Load more alerts for infinite scroll
	const handleLoadMore = useCallback(async () => {
		if (isLoadingMore || !hasMore || isJwtLoading) return;

		try {
			setIsLoadingMore(true);
			const nextPage = currentPage + 1;
			const response = await listAlerts({
				page: nextPage,
				limit: ITEMS_PER_PAGE,
				jwt: jwt ?? undefined,
				...filters,
			});

			setAlerts((prev) => [...prev, ...response.data]);
			setCurrentPage(nextPage);
			setHasMore(response.pagination.page < response.pagination.totalPages);

			await fetchClientsForAlerts(response.data);
		} catch (error) {
			console.error("Error loading more alerts:", error);
			toast({
				title: "Error",
				description: "No se pudieron cargar más alertas.",
				variant: "destructive",
			});
		} finally {
			setIsLoadingMore(false);
		}
	}, [
		currentPage,
		hasMore,
		isLoadingMore,
		isJwtLoading,
		jwt,
		filters,
		toast,
		fetchClientsForAlerts,
	]);

	// Transform Alert to AlertRow format
	const alertsData: AlertRow[] = useMemo(() => {
		return alerts.map((alert) => {
			const client = clients.get(alert.clientId);
			return {
				id: alert.id,
				alertRuleId: alert.alertRuleId,
				ruleName: alert.alertRule?.name || "Regla desconocida",
				clientId: alert.clientId,
				clientName: client ? getClientDisplayName(client) : alert.clientId,
				status: alert.status,
				severity: alert.severity,
				submissionDeadline: alert.submissionDeadline,
				isOverdue: alert.isOverdue,
				notes: alert.notes,
				createdAt: alert.createdAt,
			};
		});
	}, [alerts, clients]);

	// Column definitions
	const columns: ColumnDef<AlertRow>[] = useMemo(
		() => [
			{
				id: "alert",
				header: "Alerta",
				accessorKey: "ruleName",
				cell: (item) => {
					const statusCfg = statusConfig[item.status];
					const severityCfg = severityConfig[item.severity];

					return (
						<div className="flex items-center gap-3">
							{/* Status icon */}
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<span
											className={`flex items-center justify-center h-8 w-8 rounded-lg ${statusCfg.bgColor}`}
										>
											{statusCfg.icon}
										</span>
									</TooltipTrigger>
									<TooltipContent side="right">
										<p>{statusCfg.label}</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
							<div className="flex flex-col min-w-0">
								<div className="flex items-center gap-2">
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
												<span
													className={`h-2 w-2 rounded-full flex-shrink-0 ${severityCfg.dotColor}`}
												/>
											</TooltipTrigger>
											<TooltipContent>
												<p>Severidad: {severityCfg.label}</p>
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
									<span className="font-medium text-foreground truncate">
										{item.ruleName}
									</span>
								</div>
								{item.notes && (
									<span className="text-xs text-muted-foreground line-clamp-1">
										{item.notes}
									</span>
								)}
							</div>
						</div>
					);
				},
			},
			{
				id: "client",
				header: "Cliente",
				accessorKey: "clientName",
				sortable: true,
				hideOnMobile: true,
				cell: (item) => (
					<div className="flex flex-col min-w-0">
						<Link
							href={`/clients/${item.clientId}`}
							className="text-sm text-foreground hover:text-primary truncate"
							onClick={(e) => e.stopPropagation()}
						>
							{item.clientName}
						</Link>
						<span className="text-xs text-muted-foreground font-mono">
							{item.clientId}
						</span>
					</div>
				),
			},
			{
				id: "deadline",
				header: "Fecha Límite",
				accessorKey: "submissionDeadline",
				sortable: true,
				cell: (item) => {
					if (!item.submissionDeadline) {
						return <span className="text-muted-foreground text-sm">—</span>;
					}
					const deadline = new Date(item.submissionDeadline);
					return (
						<div
							className={`flex flex-col ${item.isOverdue ? "text-red-400" : ""}`}
						>
							<span className="text-sm tabular-nums">
								{deadline.toLocaleDateString("es-MX", {
									day: "2-digit",
									month: "short",
								})}
							</span>
							<span className="text-xs text-muted-foreground tabular-nums">
								{deadline.getFullYear()}
							</span>
						</div>
					);
				},
			},
			{
				id: "createdAt",
				header: "Creación",
				accessorKey: "createdAt",
				sortable: true,
				hideOnMobile: true,
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
				id: "status",
				label: "Estado",
				icon: Bell,
				options: [
					{
						value: "DETECTED",
						label: "Detectada",
						icon: (
							<span className="flex items-center justify-center h-5 w-5 rounded bg-amber-500/20 text-amber-400">
								<Bell className="h-3 w-3" />
							</span>
						),
					},
					{
						value: "FILE_GENERATED",
						label: "Archivo Generado",
						icon: (
							<span className="flex items-center justify-center h-5 w-5 rounded bg-sky-500/20 text-sky-400">
								<FileCheck className="h-3 w-3" />
							</span>
						),
					},
					{
						value: "SUBMITTED",
						label: "Enviada",
						icon: (
							<span className="flex items-center justify-center h-5 w-5 rounded bg-emerald-500/20 text-emerald-400">
								<Send className="h-3 w-3" />
							</span>
						),
					},
					{
						value: "OVERDUE",
						label: "Vencida",
						icon: (
							<span className="flex items-center justify-center h-5 w-5 rounded bg-red-500/20 text-red-400">
								<AlertCircle className="h-3 w-3" />
							</span>
						),
					},
					{
						value: "CANCELLED",
						label: "Cancelada",
						icon: (
							<span className="flex items-center justify-center h-5 w-5 rounded bg-zinc-500/20 text-zinc-400">
								<XCircle className="h-3 w-3" />
							</span>
						),
					},
				],
			},
			{
				id: "severity",
				label: "Severidad",
				icon: AlertTriangle,
				options: [
					{
						value: "LOW",
						label: "Baja",
						icon: <span className="h-3 w-3 rounded-full bg-zinc-400" />,
					},
					{
						value: "MEDIUM",
						label: "Media",
						icon: <span className="h-3 w-3 rounded-full bg-amber-400" />,
					},
					{
						value: "HIGH",
						label: "Alta",
						icon: <span className="h-3 w-3 rounded-full bg-orange-500" />,
					},
					{
						value: "CRITICAL",
						label: "Crítica",
						icon: <span className="h-3 w-3 rounded-full bg-red-500" />,
					},
				],
			},
			{
				id: "isOverdue",
				label: "Vencimiento",
				icon: Clock,
				options: [
					{
						value: "true",
						label: "Vencidas",
						icon: <AlertCircle className="h-3.5 w-3.5 text-red-400" />,
					},
					{
						value: "false",
						label: "Vigentes",
						icon: <Clock className="h-3.5 w-3.5 text-emerald-400" />,
					},
				],
			},
		],
		[],
	);

	// Row actions
	const renderActions = (item: AlertRow) => (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
					<MoreHorizontal className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-48">
				<DropdownMenuItem
					className="gap-2"
					onClick={() => router.push(`/alerts/${item.id}`)}
				>
					<Eye className="h-4 w-4" />
					Ver detalle
				</DropdownMenuItem>
				{item.status === "DETECTED" && (
					<DropdownMenuItem className="gap-2">
						<FileText className="h-4 w-4" />
						Generar archivo
					</DropdownMenuItem>
				)}
				{item.status === "FILE_GENERATED" && (
					<DropdownMenuItem className="gap-2">
						<Send className="h-4 w-4" />
						Enviar a SAT
					</DropdownMenuItem>
				)}
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="gap-2"
					onClick={() => router.push(`/clients/${item.clientId}`)}
				>
					<User className="h-4 w-4" />
					Ver cliente
				</DropdownMenuItem>
				{item.status !== "CANCELLED" && item.status !== "SUBMITTED" && (
					<DropdownMenuItem className="gap-2 text-destructive">
						<XCircle className="h-4 w-4" />
						Cancelar alerta
					</DropdownMenuItem>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);

	// Convert isOverdue boolean to string for filtering
	const alertsWithStringOverdue = useMemo(() => {
		return alertsData.map((alert) => ({
			...alert,
			isOverdue: String(alert.isOverdue),
		}));
	}, [alertsData]);

	// Compute stats from alerts data
	const stats: StatCard[] = useMemo(() => {
		const totalAlerts = alertsData.length;
		const detectedAlerts = alertsData.filter(
			(a) => a.status === "DETECTED",
		).length;
		const overdueAlerts = alertsData.filter((a) => a.isOverdue).length;
		const submittedAlerts = alertsData.filter(
			(a) => a.status === "SUBMITTED",
		).length;

		return [
			{
				label: "Total Alertas",
				value: totalAlerts,
				icon: Bell,
			},
			{
				label: "Detectadas",
				value: detectedAlerts,
				icon: AlertTriangle,
				variant: "primary",
			},
			{
				label: "Vencidas",
				value: overdueAlerts,
				icon: Clock,
			},
			{
				label: "Enviadas",
				value: submittedAlerts,
				icon: Send,
			},
		];
	}, [alertsData]);

	return (
		<div className="space-y-6">
			<PageHero
				title="Alertas"
				subtitle="Monitoreo y gestión de alertas AML"
				icon={Bell}
				stats={stats}
				ctaLabel="Nueva Alerta"
				ctaIcon={Plus}
				onCtaClick={() => router.push("/alerts/new")}
			/>
			<DataTable
				data={alertsWithStringOverdue as unknown as AlertRow[]}
				columns={columns}
				filters={filterDefs}
				searchKeys={["ruleName", "clientName", "clientId", "notes"]}
				searchPlaceholder="Buscar por regla, cliente..."
				emptyMessage="No se encontraron alertas"
				loadingMessage="Cargando alertas..."
				isLoading={isLoading}
				selectable
				getId={(item) => item.id}
				actions={renderActions}
				paginationMode="infinite-scroll"
				onLoadMore={handleLoadMore}
				hasMore={hasMore}
				isLoadingMore={isLoadingMore}
			/>
		</div>
	);
}
