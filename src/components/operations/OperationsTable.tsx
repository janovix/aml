"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { MoreHorizontal, Eye, Edit, FileText, Users } from "lucide-react";
import Link from "next/link";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { useServerTable } from "@/hooks/useServerTable";
import { useJwt } from "@/hooks/useJwt";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	listOperations,
	type ListOperationsOptions,
} from "@/lib/api/operations";
import type { ActivityCode } from "@/types/operation";
import { getClientById } from "@/lib/api/clients";
import type { OperationEntity } from "@/types/operation";
import type { Client } from "@/types/client";
import { getClientDisplayName } from "@/types/client";
import {
	DataTable,
	type ColumnDef,
	type FilterDef,
} from "@/components/data-table";
import { CompletenessIndicator } from "@/components/completeness/CompletenessIndicator";
import type { CompletenessResult } from "@/types/completeness";
import { useLanguage } from "@/components/LanguageProvider";

const OPERATION_FILTER_IDS = ["watchlistStatus", "dataSource"];

/**
 * Flattened row for the data table
 */
interface OperationRow {
	id: string;
	shortId: string;
	clientId: string;
	clientName: string;
	operationDate: string;
	amount: number;
	currencyCode: string;
	dataSource: string;
	completenessStatus: string;
	missingFieldsCount: number;
	watchlistStatus: string | null;
	// For rendering
	operation: OperationEntity;
}

interface OperationsTableProps {
	filters?: ListOperationsOptions;
}

export function OperationsTable({
	filters: fixedFilters,
}: OperationsTableProps = {}): React.ReactElement {
	const { t } = useLanguage();
	const { navigateTo, orgPath } = useOrgNavigation();
	const { jwt } = useJwt();

	const DATA_SOURCE_LABELS: Record<string, string> = {
		MANUAL: t("opDataSourceManual"),
		CFDI: t("opDataSourceCfdi"),
		IMPORT: t("opDataSourceImport"),
		ENRICHED: t("opDataSourceEnriched"),
	};

	// Track client info separately (operations don't embed client details)
	const [clients, setClients] = useState<Map<string, Client>>(new Map());
	const fetchedClientIdsRef = useRef<Set<string>>(new Set());

	const fetchClientsForOperations = useCallback(
		async (opList: OperationEntity[]) => {
			const uniqueClientIds = [...new Set(opList.map((op) => op.clientId))];
			const missingClientIds = uniqueClientIds.filter(
				(id) => !fetchedClientIdsRef.current.has(id),
			);
			if (!missingClientIds.length) return;

			missingClientIds.forEach((id) => fetchedClientIdsRef.current.add(id));
			const results = await Promise.allSettled(
				missingClientIds.map((clientId) =>
					getClientById({ id: clientId }).then((c) => ({
						clientId,
						client: c,
					})),
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
		},
		[],
	);

	// Build fixed filters from props (e.g., { clientId: "xxx" })
	const fixedFilterParams = useMemo<Record<string, string>>(() => {
		const out: Record<string, string> = {};
		if (fixedFilters?.clientId) out.clientId = fixedFilters.clientId;
		if (fixedFilters?.invoiceId) out.invoiceId = fixedFilters.invoiceId;
		return out;
	}, [fixedFilters]);

	// -------------------------------------------------------------------------
	// Server-driven table
	// -------------------------------------------------------------------------
	const {
		data: operations,
		isLoading,
		isLoadingMore,
		hasMore,
		pagination,
		filterMeta,
		handleLoadMore: baseHandleLoadMore,
		urlFilterProps,
	} = useServerTable<OperationEntity>({
		fetcher: async ({
			page,
			limit,
			filters: activeFilters,
			fixedFilters: fixed,
			jwt: jwtParam,
		}) => {
			const response = await listOperations({
				page,
				limit,
				jwt: jwtParam ?? undefined,
				clientId: fixed?.clientId,
				invoiceId: fixed?.invoiceId,
				filters: activeFilters,
			});
			// Fire-and-forget client enrichment
			void fetchClientsForOperations(response.data);
			return response;
		},
		allowedFilterIds: OPERATION_FILTER_IDS,
		paginationMode: "infinite-scroll",
		itemsPerPage: 20,
		fixedFilters: fixedFilterParams,
	});

	const handleLoadMore = useCallback(async () => {
		await baseHandleLoadMore();
	}, [baseHandleLoadMore]);

	// Build rows
	const operationsData: OperationRow[] = useMemo(() => {
		return operations.map((op) => {
			const client = clients.get(op.clientId);
			return {
				id: op.id,
				shortId: op.id.length > 8 ? `${op.id.slice(0, 8)}...` : op.id,
				clientId: op.clientId,
				clientName: client ? getClientDisplayName(client) : op.clientId,
				operationDate: op.operationDate,
				amount: parseFloat(op.amount),
				currencyCode: op.currencyCode,
				dataSource: op.dataSource,
				completenessStatus: op.completenessStatus,
				missingFieldsCount: op.missingFields?.length || 0,
				watchlistStatus: op.watchlistStatus,
				operation: op,
			};
		});
	}, [operations, clients]);

	// Columns
	const columns: ColumnDef<OperationRow>[] = useMemo(
		() => [
			{
				id: "client",
				header: t("opTableClient"),
				accessorKey: "clientName",
				sortable: true,
				cell: (item) => (
					<div className="flex flex-col min-w-0">
						<Link
							href={orgPath(`/operations/${item.id}`)}
							className="font-medium text-foreground hover:text-primary truncate"
							onClick={(e) => e.stopPropagation()}
						>
							{item.clientName}
						</Link>
						<span className="text-xs text-muted-foreground font-mono">
							{item.shortId}
						</span>
					</div>
				),
			},
			{
				id: "operationDate",
				header: t("opTableDate"),
				accessorKey: "operationDate",
				sortable: true,
				cell: (item) => {
					const date = new Date(item.operationDate);
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
			{
				id: "amount",
				header: t("opTableAmount"),
				accessorKey: "amount",
				sortable: true,
				className: "text-right",
				cell: (item) => (
					<div className="flex flex-col items-end">
						<span className="font-semibold tabular-nums text-foreground">
							{new Intl.NumberFormat("es-MX", {
								style: "currency",
								currency: item.currencyCode || "MXN",
								minimumFractionDigits: 0,
								maximumFractionDigits: 0,
							}).format(item.amount)}
						</span>
						<span className="text-[10px] text-muted-foreground font-medium">
							{item.currencyCode}
						</span>
					</div>
				),
			},
			{
				id: "completeness",
				header: t("opTableCompleteness"),
				accessorKey: "completenessStatus",
				hideOnMobile: true,
				cell: (item) => {
					const op = item.operation;
					const missingCount = op.missingFields?.length || 0;

					// Build a minimal completeness result for the indicator
					const result: CompletenessResult = {
						satReady: op.completenessStatus === "COMPLETE",
						alertReady:
							op.completenessStatus === "COMPLETE" ||
							op.completenessStatus === "MINIMUM",
						fullyEnriched: op.completenessStatus === "COMPLETE",
						missing: [],
						summary: {
							red: {
								total: missingCount + 1,
								filled:
									op.completenessStatus === "COMPLETE" ? missingCount + 1 : 1,
								missing:
									op.completenessStatus === "COMPLETE" ? 0 : missingCount,
							},
							yellow: { total: 0, filled: 0, missing: 0 },
							grey: { total: 0, filled: 0, missing: 0 },
							total: missingCount + 1,
							filled:
								op.completenessStatus === "COMPLETE" ? missingCount + 1 : 1,
						},
					};
					return <CompletenessIndicator result={result} />;
				},
			},
			{
				id: "dataSource",
				header: t("opTableSource"),
				accessorKey: "dataSource",
				hideOnMobile: true,
				cell: (item) => (
					<span className="text-xs text-muted-foreground">
						{DATA_SOURCE_LABELS[item.dataSource] || item.dataSource}
					</span>
				),
			},
		],
		[orgPath, t],
	);

	// Filters
	const filterDefs: FilterDef[] = useMemo(
		() => [
			{
				id: "dataSource",
				label: t("opFilterSource"),
				icon: FileText,
				options: [
					{ value: "MANUAL", label: t("opDataSourceManual") },
					{ value: "CFDI", label: t("opDataSourceCfdi") },
					{ value: "IMPORT", label: t("opFilterImport") },
					{ value: "ENRICHED", label: t("opDataSourceEnriched") },
				],
			},
			{
				id: "watchlistStatus",
				label: t("opFilterWatchlist"),
				icon: Users,
				options: [
					{ value: "PENDING", label: t("opFilterPending") },
					{ value: "COMPLETED", label: t("opFilterCompleted") },
					{ value: "ERROR", label: t("opFilterError") },
				],
			},
		],
		[t],
	);

	// Row actions
	const renderActions = (item: OperationRow) => (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
					<MoreHorizontal className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-48">
				<DropdownMenuItem
					className="gap-2"
					onClick={() => navigateTo(`/operations/${item.id}`)}
				>
					<Eye className="h-4 w-4" />
					{t("opViewDetail")}
				</DropdownMenuItem>
				<DropdownMenuItem
					className="gap-2"
					onClick={() => navigateTo(`/operations/${item.id}/edit`)}
				>
					<Edit className="h-4 w-4" />
					{t("opEditOperation")}
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="gap-2"
					onClick={() => navigateTo(`/clients/${item.clientId}`)}
				>
					{t("opViewClient")}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);

	return (
		<DataTable
			data={operationsData}
			columns={columns}
			filters={filterDefs}
			serverFilterMeta={filterMeta}
			serverTotal={pagination?.total}
			searchKeys={["clientName", "clientId", "shortId"]}
			searchPlaceholder={t("opSearchPlaceholder")}
			emptyMessage={t("opNoResults")}
			emptyIcon={FileText}
			emptyActionLabel={t("opNewOperation")}
			emptyActionHref={orgPath("/operations/new")}
			loadingMessage={t("opLoadingOperations")}
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
	);
}
