"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
	Users,
	AlertTriangle,
	Clock,
	ListChecks,
	TrendingUp,
	TrendingDown,
} from "lucide-react";

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
		warning: "border-yellow-500/30 bg-yellow-500/10",
		danger: "border-red-500/30 bg-red-500/10",
		success: "border-green-500/30 bg-green-500/10",
	};

	const iconStyles = {
		default: "bg-primary/10 text-primary",
		warning: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
		danger: "bg-red-500/20 text-red-600 dark:text-red-400",
		success: "bg-green-500/20 text-green-600 dark:text-green-400",
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
									<TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
								) : (
									<TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
								)}
								<span
									className={cn(
										"font-medium",
										trend.direction === "up"
											? "text-green-600 dark:text-green-400"
											: "text-red-600 dark:text-red-400",
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
	const kpis = [
		{
			title: "Avisos Abiertos",
			value: 37,
			icon: <AlertTriangle className="h-6 w-6" />,
			trend: { value: 8, label: "nuevos hoy", direction: "up" as const },
			severity: "danger" as const,
		},
		{
			title: "Revisiones Urgentes",
			value: 12,
			icon: <Clock className="h-6 w-6" />,
			severity: "warning" as const,
		},
		{
			title: "Revisiones Completadas",
			value: 156,
			icon: <ListChecks className="h-6 w-6" />,
			trend: { value: 23, label: "este mes", direction: "up" as const },
			severity: "success" as const,
		},
		{
			title: "Total Clientes",
			value: "1,248",
			icon: <Users className="h-6 w-6" />,
			trend: { value: 12, label: "vs mes anterior", direction: "up" as const },
			severity: "default" as const,
		},
	];

	return (
		<section aria-label="Indicadores clave de rendimiento">
			<div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{kpis.map((kpi) => (
					<KpiCard key={kpi.title} {...kpi} />
				))}
			</div>
		</section>
	);
}
