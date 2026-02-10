"use client";

import { useState, useEffect } from "react";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import {
	Edit,
	Trash2,
	FileText,
	ExternalLink,
	ShieldCheck,
	ShieldAlert,
	ShieldQuestion,
	Clock,
} from "lucide-react";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/mutations";
import { showFetchError } from "@/lib/toast-utils";
import { getOperationById, deleteOperation } from "@/lib/api/operations";
import { getClientById } from "@/lib/api/clients";
import { getClientDisplayName } from "@/types/client";
import type { OperationEntity } from "@/types/operation";
import { getExtensionData } from "@/types/operation";
import type { Client } from "@/types/client";
import type { CompletenessResult } from "@/types/completeness";
import { PageHero } from "@/components/page-hero";
import { PageHeroSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityBadge } from "./ActivityBadge";
import { ThresholdIndicator } from "./ThresholdIndicator";
import { getActivityVisual } from "@/lib/activity-registry";
import { CompletenessBanner } from "@/components/completeness/CompletenessBanner";
import { MissingFieldsList } from "@/components/completeness/MissingFieldsList";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/LanguageProvider";
import type { TranslationKeys } from "@/lib/translations";

interface OperationDetailsViewProps {
	operationId: string;
}

/**
 * Skeleton component for OperationDetailsView
 */
export function OperationDetailsSkeleton(): React.ReactElement {
	return (
		<div className="space-y-4 @lg/main:space-y-6">
			<PageHeroSkeleton
				showStats={false}
				showBackButton={true}
				actionCount={3}
			/>
			<div className="grid grid-cols-1 gap-4 @lg/main:gap-6 @lg/main:grid-cols-2">
				{[1, 2].map((i) => (
					<Card key={i}>
						<CardHeader className="pb-3">
							<Skeleton className="h-5 @lg/main:h-6 w-32 @lg/main:w-48" />
						</CardHeader>
						<CardContent className="space-y-3 @lg/main:space-y-4">
							{[1, 2, 3].map((j) => (
								<div key={j} className="space-y-2">
									<Skeleton className="h-3 @lg/main:h-4 w-20 @lg/main:w-24" />
									<Skeleton className="h-4 @lg/main:h-5 w-32 @lg/main:w-40" />
								</div>
							))}
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}

/** Fields to hide from the extension data grid (internal IDs and raw values superseded by resolved names) */
const EXTENSION_HIDDEN_FIELDS = new Set([
	"id",
	"operationId",
	// Hide raw brand ID when brandName is available
	"brand",
	// Hide the resolvedNames map itself (we use it to enrich *Code fields)
	"resolvedNames",
]);

const DATA_SOURCE_LABELS: Record<
	string,
	{ label: TranslationKeys; variant: "default" | "secondary" | "outline" }
> = {
	MANUAL: { label: "opDataSourceManual", variant: "outline" },
	CFDI: { label: "opDataSourceCfdi", variant: "default" },
	IMPORT: { label: "opDataSourceImport", variant: "secondary" },
	ENRICHED: { label: "opDataSourceEnriched", variant: "secondary" },
};

const WATCHLIST_STATUS_CONFIG: Record<
	string,
	{ label: TranslationKeys; icon: React.ElementType; color: string }
> = {
	PENDING: {
		label: "statusPending",
		icon: Clock,
		color: "text-muted-foreground",
	},
	QUEUED: {
		label: "statusInQueue",
		icon: Clock,
		color: "text-muted-foreground",
	},
	CHECKING: {
		label: "statusVerifying",
		icon: ShieldQuestion,
		color: "text-yellow-500",
	},
	COMPLETED: {
		label: "statusCompleted",
		icon: ShieldCheck,
		color: "text-green-500",
	},
	ERROR: { label: "statusError", icon: ShieldAlert, color: "text-red-500" },
	NOT_AVAILABLE: {
		label: "commonNotAvailable",
		icon: ShieldQuestion,
		color: "text-muted-foreground",
	},
};

export function OperationDetailsView({
	operationId,
}: OperationDetailsViewProps): React.JSX.Element {
	const { navigateTo } = useOrgNavigation();
	const { t } = useLanguage();
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [operation, setOperation] = useState<OperationEntity | null>(null);
	const [client, setClient] = useState<Client | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchOperation = async () => {
			try {
				setIsLoading(true);
				const data = await getOperationById({ id: operationId });
				setOperation(data);

				// Fetch client information
				if (data.clientId) {
					try {
						const clientData = await getClientById({ id: data.clientId });
						setClient(clientData);
					} catch (error) {
						console.error("Error fetching client:", error);
					}
				}
			} catch (error) {
				console.error("Error fetching operation:", error);
				showFetchError("operation-details", error);
				navigateTo("/operations");
			} finally {
				setIsLoading(false);
			}
		};
		fetchOperation();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [operationId]);

	if (isLoading) {
		return <OperationDetailsSkeleton />;
	}

	if (!operation) {
		return (
			<div className="space-y-6">
				<PageHero
					title={t("opNotFoundTitle")}
					subtitle={`La operación ${operationId} no existe`}
					icon={FileText}
					backButton={{
						label: t("opBackToList"),
						onClick: () => navigateTo("/operations"),
					}}
				/>
			</div>
		);
	}

	const activityVisual = getActivityVisual(operation.activityCode);
	const amountNum = parseFloat(operation.amount) || 0;
	// UMA daily value (2024 value as fallback)
	const umaValue = 108.57;
	const amountMxn = operation.amountMxn
		? parseFloat(operation.amountMxn)
		: amountNum;

	const extensionData = getExtensionData(operation);
	const dataSourceConfig = DATA_SOURCE_LABELS[operation.dataSource] || {
		label: operation.dataSource,
		variant: "outline" as const,
	};

	// Build completeness result
	const completenessResult: CompletenessResult | null =
		operation.completenessStatus
			? {
					satReady: operation.completenessStatus === "COMPLETE",
					alertReady:
						operation.completenessStatus === "COMPLETE" ||
						operation.completenessStatus === "MINIMUM",
					fullyEnriched: operation.completenessStatus === "COMPLETE",
					missing: (operation.missingFields || []).map((f) => ({
						field: {
							fieldPath: f,
							tier: "sat_required" as const,
							label: f,
						},
						value: undefined,
					})),
					summary: {
						red: {
							total: (operation.missingFields || []).length + 1,
							filled:
								operation.completenessStatus === "COMPLETE"
									? (operation.missingFields || []).length + 1
									: 1,
							missing:
								operation.completenessStatus === "COMPLETE"
									? 0
									: (operation.missingFields || []).length,
						},
						yellow: { total: 0, filled: 0, missing: 0 },
						grey: { total: 0, filled: 0, missing: 0 },
						total: (operation.missingFields || []).length + 1,
						filled:
							operation.completenessStatus === "COMPLETE"
								? (operation.missingFields || []).length + 1
								: 1,
					},
				}
			: null;

	const formatDateTime = (dateString: string | null | undefined): string => {
		if (!dateString) return t("commonNotAvailable");
		const date = new Date(dateString);
		if (isNaN(date.getTime())) return t("commonInvalidDate");
		return date.toLocaleString("es-MX", {
			day: "2-digit",
			month: "long",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const formatDate = (dateString: string | null | undefined): string => {
		if (!dateString) return t("commonNotAvailable");
		const date = new Date(dateString);
		if (isNaN(date.getTime())) return t("commonInvalidDate");
		return date.toLocaleDateString("es-MX", {
			day: "2-digit",
			month: "long",
			year: "numeric",
		});
	};

	const handleDelete = async (): Promise<void> => {
		try {
			await deleteOperation({ id: operationId });
			toast.success(t("opDeletedSuccess"));
			navigateTo("/operations");
		} catch (error) {
			console.error("Error deleting operation:", error);
			toast.error(extractErrorMessage(error), { id: "operation-delete" });
		}
	};

	const watchlistConfig = operation.watchlistStatus
		? WATCHLIST_STATUS_CONFIG[operation.watchlistStatus]
		: null;

	return (
		<div className="space-y-4 @lg/main:space-y-6">
			<PageHero
				title={operationId}
				subtitle="Detalle de operación"
				icon={FileText}
				backButton={{
					label: t("opBackToList"),
					onClick: () => navigateTo("/operations"),
				}}
				actions={[
					{
						label: t("edit"),
						icon: Edit,
						onClick: () => navigateTo(`/operations/${operation.id}/edit`),
					},
					{
						label: t("delete"),
						icon: Trash2,
						onClick: () => setDeleteDialogOpen(true),
						variant: "destructive",
					},
				]}
			/>

			{/* Activity header */}
			<div className="flex items-center gap-2 @lg/main:gap-3 flex-wrap">
				<ActivityBadge
					code={operation.activityCode}
					variant="full"
					className="text-xs @lg/main:text-sm"
				/>
				<Badge
					variant={dataSourceConfig.variant}
					className="text-xs @lg/main:text-sm"
				>
					{t(dataSourceConfig.label)}
				</Badge>
				{operation.completenessStatus !== "COMPLETE" && (
					<Button
						variant="outline"
						size="sm"
						onClick={() => navigateTo(`/operations/${operation.id}/edit`)}
						className="text-xs @lg/main:text-sm"
					>
						<Edit className="h-3.5 w-3.5 mr-1.5" />
						{t("opEnrich")}
					</Button>
				)}
			</div>

			{/* Completeness banner */}
			{completenessResult && <CompletenessBanner result={completenessResult} />}

			{/* Missing fields list */}
			{completenessResult && completenessResult.missing.length > 0 && (
				<MissingFieldsList result={completenessResult} />
			)}

			{/* Threshold indicator */}
			<ThresholdIndicator
				code={operation.activityCode}
				amountMxn={amountMxn}
				umaValue={umaValue}
			/>

			<div className="space-y-4 @lg/main:space-y-6">
				<div className="grid grid-cols-1 gap-3 @lg/main:gap-6 @lg/main:grid-cols-2">
					{/* General information */}
					<Card>
						<CardHeader className="pb-2 @lg/main:pb-3 px-3 @lg/main:px-6 pt-3 @lg/main:pt-6">
							<CardTitle className="text-sm @lg/main:text-base font-semibold">
								{t("opGeneralInfo")}
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2.5 @lg/main:space-y-4 px-3 @lg/main:px-6 pb-3 @lg/main:pb-6">
							<div>
								<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
									{t("opClient")}
								</p>
								<p className="text-sm @lg/main:text-base font-semibold mt-1 wrap-break-word">
									{client ? getClientDisplayName(client) : operation.clientId}
								</p>
							</div>
							<Separator />
							<div>
								<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
									{t("opOperationDate")}
								</p>
								<p className="text-sm @lg/main:text-base font-semibold mt-1">
									{formatDate(operation.operationDate)}
								</p>
							</div>
							<Separator />
							<div className="space-y-2.5 @md/main:grid @md/main:grid-cols-2 @md/main:gap-3 @md/main:space-y-0">
								<div>
									<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
										{t("opBranchPostalCode")}
									</p>
									<p className="text-sm @lg/main:text-base font-semibold mt-1">
										{operation.branchPostalCode}
									</p>
								</div>
								<div>
									<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
										{t("opOperationType")}
									</p>
									<p className="text-sm @lg/main:text-base font-semibold mt-1 wrap-break-word">
										{operation.operationTypeCatalog?.name ||
											operation.operationTypeCode ||
											"—"}
									</p>
								</div>
							</div>
							<Separator />
							<div>
								<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
									{t("opCreatedAt")}
								</p>
								<p className="text-xs @lg/main:text-sm font-medium mt-1">
									{formatDateTime(operation.createdAt)}
								</p>
							</div>
							{operation.referenceNumber && (
								<>
									<Separator />
									<div>
										<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
											{t("opReference")}
										</p>
										<p className="text-xs @lg/main:text-sm font-mono mt-1 break-all">
											{operation.referenceNumber}
										</p>
									</div>
								</>
							)}
							{operation.notes && (
								<>
									<Separator />
									<div>
										<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
											{t("opNotes")}
										</p>
										<p className="text-xs @lg/main:text-sm mt-1 whitespace-pre-wrap wrap-break-word">
											{operation.notes}
										</p>
									</div>
								</>
							)}
						</CardContent>
					</Card>

					{/* Financial information */}
					<Card>
						<CardHeader className="pb-2 @lg/main:pb-3 px-3 @lg/main:px-6 pt-3 @lg/main:pt-6">
							<CardTitle className="text-sm @lg/main:text-base font-semibold">
								{t("opFinancialInfo")}
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2.5 @lg/main:space-y-4 px-3 @lg/main:px-6 pb-3 @lg/main:pb-6">
							<div>
								<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
									{t("opAmount")}
								</p>
								<p className="text-xl @lg/main:text-3xl font-bold mt-1 wrap-break-word leading-tight">
									{new Intl.NumberFormat("es-MX", {
										style: "currency",
										currency: operation.currencyCode || "MXN",
									}).format(amountNum)}
								</p>
								<p className="text-xs text-muted-foreground mt-0.5">
									{operation.currencyCatalog?.name || operation.currencyCode}
								</p>
							</div>
							{operation.exchangeRate &&
								parseFloat(operation.exchangeRate) !== 1 && (
									<>
										<Separator />
										<div className="space-y-2.5">
											<div>
												<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
													{t("opExchangeRate")}
												</p>
												<p className="text-sm @lg/main:text-base font-semibold mt-1">
													1 {operation.currencyCode} = {operation.exchangeRate}{" "}
													MXN
												</p>
											</div>
											{operation.amountMxn && (
												<div>
													<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
														{t("opAmountMxn")}
													</p>
													<p className="text-sm @lg/main:text-base font-semibold mt-1 wrap-break-word">
														{new Intl.NumberFormat("es-MX", {
															style: "currency",
															currency: "MXN",
														}).format(parseFloat(operation.amountMxn))}
													</p>
													<p className="text-xs text-muted-foreground mt-0.5">
														{new Intl.NumberFormat("es-MX").format(amountNum)}{" "}
														{operation.currencyCode} × {operation.exchangeRate}
													</p>
												</div>
											)}
										</div>
									</>
								)}
							<Separator />
							<div>
								<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
									{t("opPaymentMethods")}
								</p>
								<div className="space-y-1.5 @lg/main:space-y-2">
									{operation.payments.map((payment, index) => (
										<div
											key={payment.id || index}
											className="flex flex-col gap-1 py-1.5 px-2.5 @lg/main:py-2 @lg/main:px-3 rounded-lg border bg-muted/30"
										>
											<div className="flex items-center justify-between gap-2">
												<span className="text-sm @lg/main:text-base font-semibold">
													{new Intl.NumberFormat("es-MX", {
														style: "currency",
														currency: payment.currencyCode || "MXN",
													}).format(parseFloat(payment.amount))}
												</span>
												<Badge
													variant="outline"
													className="text-xs font-medium shrink-0 h-5"
												>
													{payment.paymentFormCode}
												</Badge>
											</div>
											<span className="text-xs text-muted-foreground">
												{formatDate(payment.paymentDate)}
											</span>
										</div>
									))}
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Watchlist status */}
					{watchlistConfig && (
						<Card>
							<CardHeader className="pb-2 @lg/main:pb-3 px-3 @lg/main:px-6 pt-3 @lg/main:pt-6">
								<CardTitle className="text-sm @lg/main:text-base font-semibold">
									{t("opWatchlistStatus")}
								</CardTitle>
							</CardHeader>
							<CardContent className="px-3 @lg/main:px-6 pb-3 @lg/main:pb-6">
								<div className="flex items-center gap-2.5 @lg/main:gap-3">
									<watchlistConfig.icon
										className={`h-4 w-4 @lg/main:h-5 @lg/main:w-5 shrink-0 ${watchlistConfig.color}`}
									/>
									<div className="min-w-0">
										<p className="text-sm @lg/main:text-base font-semibold">
											{t(watchlistConfig.label)}
										</p>
										{operation.watchlistCheckedAt && (
											<p className="text-xs text-muted-foreground wrap-break-word mt-0.5">
												{t("opVerified")}{" "}
												{formatDateTime(operation.watchlistCheckedAt)}
											</p>
										)}
									</div>
								</div>
								{operation.watchlistFlags && (
									<div className="mt-2.5 @lg/main:mt-3">
										<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
											{t("opFlags")}
										</p>
										<p className="text-xs @lg/main:text-sm font-mono break-all">
											{operation.watchlistFlags}
										</p>
									</div>
								)}
							</CardContent>
						</Card>
					)}

					{/* Linked invoice */}
					{operation.invoiceId && (
						<Card>
							<CardHeader className="pb-2 @lg/main:pb-3 px-3 @lg/main:px-6 pt-3 @lg/main:pt-6">
								<CardTitle className="text-sm @lg/main:text-base font-semibold">
									{t("opLinkedInvoice")}
								</CardTitle>
							</CardHeader>
							<CardContent className="px-3 @lg/main:px-6 pb-3 @lg/main:pb-6">
								<div className="flex flex-col @md/main:flex-row @md/main:items-center @md/main:justify-between gap-2.5 @lg/main:gap-3">
									<div className="min-w-0">
										<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
											{t("opInvoiceId")}
										</p>
										<p className="text-xs @lg/main:text-sm font-mono mt-1 break-all">
											{operation.invoiceId}
										</p>
									</div>
									<Button
										variant="outline"
										size="sm"
										onClick={() =>
											navigateTo(`/invoices/${operation.invoiceId}`)
										}
										className="self-start @md/main:self-auto shrink-0"
									>
										<ExternalLink className="h-3.5 w-3.5 mr-1.5" />
										{t("opViewInvoice")}
									</Button>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Extension data */}
					{extensionData && Object.keys(extensionData).length > 0 && (
						<Card className="@lg/main:col-span-2">
							<CardHeader className="pb-2 @lg/main:pb-3 px-3 @lg/main:px-6 pt-3 @lg/main:pt-6">
								<CardTitle className="text-sm @lg/main:text-base font-semibold wrap-break-word">
									{t("opVehicleData")}
								</CardTitle>
							</CardHeader>
							<CardContent className="px-3 @lg/main:px-6 pb-3 @lg/main:pb-6">
								<div className="grid gap-2.5 @lg/main:gap-4 @md/main:grid-cols-2 @xl/main:grid-cols-3">
									{Object.entries(extensionData)
										.filter(([key]) => !EXTENSION_HIDDEN_FIELDS.has(key))
										.map(([key, value]) => {
											if (value === null || value === undefined) return null;

											// For fields ending in "Code", check if we have a resolved name
											let displayValue = String(value);
											if (
												key.endsWith("Code") &&
												extensionData.resolvedNames &&
												typeof extensionData.resolvedNames === "object"
											) {
												const resolvedNames =
													extensionData.resolvedNames as Record<
														string,
														unknown
													>;
												const resolvedName = resolvedNames[key];
												if (typeof resolvedName === "string") {
													displayValue = resolvedName;
												}
											}

											return (
												<div key={key}>
													<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
														{formatFieldName(key)}
													</p>
													<p className="text-sm @lg/main:text-base font-semibold mt-1 wrap-break-word">
														{displayValue}
													</p>
												</div>
											);
										})}
								</div>
							</CardContent>
						</Card>
					)}
				</div>
			</div>

			<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("opDeleteTitle")}</AlertDialogTitle>
						<AlertDialogDescription>
							Esta acción no se puede deshacer. La operación {operation.id} será
							eliminada permanentemente del sistema.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{t("delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

/** Convert camelCase field name to a human-readable label */
function formatFieldName(name: string): string {
	return name
		.replace(/([A-Z])/g, " $1")
		.replace(/^./, (s) => s.toUpperCase())
		.trim();
}
