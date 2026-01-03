"use client";

import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { useEffect, useState } from "react";
import { ClientsTable } from "@/components/clients/ClientsTable";
import { PageHero, type StatCard } from "@/components/page-hero";
import { Users, AlertTriangle, Clock, Plus } from "lucide-react";
import { getClientStats } from "@/lib/api/stats";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/api/http";
import { useLanguage } from "@/components/LanguageProvider";
import { getLocaleForLanguage } from "@/lib/translations";

export function ClientsPageContent(): React.ReactElement {
	const { navigateTo } = useOrgNavigation();
	const { toast } = useToast();
	const { t, language } = useLanguage();
	const [stats, setStats] = useState<{
		openAlerts: number;
		urgentReviews: number;
		totalClients: number;
	} | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchStats = async () => {
			try {
				setIsLoading(true);
				const data = await getClientStats();
				setStats(data);
			} catch (error) {
				if (error instanceof ApiError) {
					console.error(
						"[ClientsPageContent] API error fetching client stats:",
						`status=${error.status}`,
						`message=${error.message}`,
						"body=",
						error.body,
					);
				} else {
					console.error(
						"[ClientsPageContent] Error fetching client stats:",
						error instanceof Error ? error.message : error,
					);
				}
				toast({
					title: t("errorGeneric"),
					description: t("errorLoadingStats"),
					variant: "destructive",
				});
			} finally {
				setIsLoading(false);
			}
		};

		fetchStats();
	}, [toast, t]);

	const formatNumber = (num: number): string => {
		return new Intl.NumberFormat(getLocaleForLanguage(language)).format(num);
	};

	const heroStats: StatCard[] = [
		{
			label: t("statsOpenAlerts"),
			value: isLoading ? "..." : (stats?.openAlerts ?? 0),
			icon: AlertTriangle,
			variant: "primary",
		},
		{
			label: t("statsUrgentReviews"),
			value: isLoading ? "..." : (stats?.urgentReviews ?? 0),
			icon: Clock,
		},
		{
			label: t("statsTotalClients"),
			value: isLoading
				? "..."
				: stats?.totalClients
					? formatNumber(stats.totalClients)
					: "0",
			icon: Users,
		},
	];

	return (
		<div className="space-y-6">
			<PageHero
				title={t("clientsTitle")}
				subtitle={t("clientsSubtitle")}
				icon={Users}
				stats={heroStats}
				ctaLabel={t("clientsNew")}
				ctaIcon={Plus}
				onCtaClick={() => navigateTo("/clients/new")}
			/>

			<ClientsTable />
		</div>
	);
}
