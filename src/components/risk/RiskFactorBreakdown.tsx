"use client";

import { cn } from "@/lib/utils";
import type { ElementScore, RiskLevel } from "@/lib/api/risk";
import { RiskBadge } from "./RiskBadge";

const BAR_COLORS: Record<RiskLevel, string> = {
	LOW: "bg-emerald-500",
	MEDIUM_LOW: "bg-lime-500",
	MEDIUM: "bg-amber-500",
	MEDIUM_HIGH: "bg-orange-500",
	HIGH: "bg-red-500",
};

const ELEMENT_LABELS: Record<string, { es: string; en: string }> = {
	CLIENT: { es: "Clientes", en: "Clients" },
	GEOGRAPHIC: { es: "Geográfico", en: "Geographic" },
	PRODUCT_SERVICE: { es: "Productos/Servicios", en: "Products/Services" },
	TRANSACTION_CHANNEL: { es: "Transacciones", en: "Transactions" },
};

interface RiskFactorBreakdownProps {
	elements: ElementScore[];
	language?: "es" | "en";
	className?: string;
}

export function RiskFactorBreakdown({
	elements,
	language = "es",
	className,
}: RiskFactorBreakdownProps) {
	return (
		<div className={cn("space-y-4", className)}>
			{elements.map((element) => {
				const label =
					ELEMENT_LABELS[element.elementType]?.[language] ??
					element.elementType;

				return (
					<div key={element.elementType} className="space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium">{label}</span>
							<div className="flex items-center gap-2">
								<span className="text-sm tabular-nums text-muted-foreground">
									{element.rawScore.toFixed(1)}
								</span>
								<RiskBadge level={element.riskLevel} language={language} />
							</div>
						</div>
						<div className="h-2 rounded-full bg-muted">
							<div
								className={cn(
									"h-2 rounded-full transition-all duration-500",
									BAR_COLORS[element.riskLevel],
								)}
								style={{
									width: `${Math.min(100, (element.rawScore / 10) * 100)}%`,
								}}
							/>
						</div>
						{element.factors.length > 0 && (
							<div className="grid grid-cols-2 gap-x-4 gap-y-1 pl-2">
								{element.factors.map((f) => (
									<div
										key={f.name}
										className="flex items-center justify-between text-xs text-muted-foreground"
									>
										<span className="truncate">{f.name}</span>
										<span className="tabular-nums ml-1">
											{f.weightedScore.toFixed(1)}
										</span>
									</div>
								))}
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}
