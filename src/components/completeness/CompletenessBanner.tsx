"use client";

import * as React from "react";
import { AlertTriangle, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CompletenessResult } from "@/types/completeness";
import { TIER_COLORS } from "@/types/completeness";

interface CompletenessBannerProps {
	result: CompletenessResult;
	className?: string;
}

/**
 * Prominent banner showing completeness status at the top of detail/edit views.
 * RED = cannot submit notice. YELLOW = limited alert detection. GREEN = ready.
 */
export function CompletenessBanner({
	result,
	className,
}: CompletenessBannerProps): React.ReactElement | null {
	const { satReady, alertReady, summary } = result;

	// All complete -- show green success
	if (satReady && alertReady) {
		return (
			<div
				className={cn(
					"flex items-center gap-3 rounded-lg border p-3",
					"bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800",
					className,
				)}
			>
				<CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
				<div className="flex-1 min-w-0">
					<p className="text-sm font-medium text-green-800 dark:text-green-300">
						Datos completos para aviso SAT y detección de alertas
					</p>
					{!result.fullyEnriched && (
						<p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
							{summary.grey.missing} campos opcionales KYC pendientes
						</p>
					)}
				</div>
			</div>
		);
	}

	// RED fields missing -- urgent
	if (!satReady) {
		return (
			<div
				className={cn(
					"flex items-center gap-3 rounded-lg border p-3",
					TIER_COLORS.sat_required.bg,
					TIER_COLORS.sat_required.border,
					className,
				)}
			>
				<AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
				<div className="flex-1 min-w-0">
					<p className="text-sm font-medium text-red-800 dark:text-red-300">
						No se puede presentar aviso ante la SHCP
					</p>
					<p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
						Faltan {summary.red.missing} campo
						{summary.red.missing !== 1 ? "s" : ""} obligatorio
						{summary.red.missing !== 1 ? "s" : ""} del XSD
					</p>
					{!alertReady && (
						<p className="text-xs text-yellow-600 dark:text-yellow-400 mt-0.5">
							Detección automática de alertas limitada ({summary.yellow.missing}{" "}
							campo{summary.yellow.missing !== 1 ? "s" : ""} faltante
							{summary.yellow.missing !== 1 ? "s" : ""})
						</p>
					)}
				</div>
			</div>
		);
	}

	// Only YELLOW missing
	return (
		<div
			className={cn(
				"flex items-center gap-3 rounded-lg border p-3",
				TIER_COLORS.alert_required.bg,
				TIER_COLORS.alert_required.border,
				className,
			)}
		>
			<AlertTriangle className="h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-400" />
			<div className="flex-1 min-w-0">
				<p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
					Detección automática de alertas limitada
				</p>
				<p className="text-xs text-yellow-600 dark:text-yellow-400 mt-0.5">
					Faltan {summary.yellow.missing} campo
					{summary.yellow.missing !== 1 ? "s" : ""} necesario
					{summary.yellow.missing !== 1 ? "s" : ""}
				</p>
			</div>
		</div>
	);
}
