"use client";

import React from "react";
import { Card, CardContent, cn } from "@algtools/ui";
import {
	DollarSign,
	Package,
	Calendar,
	AlertCircle,
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
	const kpis = [
		{
			title: "Transacciones Hoy",
			value: 47,
			icon: <Calendar className="h-6 w-6" />,
			severity: "default" as const,
		},
		{
			title: "Transacciones Sospechosas",
			value: 23,
			icon: <AlertCircle className="h-6 w-6" />,
			trend: { value: 8, label: "nuevas hoy", direction: "up" as const },
			severity: "danger" as const,
		},
		{
			title: "Volumen Total",
			value: "$2.4M",
			icon: <DollarSign className="h-6 w-6" />,
			trend: { value: 15, label: "vs mes anterior", direction: "up" as const },
			severity: "success" as const,
		},
		{
			title: "Total Vehículos",
			value: "1,856",
			icon: <Package className="h-6 w-6" />,
			trend: { value: 12, label: "vs mes anterior", direction: "up" as const },
			severity: "default" as const,
		},
	];

	return (
		<section aria-label="Indicadores clave de transacciones">
			<div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{kpis.map((kpi) => (
					<KpiCard key={kpi.title} {...kpi} />
				))}
			</div>
		</section>
	);
}
