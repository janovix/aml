"use client";

import { useMemo, useCallback } from "react";
import { Shield } from "lucide-react";
import Link from "next/link";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import {
	useServerTable,
	type FetchParams,
	type FetchResult,
} from "@/hooks/useServerTable";
import { DataTable, type ColumnDef } from "@/components/data-table";
import { PageHero, type StatCard } from "@/components/page-hero";
import { useLanguage } from "@/components/LanguageProvider";
import { RiskBadge, DDBadge } from "@/components/risk/RiskBadge";
import { showFetchError } from "@/lib/toast-utils";
import type { FilterMetaDef } from "@/types/list-result";
import {
	listRiskEvaluations,
	type RiskEvaluationRow,
	type RiskLevel,
} from "@/lib/api/risk";

const EVALUATION_FILTER_IDS = ["riskLevel", "triggerReason"];

interface EvaluationsTableProps {
	clientId?: string;
}

export function EvaluationsTable({
	clientId,
}: EvaluationsTableProps): React.ReactElement {
	const { orgPath } = useOrgNavigation();
	const { t } = useLanguage();

	const fixedFilters = useMemo(
		() => (clientId ? { clientId } : undefined),
		[clientId],
	);

	const fetcher = useCallback(
		async (params: FetchParams): Promise<FetchResult<RiskEvaluationRow>> => {
			const riskLevel = params.filters.riskLevel?.[0] ?? "";
			const triggerReason = params.filters.triggerReason?.[0] ?? "";

			const response = await listRiskEvaluations({
				page: params.page,
				limit: params.limit,
				search: params.search,
				riskLevel,
				triggerReason,
				clientId,
				sort: params.sort.field ?? "assessedAt",
				direction: params.sort.direction as "asc" | "desc",
				jwt: params.jwt ?? undefined,
			});

			const filterMeta: FilterMetaDef[] = [
				{
					id: "riskLevel",
					label: t("riskEvalFilterRiskLevel"),
					type: "enum" as const,
					options: response.filterMeta.riskLevels.map((r) => ({
						value: r.value,
						label: r.value.replace("_", " "),
						count: r.count,
					})),
				},
				{
					id: "triggerReason",
					label: t("riskEvalFilterTrigger"),
					type: "enum" as const,
					options: response.filterMeta.triggerReasons.map((r) => ({
						value: r.value ?? "",
						label: r.value ?? "—",
						count: r.count,
					})),
				},
			];

			return {
				data: response.data,
				pagination: response.pagination,
				filterMeta,
			};
		},
		[clientId, t],
	);

	const {
		data: evaluations,
		isLoading,
		isLoadingMore,
		hasMore,
		pagination,
		filterMeta,
		handleLoadMore,
		urlFilterProps,
	} = useServerTable<RiskEvaluationRow>({
		fetcher,
		allowedFilterIds: EVALUATION_FILTER_IDS,
		paginationMode: "infinite-scroll",
		itemsPerPage: 20,
		fixedFilters,
		onError: (error) => showFetchError("evaluations-table", error),
	});

	const stats: StatCard[] = useMemo(() => {
		if (!pagination) return [];
		return [
			{
				label: t("riskEvalStatsTotal"),
				value: pagination.total,
				icon: Shield,
			},
		];
	}, [pagination, t]);

	const columns: ColumnDef<RiskEvaluationRow>[] = useMemo(
		() => [
			{
				id: "clientName",
				header: t("riskEvalColClient"),
				accessorKey: "clientName",
				cell: (row) => (
					<div className="flex flex-col">
						<Link
							href={orgPath(`/clients/${row.clientId}`)}
							className="font-medium text-foreground hover:underline"
						>
							{row.clientName}
						</Link>
						<span className="text-xs text-muted-foreground">
							{row.clientRfc}
						</span>
					</div>
				),
			},
			{
				id: "riskLevel",
				header: t("riskEvalColRiskLevel"),
				accessorKey: "riskLevel",
				cell: (row) => <RiskBadge level={row.riskLevel as RiskLevel} />,
				sortable: true,
			},
			{
				id: "dueDiligenceLevel",
				header: t("riskEvalColDDLevel"),
				accessorKey: "dueDiligenceLevel",
				cell: (row) => (
					<DDBadge
						level={
							row.dueDiligenceLevel as "SIMPLIFIED" | "STANDARD" | "ENHANCED"
						}
					/>
				),
			},
			{
				id: "residualRiskScore",
				header: t("riskEvalColResidualScore"),
				accessorKey: "residualRiskScore",
				cell: (row) => (
					<span className="font-mono text-sm">
						{row.residualRiskScore.toFixed(2)}
					</span>
				),
				sortable: true,
			},
			{
				id: "inherentRiskScore",
				header: t("riskEvalColInherentScore"),
				accessorKey: "inherentRiskScore",
				cell: (row) => (
					<span className="font-mono text-sm text-muted-foreground">
						{row.inherentRiskScore.toFixed(2)}
					</span>
				),
				sortable: true,
			},
			{
				id: "triggerReason",
				header: t("riskEvalColTrigger"),
				accessorKey: "triggerReason",
				cell: (row) => (
					<span className="text-sm text-muted-foreground">
						{row.triggerReason ?? "—"}
					</span>
				),
			},
			{
				id: "assessedAt",
				header: t("riskEvalColDate"),
				accessorKey: "assessedAt",
				cell: (row) => (
					<span className="text-sm text-muted-foreground">
						{new Date(row.assessedAt).toLocaleDateString()}
					</span>
				),
				sortable: true,
			},
		],
		[t, orgPath],
	);

	return (
		<div className="space-y-6">
			{!clientId && (
				<PageHero
					title={t("riskEvalPageTitle")}
					subtitle={t("riskEvalPageDescription")}
					icon={Shield}
					stats={stats}
				/>
			)}
			<DataTable<RiskEvaluationRow>
				columns={columns}
				data={evaluations}
				isLoading={isLoading}
				isLoadingMore={isLoadingMore}
				hasMore={hasMore}
				onLoadMore={handleLoadMore}
				filters={[]}
				serverFilterMeta={filterMeta}
				serverTotal={pagination?.total}
				searchKeys={["clientName", "clientRfc"]}
				searchPlaceholder={t("riskEvalSearchPlaceholder")}
				emptyMessage={t("riskEvalEmptyTitle")}
				emptyIcon={Shield}
				getId={(row) => row.id}
				onRowClick={(row) =>
					(window.location.href = orgPath(`/risk/evaluations/${row.id}`))
				}
				paginationMode="infinite-scroll"
				{...urlFilterProps}
			/>
		</div>
	);
}
