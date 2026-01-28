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
import { cn } from "@/lib/utils";

interface DashboardData {
	clientStats: ClientStats | null;
	transactionStats: TransactionStats | null;
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
			<div className="grid gap-6 @xl/main:grid-cols-2">
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

	// Fetch data when JWT and org are ready
	useEffect(() => {
		// Still waiting for JWT
		if (isJwtLoading) {
			return;
		}

		// No JWT available (no org selected or auth issue)
		if (!jwt) {
			setIsLoading(false);
			return;
		}

		// No org selected
		if (!currentOrg?.id) {
			setIsLoading(false);
			return;
		}

		// All conditions met - fetch data
		const fetchData = async () => {
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
		};

		fetchData();
	}, [isJwtLoading, jwt, currentOrg?.id, t]);

	// Manual refresh function for the refresh button
	const handleRefresh = React.useCallback(async () => {
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

	// Build stats array for PageHero
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

		if (data.clientStats) {
			result.push({
				label: t("statsPhysicalClients"),
				value: formatNumber(data.clientStats.physicalClients),
				icon: User,
				href: routes.clients.list(),
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

	// Only show skeleton on initial load (no data yet), not during org switch
	const showInitialSkeleton = isLoading && !hasData;

	return (
		<div className="space-y-6">
			{/* Page Hero with main stats - keep showing previous stats while loading */}
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

			{/* Loading skeleton - only on initial load when no data exists */}
			{showInitialSkeleton && (
				<div className="space-y-6">
					<StatsSkeleton />
					<div className="grid gap-6 @xl/main:grid-cols-2">
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
			{/* Keep showing data while loading (reduced opacity indicates refresh in progress) */}
			{hasData && (
				<div
					className={cn(
						"grid gap-6 @xl/main:grid-cols-2 transition-opacity duration-200",
						isLoading && "opacity-60 pointer-events-none",
					)}
				>
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
										<div className="grid grid-cols-1 @lg/main:grid-cols-2 gap-4">
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
									<div className="grid grid-cols-1 @md/main:grid-cols-2 @lg/main:grid-cols-4 gap-4">
										<div className="flex flex-col items-center text-center rounded-lg border bg-muted/50 p-4">
											<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 mb-3">
												<Users className="h-5 w-5 text-blue-500" />
											</div>
											<div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
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
											<div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
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
											<div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
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
											<div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
												{t("statsTrustClients")}
											</div>
											<div className="text-2xl font-bold tabular-nums mt-1 text-amber-500">
												{formatNumber(data.clientStats.trustClients)}
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
