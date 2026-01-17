"use client";

import { useCallback, useEffect, useState } from "react";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { TransactionsTable } from "@/components/transactions/TransactionsTable";
import { PageHero, type StatCard } from "@/components/page-hero";
import { DollarSign, Calendar, AlertCircle, Receipt, Plus } from "lucide-react";
import { getTransactionStats, type TransactionStats } from "@/lib/api/stats";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/mutations";
import { ApiError, isOrganizationRequiredError } from "@/lib/api/http";
import { useLanguage } from "@/components/LanguageProvider";
import { getLocaleForLanguage } from "@/lib/translations";
import { useJwt } from "@/hooks/useJwt";

export function TransactionsPageContent(): React.ReactElement {
	const { navigateTo } = useOrgNavigation();
	const { t, language } = useLanguage();
	const { jwt, isLoading: isJwtLoading } = useJwt();
	const [stats, setStats] = useState<TransactionStats | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const fetchStats = useCallback(async () => {
		// Wait for JWT to be available (which means org is synced)
		if (!jwt) {
			setIsLoading(false);
			return;
		}

		try {
			setIsLoading(true);
			const data = await getTransactionStats({ jwt });
			setStats(data);
		} catch (error) {
			// Silently handle org-required errors - this can happen during org switching
			if (isOrganizationRequiredError(error)) {
				console.debug(
					"[TransactionsPageContent] Organization required error - org may be syncing",
				);
				return;
			}

			if (error instanceof ApiError) {
				console.error(
					"[TransactionsPageContent] API error fetching transaction stats:",
					`status=${error.status}`,
					`message=${error.message}`,
					"body=",
					error.body,
				);
			} else {
				console.error(
					"[TransactionsPageContent] Error fetching transaction stats:",
					error instanceof Error ? error.message : error,
				);
			}
			toast.error(extractErrorMessage(error));
		} finally {
			setIsLoading(false);
		}
	}, [jwt]);

	useEffect(() => {
		// Only fetch when JWT is ready (which means org is ready)
		if (!isJwtLoading && jwt) {
			fetchStats();
		} else if (!isJwtLoading && !jwt) {
			// No JWT available (no org selected)
			setIsLoading(false);
		}
	}, [fetchStats, isJwtLoading, jwt]);

	const formatCurrency = (amount: string): string => {
		const num = parseFloat(amount);
		if (isNaN(num)) return "$0";
		if (num >= 1000000) {
			return `$${(num / 1000000).toFixed(1)}M`;
		}
		if (num >= 1000) {
			return `$${(num / 1000).toFixed(1)}K`;
		}
		return new Intl.NumberFormat(getLocaleForLanguage(language), {
			style: "currency",
			currency: "MXN",
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(num);
	};

	const heroStats: StatCard[] = [
		{
			label: t("statsTransactionsToday"),
			value: isLoading ? "..." : (stats?.transactionsToday ?? 0),
			icon: Calendar,
		},
		{
			label: t("statsSuspiciousTransactions"),
			value: isLoading ? "..." : (stats?.suspiciousTransactions ?? 0),
			icon: AlertCircle,
			variant: "primary",
		},
		{
			label: t("statsTotalVolume"),
			value: isLoading
				? "..."
				: stats?.totalVolume
					? formatCurrency(stats.totalVolume)
					: "$0",
			icon: DollarSign,
		},
	];

	return (
		<div className="space-y-6">
			<PageHero
				title={t("transactionsTitle")}
				subtitle={t("transactionsSubtitle")}
				icon={Receipt}
				stats={heroStats}
				ctaLabel={t("transactionsNew")}
				ctaIcon={Plus}
				onCtaClick={() => navigateTo("/transactions/new")}
			/>

			<TransactionsTable />
		</div>
	);
}
