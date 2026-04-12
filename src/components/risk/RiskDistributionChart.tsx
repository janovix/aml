"use client";

import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/lib/api/risk";

const SEGMENT_COLORS: Record<RiskLevel, string> = {
	LOW: "bg-emerald-500",
	MEDIUM_LOW: "bg-lime-500",
	MEDIUM: "bg-amber-500",
	MEDIUM_HIGH: "bg-orange-500",
	HIGH: "bg-red-500",
};

const SEGMENT_LABELS: Record<RiskLevel, { es: string; en: string }> = {
	LOW: { es: "Bajo", en: "Low" },
	MEDIUM_LOW: { es: "Medio-Bajo", en: "Medium-Low" },
	MEDIUM: { es: "Medio", en: "Medium" },
	MEDIUM_HIGH: { es: "Medio-Alto", en: "Medium-High" },
	HIGH: { es: "Alto", en: "High" },
};

const LEVELS: RiskLevel[] = [
	"LOW",
	"MEDIUM_LOW",
	"MEDIUM",
	"MEDIUM_HIGH",
	"HIGH",
];

interface RiskDistributionChartProps {
	distribution: Record<RiskLevel, number>;
	total: number;
	language?: "es" | "en";
	className?: string;
}

export function RiskDistributionChart({
	distribution,
	total,
	language = "es",
	className,
}: RiskDistributionChartProps) {
	if (total === 0) {
		return (
			<div
				className={cn(
					"text-center text-sm text-muted-foreground py-4",
					className,
				)}
			>
				{language === "es"
					? "Sin datos de distribución de riesgo"
					: "No risk distribution data"}
			</div>
		);
	}

	return (
		<div className={cn("space-y-3", className)}>
			{/* Stacked bar */}
			<div className="flex h-4 rounded-full overflow-hidden bg-muted">
				{LEVELS.map((level) => {
					const count = distribution[level] ?? 0;
					const pct = (count / total) * 100;
					if (pct === 0) return null;
					return (
						<div
							key={level}
							className={cn(
								"transition-all duration-500",
								SEGMENT_COLORS[level],
							)}
							style={{ width: `${pct}%` }}
							title={`${SEGMENT_LABELS[level][language]}: ${count}`}
						/>
					);
				})}
			</div>

			{/* Legend */}
			<div className="grid grid-cols-2 @md/main:grid-cols-5 gap-2">
				{LEVELS.map((level) => {
					const count = distribution[level] ?? 0;
					const pct = total > 0 ? ((count / total) * 100).toFixed(0) : "0";

					return (
						<div key={level} className="flex items-center gap-2">
							<div
								className={cn(
									"h-3 w-3 rounded-sm shrink-0",
									SEGMENT_COLORS[level],
								)}
							/>
							<div className="flex flex-col">
								<span className="text-xs font-medium leading-none">
									{count}
								</span>
								<span className="text-[10px] text-muted-foreground leading-tight">
									{SEGMENT_LABELS[level][language]} ({pct}%)
								</span>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
