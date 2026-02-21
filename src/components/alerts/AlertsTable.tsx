"use client";

import { useState, useMemo, useCallback, useRef } from "react";
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
import { useServerTable } from "@/hooks/useServerTable";

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
import { getClientById } from "@/lib/api/clients";
import { showFetchError } from "@/lib/toast-utils";
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
import type { TranslationKeys } from "@/lib/translations";
import {
	listAlerts,
	type Alert,
	type AlertStatus,
	type AlertSeverity,
	type ListAlertsOptions,
} from "@/lib/api/alerts";

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
		label: "alertStatusDetectedLabel",
		icon: <Bell className="h-4 w-4" />,
		bgColor: "bg-amber-500/20 text-amber-400",
	},
	FILE_GENERATED: {
		label: "alertStatusFileGenerated",
		icon: <FileCheck className="h-4 w-4" />,
		bgColor: "bg-sky-500/20 text-sky-400",
	},
	SUBMITTED: {
		label: "alertStatusSentLabel",
		icon: <Send className="h-4 w-4" />,
		bgColor: "bg-emerald-500/20 text-emerald-400",
	},
	OVERDUE: {
		label: "alertStatusOverdueLabel",
		icon: <AlertCircle className="h-4 w-4" />,
		bgColor: "bg-red-500/20 text-red-400",
	},
	CANCELLED: {
		label: "alertStatusCancelled",
		icon: <XCircle className="h-4 w-4" />,
		bgColor: "bg-zinc-500/20 text-zinc-400",
	},
};

const severityConfig: Record<
	AlertSeverity,
	{ label: string; dotColor: string }
> = {
	LOW: { label: "alertSeverityLow", dotColor: "bg-zinc-400" },
	MEDIUM: { label: "alertSeverityMedium", dotColor: "bg-amber-400" },
	HIGH: { label: "alertSeverityHigh", dotColor: "bg-orange-500" },
	CRITICAL: { label: "alertSeverityCritical", dotColor: "bg-red-500" },
};

interface AlertsTableProps {
	filters?: ListAlertsOptions;
}

export function AlertsTable({
	filters: fixedFilters,
}: AlertsTableProps = {}): React.ReactElement {
	const { navigateTo, orgPath } = useOrgNavigation();
	const { t } = useLanguage();

	const [clients, setClients] = useState<Map<string, Client>>(new Map());
	const fetchedClientIdsRef = useRef<Set<string>>(new Set());

	const fetchClientsForAlerts = useCallback(async (alertList: Alert[]) => {
		const uniqueClientIds = [...new Set(alertList.map((a) => a.clientId))];
		const missingIds = uniqueClientIds.filter(
			(id) => !fetchedClientIdsRef.current.has(id),
		);
		if (!missingIds.length) return;

		missingIds.forEach((id) => fetchedClientIdsRef.current.add(id));
		const results = await Promise.allSettled(
			missingIds.map((clientId) =>
				getClientById({ id: clientId }).then((c) => ({ clientId, client: c })),
			),
		);
		setClients((prev) => {
			const merged = new Map(prev);
			for (const r of results) {
				if (r.status === "fulfilled")
					merged.set(r.value.clientId, r.value.client);
			}
			return merged;
		});
	}, []);

	const {
		data: alerts,
		isLoading,
		isLoadingMore,
		hasMore,
		pagination,
		filterMeta,
		handleLoadMore,
		urlFilterProps,
	} = useServerTable<Alert>({
		fetcher: async ({ page, limit, filters, jwt }) => {
			const response = await listAlerts({
				page,
				limit,
				jwt: jwt ?? undefined,
				...(fixedFilters ?? {}),
				filters,
			});
			void fetchClientsForAlerts(response.data);
			return response;
		},
		allowedFilterIds: ALERT_FILTER_IDS,
		paginationMode: "infinite-scroll",
		itemsPerPage: 20,
		onError: (error) => showFetchError("alerts-table", error),
	});

	const alertsData: AlertRow[] = useMemo(
		() =>
			alerts.map((alert) => {
				const client = clients.get(alert.clientId);
				return {
					id: alert.id,
					alertRuleId: alert.alertRuleId,
					ruleName: alert.alertRule?.name ?? "Regla desconocida",
					clientId: alert.clientId,
					clientName: client ? getClientDisplayName(client) : alert.clientId,
					status: alert.status,
					severity: alert.severity,
					submissionDeadline: alert.submissionDeadline,
					isOverdue: alert.isOverdue,
					notes: alert.notes,
					createdAt: alert.createdAt,
				};
			}),
		[alerts, clients],
	);

	const columns: ColumnDef<AlertRow>[] = useMemo(
		() => [
			{
				id: "alert",
				header: t("alertTableAlert"),
				accessorKey: "ruleName",
				cell: (item) => {
					const statusCfg = statusConfig[item.status];
					const severityCfg = severityConfig[item.severity];

					return (
						<div className="flex items-center gap-3">
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
										<p>{t(statusCfg.label as TranslationKeys)}</p>
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
												<p>
													{t("alertSeverityLabel")}:{" "}
													{t(severityCfg.label as TranslationKeys)}
												</p>
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
				header: t("alertTableClient"),
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
				header: t("alertTableDeadline"),
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
				header: t("alertTableCreation"),
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
		[orgPath, t],
	);

	const filterDefs: FilterDef[] = useMemo(
		() => [
			{
				id: "status",
				label: t("alertFilterStatus"),
				icon: Bell,
				options: [
					{
						value: "DETECTED",
						label: t("alertStatusDetectedLabel"),
						icon: (
							<span className="flex items-center justify-center h-5 w-5 rounded bg-amber-500/20 text-amber-400">
								<Bell className="h-3 w-3" />
							</span>
						),
					},
					{
						value: "FILE_GENERATED",
						label: t("alertStatusFileGenerated"),
						icon: (
							<span className="flex items-center justify-center h-5 w-5 rounded bg-sky-500/20 text-sky-400">
								<FileCheck className="h-3 w-3" />
							</span>
						),
					},
					{
						value: "SUBMITTED",
						label: t("alertStatusSentLabel"),
						icon: (
							<span className="flex items-center justify-center h-5 w-5 rounded bg-emerald-500/20 text-emerald-400">
								<Send className="h-3 w-3" />
							</span>
						),
					},
					{
						value: "OVERDUE",
						label: t("alertStatusOverdueLabel"),
						icon: (
							<span className="flex items-center justify-center h-5 w-5 rounded bg-red-500/20 text-red-400">
								<AlertCircle className="h-3 w-3" />
							</span>
						),
					},
					{
						value: "CANCELLED",
						label: t("alertStatusCancelled"),
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
				label: t("alertFilterSeverity"),
				icon: AlertTriangle,
				options: [
					{
						value: "LOW",
						label: t("alertSeverityLow"),
						icon: <span className="h-3 w-3 rounded-full bg-zinc-400" />,
					},
					{
						value: "MEDIUM",
						label: t("alertSeverityMedium"),
						icon: <span className="h-3 w-3 rounded-full bg-amber-400" />,
					},
					{
						value: "HIGH",
						label: t("alertSeverityHigh"),
						icon: <span className="h-3 w-3 rounded-full bg-orange-500" />,
					},
					{
						value: "CRITICAL",
						label: t("alertSeverityCritical"),
						icon: <span className="h-3 w-3 rounded-full bg-red-500" />,
					},
				],
			},
			{
				id: "isOverdue",
				label: t("alertFilterExpiry"),
				icon: Clock,
				options: [
					{
						value: "true",
						label: t("alertFilterOverdue"),
						icon: <AlertCircle className="h-3.5 w-3.5 text-red-400" />,
					},
					{
						value: "false",
						label: t("alertFilterActive"),
						icon: <Clock className="h-3.5 w-3.5 text-emerald-400" />,
					},
				],
			},
		],
		[t],
	);

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
					{t("alertViewDetail")}
				</DropdownMenuItem>
				{item.status === "DETECTED" && (
					<DropdownMenuItem className="gap-2">
						<FileText className="h-4 w-4" />
						{t("alertGenerateFile")}
					</DropdownMenuItem>
				)}
				{item.status === "FILE_GENERATED" && (
					<DropdownMenuItem className="gap-2">
						<Send className="h-4 w-4" />
						{t("alertSendToSat")}
					</DropdownMenuItem>
				)}
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="gap-2"
					onClick={() => navigateTo(`/clients/${item.clientId}`)}
				>
					<User className="h-4 w-4" />
					{t("alertViewClient")}
				</DropdownMenuItem>
				{item.status !== "CANCELLED" && item.status !== "SUBMITTED" && (
					<DropdownMenuItem className="gap-2 text-destructive">
						<XCircle className="h-4 w-4" />
						{t("alertCancelAlertAction")}
					</DropdownMenuItem>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);

	// isOverdue is client-side filter (no server support); convert to string for DataTable filtering
	const alertsWithStringOverdue = useMemo(
		() => alertsData.map((a) => ({ ...a, isOverdue: String(a.isOverdue) })),
		[alertsData],
	);

	const stats: StatCard[] = useMemo(() => {
		const totalAlerts = pagination?.total ?? alertsData.length;
		const detectedAlerts = alertsData.filter(
			(a) => a.status === "DETECTED",
		).length;
		const overdueAlerts = alertsData.filter((a) => a.isOverdue).length;
		const submittedAlerts = alertsData.filter(
			(a) => a.status === "SUBMITTED",
		).length;

		return [
			{ label: t("statsTotalAlerts"), value: totalAlerts, icon: Bell },
			{
				label: t("alertStatusDetected"),
				value: detectedAlerts,
				icon: AlertTriangle,
				variant: "primary",
			},
			{ label: t("alertStatusOverdue"), value: overdueAlerts, icon: Clock },
			{ label: t("alertStatusSubmitted"), value: submittedAlerts, icon: Send },
		];
	}, [alertsData, pagination?.total, t]);

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
				serverFilterMeta={filterMeta}
				serverTotal={pagination?.total}
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
				{...urlFilterProps}
			/>
		</div>
	);
}
