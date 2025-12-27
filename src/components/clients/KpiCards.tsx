"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, cn } from "@algtools/ui";
import {
	Users,
	AlertTriangle,
	Clock,
	TrendingUp,
	TrendingDown,
} from "lucide-react";
import { getClientStats } from "../../lib/api/stats";
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
		warning: "border-[var(--risk-medium)]/30 bg-[var(--risk-medium-bg)]",
		danger: "border-[var(--risk-high)]/30 bg-[var(--risk-high-bg)]",
		success: "border-[var(--risk-low)]/30 bg-[var(--risk-low-bg)]",
	};

	const iconStyles = {
		default: "bg-primary/10 text-primary",
		warning: "bg-[var(--risk-medium)]/20 text-[var(--risk-medium)]",
		danger: "bg-[var(--risk-high)]/20 text-[var(--risk-high)]",
		success: "bg-[var(--risk-low)]/20 text-[var(--risk-low)]",
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
									<TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[var(--risk-low)]" />
								) : (
									<TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[var(--risk-high)]" />
								)}
								<span
									className={cn(
										"font-medium",
										trend.direction === "up"
											? "text-[var(--risk-low)]"
											: "text-[var(--risk-high)]",
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

export function KpiCards(): React.ReactElement {
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
				console.error("Error fetching client stats:", error);
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

	const kpis = [
		{
			title: "Avisos Abiertos",
			value: isLoading ? "..." : (stats?.openAlerts ?? 0),
			icon: <AlertTriangle className="h-6 w-6" />,
			severity: "danger" as const,
		},
		{
			title: "Revisiones Urgentes",
			value: isLoading ? "..." : (stats?.urgentReviews ?? 0),
			icon: <Clock className="h-6 w-6" />,
			severity: "warning" as const,
		},
		{
			title: "Total Clientes",
			value: isLoading
				? "..."
				: stats?.totalClients
					? formatNumber(stats.totalClients)
					: "0",
			icon: <Users className="h-6 w-6" />,
			severity: "default" as const,
		},
	];

	return (
		<section aria-label="Indicadores clave de rendimiento">
			<div
				className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:overflow-x-visible sm:pb-0 scrollbar-hide"
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
