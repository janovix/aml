"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
	AlertTriangle,
	Bell,
	FileCheck,
	Send,
	XCircle,
	AlertCircle,
	Receipt,
	ExternalLink,
} from "lucide-react";
import { useJwt } from "@/hooks/useJwt";
import { useLanguage } from "@/components/LanguageProvider";
import type { TranslationKeys } from "@/lib/translations";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/mutations";
import { showFetchError } from "@/lib/toast-utils";
import {
	getAlertById,
	cancelAlert,
	type Alert,
	type AlertStatus,
	type AlertSeverity,
} from "@/lib/api/alerts";
import { getClientById } from "@/lib/api/clients";
import type { Client } from "@/types/client";
import { getClientDisplayName } from "@/types/client";
import { PageHero } from "@/components/page-hero";
import { PageHeroSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { formatProperNoun } from "@/lib/utils";
import { executeMutation } from "@/lib/mutations";

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
	{
		label: string;
		badgeVariant: "default" | "secondary" | "destructive" | "outline";
	}
> = {
	LOW: { label: "alertSeverityLow", badgeVariant: "outline" },
	MEDIUM: { label: "alertSeverityMedium", badgeVariant: "secondary" },
	HIGH: { label: "alertSeverityHigh", badgeVariant: "default" },
	CRITICAL: { label: "alertSeverityCritical", badgeVariant: "destructive" },
};

interface AlertDetailsViewProps {
	alertId: string;
}

/**
 * Skeleton component for AlertDetailsView
 * Used when loading the organization to show the appropriate skeleton
 */
export function AlertDetailsSkeleton(): React.ReactElement {
	return (
		<div className="space-y-6">
			<PageHeroSkeleton
				showStats={false}
				showBackButton={true}
				actionCount={2}
			/>
			{/* Content skeleton */}
			<div className="grid gap-6 @md/main:grid-cols-2">
				{[1, 2].map((i) => (
					<Card key={i}>
						<CardHeader>
							<Skeleton className="h-6 w-48" />
						</CardHeader>
						<CardContent className="space-y-4">
							{[1, 2, 3].map((j) => (
								<div key={j} className="space-y-2">
									<Skeleton className="h-4 w-24" />
									<Skeleton className="h-5 w-40" />
								</div>
							))}
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}

export function AlertDetailsView({
	alertId,
}: AlertDetailsViewProps): React.JSX.Element {
	const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
	const [alert, setAlert] = useState<Alert | null>(null);
	const [client, setClient] = useState<Client | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const { navigateTo, orgPath } = useOrgNavigation();
	const { jwt } = useJwt();
	const { t } = useLanguage();

	useEffect(() => {
		const fetchAlert = async () => {
			if (!jwt) return;

			try {
				setIsLoading(true);
				const alertData = await getAlertById({ id: alertId, jwt });
				setAlert(alertData);

				// Fetch client if available
				if (alertData.clientId) {
					try {
						const clientData = await getClientById({
							id: alertData.clientId,
							jwt,
						});
						setClient(clientData);
					} catch (error) {
						console.error("Error fetching client:", error);
					}
				}
			} catch (error) {
				console.error("Error fetching alert:", error);
				showFetchError("alert-details", error);
				navigateTo("/alerts");
			} finally {
				setIsLoading(false);
			}
		};
		fetchAlert();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [alertId, jwt]);

	if (isLoading) {
		return <AlertDetailsSkeleton />;
	}

	if (!alert) {
		return (
			<div className="space-y-6">
				<PageHero
					title={t("alertNotFound")}
					subtitle={t("alertNotFoundDesc")}
					icon={AlertTriangle}
					backButton={{
						label: t("alertBackToAlerts"),
						onClick: () => navigateTo("/alerts"),
					}}
				/>
			</div>
		);
	}

	const formatDateTime = (dateString: string | null | undefined): string => {
		if (!dateString) {
			return t("commonNotAvailable");
		}
		const date = new Date(dateString);
		if (isNaN(date.getTime())) {
			return t("commonInvalidDate");
		}
		return date.toLocaleString("es-MX", {
			day: "2-digit",
			month: "long",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const formatDate = (dateString: string | null | undefined): string => {
		if (!dateString) {
			return t("commonNotAvailable");
		}
		const date = new Date(dateString);
		if (isNaN(date.getTime())) {
			return t("commonInvalidDate");
		}
		return date.toLocaleDateString("es-MX", {
			day: "2-digit",
			month: "long",
			year: "numeric",
		});
	};

	const handleCancel = async (reason: string): Promise<void> => {
		if (!alert || !jwt) return;

		try {
			await executeMutation({
				mutation: () => cancelAlert({ id: alert.id, reason, jwt }),
				loading: t("alertCancelling"),
				success: t("alertCancelledSuccess"),
				onSuccess: () => {
					// Refetch alert to get updated status
					getAlertById({ id: alert.id, jwt })
						.then(setAlert)
						.catch(console.error);
				},
			});
			setCancelDialogOpen(false);
		} catch (error) {
			console.error("Error cancelling alert:", error);
		}
	};

	const statusCfg = statusConfig[alert.status];
	const severityCfg = severityConfig[alert.severity];

	return (
		<div className="space-y-6">
			<PageHero
				title={alert.alertRule?.name || `Alerta ${alert.id}`}
				subtitle={`Código: ${alert.alertRuleId}`}
				icon={AlertTriangle}
				backButton={{
					label: t("alertBackToAlerts"),
					onClick: () => navigateTo("/alerts"),
				}}
				actions={[
					...(alert.status !== "CANCELLED"
						? [
								{
									label: t("alertCancelAlert"),
									icon: XCircle,
									onClick: () => setCancelDialogOpen(true),
									variant: "destructive" as const,
								},
							]
						: []),
				]}
			/>

			<div className="space-y-6">
				<div className="grid gap-6 @md/main:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle>{t("alertInfoTitle")}</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									{t("alertStatusLabel")}
								</p>
								<div className="flex items-center gap-2 mt-1">
									<Badge
										variant="outline"
										className={`${statusCfg.bgColor} border-0`}
									>
										<div className="flex items-center gap-2">
											{statusCfg.icon}
											{t(statusCfg.label as TranslationKeys)}
										</div>
									</Badge>
								</div>
							</div>
							<Separator />
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									{t("alertSeverityLabel")}
								</p>
								<Badge variant={severityCfg.badgeVariant} className="mt-1">
									{t(severityCfg.label as TranslationKeys)}
								</Badge>
							</div>
							<Separator />
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									{t("alertRuleLabel")}
								</p>
								<p className="text-base font-medium mt-1">
									{alert.alertRule?.name || alert.alertRuleId}
								</p>
								{alert.alertRule?.description && (
									<p className="text-sm text-muted-foreground mt-1">
										{alert.alertRule.description}
									</p>
								)}
							</div>
							<Separator />
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									{t("alertTypeLabel")}
								</p>
								<Badge variant="outline" className="mt-1">
									{alert.isManual
										? t("alertTypeManual")
										: t("alertTypeAutomatic")}
								</Badge>
							</div>
							<Separator />
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									{t("alertCreatedAt")}
								</p>
								<p className="text-base font-medium mt-1">
									{formatDateTime(alert.createdAt)}
								</p>
							</div>
							{alert.updatedAt && alert.updatedAt !== alert.createdAt && (
								<>
									<Separator />
									<div>
										<p className="text-sm font-medium text-muted-foreground">
											{t("alertUpdatedAt")}
										</p>
										<p className="text-base font-medium mt-1">
											{formatDateTime(alert.updatedAt)}
										</p>
									</div>
								</>
							)}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>{t("alertClientInfo")}</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{client ? (
								<>
									<div>
										<p className="text-sm font-medium text-muted-foreground">
											{t("alertClientLabel")}
										</p>
										<Link
											href={orgPath(`/clients/${client.id}`)}
											className="text-base font-medium text-primary hover:underline mt-1 block"
										>
											{getClientDisplayName(client)}
										</Link>
									</div>
									<Separator />
									<div>
										<p className="text-sm font-medium text-muted-foreground">
											{t("alertRfcLabel")}
										</p>
										<p className="text-base font-mono mt-1">{client.rfc}</p>
									</div>
									{client.email && (
										<>
											<Separator />
											<div>
												<p className="text-sm font-medium text-muted-foreground">
													{t("alertEmailLabel")}
												</p>
												<p className="text-base mt-1">{client.email}</p>
											</div>
										</>
									)}
								</>
							) : (
								<div>
									<p className="text-sm text-muted-foreground">
										ID del Cliente: {alert.clientId}
									</p>
								</div>
							)}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>{t("alertDeadlinesTitle")}</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{alert.submissionDeadline && (
								<>
									<div>
										<p className="text-sm font-medium text-muted-foreground">
											{t("alertSubmissionDeadline")}
										</p>
										<p
											className={`text-base font-medium mt-1 ${
												alert.isOverdue ? "text-red-400" : ""
											}`}
										>
											{formatDate(alert.submissionDeadline)}
											{alert.isOverdue && (
												<span className="ml-2 text-xs">
													{t("alertOverdue")}
												</span>
											)}
										</p>
									</div>
									<Separator />
								</>
							)}
							{alert.fileGeneratedAt && (
								<>
									<div>
										<p className="text-sm font-medium text-muted-foreground">
											{t("alertFileGenerated")}
										</p>
										<p className="text-base font-medium mt-1">
											{formatDateTime(alert.fileGeneratedAt)}
										</p>
									</div>
									<Separator />
								</>
							)}
							{alert.submittedAt && (
								<>
									<div>
										<p className="text-sm font-medium text-muted-foreground">
											{t("alertSubmittedToSat")}
										</p>
										<p className="text-base font-medium mt-1">
											{formatDateTime(alert.submittedAt)}
										</p>
									</div>
									{alert.satFolioNumber && (
										<>
											<Separator />
											<div>
												<p className="text-sm font-medium text-muted-foreground">
													{t("alertSatFolio")}
												</p>
												<p className="text-base font-mono mt-1">
													{alert.satFolioNumber}
												</p>
											</div>
										</>
									)}
									{alert.satAcknowledgmentReceipt && (
										<>
											<Separator />
											<div>
												<p className="text-sm font-medium text-muted-foreground">
													{t("alertSatAck")}
												</p>
												<p className="text-base font-mono mt-1 break-all">
													{alert.satAcknowledgmentReceipt}
												</p>
											</div>
										</>
									)}
								</>
							)}
							{alert.cancelledAt && (
								<>
									<Separator />
									<div>
										<p className="text-sm font-medium text-muted-foreground">
											{t("alertCancelledLabel")}
										</p>
										<p className="text-base font-medium mt-1">
											{formatDateTime(alert.cancelledAt)}
										</p>
										{alert.cancellationReason && (
											<p className="text-sm text-muted-foreground mt-1">
												{t("alertCancelReason")}
												{alert.cancellationReason}
											</p>
										)}
									</div>
								</>
							)}
							{!alert.submissionDeadline &&
								!alert.fileGeneratedAt &&
								!alert.submittedAt &&
								!alert.cancelledAt && (
									<p className="text-sm text-muted-foreground">
										{t("alertNoDatesRecorded")}
									</p>
								)}
						</CardContent>
					</Card>

					{alert.notes && (
						<Card>
							<CardHeader>
								<CardTitle>{t("alertNotesTitle")}</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm whitespace-pre-wrap">{alert.notes}</p>
							</CardContent>
						</Card>
					)}

					{(() => {
						// Extract all operation IDs from metadata and transactionId field
						const operationIdsFromMetadata = Array.isArray(
							alert.metadata?.transactionIds,
						)
							? (alert.metadata.transactionIds as string[])
							: [];
						const singleOperationId = alert.transactionId
							? [alert.transactionId]
							: [];

						// Combine and deduplicate operation IDs
						const allOperationIds = [
							...new Set([...operationIdsFromMetadata, ...singleOperationId]),
						];

						if (allOperationIds.length === 0) {
							return null;
						}

						const isMultiple = allOperationIds.length > 1;

						return (
							<Card>
								<CardHeader>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<Receipt className="h-5 w-5 text-muted-foreground" />
											<CardTitle>
												{isMultiple
													? t("alertRelatedOperations")
													: t("alertRelatedOperation")}
											</CardTitle>
										</div>
										{isMultiple && (
											<Badge variant="secondary" className="font-mono">
												{allOperationIds.length}
											</Badge>
										)}
									</div>
								</CardHeader>
								<CardContent>
									<div className="space-y-2">
										{allOperationIds.map((txId, index) => (
											<Link
												key={txId}
												href={orgPath(`/operations/${txId}`)}
												className="group flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/50 hover:bg-accent/50"
											>
												<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary group-hover:bg-primary/20">
													<Receipt className="h-4 w-4" />
												</div>
												<div className="flex-1 min-w-0">
													<div className="flex items-center gap-2">
														<span className="text-sm font-medium text-foreground">
															{txId}
														</span>
														<ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
													</div>
													{isMultiple && (
														<p className="text-xs text-muted-foreground mt-0.5">
															Operación {index + 1} de {allOperationIds.length}
														</p>
													)}
												</div>
											</Link>
										))}
									</div>
								</CardContent>
							</Card>
						);
					})()}

					{Object.keys(alert.metadata || {}).length > 0 && (
						<Card className="md:col-span-2">
							<CardHeader>
								<CardTitle>{t("alertMetadata")}</CardTitle>
							</CardHeader>
							<CardContent>
								<pre className="text-xs bg-muted p-4 rounded-lg overflow-auto">
									{JSON.stringify(alert.metadata, null, 2)}
								</pre>
							</CardContent>
						</Card>
					)}
				</div>
			</div>

			<AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("alertCancelQuestion")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("alertCancelDesc")}
							<strong>{alert.alertRule?.name || alert.alertRuleId}</strong>
							{t("alertCancelDescSuffix")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							const formData = new FormData(e.currentTarget);
							const reason = formData.get("reason") as string;
							if (reason) {
								handleCancel(reason);
							}
						}}
						className="space-y-4"
					>
						<div>
							<label
								htmlFor="reason"
								className="text-sm font-medium text-foreground"
							>
								{t("alertCancelReason2")}
							</label>
							<textarea
								id="reason"
								name="reason"
								required
								className="mt-2 w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
								placeholder={t("alertCancelPlaceholder")}
							/>
						</div>
						<AlertDialogFooter>
							<AlertDialogCancel type="button">{t("cancel")}</AlertDialogCancel>
							<AlertDialogAction type="submit">
								{t("alertConfirmCancel")}
							</AlertDialogAction>
						</AlertDialogFooter>
					</form>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
