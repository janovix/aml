"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { MoreHorizontal, Eye, Edit, FileText, Users } from "lucide-react";
import Link from "next/link";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { useDataTableUrlFilters } from "@/hooks/useDataTableUrlFilters";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useJwt } from "@/hooks/useJwt";
import { showFetchError } from "@/lib/toast-utils";
import { useOrgStore } from "@/lib/org-store";
import {
	listOperations,
	type ListOperationsOptions,
} from "@/lib/api/operations";
import { getClientById } from "@/lib/api/clients";
import type { OperationEntity } from "@/types/operation";
import type { Client } from "@/types/client";
import { getClientDisplayName } from "@/types/client";
import {
	DataTable,
	type ColumnDef,
	type FilterDef,
} from "@/components/data-table";
import { ActivityBadge } from "./ActivityBadge";
import { CompletenessIndicator } from "@/components/completeness/CompletenessIndicator";
import type { CompletenessResult } from "@/types/completeness";
import { useLanguage } from "@/components/LanguageProvider";

const OPERATION_FILTER_IDS = ["activityCode", "watchlistStatus", "dataSource"];

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
	activityCode: string;
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
	filters,
}: OperationsTableProps = {}): React.ReactElement {
	const { t } = useLanguage();
	const { navigateTo, orgPath } = useOrgNavigation();

	const DATA_SOURCE_LABELS: Record<string, string> = {
		MANUAL: t("opDataSourceManual"),
		CFDI: t("opDataSourceCfdi"),
		IMPORT: t("opDataSourceImport"),
		ENRICHED: t("opDataSourceEnriched"),
	};
	const { jwt, isLoading: isJwtLoading } = useJwt();
	const { currentOrg } = useOrgStore();
	const searchParams = useSearchParams();
	const urlFilters = useDataTableUrlFilters(OPERATION_FILTER_IDS);

	const [operations, setOperations] = useState<OperationEntity[]>([]);
	const [clients, setClients] = useState<Map<string, Client>>(new Map());
	const [isLoading, setIsLoading] = useState(true);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const ITEMS_PER_PAGE = 20;

	const fetchedClientIdsRef = useRef<Set<string>>(new Set());
	const hasLoadedForOrgRef = useRef<string | null>(null);

	// Fetch client information for operations
	const fetchClientsForOperations = useCallback(
		async (opList: OperationEntity[]) => {
			const uniqueClientIds = [...new Set(opList.map((op) => op.clientId))];
			const missingClientIds = uniqueClientIds.filter(
				(clientId) => !fetchedClientIdsRef.current.has(clientId),
			);

			if (missingClientIds.length === 0) return;

			missingClientIds.forEach((id) => fetchedClientIdsRef.current.add(id));

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
			const validResults = results.filter(
				(result): result is { clientId: string; client: Client } =>
					result !== null,
			);

			if (validResults.length > 0) {
				setClients((prev) => {
					const merged = new Map(prev);
					validResults.forEach((result) => {
						merged.set(result.clientId, result.client);
					});
					return merged;
				});
			}
		},
		[jwt],
	);

	// Initial load
	useEffect(() => {
		if (isJwtLoading || !jwt || !currentOrg?.id) {
			if (!currentOrg?.id && !isJwtLoading) {
				setOperations([]);
				setClients(new Map());
				fetchedClientIdsRef.current.clear();
				setIsLoading(false);
				hasLoadedForOrgRef.current = null;
			}
			return;
		}

		if (hasLoadedForOrgRef.current === currentOrg.id) return;

		const fetchOperations = async () => {
			try {
				setIsLoading(true);
				setCurrentPage(1);
				setOperations([]);
				setClients(new Map());
				fetchedClientIdsRef.current.clear();

				const response = await listOperations({
					page: 1,
					limit: ITEMS_PER_PAGE,
					jwt,
					...filters,
				});
				setOperations(response.data);
				setHasMore(response.pagination.page < response.pagination.totalPages);
				hasLoadedForOrgRef.current = currentOrg.id;
				await fetchClientsForOperations(response.data);
			} catch (error) {
				hasLoadedForOrgRef.current = currentOrg.id;
				console.error("Error fetching operations:", error);
				showFetchError("operations-table", error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchOperations();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [jwt, isJwtLoading, currentOrg?.id]);

	// Load more
	const handleLoadMore = useCallback(async () => {
		if (isLoadingMore || !hasMore || isJwtLoading || !jwt || !currentOrg?.id)
			return;

		try {
			setIsLoadingMore(true);
			const nextPage = currentPage + 1;
			const response = await listOperations({
				page: nextPage,
				limit: ITEMS_PER_PAGE,
				jwt,
				...filters,
			});

			setOperations((prev) => [...prev, ...response.data]);
			setCurrentPage(nextPage);
			setHasMore(response.pagination.page < response.pagination.totalPages);
			await fetchClientsForOperations(response.data);
		} catch (error) {
			console.error("Error loading more operations:", error);
			showFetchError("operations-table-more", error);
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
		fetchClientsForOperations,
		currentOrg?.id,
	]);

	// Silent refresh
	const silentRefresh = useCallback(async () => {
		if (!jwt || isJwtLoading || !currentOrg?.id) return;

		try {
			const response = await listOperations({
				page: 1,
				limit: ITEMS_PER_PAGE,
				jwt,
				...filters,
			});
			setOperations(response.data);
			setCurrentPage(1);
			setHasMore(response.pagination.page < response.pagination.totalPages);
			await fetchClientsForOperations(response.data);
		} catch {
			// Silently ignore
		}
	}, [jwt, isJwtLoading, filters, fetchClientsForOperations, currentOrg?.id]);

	useAutoRefresh(silentRefresh, {
		enabled: !isLoading && !!jwt && !!currentOrg?.id && currentPage === 1,
		interval: 30000,
	});

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
				activityCode: op.activityCode,
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
				id: "activity",
				header: t("opTableActivity"),
				accessorKey: "activityCode",
				hideOnMobile: true,
				cell: (item) => (
					<ActivityBadge
						code={item.activityCode as import("@/types/operation").ActivityCode}
						variant="short"
					/>
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
				id: "activityCode",
				label: t("opFilterActivity"),
				icon: FileText,
				options: [], // Dynamic from activities
			},
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
			initialFilters={urlFilters.initialFilters}
			initialSearch={urlFilters.initialSearch}
			initialSort={urlFilters.initialSort}
			onFiltersChange={urlFilters.onFiltersChange}
			onSearchChange={urlFilters.onSearchChange}
			onSortChange={urlFilters.onSortChange}
		/>
	);
}
