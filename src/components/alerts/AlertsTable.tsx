"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { useDataTableUrlFilters } from "@/hooks/useDataTableUrlFilters";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";

// Filter IDs for URL persistence
const ALERT_FILTER_IDS = ["status", "severity", "isOverdue"];
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useJwt } from "@/hooks/useJwt";
import { useOrgStore } from "@/lib/org-store";
import {
	listAlerts,
	getAlertById,
	type Alert,
	type AlertStatus,
	type AlertSeverity,
	type ListAlertsOptions,
} from "@/lib/api/alerts";
import { getClientById } from "@/lib/api/clients";
import type { Client } from "@/types/client";
import { getClientDisplayName } from "@/types/client";
import {
	DataTable,
	type ColumnDef,
	type FilterDef,
} from "@/components/data-table";
import { formatProperNoun } from "@/lib/utils";
import { PageHero, type StatCard } from "@/components/page-hero";
import { useLanguage } from "@/components/LanguageProvider";

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
	const { navigateTo, orgPath } = useOrgNavigation();
	const { toast } = useToast();
	const { jwt, isLoading: isJwtLoading } = useJwt();
	const { currentOrg } = useOrgStore();
	const urlFilters = useDataTableUrlFilters(ALERT_FILTER_IDS);
	const { t } = useLanguage();
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
					const client = await getClientById({
						id: clientId,
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

	// Track if initial load has happened for current org
	const hasLoadedForOrgRef = useRef<string | null>(null);
	// Track previous filters to detect changes
	const prevFiltersRef = useRef<typeof filters | null>(null);

	// Initial load - refetch when organization changes (not on JWT refresh)
	useEffect(() => {
		// Wait for JWT to be ready and organization to be selected
		// Without an organization, the API will return 403 "Organization Required"
		if (isJwtLoading || !jwt || !currentOrg?.id) {
			// If no org selected, clear data and stop loading
			if (!currentOrg?.id && !isJwtLoading) {
				setAlerts([]);
				setClients(new Map());
				setIsLoading(false);
				hasLoadedForOrgRef.current = null;
			}
			return;
		}

		// Skip if we've already loaded for this org (JWT refresh shouldn't trigger reload)
		if (hasLoadedForOrgRef.current === currentOrg.id) {
			return;
		}

		const fetchAlerts = async () => {
			try {
				setIsLoading(true);
				setCurrentPage(1);
				// Clear existing data when org changes
				setAlerts([]);
				setClients(new Map());

				const response = await listAlerts({
					page: 1,
					limit: ITEMS_PER_PAGE,
					jwt,
					...filters,
				});
				setAlerts(response.data);
				setHasMore(response.pagination.page < response.pagination.totalPages);
				hasLoadedForOrgRef.current = currentOrg.id;

				await fetchClientsForAlerts(response.data);
			} catch (error) {
				console.error("Error fetching alerts:", error);
				toast({
					title: t("errorGeneric"),
					description: t("alertsLoadError"),
					variant: "destructive",
				});
			} finally {
				setIsLoading(false);
			}
		};
		fetchAlerts();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [jwt, isJwtLoading, currentOrg?.id]);

	// Refetch when filters change (after initial load, skip first run)
	useEffect(() => {
		// Skip if not loaded yet
		if (!hasLoadedForOrgRef.current || !jwt || !currentOrg?.id) {
			prevFiltersRef.current = filters;
			return;
		}

		// Skip on first run (initial load already fetched)
		if (prevFiltersRef.current === null) {
			prevFiltersRef.current = filters;
			return;
		}

		// Only refetch if filters actually changed
		if (JSON.stringify(prevFiltersRef.current) === JSON.stringify(filters)) {
			return;
		}

		prevFiltersRef.current = filters;

		const refetchWithFilters = async () => {
			try {
				setIsLoading(true);
				setCurrentPage(1);
				setAlerts([]);

				const response = await listAlerts({
					page: 1,
					limit: ITEMS_PER_PAGE,
					jwt,
					...filters,
				});
				setAlerts(response.data);
				setHasMore(response.pagination.page < response.pagination.totalPages);
				await fetchClientsForAlerts(response.data);
			} catch (error) {
				console.error("Error fetching alerts:", error);
				toast({
					title: t("errorGeneric"),
					description: t("alertsLoadError"),
					variant: "destructive",
				});
			} finally {
				setIsLoading(false);
			}
		};
		refetchWithFilters();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [filters]);

	// Load more alerts for infinite scroll
	const handleLoadMore = useCallback(async () => {
		if (isLoadingMore || !hasMore || isJwtLoading || !jwt || !currentOrg?.id)
			return;

		try {
			setIsLoadingMore(true);
			const nextPage = currentPage + 1;
			const response = await listAlerts({
				page: nextPage,
				limit: ITEMS_PER_PAGE,
				jwt,
				...filters,
			});

			setAlerts((prev) => [...prev, ...response.data]);
			setCurrentPage(nextPage);
			setHasMore(response.pagination.page < response.pagination.totalPages);

			await fetchClientsForAlerts(response.data);
		} catch (error) {
			console.error("Error loading more alerts:", error);
			toast({
				title: t("errorGeneric"),
				description: t("alertsLoadMoreError"),
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
		currentOrg?.id,
	]);

	// Silent refresh for auto-refresh (doesn't show loading state)
	const silentRefresh = useCallback(async () => {
		if (!jwt || isJwtLoading || !currentOrg?.id) return;

		try {
			const response = await listAlerts({
				page: 1,
				limit: ITEMS_PER_PAGE,
				jwt,
				...filters,
			});
			setAlerts(response.data);
			setCurrentPage(1);
			setHasMore(response.pagination.page < response.pagination.totalPages);
			await fetchClientsForAlerts(response.data);
		} catch {
			// Silently ignore errors for background refresh
		}
	}, [jwt, isJwtLoading, filters, fetchClientsForAlerts, currentOrg?.id]);

	// Auto-refresh every 30 seconds (only when on first page to avoid disrupting infinite scroll)
	useAutoRefresh(silentRefresh, {
		enabled: !isLoading && !!jwt && !!currentOrg?.id && currentPage === 1,
		interval: 30000,
	});

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
							<div className="flex flex-col min-w-0 flex-1 max-w-[600px]">
								<div className="flex items-start gap-2">
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
												<span
													className={`h-2 w-2 rounded-full shrink-0 mt-1.5 ${severityCfg.dotColor}`}
												/>
											</TooltipTrigger>
											<TooltipContent>
												<p>Severidad: {severityCfg.label}</p>
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
									<Link
										href={orgPath(`/alerts/${item.id}`)}
										className="font-medium text-foreground hover:text-primary transition-colors line-clamp-3 break-words"
										onClick={(e) => e.stopPropagation()}
									>
										{formatProperNoun(item.ruleName)}
									</Link>
								</div>
								{item.notes && (
									<span className="text-xs text-muted-foreground line-clamp-2 mt-1 break-words">
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
							href={orgPath(`/clients/${item.clientId}`)}
							className="text-sm text-foreground hover:text-primary truncate"
							onClick={(e) => e.stopPropagation()}
						>
							{formatProperNoun(item.clientName)}
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
					onClick={() => navigateTo(`/alerts/${item.id}`)}
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
					onClick={() => navigateTo(`/clients/${item.clientId}`)}
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
				label: t("statsTotalAlerts"),
				value: totalAlerts,
				icon: Bell,
			},
			{
				label: t("alertStatusDetected"),
				value: detectedAlerts,
				icon: AlertTriangle,
				variant: "primary",
			},
			{
				label: t("alertStatusOverdue"),
				value: overdueAlerts,
				icon: Clock,
			},
			{
				label: t("alertStatusSubmitted"),
				value: submittedAlerts,
				icon: Send,
			},
		];
	}, [alertsData, t]);

	return (
		<div className="space-y-6">
			<PageHero
				title={t("alertsTitle")}
				subtitle={t("alertsSubtitle")}
				icon={Bell}
				stats={stats}
				ctaLabel={t("alertsNew")}
				ctaIcon={Plus}
				onCtaClick={() => navigateTo("/alerts/new")}
			/>
			<DataTable
				data={alertsWithStringOverdue as unknown as AlertRow[]}
				columns={columns}
				filters={filterDefs}
				searchKeys={["ruleName", "clientName", "clientId", "notes"]}
				searchPlaceholder={t("alertsSearchPlaceholder")}
				emptyMessage={t("alertNoAlerts")}
				emptyIcon={Bell}
				loadingMessage={t("alertsLoading")}
				isLoading={isLoading}
				selectable
				getId={(item) => item.id}
				actions={renderActions}
				paginationMode="infinite-scroll"
				onLoadMore={handleLoadMore}
				hasMore={hasMore}
				isLoadingMore={isLoadingMore}
				// URL persistence
				initialFilters={urlFilters.initialFilters}
				initialSearch={urlFilters.initialSearch}
				initialSort={urlFilters.initialSort}
				onFiltersChange={urlFilters.onFiltersChange}
				onSearchChange={urlFilters.onSearchChange}
				onSortChange={urlFilters.onSortChange}
			/>
		</div>
	);
}
