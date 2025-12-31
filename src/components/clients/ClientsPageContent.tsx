"use client";

import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { useEffect, useState } from "react";
import { ClientsTable } from "@/components/clients/ClientsTable";
import { PageHero, type StatCard } from "@/components/page-hero";
import { Users, AlertTriangle, Clock, Plus } from "lucide-react";
import { getClientStats } from "@/lib/api/stats";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/api/http";

export function ClientsPageContent(): React.ReactElement {
	const { navigateTo } = useOrgNavigation();
	const { toast } = useToast();
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
					title: "Error",
					description: "No se pudieron cargar las estadísticas.",
					variant: "destructive",
				});
			} finally {
				setIsLoading(false);
			}
		};

		fetchStats();
	}, [toast]);

	const formatNumber = (num: number): string => {
		return new Intl.NumberFormat("es-MX").format(num);
	};

	const heroStats: StatCard[] = [
		{
			label: "Alertas Abiertas",
			value: isLoading ? "..." : (stats?.openAlerts ?? 0),
			icon: AlertTriangle,
			variant: "primary",
		},
		{
			label: "Revisiones Urgentes",
			value: isLoading ? "..." : (stats?.urgentReviews ?? 0),
			icon: Clock,
		},
		{
			label: "Total Clientes",
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
				title="Clientes"
				subtitle="Gestión y monitoreo de clientes"
				icon={Users}
				stats={heroStats}
				ctaLabel="Nuevo Cliente"
				ctaIcon={Plus}
				onCtaClick={() => navigateTo("/clients/new")}
			/>

			<ClientsTable />
		</div>
	);
}
