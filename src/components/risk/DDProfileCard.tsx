"use client";

import { cn } from "@/lib/utils";
import type { DDProfile, DDLevel } from "@/lib/api/risk";
import { DDBadge } from "./RiskBadge";

const DD_FIELD_LABELS: Record<keyof DDProfile, { es: string; en: string }> = {
	clientAcceptance: {
		es: "Aceptación de cliente",
		en: "Client acceptance",
	},
	identificationVerification: {
		es: "Identificación y verificación",
		en: "ID & verification",
	},
	ongoingMonitoring: {
		es: "Monitoreo continuo",
		en: "Ongoing monitoring",
	},
	transactionScrutiny: {
		es: "Escrutinio transaccional",
		en: "Transaction scrutiny",
	},
	reportingObligations: {
		es: "Obligaciones de reporte",
		en: "Reporting obligations",
	},
};

const DD_ORDER: (keyof DDProfile)[] = [
	"clientAcceptance",
	"identificationVerification",
	"ongoingMonitoring",
	"transactionScrutiny",
	"reportingObligations",
];

interface DDProfileCardProps {
	profile: DDProfile;
	language?: "es" | "en";
	className?: string;
}

export function DDProfileCard({
	profile,
	language = "es",
	className,
}: DDProfileCardProps) {
	return (
		<div className={cn("space-y-3", className)}>
			{DD_ORDER.map((field) => {
				const level: DDLevel = profile[field];
				const label = DD_FIELD_LABELS[field][language];

				return (
					<div key={field} className="flex items-center justify-between">
						<span className="text-sm text-muted-foreground">{label}</span>
						<DDBadge level={level} language={language} />
					</div>
				);
			})}
		</div>
	);
}
