import * as React from "react";
import { Badge } from "@/components/ui/badge";
import type { KycSessionStatus } from "@/lib/api/kyc-sessions";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<
	KycSessionStatus,
	{ label: string; className: string }
> = {
	ACTIVE: {
		label: "Activo",
		className:
			"bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
	},
	IN_PROGRESS: {
		label: "En progreso",
		className:
			"bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800",
	},
	SUBMITTED: {
		label: "Enviado",
		className:
			"bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
	},
	PENDING_REVIEW: {
		label: "Pendiente de revisión",
		className:
			"bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
	},
	APPROVED: {
		label: "Aprobado",
		className:
			"bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
	},
	REJECTED: {
		label: "Rechazado",
		className:
			"bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
	},
	EXPIRED: {
		label: "Expirado",
		className:
			"bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-700",
	},
	REVOKED: {
		label: "Revocado",
		className:
			"bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-700",
	},
};

interface KycStatusBadgeProps {
	status: KycSessionStatus;
	className?: string;
}

export function KycStatusBadge({ status, className }: KycStatusBadgeProps) {
	const config = STATUS_CONFIG[status] ?? {
		label: status,
		className: "",
	};
	return (
		<Badge variant="outline" className={cn(config.className, className)}>
			{config.label}
		</Badge>
	);
}
