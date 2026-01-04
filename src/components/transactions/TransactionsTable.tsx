"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
	ArrowDownCircle,
	ArrowUpCircle,
	Car,
	Ship,
	Plane,
	DollarSign,
	MoreHorizontal,
	Eye,
	Edit,
	FileText,
	Receipt,
} from "lucide-react";
import Link from "next/link";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { useDataTableUrlFilters } from "@/hooks/useDataTableUrlFilters";

// Filter IDs for URL persistence
const TRANSACTION_FILTER_IDS = ["operationType", "vehicleType", "currency"];
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
import { useOrgStore } from "@/lib/org-store";
import {
	listTransactions,
	type ListTransactionsOptions,
} from "@/lib/api/transactions";
import { getClientById } from "@/lib/api/clients";
import type { Transaction, TransactionVehicleType } from "@/types/transaction";
import type { Client } from "@/types/client";
import { getClientDisplayName } from "@/types/client";
import { generateShortTransactionId } from "@/lib/transaction-id";
import {
	DataTable,
	type ColumnDef,
	type FilterDef,
} from "@/components/data-table";
import { formatProperNoun } from "@/lib/utils";
import { useLanguage } from "@/components/LanguageProvider";
import { getLocaleForLanguage } from "@/lib/translations";

/**
 * Extended transaction row with resolved client data
 */
interface TransactionRow {
	id: string;
	shortId: string;
	operationType: "purchase" | "sale";
	vehicleType: TransactionVehicleType;
	brand: string;
	model: string;
	year: number;
	amount: number;
	currency: string;
	clientId: string;
	clientName: string;
	operationDate: string;
	paymentMethods: string;
}

const vehicleTypeConfig: Record<
	TransactionVehicleType,
	{ label: string; icon: React.ReactNode; bgColor: string }
> = {
	land: {
		label: "Terrestre",
		icon: <Car className="h-4 w-4" />,
		bgColor: "bg-sky-500/20 text-sky-400",
	},
	marine: {
		label: "Marítimo",
		icon: <Ship className="h-4 w-4" />,
		bgColor: "bg-teal-500/20 text-teal-400",
	},
	air: {
		label: "Aéreo",
		icon: <Plane className="h-4 w-4" />,
		bgColor: "bg-amber-500/20 text-amber-400",
	},
};

const paymentMethodLabels: Record<string, string> = {
	EFECTIVO: "Efectivo",
	TRANSFERENCIA: "Transferencia",
	CHEQUE: "Cheque",
	FINANCIAMIENTO: "Financiamiento",
};

interface TransactionsTableProps {
	filters?: ListTransactionsOptions;
}

export function TransactionsTable({
	filters,
}: TransactionsTableProps = {}): React.ReactElement {
	const { navigateTo, orgPath } = useOrgNavigation();
	const { toast } = useToast();
	const { currentOrg } = useOrgStore();
	const urlFilters = useDataTableUrlFilters(TRANSACTION_FILTER_IDS);
	const { t, language } = useLanguage();
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [clients, setClients] = useState<Map<string, Client>>(new Map());
	const [isLoading, setIsLoading] = useState(true);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const ITEMS_PER_PAGE = 20;

	// Track which client IDs we've already attempted to fetch (to avoid re-fetching)
	const fetchedClientIdsRef = useRef<Set<string>>(new Set());

	// Fetch client information for transactions - optimized to only fetch missing clients
	const fetchClientsForTransactions = useCallback(
		async (txList: Transaction[]) => {
			const uniqueClientIds = [...new Set(txList.map((tx) => tx.clientId))];

			// Filter out clients we've already attempted to fetch
			const missingClientIds = uniqueClientIds.filter(
				(clientId) => !fetchedClientIdsRef.current.has(clientId),
			);

			// If all clients are already loaded or fetched, skip fetching
			if (missingClientIds.length === 0) {
				return;
			}

			// Mark these as being fetched
			missingClientIds.forEach((id) => fetchedClientIdsRef.current.add(id));

			// Fetch only missing clients in parallel
			const clientPromises = missingClientIds.map(async (clientId) => {
				try {
					const client = await getClientById({ id: clientId });
					return { clientId, client };
				} catch (error) {
					console.error(`Error fetching client ${clientId}:`, error);
					return null;
				}
			});

			const results = await Promise.all(clientPromises);

			// Only update state if we have new results
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
		[], // No dependencies - uses ref to track fetched clients
	);

	// Initial load - refetch when organization changes
	useEffect(() => {
		// Wait for an organization to be selected
		// Without an organization, the API will return 403 "Organization Required"
		if (!currentOrg?.id) {
			setTransactions([]);
			setClients(new Map());
			fetchedClientIdsRef.current.clear();
			setIsLoading(false);
			return;
		}

		const fetchTransactions = async () => {
			try {
				setIsLoading(true);
				setCurrentPage(1);
				// Clear existing data and caches when org changes
				setTransactions([]);
				setClients(new Map());
				fetchedClientIdsRef.current.clear();

				// Fetch transactions (brand data is now enriched by the backend)
				const response = await listTransactions({
					page: 1,
					limit: ITEMS_PER_PAGE,
					...filters,
				});
				setTransactions(response.data);
				setHasMore(response.pagination.page < response.pagination.totalPages);
				await fetchClientsForTransactions(response.data);
			} catch (error) {
				console.error("Error fetching transactions:", error);
				toast({
					title: t("errorGeneric"),
					description: t("transactionsLoadError"),
					variant: "destructive",
				});
			} finally {
				setIsLoading(false);
			}
		};
		fetchTransactions();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [filters, toast, currentOrg?.id]);

	// Load more transactions for infinite scroll
	const handleLoadMore = useCallback(async () => {
		if (isLoadingMore || !hasMore || !currentOrg?.id) return;

		try {
			setIsLoadingMore(true);
			const nextPage = currentPage + 1;
			const response = await listTransactions({
				page: nextPage,
				limit: ITEMS_PER_PAGE,
				...filters,
			});

			setTransactions((prev) => [...prev, ...response.data]);
			setCurrentPage(nextPage);
			setHasMore(response.pagination.page < response.pagination.totalPages);

			await fetchClientsForTransactions(response.data);
		} catch (error) {
			console.error("Error loading more transactions:", error);
			toast({
				title: t("errorGeneric"),
				description: t("transactionsLoadMoreError"),
				variant: "destructive",
			});
		} finally {
			setIsLoadingMore(false);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentPage, hasMore, isLoadingMore, filters, toast, currentOrg?.id]);

	// Transform Transaction to TransactionRow format
	const transactionsData: TransactionRow[] = useMemo(() => {
		return transactions.map((tx) => {
			const client = clients.get(tx.clientId);
			// Use enriched brand catalog name if available, fallback to brand ID
			const brandName = tx.brandCatalog?.name || tx.brand;
			return {
				id: tx.id,
				shortId: generateShortTransactionId(tx.id),
				operationType: tx.operationType,
				vehicleType: tx.vehicleType,
				brand: brandName,
				model: tx.model,
				year: tx.year,
				amount: parseFloat(tx.amount),
				currency: tx.currency,
				clientId: tx.clientId,
				clientName: client ? getClientDisplayName(client) : tx.clientId,
				operationDate: tx.operationDate,
				paymentMethods: tx.paymentMethods
					.map((pm) => paymentMethodLabels[pm.method] || pm.method)
					.join(", "),
			};
		});
	}, [transactions, clients]);

	// Column definitions
	const columns: ColumnDef<TransactionRow>[] = useMemo(
		() => [
			{
				id: "client",
				header: "Cliente",
				accessorKey: "clientName",
				sortable: true,
				cell: (item) => (
					<div className="flex items-center gap-3">
						{/* Operation type icon */}
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<span
										className={`flex items-center justify-center h-8 w-8 rounded-lg ${
											item.operationType === "purchase"
												? "bg-emerald-500/20 text-emerald-400"
												: "bg-sky-500/20 text-sky-400"
										}`}
									>
										{item.operationType === "purchase" ? (
											<ArrowDownCircle className="h-4 w-4" />
										) : (
											<ArrowUpCircle className="h-4 w-4" />
										)}
									</span>
								</TooltipTrigger>
								<TooltipContent side="right">
									<p>
										{item.operationType === "purchase" ? "Compra" : "Venta"}
									</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
						<div className="flex flex-col min-w-0">
							<Link
								href={orgPath(`/transactions/${item.id}`)}
								className="font-medium text-foreground hover:text-primary truncate"
								onClick={(e) => e.stopPropagation()}
							>
								{item.clientName}
							</Link>
							<span className="text-xs text-muted-foreground font-mono">
								{item.shortId}
							</span>
						</div>
					</div>
				),
			},
			{
				id: "vehicle",
				header: "Vehículo",
				accessorKey: "brand",
				hideOnMobile: true,
				cell: (item) => {
					const config = vehicleTypeConfig[item.vehicleType];
					return (
						<div className="flex items-center gap-2.5">
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<span
											className={`flex items-center justify-center h-7 w-7 rounded ${config.bgColor}`}
										>
											{config.icon}
										</span>
									</TooltipTrigger>
									<TooltipContent>
										<p>{config.label}</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
							<div className="flex flex-col min-w-0">
								<span className="text-sm font-medium truncate">
									{formatProperNoun(item.brand)} {formatProperNoun(item.model)}
								</span>
								<span className="text-xs text-muted-foreground">
									{item.year}
								</span>
							</div>
						</div>
					);
				},
			},
			{
				id: "amount",
				header: "Monto",
				accessorKey: "amount",
				sortable: true,
				className: "text-right",
				cell: (item) => (
					<div className="flex flex-col items-end">
						<span className="font-semibold tabular-nums text-foreground">
							{new Intl.NumberFormat("es-MX", {
								style: "currency",
								currency: item.currency,
								minimumFractionDigits: 0,
								maximumFractionDigits: 0,
							}).format(item.amount)}
						</span>
						<span className="text-[10px] text-muted-foreground font-medium">
							{item.currency}
						</span>
					</div>
				),
			},
			{
				id: "operationDate",
				header: "Fecha",
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
								{date.toLocaleTimeString("es-MX", {
									hour: "2-digit",
									minute: "2-digit",
								})}
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
				id: "operationType",
				label: "Operación",
				icon: DollarSign,
				options: [
					{
						value: "purchase",
						label: "Compra",
						icon: (
							<span className="flex items-center justify-center h-5 w-5 rounded bg-emerald-500/20 text-emerald-400">
								<ArrowDownCircle className="h-3 w-3" />
							</span>
						),
					},
					{
						value: "sale",
						label: "Venta",
						icon: (
							<span className="flex items-center justify-center h-5 w-5 rounded bg-sky-500/20 text-sky-400">
								<ArrowUpCircle className="h-3 w-3" />
							</span>
						),
					},
				],
			},
			{
				id: "vehicleType",
				label: "Vehículo",
				icon: Car,
				options: [
					{
						value: "land",
						label: "Terrestre",
						icon: (
							<span className="flex items-center justify-center h-5 w-5 rounded bg-sky-500/20 text-sky-400">
								<Car className="h-3 w-3" />
							</span>
						),
					},
					{
						value: "marine",
						label: "Marítimo",
						icon: (
							<span className="flex items-center justify-center h-5 w-5 rounded bg-teal-500/20 text-teal-400">
								<Ship className="h-3 w-3" />
							</span>
						),
					},
					{
						value: "air",
						label: "Aéreo",
						icon: (
							<span className="flex items-center justify-center h-5 w-5 rounded bg-amber-500/20 text-amber-400">
								<Plane className="h-3 w-3" />
							</span>
						),
					},
				],
			},
			{
				id: "currency",
				label: "Moneda",
				icon: DollarSign,
				options: [
					{ value: "MXN", label: "MXN" },
					{ value: "USD", label: "USD" },
				],
			},
		],
		[],
	);

	// Row actions
	const renderActions = (item: TransactionRow) => (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
					<MoreHorizontal className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-48">
				<DropdownMenuItem
					className="gap-2"
					onClick={() => navigateTo(`/transactions/${item.id}`)}
				>
					<Eye className="h-4 w-4" />
					Ver detalle
				</DropdownMenuItem>
				<DropdownMenuItem
					className="gap-2"
					onClick={() => navigateTo(`/transactions/${item.id}/edit`)}
				>
					<Edit className="h-4 w-4" />
					Editar transacción
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="gap-2"
					onClick={() => navigateTo(`/clients/${item.clientId}`)}
				>
					Ver cliente
				</DropdownMenuItem>
				<DropdownMenuItem className="gap-2">
					<FileText className="h-4 w-4" />
					Generar recibo
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);

	return (
		<DataTable
			data={transactionsData}
			columns={columns}
			filters={filterDefs}
			searchKeys={["clientName", "clientId", "shortId", "brand", "model"]}
			searchPlaceholder={t("transactionsSearchPlaceholder")}
			emptyMessage={t("transactionNoTransactions")}
			emptyIcon={Receipt}
			emptyActionLabel={t("transactionsNew")}
			emptyActionHref={orgPath("/transactions/new")}
			loadingMessage={t("transactionsLoading")}
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
	);
}
