"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
	Home,
	Users,
	User,
	Building2,
	Landmark,
	Briefcase,
	Clock,
	AlertTriangle,
	RefreshCw,
	ShieldAlert,
	ShieldCheck,
	Car,
	TrendingUp,
	TrendingDown,
	UserX,
	FileWarning,
	Activity,
} from "lucide-react";

import { PageHero, type StatCard } from "@/components/page-hero/page-hero";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/components/LanguageProvider";
import { useJwt } from "@/hooks/useJwt";
import { useOrgStore } from "@/lib/org-store";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import {
	getClientStats,
	getOperationStats,
	getReportSummary,
	type ClientStats,
	type OperationStats,
	type ReportAggregation,
} from "@/lib/api/stats";
import { getLocaleForLanguage } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { useOrgSettings } from "@/hooks/useOrgSettings";
import { getActivityVisual } from "@/lib/activity-registry";

interface DashboardData {
	clientStats: ClientStats | null;
	operationStats: OperationStats | null;
	reportSummary: ReportAggregation | null;
}

export function StatsSkeleton(): React.ReactElement {
	return (
		<div className="grid grid-cols-1 gap-3 @md/main:grid-cols-2 @2xl/main:grid-cols-3">
			{[1, 2, 3].map((i) => (
				<Skeleton key={i} className="h-24 rounded-xl" />
			))}
		</div>
	);
}

export function CardSkeleton(): React.ReactElement {
	return <Skeleton className="h-[280px] rounded-xl" />;
}

/**
 * Combined skeleton for DashboardView
 * Used when loading the organization to show the appropriate skeleton
 */
export function DashboardSkeleton(): React.ReactElement {
	return (
		<div className="space-y-6">
			<StatsSkeleton />
			<div className="grid gap-6 @xl/main:grid-cols-2">
				<CardSkeleton />
				<CardSkeleton />
			</div>
			<div className="grid gap-6 @xl/main:grid-cols-2">
				<CardSkeleton />
				<CardSkeleton />
			</div>
		</div>
	);
}

function getMonthPeriod(): {
	periodStart: string;
	periodEnd: string;
	comparisonPeriodStart: string;
	comparisonPeriodEnd: string;
} {
	const now = new Date();
	const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
	const endOfMonth = new Date(
		now.getFullYear(),
		now.getMonth() + 1,
		0,
		23,
		59,
		59,
		999,
	);
	const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
	const prevEnd = new Date(
		now.getFullYear(),
		now.getMonth(),
		0,
		23,
		59,
		59,
		999,
	);
	return {
		periodStart: startOfMonth.toISOString(),
		periodEnd: endOfMonth.toISOString(),
		comparisonPeriodStart: prevStart.toISOString(),
		comparisonPeriodEnd: prevEnd.toISOString(),
	};
}

export function DashboardView(): React.ReactElement {
	const { t, language } = useLanguage();
	const { jwt, isLoading: isJwtLoading } = useJwt();
	const { currentOrg } = useOrgStore();
	const { routes } = useOrgNavigation();

	const locale = getLocaleForLanguage(language);

	const formatCurrency = React.useCallback(
		(value: string | number): string => {
			const numValue = typeof value === "string" ? parseFloat(value) : value;
			if (isNaN(numValue)) return "$0";
			if (numValue >= 1000000) {
				return `$${(numValue / 1000000).toFixed(1)}M`;
			}
			if (numValue >= 1000) {
				return `$${(numValue / 1000).toFixed(1)}K`;
			}
			return new Intl.NumberFormat(locale, {
				style: "currency",
				currency: "MXN",
				minimumFractionDigits: 0,
				maximumFractionDigits: 0,
			}).format(numValue);
		},
		[locale],
	);

	const formatNumber = React.useCallback(
		(value: number | undefined | null): string => {
			const num = typeof value === "number" && !Number.isNaN(value) ? value : 0;
			return new Intl.NumberFormat(locale).format(num);
		},
		[locale],
	);

	const formatPercent = React.useCallback(
		(value: number | undefined | null): string => {
			if (value == null || Number.isNaN(value)) return t("statsNoChange");
			const sign = value > 0 ? "+" : "";
			return `${sign}${value.toFixed(1)}%`;
		},
		[t],
	);

	const [data, setData] = useState<DashboardData>({
		clientStats: null,
		operationStats: null,
		reportSummary: null,
	});
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const {
		settings: orgSettings,
		activityCode,
		isConfigured: isOrgConfigured,
		refresh: refreshOrgSettings,
	} = useOrgSettings();

	const activityVisual = activityCode ? getActivityVisual(activityCode) : null;
	const isVehicleActivity = activityCode === "VEH";

	const fetchAllData = React.useCallback(
		async (jwtToken: string) => {
			setIsLoading(true);
			setError(null);

			const period = getMonthPeriod();

			try {
				const [clientStats, operationStats, reportSummary] = await Promise.all([
					getClientStats({ jwt: jwtToken }).catch(() => null),
					getOperationStats({ jwt: jwtToken }).catch(() => null),
					getReportSummary({
						jwt: jwtToken,
						...period,
					}).catch(() => null),
				]);

				setData({ clientStats, operationStats, reportSummary });
			} catch (err) {
				console.error("Error fetching dashboard data:", err);
				setError(t("errorLoadingData"));
			} finally {
				setIsLoading(false);
			}
		},
		[t],
	);

	useEffect(() => {
		if (isJwtLoading) return;
		if (!jwt) {
			setIsLoading(false);
			return;
		}
		if (!currentOrg?.id) {
			setIsLoading(false);
			return;
		}
		fetchAllData(jwt);
	}, [isJwtLoading, jwt, currentOrg?.id, fetchAllData]);

	const handleRefresh = React.useCallback(async () => {
		if (!jwt || !currentOrg?.id) return;
		fetchAllData(jwt);
	}, [jwt, currentOrg?.id, fetchAllData]);

	const stats: StatCard[] = useMemo(() => {
		const result: StatCard[] = [];

		if (data.clientStats) {
			result.push({
				label: t("statsTotalClients"),
				value: formatNumber(data.clientStats.totalClients),
				icon: Users,
				variant: "primary",
				href: routes.clients.list(),
			});
		}

		if (data.operationStats) {
			result.push({
				label: t("statsTransactionsToday"),
				value: formatNumber(data.operationStats.transactionsToday),
				icon: Briefcase,
				href: routes.operations.list(),
			});
		}

		if (data.reportSummary?.alerts) {
			result.push({
				label: t("statsTotalAlerts"),
				value: formatNumber(data.reportSummary.alerts.total),
				icon: ShieldAlert,
				href: routes.alerts.list(),
			});
		} else if (data.operationStats) {
			result.push({
				label: t("statsActiveAlerts"),
				value: formatNumber(data.operationStats.suspiciousTransactions),
				icon: ShieldAlert,
				href: routes.alerts.list(),
			});
		}

		return result;
	}, [data, t, formatNumber, routes]);

	const hasData = data.clientStats || data.operationStats || data.reportSummary;
	const showInitialSkeleton = isLoading && !hasData;

	return (
		<div className="space-y-6">
			<PageHero
				title={t("navDashboard")}
				subtitle={t("dashboardSubtitle")}
				icon={Home}
				stats={stats.length > 0 ? stats : undefined}
				actions={[
					{
						label: t("dashboardRefresh"),
						icon: RefreshCw,
						onClick: handleRefresh,
						variant: "outline",
						disabled: isLoading,
					},
				]}
			/>

			{showInitialSkeleton && (
				<div className="space-y-6">
					<StatsSkeleton />
					<div className="grid gap-6 @xl/main:grid-cols-2">
						<CardSkeleton />
						<CardSkeleton />
					</div>
					<div className="grid gap-6 @xl/main:grid-cols-2">
						<CardSkeleton />
						<CardSkeleton />
					</div>
				</div>
			)}

			{error && !isLoading && (
				<Card className="border-destructive/50 bg-destructive/5">
					<CardContent className="pt-6">
						<div className="flex items-center gap-2 text-destructive">
							<AlertTriangle className="h-5 w-5" />
							<span>{error}</span>
						</div>
					</CardContent>
				</Card>
			)}

			{hasData && (
				<div
					className={cn(
						"space-y-6 transition-opacity duration-200",
						isLoading && "opacity-60 pointer-events-none",
					)}
				>
					{/* Risk Indicators + Alert Summary row */}
					{data.reportSummary && (
						<div className="grid gap-6 @xl/main:grid-cols-2">
							{/* Risk Indicators Card */}
							<Card className="h-full">
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<ShieldCheck className="h-5 w-5 text-primary" />
										{t("dashboardRiskIndicators")}
									</CardTitle>
									<CardDescription>
										{t("dashboardRiskIndicatorsDesc")}
									</CardDescription>
								</CardHeader>
								<CardContent>
									{data.reportSummary.riskIndicators ? (
										<div className="space-y-4">
											{/* Compliance Score */}
											<div className="rounded-lg border bg-muted/50 p-4">
												<div className="flex items-center justify-between">
													<div className="text-sm font-medium text-muted-foreground">
														{t("statsComplianceScore")}
													</div>
													<div
														className={cn(
															"text-2xl font-bold tabular-nums",
															data.reportSummary.riskIndicators
																.complianceScore >= 80
																? "text-emerald-500"
																: data.reportSummary.riskIndicators
																			.complianceScore >= 50
																	? "text-amber-500"
																	: "text-red-500",
														)}
													>
														{formatNumber(
															data.reportSummary.riskIndicators.complianceScore,
														)}
														%
													</div>
												</div>
												<div className="mt-2 h-2 rounded-full bg-muted">
													<div
														className={cn(
															"h-2 rounded-full transition-all",
															data.reportSummary.riskIndicators
																.complianceScore >= 80
																? "bg-emerald-500"
																: data.reportSummary.riskIndicators
																			.complianceScore >= 50
																	? "bg-amber-500"
																	: "bg-red-500",
														)}
														style={{
															width: `${Math.min(100, Math.max(0, data.reportSummary.riskIndicators.complianceScore))}%`,
														}}
													/>
												</div>
											</div>
											{/* Risk metrics grid */}
											<div className="grid grid-cols-3 gap-3">
												<div className="flex flex-col items-center text-center rounded-lg border bg-muted/50 p-3">
													<ShieldAlert className="h-4 w-4 text-red-500 mb-1" />
													<div className="text-xs font-medium text-muted-foreground">
														{t("statsCriticalAlerts")}
													</div>
													<div className="text-lg font-bold tabular-nums text-red-500">
														{formatNumber(
															data.reportSummary.riskIndicators.criticalAlerts,
														)}
													</div>
												</div>
												<div className="flex flex-col items-center text-center rounded-lg border bg-muted/50 p-3">
													<UserX className="h-4 w-4 text-amber-500 mb-1" />
													<div className="text-xs font-medium text-muted-foreground">
														{t("statsHighRiskClients")}
													</div>
													<div className="text-lg font-bold tabular-nums text-amber-500">
														{formatNumber(
															data.reportSummary.riskIndicators.highRiskClients,
														)}
													</div>
												</div>
												<div className="flex flex-col items-center text-center rounded-lg border bg-muted/50 p-3">
													<FileWarning className="h-4 w-4 text-orange-500 mb-1" />
													<div className="text-xs font-medium text-muted-foreground">
														{t("statsOverdueSubmissions")}
													</div>
													<div className="text-lg font-bold tabular-nums text-orange-500">
														{formatNumber(
															data.reportSummary.riskIndicators
																.overdueSubmissions,
														)}
													</div>
												</div>
											</div>
										</div>
									) : (
										<div className="flex flex-col items-center justify-center py-8 text-center">
											<ShieldCheck className="h-10 w-10 text-muted-foreground/50" />
											<p className="mt-2 text-muted-foreground">
												{t("dashboardNoRiskData")}
											</p>
										</div>
									)}
								</CardContent>
							</Card>

							{/* Alert Summary Card */}
							<Link
								href={routes.alerts.list()}
								className="block transition-transform hover:scale-[1.01]"
							>
								<Card className="h-full cursor-pointer transition-colors hover:border-primary/50">
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<ShieldAlert className="h-5 w-5 text-primary" />
											{t("dashboardAlertStats")}
										</CardTitle>
										<CardDescription>
											{t("dashboardAlertStatsDesc")}
										</CardDescription>
									</CardHeader>
									<CardContent>
										{data.reportSummary.alerts ? (
											<div className="space-y-4">
												<div className="grid grid-cols-1 @lg/main:grid-cols-2 gap-4">
													<div className="rounded-lg border bg-muted/50 p-4">
														<div className="text-sm font-medium text-muted-foreground">
															{t("statsTotalAlerts")}
														</div>
														<div className="mt-1 text-xl font-bold tabular-nums">
															{formatNumber(data.reportSummary.alerts.total)}
														</div>
													</div>
													<div className="rounded-lg border bg-muted/50 p-4">
														<div className="text-sm font-medium text-muted-foreground">
															{t("statsOverdueAlerts")}
														</div>
														<div className="mt-1 text-xl font-bold tabular-nums text-orange-500">
															{formatNumber(
																data.reportSummary.alerts.overdueCount,
															)}
														</div>
													</div>
												</div>
												{/* Avg resolution + severity breakdown */}
												<div className="flex items-center gap-4 rounded-lg border p-4">
													<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
														<Clock className="h-6 w-6 text-primary" />
													</div>
													<div>
														<div className="text-sm font-medium text-muted-foreground">
															{t("statsAvgResolutionDays")}
														</div>
														<div className="text-2xl font-bold tabular-nums">
															{formatNumber(
																data.reportSummary.alerts.avgResolutionDays !=
																	null
																	? Math.round(
																			data.reportSummary.alerts
																				.avgResolutionDays,
																		)
																	: 0,
															)}{" "}
															<span className="text-sm font-normal text-muted-foreground">
																{t("statsDays")}
															</span>
														</div>
													</div>
												</div>
												{/* Severity breakdown */}
												{Object.keys(data.reportSummary.alerts.bySeverity)
													.length > 0 && (
													<div className="rounded-lg border p-4">
														<div className="text-sm font-medium text-muted-foreground mb-3">
															{t("statsAlertsBySeverity")}
														</div>
														<div className="grid grid-cols-2 @lg/main:grid-cols-4 gap-2">
															{(
																[
																	{
																		key: "LOW",
																		label: t("statsSeverityLow"),
																		color: "text-blue-500",
																	},
																	{
																		key: "MEDIUM",
																		label: t("statsSeverityMedium"),
																		color: "text-amber-500",
																	},
																	{
																		key: "HIGH",
																		label: t("statsSeverityHigh"),
																		color: "text-orange-500",
																	},
																	{
																		key: "CRITICAL",
																		label: t("statsSeverityCritical"),
																		color: "text-red-500",
																	},
																] as const
															).map(({ key, label, color }) => (
																<div
																	key={key}
																	className="flex flex-col items-center text-center"
																>
																	<div
																		className={cn(
																			"text-lg font-bold tabular-nums",
																			color,
																		)}
																	>
																		{formatNumber(
																			data.reportSummary!.alerts.bySeverity[
																				key
																			],
																		)}
																	</div>
																	<div className="text-xs text-muted-foreground">
																		{label}
																	</div>
																</div>
															))}
														</div>
													</div>
												)}
											</div>
										) : (
											<div className="flex flex-col items-center justify-center py-8 text-center">
												<ShieldAlert className="h-10 w-10 text-muted-foreground/50" />
												<p className="mt-2 text-muted-foreground">
													{t("dashboardNoAlertData")}
												</p>
											</div>
										)}
									</CardContent>
								</Card>
							</Link>
						</div>
					)}

					{/* Operation Stats + Client Stats row */}
					<div className="grid gap-6 @xl/main:grid-cols-2">
						{/* Operation Stats Card */}
						<Link
							href={routes.operations.list()}
							className="block transition-transform hover:scale-[1.01]"
						>
							<Card className="h-full cursor-pointer transition-colors hover:border-primary/50">
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										{activityVisual ? (
											<activityVisual.icon className="h-5 w-5 text-primary" />
										) : (
											<Briefcase className="h-5 w-5 text-primary" />
										)}
										{t("dashboardOperationStats")}
									</CardTitle>
									<CardDescription>
										{activityVisual
											? activityVisual.shortLabel
											: t("dashboardOperationStatsDesc")}
									</CardDescription>
								</CardHeader>
								<CardContent>
									{data.operationStats ? (
										<div className="space-y-4">
											<div className="grid grid-cols-1 @lg/main:grid-cols-2 gap-4">
												<div className="rounded-lg border bg-muted/50 p-4">
													<div className="text-sm font-medium text-muted-foreground">
														{t("statsTotalVolume")}
													</div>
													<div className="mt-1 text-xl font-bold tabular-nums">
														{formatCurrency(data.operationStats.totalVolume)}
													</div>
												</div>
												<div className="rounded-lg border bg-muted/50 p-4">
													<div className="text-sm font-medium text-muted-foreground">
														{t("statsSuspiciousTransactions")}
													</div>
													<div className="mt-1 text-xl font-bold tabular-nums">
														{formatNumber(
															data.operationStats.suspiciousTransactions,
														)}
													</div>
												</div>
											</div>

											<div className="grid grid-cols-1 @lg/main:grid-cols-2 gap-4">
												<div className="flex items-center gap-4 rounded-lg border p-4">
													<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
														<Clock className="h-6 w-6 text-primary" />
													</div>
													<div>
														<div className="text-sm font-medium text-muted-foreground">
															{t("statsTransactionsToday")}
														</div>
														<div className="text-2xl font-bold tabular-nums">
															{formatNumber(
																data.operationStats.transactionsToday,
															)}
														</div>
													</div>
												</div>
												{isVehicleActivity ? (
													<div className="flex items-center gap-4 rounded-lg border p-4">
														<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10">
															<Car className="h-6 w-6 text-emerald-500" />
														</div>
														<div>
															<div className="text-sm font-medium text-muted-foreground">
																{t("statsTotalVehicles")}
															</div>
															<div className="text-2xl font-bold tabular-nums">
																{formatNumber(
																	data.operationStats.totalVehicles,
																)}
															</div>
														</div>
													</div>
												) : (
													<div className="flex items-center gap-4 rounded-lg border p-4">
														<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10">
															<Briefcase className="h-6 w-6 text-emerald-500" />
														</div>
														<div>
															<div className="text-sm font-medium text-muted-foreground">
																{t("statsTotalOperations")}
															</div>
															<div className="text-2xl font-bold tabular-nums">
																{formatNumber(
																	data.reportSummary?.operations?.total,
																)}
															</div>
														</div>
													</div>
												)}
											</div>

											{/* Comparison metric */}
											{data.reportSummary?.comparison?.transactionsChange !=
												null && (
												<div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
													{data.reportSummary.comparison.transactionsChange >=
													0 ? (
														<TrendingUp className="h-4 w-4 text-emerald-500" />
													) : (
														<TrendingDown className="h-4 w-4 text-red-500" />
													)}
													<span>
														{formatPercent(
															data.reportSummary.comparison.transactionsChange,
														)}{" "}
														{t("statsVsLastMonth")}
													</span>
												</div>
											)}
										</div>
									) : (
										<div className="flex flex-col items-center justify-center py-8 text-center">
											<Briefcase className="h-10 w-10 text-muted-foreground/50" />
											<p className="mt-2 text-muted-foreground">
												{t("dashboardNoOperationData")}
											</p>
										</div>
									)}
								</CardContent>
							</Card>
						</Link>

						{/* Client Stats Card */}
						<Link
							href={routes.clients.list()}
							className="block transition-transform hover:scale-[1.01]"
						>
							<Card className="h-full cursor-pointer transition-colors hover:border-primary/50">
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<Users className="h-5 w-5 text-primary" />
										{t("dashboardClientStats")}
									</CardTitle>
									<CardDescription>
										{t("dashboardClientStatsDesc")}
									</CardDescription>
								</CardHeader>
								<CardContent>
									{data.clientStats ? (
										<div className="space-y-4">
											<div className="grid grid-cols-2 @lg/main:grid-cols-4 gap-4">
												<div className="flex flex-col items-center text-center rounded-lg border bg-muted/50 p-4">
													<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 mb-3">
														<Users className="h-5 w-5 text-blue-500" />
													</div>
													<div className="text-xs font-medium text-muted-foreground uppercase tracking-wider h-8 flex items-center justify-center">
														{t("statsTotalClients")}
													</div>
													<div className="text-2xl font-bold tabular-nums mt-1 text-blue-500">
														{formatNumber(data.clientStats.totalClients)}
													</div>
												</div>
												<div className="flex flex-col items-center text-center rounded-lg border bg-muted/50 p-4">
													<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 mb-3">
														<User className="h-5 w-5 text-emerald-500" />
													</div>
													<div className="text-xs font-medium text-muted-foreground uppercase tracking-wider h-8 flex items-center justify-center">
														{t("statsPhysicalClients")}
													</div>
													<div className="text-2xl font-bold tabular-nums mt-1 text-emerald-500">
														{formatNumber(data.clientStats.physicalClients)}
													</div>
												</div>
												<div className="flex flex-col items-center text-center rounded-lg border bg-muted/50 p-4">
													<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 mb-3">
														<Building2 className="h-5 w-5 text-purple-500" />
													</div>
													<div className="text-xs font-medium text-muted-foreground uppercase tracking-wider h-8 flex items-center justify-center">
														{t("statsMoralClients")}
													</div>
													<div className="text-2xl font-bold tabular-nums mt-1 text-purple-500">
														{formatNumber(data.clientStats.moralClients)}
													</div>
												</div>
												<div className="flex flex-col items-center text-center rounded-lg border bg-muted/50 p-4">
													<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 mb-3">
														<Landmark className="h-5 w-5 text-amber-500" />
													</div>
													<div className="text-xs font-medium text-muted-foreground uppercase tracking-wider h-8 flex items-center justify-center">
														{t("statsTrustClients")}
													</div>
													<div className="text-2xl font-bold tabular-nums mt-1 text-amber-500">
														{formatNumber(data.clientStats.trustClients)}
													</div>
												</div>
											</div>
											{/* Additional client metrics from report summary */}
											{data.reportSummary?.clients && (
												<div className="grid grid-cols-1 @lg/main:grid-cols-2 gap-4">
													<div className="flex items-center gap-4 rounded-lg border p-4">
														<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
															<Activity className="h-5 w-5 text-blue-500" />
														</div>
														<div>
															<div className="text-sm font-medium text-muted-foreground">
																{t("statsNewClientsInPeriod")}
															</div>
															<div className="text-xl font-bold tabular-nums">
																{formatNumber(
																	data.reportSummary.clients.newInPeriod,
																)}
															</div>
														</div>
													</div>
													<div className="flex items-center gap-4 rounded-lg border p-4">
														<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
															<AlertTriangle className="h-5 w-5 text-orange-500" />
														</div>
														<div>
															<div className="text-sm font-medium text-muted-foreground">
																{t("statsClientsWithAlerts")}
															</div>
															<div className="text-xl font-bold tabular-nums text-orange-500">
																{formatNumber(
																	data.reportSummary.clients.withAlerts,
																)}
															</div>
														</div>
													</div>
												</div>
											)}
											{/* Comparison metric */}
											{data.reportSummary?.comparison?.clientsChange !=
												null && (
												<div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
													{data.reportSummary.comparison.clientsChange >= 0 ? (
														<TrendingUp className="h-4 w-4 text-emerald-500" />
													) : (
														<TrendingDown className="h-4 w-4 text-red-500" />
													)}
													<span>
														{formatPercent(
															data.reportSummary.comparison.clientsChange,
														)}{" "}
														{t("statsVsLastMonth")}
													</span>
												</div>
											)}
										</div>
									) : (
										<div className="flex flex-col items-center justify-center py-8 text-center">
											<Users className="h-10 w-10 text-muted-foreground/50" />
											<p className="mt-2 text-muted-foreground">
												{t("dashboardNoClientData")}
											</p>
										</div>
									)}
								</CardContent>
							</Card>
						</Link>
					</div>
				</div>
			)}
		</div>
	);
}
