"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
	UserPlus,
} from "lucide-react";
import Link from "next/link";
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
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useJwt } from "@/hooks/useJwt";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { useDataTableUrlFilters } from "@/hooks/useDataTableUrlFilters";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { executeMutation } from "@/lib/mutations";
import { toast } from "sonner";
import { useOrgStore } from "@/lib/org-store";
import type { Client, PersonType } from "@/types/client";
import { getClientDisplayName } from "@/types/client";
import { listClients, deleteClient } from "@/lib/api/clients";
import {
	DataTable,
	type ColumnDef,
	type FilterDef,
} from "@/components/data-table";
import { useLanguage } from "@/components/LanguageProvider";
import { getLocaleForLanguage } from "@/lib/translations";
import { useStatesCatalog } from "@/hooks/useStatesCatalog";

/**
 * Client row with computed display name
 */
interface ClientRow extends Client {
	displayName: string;
}

const personTypeIcons: Record<PersonType, React.ReactNode> = {
	physical: <User className="h-4 w-4" />,
	moral: <Building2 className="h-4 w-4" />,
	trust: <Landmark className="h-4 w-4" />,
};

const personTypeBgColors: Record<PersonType, string> = {
	physical: "bg-sky-500/20 text-sky-400",
	moral: "bg-violet-500/20 text-violet-400",
	trust: "bg-amber-500/20 text-amber-400",
};

// Filter IDs for URL persistence
const CLIENT_FILTER_IDS = ["personType", "stateCode"];

export function ClientsTable(): React.ReactElement {
	const { navigateTo, orgPath } = useOrgNavigation();
	const { jwt, isLoading: isJwtLoading } = useJwt();
	const { currentOrg } = useOrgStore();
	const urlFilters = useDataTableUrlFilters(CLIENT_FILTER_IDS);
	const { t, language } = useLanguage();
	const { states } = useStatesCatalog();

	// Build person type config with translations
	const personTypeConfig = useMemo(
		() => ({
			physical: {
				label: t("clientPersonPhysical"),
				icon: personTypeIcons.physical,
				bgColor: personTypeBgColors.physical,
			},
			moral: {
				label: t("clientPersonMoral"),
				icon: personTypeIcons.moral,
				bgColor: personTypeBgColors.moral,
			},
			trust: {
				label: t("clientTrust"),
				icon: personTypeIcons.trust,
				bgColor: personTypeBgColors.trust,
			},
		}),
		[t],
	);
	const [clients, setClients] = useState<Client[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
	const ITEMS_PER_PAGE = 20;

	// Track if initial load has happened for current org
	const hasLoadedForOrgRef = useRef<string | null>(null);

	// Initial load - refetch when organization changes (not on JWT refresh)
	useEffect(() => {
		// Wait for JWT to be ready and organization to be selected
		// Without an organization, the API will return 403
		if (isJwtLoading || !jwt || !currentOrg?.id) {
			// If no org selected, clear data and stop loading
			if (!currentOrg?.id && !isJwtLoading) {
				setClients([]);
				setIsLoading(false);
				hasLoadedForOrgRef.current = null;
			}
			return;
		}

		// Skip if we've already loaded for this org (JWT refresh shouldn't trigger reload)
		if (hasLoadedForOrgRef.current === currentOrg.id) {
			return;
		}

		const fetchClients = async () => {
			try {
				setIsLoading(true);
				setCurrentPage(1);
				// Clear existing data when org changes
				setClients([]);
				const response = await listClients({
					page: 1,
					limit: ITEMS_PER_PAGE,
					jwt,
				});
				setClients(response.data);
				setHasMore(response.pagination.page < response.pagination.totalPages);
				hasLoadedForOrgRef.current = currentOrg.id;
			} catch (error) {
				console.error("Error fetching clients:", error);
				toast.error(t("clientsLoadError"));
			} finally {
				setIsLoading(false);
			}
		};
		fetchClients();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [jwt, isJwtLoading, currentOrg?.id]);

	// Load more clients for infinite scroll
	const handleLoadMore = useCallback(async () => {
		if (isLoadingMore || !hasMore || isJwtLoading || !jwt || !currentOrg?.id)
			return;

		try {
			setIsLoadingMore(true);
			const nextPage = currentPage + 1;
			const response = await listClients({
				page: nextPage,
				limit: ITEMS_PER_PAGE,
				jwt,
			});

			setClients((prev) => [...prev, ...response.data]);
			setCurrentPage(nextPage);
			setHasMore(response.pagination.page < response.pagination.totalPages);
		} catch (error) {
			console.error("Error loading more clients:", error);
			toast.error(t("clientsLoadMoreError"));
		} finally {
			setIsLoadingMore(false);
		}
	}, [currentPage, hasMore, isLoadingMore, isJwtLoading, jwt, currentOrg?.id]);

	// Silent refresh for auto-refresh (doesn't show loading state)
	const silentRefresh = useCallback(async () => {
		if (!jwt || isJwtLoading || !currentOrg?.id) return;

		try {
			const response = await listClients({
				page: 1,
				limit: ITEMS_PER_PAGE,
				jwt,
			});
			setClients(response.data);
			setCurrentPage(1);
			setHasMore(response.pagination.page < response.pagination.totalPages);
		} catch {
			// Silently ignore errors for background refresh
		}
	}, [jwt, isJwtLoading, currentOrg?.id]);

	// Auto-refresh every 30 seconds (only when on first page to avoid disrupting infinite scroll)
	useAutoRefresh(silentRefresh, {
		enabled: !isLoading && !!jwt && !!currentOrg?.id && currentPage === 1,
		interval: 30000,
	});

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
		a.download = `report-${client.rfc}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);

		toast.success(
			`${t("clientReportDownloaded")} ${getClientDisplayName(client)}`,
		);
	};

	const handleFlagSuspicious = (client: Client): void => {
		toast.success(
			`${getClientDisplayName(client)} ${t("clientMarkedSuspicious")}`,
		);
	};

	const handleDeleteClick = (client: Client): void => {
		setClientToDelete(client);
		setDeleteDialogOpen(true);
	};

	const handleDeleteConfirm = async (): Promise<void> => {
		if (!clientToDelete) return;

		const clientName = getClientDisplayName(clientToDelete);
		const clientId = clientToDelete.id;

		try {
			await executeMutation({
				mutation: () => deleteClient({ id: clientId, jwt: jwt ?? undefined }),
				loading: t("clientDeleting"),
				success: `${clientName} ${t("clientDeleted")}`,
				onSuccess: () => {
					setClients(clients.filter((c) => c.id !== clientId));
				},
			});
		} catch {
			// Error is already handled by executeMutation via Sonner
		} finally {
			setDeleteDialogOpen(false);
			setClientToDelete(null);
		}
	};

	// Column definitions
	const columns: ColumnDef<ClientRow>[] = useMemo(
		() => [
			{
				id: "client",
				header: t("tableClient"),
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
									href={orgPath(`/clients/${item.id}`)}
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
				header: t("tableContact"),
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
				header: t("tableLocation"),
				accessorKey: "city",
				sortable: true,
				hideOnMobile: true,
				cell: (item) => (
					<div className="flex items-center gap-1.5 text-sm text-muted-foreground">
						<MapPin className="h-3.5 w-3.5 shrink-0" />
						<span className="truncate">
							{item.city}, {item.stateCode}
						</span>
					</div>
				),
			},
			{
				id: "createdAt",
				header: t("tableRegistration"),
				accessorKey: "createdAt",
				sortable: true,
				cell: (item) => {
					const date = new Date(item.createdAt);
					return (
						<div className="flex flex-col">
							<span className="text-sm text-foreground tabular-nums">
								{date.toLocaleDateString(getLocaleForLanguage(language), {
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
		[t, personTypeConfig, orgPath, language],
	);

	// Filter definitions
	const filterDefs: FilterDef[] = useMemo(
		() => [
			{
				id: "personType",
				label: t("filterType"),
				icon: Users,
				options: [
					{
						value: "physical",
						label: t("clientPersonPhysical"),
						icon: (
							<span className="flex items-center justify-center h-5 w-5 rounded bg-sky-500/20 text-sky-400">
								<User className="h-3 w-3" />
							</span>
						),
					},
					{
						value: "moral",
						label: t("clientPersonMoral"),
						icon: (
							<span className="flex items-center justify-center h-5 w-5 rounded bg-violet-500/20 text-violet-400">
								<Building2 className="h-3 w-3" />
							</span>
						),
					},
					{
						value: "trust",
						label: t("clientTrust"),
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
				label: t("filterState"),
				icon: MapPin,
				options: states
					.map((state) => {
						const metadata = state.metadata as { code?: string } | null;
						return {
							value: metadata?.code || state.id,
							label: state.name,
						};
					})
					.sort((a, b) => a.label.localeCompare(b.label, "es")),
			},
		],
		[t],
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
					onClick={() => navigateTo(`/clients/${item.id}`)}
				>
					<Eye className="h-4 w-4" />
					{t("actionViewDetail")}
				</DropdownMenuItem>
				<DropdownMenuItem
					className="gap-2"
					onClick={() => navigateTo(`/clients/${item.id}/edit`)}
				>
					<Edit className="h-4 w-4" />
					{t("actionEditClient")}
				</DropdownMenuItem>
				<DropdownMenuItem
					className="gap-2"
					onClick={() => handleGenerateReport(item)}
				>
					<FileText className="h-4 w-4" />
					{t("actionGenerateReport")}
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					onClick={() => navigateTo(`/transactions?clientId=${item.id}`)}
				>
					{t("actionViewTransactions")}
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={() => navigateTo(`/alerts?clientId=${item.id}`)}
				>
					{t("actionViewAlerts")}
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="gap-2 text-[rgb(var(--risk-high))]"
					onClick={() => handleFlagSuspicious(item)}
				>
					<Flag className="h-4 w-4" />
					{t("actionMarkSuspicious")}
				</DropdownMenuItem>
				<DropdownMenuItem
					className="gap-2 text-destructive"
					onClick={() => handleDeleteClick(item)}
				>
					<Trash2 className="h-4 w-4" />
					{t("delete")}
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
				searchPlaceholder={t("clientsSearchPlaceholder")}
				emptyMessage={t("clientNoClients")}
				emptyIcon={Users}
				emptyActionLabel={t("clientsNew")}
				emptyActionHref={orgPath("/clients/new")}
				loadingMessage={t("clientsLoading")}
				isLoading={isLoading}
				selectable
				getId={(item) => item.rfc}
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

			<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("clientDeleteTitle")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("clientDeleteDescription")}{" "}
							<strong>
								{clientToDelete?.businessName ||
									`${clientToDelete?.firstName} ${clientToDelete?.lastName} ${clientToDelete?.secondLastName || ""}`.trim()}
							</strong>
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteConfirm}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{t("delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
