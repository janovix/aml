"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TransactionsTable } from "@/components/transactions/TransactionsTable";
import { PageHero, type StatCard } from "@/components/page-hero";
import { DollarSign, Calendar, AlertCircle, Receipt, Plus } from "lucide-react";
import { getTransactionStats, type TransactionStats } from "@/lib/api/stats";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/api/http";

export function TransactionsPageContent(): React.ReactElement {
	const router = useRouter();
	const { toast } = useToast();
	const [stats, setStats] = useState<TransactionStats | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchStats = async () => {
			try {
				setIsLoading(true);
				const data = await getTransactionStats();
				setStats(data);
			} catch (error) {
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

	const formatCurrency = (amount: string): string => {
		const num = parseFloat(amount);
		if (isNaN(num)) return "$0";
		if (num >= 1000000) {
			return `$${(num / 1000000).toFixed(1)}M`;
		}
		if (num >= 1000) {
			return `$${(num / 1000).toFixed(1)}K`;
		}
		return new Intl.NumberFormat("es-MX", {
			style: "currency",
			currency: "MXN",
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(num);
	};

	const heroStats: StatCard[] = [
		{
			label: "Transacciones Hoy",
			value: isLoading ? "..." : (stats?.transactionsToday ?? 0),
			icon: Calendar,
		},
		{
			label: "Transacciones Sospechosas",
			value: isLoading ? "..." : (stats?.suspiciousTransactions ?? 0),
			icon: AlertCircle,
			variant: "primary",
		},
		{
			label: "Volumen Total",
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
				title="Transacciones"
				subtitle="Gestión de transacciones de vehículos"
				icon={Receipt}
				stats={heroStats}
				ctaLabel="Nueva Transacción"
				ctaIcon={Plus}
				onCtaClick={() => router.push("/transactions/new")}
			/>

			<TransactionsTable />
		</div>
	);
}
