"use client";

import * as React from "react";
import {
	AlertTriangle,
	AlertCircle,
	CheckCircle2,
	ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
	CompletenessResult,
	FieldRequirement,
} from "@/types/completeness";
import { TIER_COLORS } from "@/types/completeness";
import { Button } from "@/components/ui/button";

interface CompletenessBannerProps {
	result: CompletenessResult;
	className?: string;
	/** Optional callback to navigate to the section where a missing field lives. */
	onNavigateToField?: (fieldPath: string) => void;
}

function MissingFieldList({
	fields,
	dotColor,
	textColor,
	onNavigate,
}: {
	fields: FieldRequirement[];
	dotColor: string;
	textColor: string;
	onNavigate?: (fieldPath: string) => void;
}) {
	if (fields.length === 0) return null;
	return (
		<ul className="mt-1.5 space-y-0.5">
			{fields.map((f) => (
				<li key={f.fieldPath} className="flex items-center gap-1">
					<span className={cn("w-1 h-1 rounded-full shrink-0", dotColor)} />
					{onNavigate ? (
						<Button
							variant="link"
							size="sm"
							className={cn(
								"h-auto p-0 text-xs font-normal underline-offset-2",
								textColor,
							)}
							onClick={() => onNavigate(f.fieldPath)}
						>
							{f.label}
							<ArrowRight className="h-3 w-3 ml-0.5" />
						</Button>
					) : (
						<span className={cn("text-xs", textColor)}>{f.label}</span>
					)}
				</li>
			))}
		</ul>
	);
}

/**
 * Prominent banner showing completeness status at the top of detail/edit views.
 * RED = cannot submit notice. YELLOW = limited alert detection. GREEN = ready.
 */
export function CompletenessBanner({
	result,
	className,
	onNavigateToField,
}: CompletenessBannerProps): React.ReactElement | null {
	const { satReady, alertReady, summary, missing } = result;

	const redMissingFields = missing
		.filter((m) => m.field.tier === "sat_required")
		.map((m) => m.field);
	const yellowMissingFields = missing
		.filter((m) => m.field.tier === "alert_required")
		.map((m) => m.field);

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
					"rounded-lg border p-3",
					TIER_COLORS.sat_required.bg,
					TIER_COLORS.sat_required.border,
					className,
				)}
			>
				<div className="flex items-start gap-3">
					<AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
					<div className="flex-1 min-w-0">
						<p className="text-sm font-medium text-red-800 dark:text-red-300">
							No se puede presentar aviso ante la SHCP
						</p>
						<p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
							Faltan {summary.red.missing} campo
							{summary.red.missing !== 1 ? "s" : ""} obligatorio
							{summary.red.missing !== 1 ? "s" : ""} del XSD
						</p>
						<MissingFieldList
							fields={redMissingFields}
							dotColor="bg-red-500"
							textColor="text-red-600 dark:text-red-400"
							onNavigate={onNavigateToField}
						/>
						{!alertReady && (
							<>
								<p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1.5">
									Detección automática de alertas limitada (
									{summary.yellow.missing} campo
									{summary.yellow.missing !== 1 ? "s" : ""} faltante
									{summary.yellow.missing !== 1 ? "s" : ""})
								</p>
								<MissingFieldList
									fields={yellowMissingFields}
									dotColor="bg-yellow-500"
									textColor="text-yellow-600 dark:text-yellow-400"
									onNavigate={onNavigateToField}
								/>
							</>
						)}
					</div>
				</div>
			</div>
		);
	}

	// Only YELLOW missing
	return (
		<div
			className={cn(
				"rounded-lg border p-3",
				TIER_COLORS.alert_required.bg,
				TIER_COLORS.alert_required.border,
				className,
			)}
		>
			<div className="flex items-start gap-3">
				<AlertTriangle className="h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-400 mt-0.5" />
				<div className="flex-1 min-w-0">
					<p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
						Detección automática de alertas limitada
					</p>
					<p className="text-xs text-yellow-600 dark:text-yellow-400 mt-0.5">
						Faltan {summary.yellow.missing} campo
						{summary.yellow.missing !== 1 ? "s" : ""} necesario
						{summary.yellow.missing !== 1 ? "s" : ""}
					</p>
					<MissingFieldList
						fields={yellowMissingFields}
						dotColor="bg-yellow-500"
						textColor="text-yellow-600 dark:text-yellow-400"
						onNavigate={onNavigateToField}
					/>
				</div>
			</div>
		</div>
	);
}
