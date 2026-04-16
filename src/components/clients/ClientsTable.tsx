"use client";

import { useState, useMemo, useCallback } from "react";
import {
	Users,
	Building2,
	User,
	Landmark,
	MapPin,
	Globe,
	MoreHorizontal,
	Eye,
	Edit,
	Flag,
	FileText,
	Trash2,
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
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { useServerTable } from "@/hooks/useServerTable";
import { executeMutation } from "@/lib/mutations";
import { toast } from "sonner";
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
import { CircularProgress } from "@/components/ui/circular-progress";
import { RiskBadge } from "@/components/risk/RiskBadge";
import type { RiskLevel } from "@/lib/api/risk";

const VALID_CLIENT_RISK_LEVELS = new Set<string>([
	"LOW",
	"MEDIUM_LOW",
	"MEDIUM",
	"MEDIUM_HIGH",
	"HIGH",
]);

function parseClientRiskLevel(
	value: string | null | undefined,
): RiskLevel | null {
	if (!value) return null;
	return VALID_CLIENT_RISK_LEVELS.has(value) ? (value as RiskLevel) : null;
}

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

const CLIENT_FILTER_IDS = ["personType", "stateCode"];

export function ClientsTable(): React.ReactElement {
	const { navigateTo, orgPath } = useOrgNavigation();
	const { t, language } = useLanguage();
	const { states, getStateName } = useStatesCatalog();

	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

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

	const handleFetchError = useCallback(() => {
		toast.error("No se pudieron cargar los clientes.", { id: "clients-table" });
	}, []);

	// -------------------------------------------------------------------------
	// Server-driven table: useServerTable handles fetch, filters, pagination, URL
	// -------------------------------------------------------------------------
	const {
		data: clients,
		isLoading,
		isLoadingMore,
		hasMore,
		pagination,
		filterMeta,
		handleLoadMore,
		urlFilterProps,
	} = useServerTable<Client>({
		fetcher: async ({ page, limit, filters, search, jwt }) => {
			const response = await listClients({
				page,
				limit,
				search: search || undefined,
				filters,
				jwt: jwt ?? undefined,
			});
			return response;
		},
		allowedFilterIds: CLIENT_FILTER_IDS,
		paginationMode: "infinite-scroll",
		itemsPerPage: 20,
		onError: handleFetchError,
	});

	// Transform clients to include display name
	const clientsData: ClientRow[] = useMemo(
		() =>
			clients.map((client) => ({
				...client,
				displayName: getClientDisplayName(client),
			})),
		[clients],
	);

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
				mutation: () => deleteClient({ id: clientId }),
				loading: t("clientDeleting"),
				success: `${clientName} ${t("clientDeleted")}`,
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
											className={`flex items-center justify-center h-8 w-8 shrink-0 rounded-lg ${config.bgColor}`}
										>
											{config.icon}
										</span>
									</TooltipTrigger>
									<TooltipContent side="right">
										<p>{config.label}</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
							{/* KYC circular progress */}
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<span className="shrink-0 flex items-center justify-center">
											<CircularProgress
												percentage={item.kycCompletionPct ?? 0}
												size={22}
												strokeWidth={2.5}
											/>
										</span>
									</TooltipTrigger>
									<TooltipContent side="right">
										<p>KYC: {item.kycCompletionPct ?? 0}%</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
							<div className="flex flex-col min-w-0 gap-0.5">
								<Link
									href={orgPath(`/clients/${item.id}`)}
									className="font-medium text-foreground hover:text-primary truncate"
									onClick={(e) => e.stopPropagation()}
								>
									{item.displayName}
								</Link>
								{/* Screening badges below the name */}
								{(() => {
									const flags: { label: string; className: string }[] = [];
									if (item.isPEP)
										flags.push({
											label: "PEP",
											className: "bg-red-500/15 text-red-500 border-red-500/30",
										});
									if (item.ofacSanctioned)
										flags.push({
											label: "OFAC",
											className: "bg-red-500/15 text-red-500 border-red-500/30",
										});
									if (item.unscSanctioned)
										flags.push({
											label: "UN",
											className: "bg-red-500/15 text-red-500 border-red-500/30",
										});
									if (item.sat69bListed)
										flags.push({
											label: "EFOS",
											className:
												"bg-orange-500/15 text-orange-500 border-orange-500/30",
										});
									if (item.adverseMediaFlagged)
										flags.push({
											label: t("screeningMedia"),
											className:
												"bg-amber-500/15 text-amber-600 border-amber-500/30",
										});

									if (flags.length > 0) {
										return (
											<div className="flex flex-wrap gap-1">
												{flags.map((flag) => (
													<span
														key={flag.label}
														className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold leading-none ${flag.className}`}
													>
														{flag.label}
													</span>
												))}
											</div>
										);
									}
									if (item.screeningResult === "clear") {
										return (
											<span className="inline-flex items-center gap-1 text-[10px] font-medium leading-none text-green-600">
												<span className="h-1.5 w-1.5 rounded-full bg-green-500" />
												{t("screeningClear")}
											</span>
										);
									}
									return null;
								})()}
							</div>
						</div>
					);
				},
			},
			{
				id: "location",
				header: t("tableLocation"),
				accessorKey: "city",
				sortable: true,
				hideOnMobile: true,
				cell: (item) => {
					const city = item.city?.trim();
					const stateName = getStateName(item.stateCode);
					const addressParts = [city, stateName].filter(Boolean);
					const addressLabel =
						addressParts.length > 0 ? addressParts.join(", ") : null;

					const countryLabel =
						(item.resolvedNames?.nationality || item.nationality)?.trim() ||
						(item.resolvedNames?.country || item.country)?.trim() ||
						null;

					if (!countryLabel && !addressLabel) {
						return (
							<div className="flex items-center gap-1.5 text-sm text-muted-foreground">
								<MapPin className="h-3.5 w-3.5 shrink-0" />
								<span className="truncate">{t("unspecified")}</span>
							</div>
						);
					}

					return (
						<div className="flex flex-col gap-0.5">
							{countryLabel && (
								<div className="flex items-center gap-1.5 text-sm">
									<Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
									<span className="truncate">{countryLabel}</span>
								</div>
							)}
							{addressLabel && (
								<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
									<MapPin className="h-3 w-3 shrink-0" />
									<span className="truncate">{addressLabel}</span>
								</div>
							)}
						</div>
					);
				},
			},
			{
				id: "riskLevel",
				header: t("tableRisk"),
				accessorKey: "riskLevel",
				hideOnMobile: true,
				cell: (item) => {
					const level = parseClientRiskLevel(item.riskLevel);
					if (!level) {
						return (
							<span className="text-xs text-muted-foreground tabular-nums">
								—
							</span>
						);
					}
					return <RiskBadge level={level} language={language} />;
				},
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
		[t, personTypeConfig, orgPath, language, getStateName],
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
		[t, states],
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
					onClick={() => navigateTo(`/operations?clientId=${item.id}`)}
				>
					{t("actionViewOperations")}
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
				serverFilterMeta={filterMeta}
				serverTotal={pagination?.total}
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
				getId={(item) => item.id}
				actions={renderActions}
				paginationMode="infinite-scroll"
				onLoadMore={handleLoadMore}
				hasMore={hasMore}
				isLoadingMore={isLoadingMore}
				{...urlFilterProps}
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
