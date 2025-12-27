"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, cn } from "@algtools/ui";
import {
	DollarSign,
	Package,
	Calendar,
	AlertCircle,
	TrendingUp,
	TrendingDown,
} from "lucide-react";
import { getTransactionStats } from "../../lib/api/stats";
import { useToast } from "../../hooks/use-toast";

interface KpiCardProps {
	title: string;
	value: string | number;
	icon: React.ReactNode;
	trend?: {
		value: number;
		label: string;
		direction: "up" | "down";
	};
	severity?: "default" | "warning" | "danger" | "success";
	className?: string;
}

function KpiCard({
	title,
	value,
	icon,
	trend,
	severity = "default",
	className,
}: KpiCardProps): React.ReactElement {
	const severityStyles = {
		default: "border-border bg-card",
		warning:
			"border-[rgb(var(--risk-medium))]/30 bg-[rgb(var(--risk-medium-bg))]",
		danger: "border-[rgb(var(--risk-high))]/30 bg-[rgb(var(--risk-high-bg))]",
		success: "border-[rgb(var(--risk-low))]/30 bg-[rgb(var(--risk-low-bg))]",
	};

	const iconStyles = {
		default: "bg-primary/10 text-primary",
		warning: "bg-[rgb(var(--risk-medium))]/20 text-[rgb(var(--risk-medium))]",
		danger: "bg-[rgb(var(--risk-high))]/20 text-[rgb(var(--risk-high))]",
		success: "bg-[rgb(var(--risk-low))]/20 text-[rgb(var(--risk-low))]",
	};

	return (
		<Card
			className={cn(
				"transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
				severityStyles[severity],
				className,
			)}
		>
			<CardContent className="p-4 sm:p-5 lg:p-6">
				<div className="flex items-start justify-between gap-3 sm:gap-4">
					<div className="space-y-1 sm:space-y-1.5 lg:space-y-2 min-w-0 flex-1">
						<p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
							{title}
						</p>
						<p className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
							{value}
						</p>
						{trend && (
							<div className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm">
								{trend.direction === "up" ? (
									<TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[rgb(var(--risk-low))]" />
								) : (
									<TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[rgb(var(--risk-high))]" />
								)}
								<span
									className={cn(
										"font-medium",
										trend.direction === "up"
											? "text-[rgb(var(--risk-low))]"
											: "text-[rgb(var(--risk-high))]",
									)}
								>
									{trend.value}%
								</span>
								<span className="text-muted-foreground truncate">
									{trend.label}
								</span>
							</div>
						)}
					</div>
					<div
						className={cn(
							"flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg",
							iconStyles[severity],
						)}
						aria-hidden="true"
					>
						{icon}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

export function TransactionsKPICards(): React.ReactElement {
	const { toast } = useToast();
	const [stats, setStats] = useState<{
		transactionsToday: number;
		suspiciousTransactions: number;
		totalVolume: string;
		totalVehicles: number;
	} | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchStats = async () => {
			try {
				setIsLoading(true);
				const data = await getTransactionStats();
				setStats(data);
			} catch (error) {
				console.error("Error fetching transaction stats:", error);
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

	const formatNumber = (num: number): string => {
		return new Intl.NumberFormat("es-MX").format(num);
	};

	const kpis = [
		{
			title: "Transacciones Hoy",
			value: isLoading ? "..." : (stats?.transactionsToday ?? 0),
			icon: <Calendar className="h-6 w-6" />,
			severity: "default" as const,
		},
		{
			title: "Transacciones Sospechosas",
			value: isLoading ? "..." : (stats?.suspiciousTransactions ?? 0),
			icon: <AlertCircle className="h-6 w-6" />,
			severity: "danger" as const,
		},
		{
			title: "Volumen Total",
			value: isLoading
				? "..."
				: stats?.totalVolume
					? formatCurrency(stats.totalVolume)
					: "$0",
			icon: <DollarSign className="h-6 w-6" />,
			severity: "success" as const,
		},
		{
			title: "Total Vehículos",
			value: isLoading
				? "..."
				: stats?.totalVehicles
					? formatNumber(stats.totalVehicles)
					: "0",
			icon: <Package className="h-6 w-6" />,
			severity: "default" as const,
		},
	];

	return (
		<section aria-label="Indicadores clave de transacciones">
			<div
				className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-x-visible sm:pb-0 scrollbar-hide"
				style={{ WebkitOverflowScrolling: "touch" }}
			>
				{kpis.map((kpi) => (
					<KpiCard
						key={kpi.title}
						{...kpi}
						className="min-w-[140px] flex-shrink-0 sm:min-w-0 sm:flex-shrink"
					/>
				))}
			</div>
		</section>
	);
}
