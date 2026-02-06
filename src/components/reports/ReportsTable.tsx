"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
	FileText,
	Calendar,
	FileCheck2,
	Send,
	CheckCircle2,
	Clock,
	MoreHorizontal,
	Download,
	Eye,
	Trash2,
	Plus,
	AlertCircle,
} from "lucide-react";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { useJwt } from "@/hooks/useJwt";
import { useOrgStore } from "@/lib/org-store";
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
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/mutations";
import { showFetchError } from "@/lib/toast-utils";
import {
	DataTable,
	type ColumnDef,
	type FilterDef,
} from "@/components/data-table";
import { PageHero, type StatCard } from "@/components/page-hero";
import { formatProperNoun } from "@/lib/utils";
import { useLanguage } from "@/components/LanguageProvider";
import type { TranslationKeys } from "@/lib/translations";
import {
	listReports,
	deleteReport,
	generateReportFile,
	downloadReportFile,
	type Report,
	type ReportType,
	type ReportStatus,
} from "@/lib/api/reports";

const ITEMS_PER_PAGE = 20;

const typeConfig: Record<
	ReportType,
	{ label: TranslationKeys; bgColor: string }
> = {
	MONTHLY: {
		label: "reportTypeMonthly",
		bgColor: "bg-sky-500/20 text-sky-400",
	},
	QUARTERLY: {
		label: "reportTypeQuarterly",
		bgColor: "bg-violet-500/20 text-violet-400",
	},
	ANNUAL: {
		label: "reportTypeAnnual",
		bgColor: "bg-amber-500/20 text-amber-400",
	},
	CUSTOM: {
		label: "reportTypeCustom",
		bgColor: "bg-zinc-500/20 text-zinc-400",
	},
};

const statusConfig: Record<
	ReportStatus,
	{ label: TranslationKeys; icon: React.ReactNode; color: string }
> = {
	DRAFT: {
		label: "statusDraft",
		icon: <Clock className="h-4 w-4" />,
		color: "text-zinc-400",
	},
	GENERATED: {
		label: "statusGenerated",
		icon: <FileCheck2 className="h-4 w-4" />,
		color: "text-sky-400",
	},
};

interface ReportsTableProps {
	filters?: {
		periodType?: ReportType;
		status?: ReportStatus;
	};
}

export function ReportsTable({
	filters,
}: ReportsTableProps): React.ReactElement {
	const { navigateTo, orgPath } = useOrgNavigation();
	const { jwt, isLoading: isJwtLoading } = useJwt();
	const { currentOrg } = useOrgStore();
	const { t } = useLanguage();

	const [reports, setReports] = useState<Report[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [hasMore, setHasMore] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalReports, setTotalReports] = useState(0);

	// Track if initial load has happened for current org
	const hasLoadedForOrgRef = useRef<string | null>(null);
	// Track previous filters to detect changes
	const prevFiltersRef = useRef<typeof filters | null>(null);

	// Fetch reports from API (internal function, not a callback)
	const doFetchReports = async (jwtToken: string) => {
		try {
			setIsLoading(true);
			setReports([]);

			const response = await listReports({
				page: 1,
				limit: ITEMS_PER_PAGE,
				jwt: jwtToken,
				...filters,
			});

			setReports(response.data);
			setTotalReports(response.pagination.total);
			setCurrentPage(1);
			setHasMore(response.pagination.page < response.pagination.totalPages);
		} catch (error) {
			console.error("Error fetching reports:", error);
			showFetchError("reports-table", error);
			if (currentOrg?.id) {
				hasLoadedForOrgRef.current = currentOrg.id;
			}
		} finally {
			setIsLoading(false);
		}
	};

	// Load more reports for infinite scroll
	const loadMore = useCallback(async () => {
		if (!jwt || isLoadingMore || !hasMore) return;

		try {
			setIsLoadingMore(true);
			const nextPage = currentPage + 1;
			const response = await listReports({
				page: nextPage,
				limit: ITEMS_PER_PAGE,
				jwt,
				...filters,
			});

			setReports((prev) => [...prev, ...response.data]);
			setCurrentPage(nextPage);
			setHasMore(response.pagination.page < response.pagination.totalPages);
		} catch (error) {
			console.error("Error loading more reports:", error);
			showFetchError("reports-table-more", error);
		} finally {
			setIsLoadingMore(false);
		}
	}, [jwt, isLoadingMore, hasMore, currentPage, filters, toast]);

	// Silent refresh for auto-refresh (doesn't show loading state)
	const silentRefresh = useCallback(async () => {
		if (!jwt || isJwtLoading || !currentOrg) return;

		try {
			const response = await listReports({
				page: 1,
				limit: ITEMS_PER_PAGE,
				jwt,
				...filters,
			});
			setReports(response.data);
			setTotalReports(response.pagination.total);
			setCurrentPage(1);
			setHasMore(response.pagination.page < response.pagination.totalPages);
		} catch {
			// Silently ignore errors for background refresh
		}
	}, [jwt, isJwtLoading, filters, currentOrg]);

	// Auto-refresh every 30 seconds (only when on first page to avoid disrupting infinite scroll)
	useAutoRefresh(silentRefresh, {
		enabled: !isLoading && !!jwt && !!currentOrg && currentPage === 1,
		interval: 30000,
	});

	// Initial load - refetch when organization changes (not on JWT refresh)
	useEffect(() => {
		if (isJwtLoading || !jwt || !currentOrg?.id) {
			if (!currentOrg?.id && !isJwtLoading) {
				setReports([]);
				setIsLoading(false);
				hasLoadedForOrgRef.current = null;
			}
			return;
		}

		// Skip if we've already loaded for this org (JWT refresh shouldn't trigger reload)
		if (hasLoadedForOrgRef.current === currentOrg.id) {
			return;
		}

		hasLoadedForOrgRef.current = currentOrg.id;
		doFetchReports(jwt);
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
		doFetchReports(jwt);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [filters]);

	// Column definitions
	const columns: ColumnDef<Report>[] = useMemo(
		() => [
			{
				id: "report",
				header: t("reportTableReport"),
				accessorKey: "name",
				sortable: true,
				cell: (item) => {
					const typeCfg = typeConfig[item.periodType];
					const statusCfg = statusConfig[item.status];

					return (
						<div className="flex items-center gap-3">
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<span
											className={`flex items-center justify-center h-8 w-8 rounded-lg ${typeCfg.bgColor}`}
										>
											<FileText className="h-4 w-4" />
										</span>
									</TooltipTrigger>
									<TooltipContent side="right">
										<p>{t(typeCfg.label)}</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
							<div className="flex flex-col min-w-0">
								<div className="flex items-center gap-2">
									<Link
										href={orgPath(`/reports/${item.id}`)}
										className="font-medium text-foreground truncate hover:underline hover:text-primary transition-colors"
									>
										{formatProperNoun(item.name)}
									</Link>
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
												<span className={statusCfg.color}>
													{statusCfg.icon}
												</span>
											</TooltipTrigger>
											<TooltipContent>
												<p>{t(statusCfg.label)}</p>
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								</div>
								<span className="text-xs text-muted-foreground">
									ID: {item.id.slice(0, 12)}
								</span>
							</div>
						</div>
					);
				},
			},
			{
				id: "period",
				header: t("noticePeriod"),
				accessorKey: "reportedMonth",
				hideOnMobile: true,
				cell: (item) => {
					const startDate = new Date(item.periodStart);
					const endDate = new Date(item.periodEnd);
					return (
						<div className="flex flex-col">
							<div className="flex items-center gap-1.5 text-sm text-muted-foreground">
								<Calendar className="h-3.5 w-3.5 flex-shrink-0" />
								<span>{item.reportedMonth}</span>
							</div>
							<span className="text-xs text-muted-foreground">
								{startDate.toLocaleDateString("es-MX", {
									day: "2-digit",
									month: "short",
								})}{" "}
								-{" "}
								{endDate.toLocaleDateString("es-MX", {
									day: "2-digit",
									month: "short",
								})}
							</span>
						</div>
					);
				},
			},
			{
				id: "recordCount",
				header: t("reportTableRecords"),
				accessorKey: "recordCount",
				sortable: true,
				className: "text-center",
				cell: (item) => (
					<span className="font-medium tabular-nums text-foreground">
						{item.recordCount}
					</span>
				),
			},
		],
		[orgPath, t],
	);

	// Filter definitions
	const filterDefs: FilterDef[] = useMemo(
		() => [
			{
				id: "type",
				label: t("reportFilterType"),
				icon: FileText,
				options: [
					{
						value: "MONTHLY",
						label: t("reportTypeMonthly"),
						icon: (
							<span className="flex items-center justify-center h-5 w-5 rounded bg-sky-500/20 text-sky-400">
								<FileText className="h-3 w-3" />
							</span>
						),
					},
					{
						value: "QUARTERLY",
						label: t("reportTypeQuarterly"),
						icon: (
							<span className="flex items-center justify-center h-5 w-5 rounded bg-violet-500/20 text-violet-400">
								<FileText className="h-3 w-3" />
							</span>
						),
					},
					{
						value: "ANNUAL",
						label: t("reportTypeAnnual"),
						icon: (
							<span className="flex items-center justify-center h-5 w-5 rounded bg-amber-500/20 text-amber-400">
								<FileText className="h-3 w-3" />
							</span>
						),
					},
					{
						value: "CUSTOM",
						label: t("reportTypeCustom"),
						icon: (
							<span className="flex items-center justify-center h-5 w-5 rounded bg-zinc-500/20 text-zinc-400">
								<FileText className="h-3 w-3" />
							</span>
						),
					},
				],
			},
			{
				id: "status",
				label: t("reportFilterStatus"),
				icon: Clock,
				options: [
					{
						value: "DRAFT",
						label: t("statusDraft"),
						icon: <Clock className="h-3.5 w-3.5 text-zinc-400" />,
					},
					{
						value: "GENERATED",
						label: t("statusGenerated"),
						icon: <FileCheck2 className="h-3.5 w-3.5 text-sky-400" />,
					},
				],
			},
		],
		[t],
	);

	const handleGenerate = async (report: Report) => {
		if (!jwt) return;
		try {
			const result = await generateReportFile({ id: report.id, jwt });
			toast.success(t("reportGeneratedToast"));
			doFetchReports(jwt);
		} catch (error) {
			console.error("Error generating report:", error);
			toast.error(extractErrorMessage(error), { id: "reports-generate" });
		}
	};

	const handleDownload = async (report: Report) => {
		if (!jwt) return;
		try {
			await downloadReportFile({
				id: report.id,
				jwt,
			});
		} catch (error) {
			console.error("Error downloading report:", error);
			toast.error(extractErrorMessage(error), { id: "reports-download" });
		}
	};

	const handleDelete = async (report: Report) => {
		if (!jwt) return;
		try {
			await deleteReport({ id: report.id, jwt });
			toast.success(`${report.name} ${t("reportDeletedToast")}`);
			doFetchReports(jwt);
		} catch (error) {
			console.error("Error deleting report:", error);
			toast.error(extractErrorMessage(error), { id: "reports-delete" });
		}
	};

	// Row actions
	const renderActions = (item: Report) => (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
					<MoreHorizontal className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-48">
				<DropdownMenuItem
					className="gap-2"
					onClick={() => navigateTo(`/reports/${item.id}`)}
				>
					<Eye className="h-4 w-4" />
					{t("reportViewDetail")}
				</DropdownMenuItem>
				{item.status === "DRAFT" && (
					<DropdownMenuItem
						className="gap-2"
						onClick={() => handleGenerate(item)}
					>
						<FileCheck2 className="h-4 w-4" />
						{t("reportGenerate")}{" "}
						{item.periodType === "MONTHLY" ? "XML y PDF" : "PDF"}
					</DropdownMenuItem>
				)}
				{item.status === "GENERATED" && item.periodType === "MONTHLY" && (
					<DropdownMenuItem
						className="gap-2"
						onClick={() => navigateTo(`/reports/${item.id}`)}
					>
						<Send className="h-4 w-4" />
						{t("reportSendToSat")}
					</DropdownMenuItem>
				)}
				<DropdownMenuSeparator />
				{item.status !== "DRAFT" && (
					<DropdownMenuItem
						className="gap-2"
						onClick={() => handleDownload(item)}
					>
						<Download className="h-4 w-4" />
						{t("reportDownload")}
					</DropdownMenuItem>
				)}
				{item.status === "DRAFT" && (
					<DropdownMenuItem
						className="gap-2 text-destructive"
						onClick={() => handleDelete(item)}
					>
						<Trash2 className="h-4 w-4" />
						{t("delete")}
					</DropdownMenuItem>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);

	// Compute stats from reports data
	const stats: StatCard[] = useMemo(() => {
		const draftReports = reports.filter((r) => r.status === "DRAFT").length;
		const generatedReports = reports.filter(
			(r) => r.status === "GENERATED",
		).length;
		const totalRecords = reports.reduce((sum, r) => sum + r.recordCount, 0);

		return [
			{
				label: t("tableTotalReports"),
				value: totalReports,
				icon: FileText,
			},
			{
				label: t("tableDrafts"),
				value: draftReports,
				icon: Clock,
				variant: "primary",
			},
			{
				label: t("tableGenerated"),
				value: generatedReports,
				icon: FileCheck2,
			},
			{
				label: t("tableTotalRecords"),
				value: totalRecords,
				icon: FileCheck2,
			},
		];
	}, [reports, totalReports, t]);

	// Show error if no organization selected
	if (!currentOrg && !isLoading) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
				<h3 className="text-lg font-medium">{t("reportNoOrg")}</h3>
				<p className="text-muted-foreground">{t("reportNoOrgDesc")}</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<PageHero
				title={t("reportPageTitle")}
				subtitle={t("reportPageSubtitle")}
				icon={FileText}
				stats={stats}
				ctaLabel={t("reportNewReport")}
				ctaIcon={Plus}
				onCtaClick={() => navigateTo("/reports/new")}
			/>
			<DataTable
				data={reports}
				columns={columns}
				filters={filterDefs}
				searchKeys={["id", "name", "reportedMonth"]}
				searchPlaceholder={t("reportSearchPlaceholder")}
				emptyMessage={t("reportNoResults")}
				emptyIcon={FileText}
				loadingMessage={t("reportLoading")}
				isLoading={isLoading || isJwtLoading}
				selectable
				getId={(item) => item.id}
				actions={renderActions}
				paginationMode="infinite-scroll"
				hasMore={hasMore}
				onLoadMore={loadMore}
				isLoadingMore={isLoadingMore}
			/>
		</div>
	);
}
