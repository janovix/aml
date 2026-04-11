"use client";

import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle } from "lucide-react";
import type { OrgMitigant } from "@/lib/api/risk";

interface OrgMitigantsListProps {
	mitigants: OrgMitigant[];
	language?: "es" | "en";
	className?: string;
}

export function OrgMitigantsList({
	mitigants,
	language = "es",
	className,
}: OrgMitigantsListProps) {
	const sorted = [...mitigants].sort(
		(a, b) => Number(b.exists) - Number(a.exists),
	);

	return (
		<div className={cn("space-y-2", className)}>
			{sorted.map((m) => (
				<div
					key={m.mitigantKey}
					className={cn(
						"flex items-start gap-3 rounded-lg border p-3 text-sm",
						m.exists
							? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-900/20"
							: "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/20",
					)}
				>
					{m.exists ? (
						<CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
					) : (
						<XCircle className="h-4 w-4 mt-0.5 text-red-600 dark:text-red-400 shrink-0" />
					)}
					<div className="flex-1 min-w-0">
						<div className="font-medium">{m.mitigantName}</div>
						{m.exists && (
							<div className="text-xs text-muted-foreground mt-0.5">
								{language === "es" ? "Efectividad" : "Effectiveness"}:{" "}
								<span className="tabular-nums">
									{(m.effectivenessScore * 100).toFixed(0)}%
								</span>
								{" · "}
								{language === "es" ? "Efecto" : "Effect"}:{" "}
								<span className="tabular-nums">
									{m.riskEffect > 0 ? "+" : ""}
									{m.riskEffect.toFixed(2)}
								</span>
							</div>
						)}
					</div>
				</div>
			))}
		</div>
	);
}
