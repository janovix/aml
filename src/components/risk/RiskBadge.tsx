"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { RiskLevel, DDLevel } from "@/lib/api/risk";

const RISK_COLORS: Record<RiskLevel, string> = {
	LOW: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
	MEDIUM_LOW:
		"bg-lime-100 text-lime-800 border-lime-200 dark:bg-lime-900/30 dark:text-lime-400 dark:border-lime-800",
	MEDIUM:
		"bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
	MEDIUM_HIGH:
		"bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
	HIGH: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
};

const RISK_LABELS: Record<RiskLevel, { es: string; en: string }> = {
	LOW: { es: "Bajo", en: "Low" },
	MEDIUM_LOW: { es: "Medio-Bajo", en: "Medium-Low" },
	MEDIUM: { es: "Medio", en: "Medium" },
	MEDIUM_HIGH: { es: "Medio-Alto", en: "Medium-High" },
	HIGH: { es: "Alto", en: "High" },
};

const DD_COLORS: Record<DDLevel, string> = {
	SIMPLIFIED:
		"bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800",
	STANDARD:
		"bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
	ENHANCED:
		"bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800",
};

const DD_LABELS: Record<DDLevel, { es: string; en: string }> = {
	SIMPLIFIED: { es: "Simplificada", en: "Simplified" },
	STANDARD: { es: "Estándar", en: "Standard" },
	ENHANCED: { es: "Reforzada", en: "Enhanced" },
};

interface RiskBadgeProps {
	level: RiskLevel;
	language?: "es" | "en";
	className?: string;
	size?: "sm" | "md";
}

export function RiskBadge({
	level,
	language = "es",
	className,
	size = "sm",
}: RiskBadgeProps) {
	return (
		<Badge
			variant="outline"
			className={cn(
				RISK_COLORS[level],
				size === "md" && "text-sm px-3 py-1",
				className,
			)}
		>
			{RISK_LABELS[level][language]}
		</Badge>
	);
}

interface DDBadgeProps {
	level: DDLevel;
	language?: "es" | "en";
	className?: string;
}

export function DDBadge({ level, language = "es", className }: DDBadgeProps) {
	return (
		<Badge variant="outline" className={cn(DD_COLORS[level], className)}>
			{DD_LABELS[level][language]}
		</Badge>
	);
}
