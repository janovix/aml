"use client";

import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { useEffect, useState } from "react";
import { ClientsTable } from "@/components/clients/ClientsTable";
import { PageHero, type StatCard } from "@/components/page-hero";
import { Users, User, Building2, Plus } from "lucide-react";
import { getClientStats } from "@/lib/api/stats";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/mutations";
import { ApiError } from "@/lib/api/http";
import { useLanguage } from "@/components/LanguageProvider";
import { getLocaleForLanguage } from "@/lib/translations";

export function ClientsPageContent(): React.ReactElement {
	const { navigateTo } = useOrgNavigation();
	const { t, language } = useLanguage();
	const [stats, setStats] = useState<{
		totalClients: number;
		physicalClients: number;
		moralClients: number;
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
				toast.error(extractErrorMessage(error));
			} finally {
				setIsLoading(false);
			}
		};

		fetchStats();
	}, [t]);

	const formatNumber = (num: number): string => {
		return new Intl.NumberFormat(getLocaleForLanguage(language)).format(num);
	};

	const heroStats: StatCard[] = [
		{
			label: t("statsTotalClients"),
			value: isLoading
				? "..."
				: stats?.totalClients
					? formatNumber(stats.totalClients)
					: "0",
			icon: Users,
			variant: "primary",
		},
		{
			label: t("statsPhysicalClients"),
			value: isLoading
				? "..."
				: stats?.physicalClients
					? formatNumber(stats.physicalClients)
					: "0",
			icon: User,
		},
		{
			label: t("statsMoralClients"),
			value: isLoading
				? "..."
				: stats?.moralClients
					? formatNumber(stats.moralClients)
					: "0",
			icon: Building2,
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
