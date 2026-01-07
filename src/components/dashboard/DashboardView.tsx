"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
	Home,
	Users,
	Briefcase,
	AlertTriangle,
	Clock,
	RefreshCw,
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
import { getClientStats, type ClientStats } from "@/lib/api/stats";
import { getTransactionStats, type TransactionStats } from "@/lib/api/stats";
import { getLocaleForLanguage } from "@/lib/translations";

interface DashboardData {
	clientStats: ClientStats | null;
	transactionStats: TransactionStats | null;
}

export function StatsSkeleton(): React.ReactElement {
	return (
		<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{[1, 2, 3].map((i) => (
				<Skeleton key={i} className="h-24 rounded-xl" />
			))}
		</div>
	);
}

export function CardSkeleton(): React.ReactElement {
	return (
		<Card>
			<CardHeader>
				<Skeleton className="h-5 w-40" />
				<Skeleton className="h-4 w-60" />
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid grid-cols-2 gap-4">
					<Skeleton className="h-20 rounded-lg" />
					<Skeleton className="h-20 rounded-lg" />
				</div>
				<Skeleton className="h-16 rounded-lg" />
			</CardContent>
		</Card>
	);
}

/**
 * Combined skeleton for DashboardView
 * Used when loading the organization to show the appropriate skeleton
 */
export function DashboardSkeleton(): React.ReactElement {
	return (
		<div className="space-y-6">
			<StatsSkeleton />
			<div className="grid gap-6 lg:grid-cols-2">
				<CardSkeleton />
				<CardSkeleton />
			</div>
		</div>
	);
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
		(value: number): string => {
			return new Intl.NumberFormat(locale).format(value);
		},
		[locale],
	);

	const [data, setData] = useState<DashboardData>({
		clientStats: null,
		transactionStats: null,
	});
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchData = React.useCallback(async () => {
		if (!jwt || !currentOrg?.id) return;

		setIsLoading(true);
		setError(null);

		try {
			const [clientStats, transactionStats] = await Promise.all([
				getClientStats({ jwt }).catch(() => null),
				getTransactionStats({ jwt }).catch(() => null),
			]);

			setData({ clientStats, transactionStats });
		} catch (err) {
			console.error("Error fetching dashboard data:", err);
			setError(t("errorLoadingData"));
		} finally {
			setIsLoading(false);
		}
	}, [jwt, currentOrg?.id, t]);

	useEffect(() => {
		if (!isJwtLoading && jwt && currentOrg?.id) {
			fetchData();
		} else if (!currentOrg?.id && !isJwtLoading) {
			setIsLoading(false);
		}
	}, [fetchData, isJwtLoading, jwt, currentOrg?.id]);

	// Build stats array for PageHero
	const stats: StatCard[] = useMemo(() => {
		const result: StatCard[] = [];

		if (data.clientStats) {
			result.push({
				label: t("statsTotalClients"),
				value: formatNumber(data.clientStats.totalClients),
				icon: Users,
				href: routes.clients.list(),
			});
		}

		if (data.clientStats) {
			result.push({
				label: t("statsOpenAlerts"),
				value: formatNumber(data.clientStats.openAlerts),
				icon: AlertTriangle,
				variant: data.clientStats.openAlerts > 0 ? "primary" : "default",
				href: routes.alerts.list(),
			});
		}

		if (data.transactionStats) {
			result.push({
				label: t("statsTransactionsToday"),
				value: formatNumber(data.transactionStats.transactionsToday),
				icon: Briefcase,
				href: routes.transactions.list(),
			});
		}

		return result;
	}, [data, t, formatNumber, routes]);

	const hasData = data.clientStats || data.transactionStats;

	return (
		<div className="space-y-6">
			{/* Page Hero with main stats */}
			<PageHero
				title={t("navDashboard")}
				subtitle={t("dashboardSubtitle")}
				icon={Home}
				stats={isLoading ? undefined : stats}
				actions={[
					{
						label: t("dashboardRefresh"),
						icon: RefreshCw,
						onClick: fetchData,
						variant: "outline",
						disabled: isLoading,
					},
				]}
			/>

			{/* Loading skeleton */}
			{isLoading && !hasData && (
				<div className="space-y-6">
					<StatsSkeleton />
					<div className="grid gap-6 lg:grid-cols-2">
						<CardSkeleton />
						<CardSkeleton />
					</div>
				</div>
			)}

			{/* Error state */}
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

			{/* Main content grid - Transactions and Clients side by side */}
			{hasData && (
				<div className="grid gap-6 lg:grid-cols-2">
					{/* Transaction Stats Card */}
					<Link
						href={routes.transactions.list()}
						className="block transition-transform hover:scale-[1.01]"
					>
						<Card className="h-full cursor-pointer transition-colors hover:border-primary/50">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Briefcase className="h-5 w-5 text-primary" />
									{t("dashboardTransactionStats")}
								</CardTitle>
								<CardDescription>
									{t("dashboardTransactionStatsDesc")}
								</CardDescription>
							</CardHeader>
							<CardContent>
								{data.transactionStats ? (
									<div className="space-y-4">
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div className="rounded-lg border bg-muted/50 p-4">
												<div className="text-sm font-medium text-muted-foreground">
													{t("statsTotalVolume")}
												</div>
												<div className="mt-1 text-xl font-bold tabular-nums">
													{formatCurrency(data.transactionStats.totalVolume)}
												</div>
											</div>
											<div className="rounded-lg border bg-muted/50 p-4">
												<div className="text-sm font-medium text-muted-foreground">
													{t("statsSuspiciousTransactions")}
												</div>
												<div className="mt-1 text-xl font-bold tabular-nums">
													{formatNumber(
														data.transactionStats.suspiciousTransactions,
													)}
												</div>
											</div>
										</div>

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
														data.transactionStats.transactionsToday,
													)}
												</div>
											</div>
										</div>
									</div>
								) : (
									<div className="flex flex-col items-center justify-center py-8 text-center">
										<Briefcase className="h-10 w-10 text-muted-foreground/50" />
										<p className="mt-2 text-muted-foreground">
											{t("dashboardNoTransactionData")}
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
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div className="rounded-lg border bg-muted/50 p-4">
												<div className="flex items-center gap-3">
													<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
														<Users className="h-5 w-5 text-blue-500" />
													</div>
													<div>
														<div className="text-sm font-medium text-muted-foreground">
															{t("statsTotalClients")}
														</div>
														<div className="text-xl font-bold tabular-nums">
															{formatNumber(data.clientStats.totalClients)}
														</div>
													</div>
												</div>
											</div>
											<div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
												<div className="flex items-center gap-3">
													<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
														<AlertTriangle className="h-5 w-5 text-amber-500" />
													</div>
													<div>
														<div className="text-sm font-medium text-muted-foreground">
															{t("statsOpenAlerts")}
														</div>
														<div className="text-xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
															{formatNumber(data.clientStats.openAlerts)}
														</div>
													</div>
												</div>
											</div>
										</div>

										<div className="flex items-center gap-4 rounded-lg border border-red-500/20 bg-red-500/5 p-4">
											<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/10">
												<Clock className="h-6 w-6 text-red-500" />
											</div>
											<div>
												<div className="text-sm font-medium text-muted-foreground">
													{t("statsUrgentReviews")}
												</div>
												<div className="text-2xl font-bold tabular-nums text-red-600 dark:text-red-400">
													{formatNumber(data.clientStats.urgentReviews)}
												</div>
											</div>
										</div>
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
			)}
		</div>
	);
}
