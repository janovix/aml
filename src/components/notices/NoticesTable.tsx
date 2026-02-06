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
	FileWarning,
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
import {
	listNotices,
	deleteNotice,
	generateNoticeFile,
	downloadNoticeXml,
	type Notice,
	type NoticeStatus,
} from "@/lib/api/notices";

const ITEMS_PER_PAGE = 20;

import type { TranslationKeys } from "@/lib/translations";

const statusConfig: Record<
	NoticeStatus,
	{
		label: TranslationKeys;
		icon: React.ReactNode;
		color: string;
		bgColor: string;
	}
> = {
	DRAFT: {
		label: "statusDraft",
		icon: <Clock className="h-4 w-4" />,
		color: "text-zinc-400",
		bgColor: "bg-zinc-500/20",
	},
	GENERATED: {
		label: "statusGenerated",
		icon: <FileCheck2 className="h-4 w-4" />,
		color: "text-blue-400",
		bgColor: "bg-blue-500/20",
	},
	SUBMITTED: {
		label: "noticeTableSent",
		icon: <Send className="h-4 w-4" />,
		color: "text-amber-400",
		bgColor: "bg-amber-500/20",
	},
	ACKNOWLEDGED: {
		label: "noticeFilterAcknowledged",
		icon: <CheckCircle2 className="h-4 w-4" />,
		color: "text-emerald-400",
		bgColor: "bg-emerald-500/20",
	},
};

interface NoticesTableProps {
	filters?: {
		status?: NoticeStatus;
		year?: number;
	};
}

export function NoticesTable({
	filters,
}: NoticesTableProps): React.ReactElement {
	const { navigateTo, orgPath } = useOrgNavigation();
	const { jwt, isLoading: isJwtLoading } = useJwt();
	const { currentOrg } = useOrgStore();
	const { t } = useLanguage();

	const [notices, setNotices] = useState<Notice[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [hasMore, setHasMore] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalNotices, setTotalNotices] = useState(0);

	const hasLoadedForOrgRef = useRef<string | null>(null);
	const prevFiltersRef = useRef<typeof filters | null>(null);

	const doFetchNotices = async (jwtToken: string) => {
		try {
			setIsLoading(true);
			setNotices([]);

			const response = await listNotices({
				page: 1,
				limit: ITEMS_PER_PAGE,
				jwt: jwtToken,
				...filters,
			});

			setNotices(response.data);
			setTotalNotices(response.pagination.total);
			setCurrentPage(1);
			setHasMore(response.pagination.page < response.pagination.totalPages);
		} catch (error) {
			console.error("Error fetching notices:", error);
			showFetchError("notices-table", error);
			if (currentOrg?.id) {
				hasLoadedForOrgRef.current = currentOrg.id;
			}
		} finally {
			setIsLoading(false);
		}
	};

	const loadMore = useCallback(async () => {
		if (!jwt || isLoadingMore || !hasMore) return;

		try {
			setIsLoadingMore(true);
			const nextPage = currentPage + 1;
			const response = await listNotices({
				page: nextPage,
				limit: ITEMS_PER_PAGE,
				jwt,
				...filters,
			});

			setNotices((prev) => [...prev, ...response.data]);
			setCurrentPage(nextPage);
			setHasMore(response.pagination.page < response.pagination.totalPages);
		} catch (error) {
			console.error("Error loading more notices:", error);
			showFetchError("notices-table-more", error);
		} finally {
			setIsLoadingMore(false);
		}
	}, [jwt, isLoadingMore, hasMore, currentPage, filters, toast]);

	const silentRefresh = useCallback(async () => {
		if (!jwt || isJwtLoading || !currentOrg) return;

		try {
			const response = await listNotices({
				page: 1,
				limit: ITEMS_PER_PAGE,
				jwt,
				...filters,
			});
			setNotices(response.data);
			setTotalNotices(response.pagination.total);
			setCurrentPage(1);
			setHasMore(response.pagination.page < response.pagination.totalPages);
		} catch {
			// Silently ignore errors for background refresh
		}
	}, [jwt, isJwtLoading, filters, currentOrg]);

	useAutoRefresh(silentRefresh, {
		enabled: !isLoading && !!jwt && !!currentOrg && currentPage === 1,
		interval: 30000,
	});

	useEffect(() => {
		if (isJwtLoading || !jwt || !currentOrg?.id) {
			if (!currentOrg?.id && !isJwtLoading) {
				setNotices([]);
				setIsLoading(false);
				hasLoadedForOrgRef.current = null;
			}
			return;
		}

		if (hasLoadedForOrgRef.current === currentOrg.id) {
			return;
		}

		hasLoadedForOrgRef.current = currentOrg.id;
		doFetchNotices(jwt);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [jwt, isJwtLoading, currentOrg?.id]);

	useEffect(() => {
		if (!hasLoadedForOrgRef.current || !jwt || !currentOrg?.id) {
			prevFiltersRef.current = filters;
			return;
		}

		if (prevFiltersRef.current === null) {
			prevFiltersRef.current = filters;
			return;
		}

		if (JSON.stringify(prevFiltersRef.current) === JSON.stringify(filters)) {
			return;
		}

		prevFiltersRef.current = filters;
		doFetchNotices(jwt);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [filters]);

	const columns: ColumnDef<Notice>[] = useMemo(
		() => [
			{
				id: "notice",
				header: t("noticeTableNotice"),
				accessorKey: "name",
				sortable: true,
				cell: (item) => {
					const statusCfg = statusConfig[item.status];

					return (
						<div className="flex items-center gap-3">
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<span
											className={`flex items-center justify-center h-8 w-8 rounded-lg ${statusCfg.bgColor} ${statusCfg.color}`}
										>
											<FileWarning className="h-4 w-4" />
										</span>
									</TooltipTrigger>
									<TooltipContent side="right">
										<p>{t("noticeTableSatNotice")}</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
							<div className="flex flex-col min-w-0">
								<div className="flex items-center gap-2">
									<Link
										href={orgPath(`/notices/${item.id}`)}
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
				header: t("tableSatPeriod"),
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
				header: t("noticeAlerts"),
				accessorKey: "recordCount",
				sortable: true,
				className: "text-center",
				cell: (item) => (
					<span className="font-medium tabular-nums text-foreground">
						{item.recordCount}
					</span>
				),
			},
			{
				id: "status",
				header: t("alertFilterStatus"),
				accessorKey: "status",
				sortable: true,
				cell: (item) => {
					const statusCfg = statusConfig[item.status];
					return (
						<span
							className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${statusCfg.bgColor} ${statusCfg.color}`}
						>
							{statusCfg.icon}
							{t(statusCfg.label)}
						</span>
					);
				},
			},
			{
				id: "submittedAt",
				header: t("noticeTableSent"),
				accessorKey: "submittedAt",
				sortable: true,
				cell: (item) => {
					if (!item.submittedAt) {
						return <span className="text-muted-foreground text-sm">—</span>;
					}
					const date = new Date(item.submittedAt);
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
				label: t("noticeFilterStatus"),
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
						icon: <FileCheck2 className="h-3.5 w-3.5 text-blue-400" />,
					},
					{
						value: "SUBMITTED",
						label: t("noticeFilterSent"),
						icon: <Send className="h-3.5 w-3.5 text-amber-400" />,
					},
					{
						value: "ACKNOWLEDGED",
						label: t("noticeFilterAcknowledged"),
						icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />,
					},
				],
			},
		],
		[t],
	);

	const handleGenerate = async (notice: Notice) => {
		if (!jwt) return;
		try {
			const result = await generateNoticeFile({ id: notice.id, jwt });
			toast.success(
				`${t("noticeXmlGeneratedToast")} ${result.alertCount} ${t("noticeAlertsSuffix")}`,
			);
			doFetchNotices(jwt);
		} catch (error) {
			console.error("Error generating notice:", error);
			toast.error(extractErrorMessage(error), { id: "notices-generate" });
		}
	};

	const handleDownload = async (notice: Notice) => {
		if (!jwt) return;
		try {
			await downloadNoticeXml({ id: notice.id, jwt });
		} catch (error) {
			console.error("Error downloading notice:", error);
			toast.error(extractErrorMessage(error), { id: "notices-download" });
		}
	};

	const handleDelete = async (notice: Notice) => {
		if (!jwt) return;
		try {
			await deleteNotice({ id: notice.id, jwt });
			toast.success(`${notice.name} ${t("noticeDeletedToast")}`);
			doFetchNotices(jwt);
		} catch (error) {
			console.error("Error deleting notice:", error);
			toast.error(extractErrorMessage(error), { id: "notices-delete" });
		}
	};

	const renderActions = (item: Notice) => (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
					<MoreHorizontal className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-48">
				<DropdownMenuItem
					className="gap-2"
					onClick={() => navigateTo(`/notices/${item.id}`)}
				>
					<Eye className="h-4 w-4" />
					{t("noticeViewDetail")}
				</DropdownMenuItem>
				{item.status === "DRAFT" && (
					<DropdownMenuItem
						className="gap-2"
						onClick={() => handleGenerate(item)}
					>
						<FileCheck2 className="h-4 w-4" />
						{t("noticeGenerateXml")}
					</DropdownMenuItem>
				)}
				{item.status === "GENERATED" && (
					<DropdownMenuItem
						className="gap-2"
						onClick={() => navigateTo(`/notices/${item.id}`)}
					>
						<Send className="h-4 w-4" />
						{t("noticeSendToSat")}
					</DropdownMenuItem>
				)}
				<DropdownMenuSeparator />
				{item.status !== "DRAFT" && (
					<DropdownMenuItem
						className="gap-2"
						onClick={() => handleDownload(item)}
					>
						<Download className="h-4 w-4" />
						{t("noticeDownloadXml")}
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

	const stats: StatCard[] = useMemo(() => {
		const draftNotices = notices.filter((n) => n.status === "DRAFT").length;
		const pendingSubmission = notices.filter(
			(n) => n.status === "GENERATED",
		).length;
		const submittedNotices = notices.filter(
			(n) => n.status === "SUBMITTED" || n.status === "ACKNOWLEDGED",
		).length;
		const totalAlerts = notices.reduce((sum, n) => sum + n.recordCount, 0);

		return [
			{
				label: t("noticeTotalNotices"),
				value: totalNotices,
				icon: FileWarning,
			},
			{
				label: t("noticePendingCount"),
				value: draftNotices + pendingSubmission,
				icon: Clock,
				variant: "primary",
			},
			{
				label: t("noticeSentCount"),
				value: submittedNotices,
				icon: Send,
			},
			{
				label: t("noticeTotalAlerts"),
				value: totalAlerts,
				icon: FileCheck2,
			},
		];
	}, [notices, totalNotices, t]);

	if (!currentOrg && !isLoading) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
				<h3 className="text-lg font-medium">{t("noticeNoOrg")}</h3>
				<p className="text-muted-foreground">{t("noticeNoOrgDesc")}</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<PageHero
				title={t("noticeTitle")}
				subtitle={t("noticeSubtitle")}
				icon={FileWarning}
				stats={stats}
				ctaLabel={t("noticeNewNotice")}
				ctaIcon={Plus}
				onCtaClick={() => navigateTo("/notices/new")}
			/>
			<DataTable
				data={notices}
				columns={columns}
				filters={filterDefs}
				searchKeys={["id", "name", "reportedMonth"]}
				searchPlaceholder={t("noticeSearchPlaceholder")}
				emptyMessage={t("noticeNoResults")}
				emptyIcon={FileWarning}
				loadingMessage={t("noticeLoading")}
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
