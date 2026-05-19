"use client";

import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/LanguageProvider";
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";

type ExceptionStatus = "INCOMPLETE" | "VALIDATED" | "INVALIDATED";

interface TrafficLightBadgeProps {
	status: ExceptionStatus;
	className?: string;
}

const STATUS_CONFIG: Record<
	ExceptionStatus,
	{
		variant: "default" | "secondary" | "destructive" | "outline";
		icon: typeof CheckCircle2;
		colorClass: string;
		labelKey:
			| "opExceptionStatusValidated"
			| "opExceptionStatusIncomplete"
			| "opExceptionStatusInvalidated";
	}
> = {
	VALIDATED: {
		variant: "default",
		icon: CheckCircle2,
		colorClass:
			"bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
		labelKey: "opExceptionStatusValidated",
	},
	INCOMPLETE: {
		variant: "secondary",
		icon: AlertCircle,
		colorClass:
			"bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
		labelKey: "opExceptionStatusIncomplete",
	},
	INVALIDATED: {
		variant: "destructive",
		icon: XCircle,
		colorClass:
			"bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
		labelKey: "opExceptionStatusInvalidated",
	},
};

export function TrafficLightBadge({
	status,
	className,
}: TrafficLightBadgeProps) {
	const { t } = useLanguage();
	const config = STATUS_CONFIG[status];
	const Icon = config.icon;

	return (
		<Badge
			variant="outline"
			className={`${config.colorClass} gap-1.5 ${className ?? ""}`}
		>
			<Icon className="h-3.5 w-3.5" />
			{t(config.labelKey)}
		</Badge>
	);
}
