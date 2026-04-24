"use client";

import * as React from "react";
import {
	AlertTriangle,
	Bell,
	CheckCircle2,
	FileText,
	Info,
	MinusCircle,
	UserCheck,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { CompletenessResult } from "@/types/completeness";
import { TIER_COLORS } from "@/types/completeness";

const MISSING_FIELD_PREVIEW = 5;

type PrimaryStatus =
	| { kind: "noData" }
	| { kind: "missingSat"; missingCount: number }
	| { kind: "partial" }
	| { kind: "ready" };

function getPrimaryStatus(result: CompletenessResult): PrimaryStatus {
	const { summary, satReady, alertReady, fullyEnriched } = result;
	if (
		summary.red.total === 0 &&
		summary.yellow.total === 0 &&
		summary.grey.total === 0
	) {
		return { kind: "noData" };
	}
	if (!satReady) {
		return { kind: "missingSat", missingCount: summary.red.missing };
	}
	if (!alertReady || !fullyEnriched) {
		return { kind: "partial" };
	}
	return { kind: "ready" };
}

function replaceCount(template: string, count: number): string {
	return template.replace(/\{\{count\}\}/g, String(count));
}

function tierBarClass(tier: "red" | "yellow" | "grey"): string {
	switch (tier) {
		case "red":
			return "bg-red-500";
		case "yellow":
			return "bg-amber-500";
		case "grey":
			return "bg-slate-500";
	}
}

function TierRow({
	tier,
	label,
	helper,
	icon: Icon,
	filled,
	total,
}: {
	tier: "red" | "yellow" | "grey";
	label: string;
	helper: string;
	icon: React.ComponentType<{ className?: string }>;
	filled: number;
	total: number;
}) {
	const { t } = useLanguage();
	const pct = total > 0 ? Math.round((filled / total) * 100) : 0;
	const borderTint =
		tier === "red"
			? TIER_COLORS.sat_required.border
			: tier === "yellow"
				? TIER_COLORS.alert_required.border
				: TIER_COLORS.kyc_optional.border;

	return (
		<div
			className={cn(
				"rounded-md border p-2.5",
				tier === "red" && TIER_COLORS.sat_required.bg,
				tier === "yellow" && TIER_COLORS.alert_required.bg,
				tier === "grey" && TIER_COLORS.kyc_optional.bg,
				borderTint,
			)}
		>
			<div className="flex items-start justify-between gap-2">
				<div className="flex min-w-0 items-start gap-1.5">
					<Icon
						className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground"
						aria-hidden
					/>
					<div className="min-w-0">
						<div
							className={cn(
								"text-xs font-medium leading-tight",
								tier === "red" && TIER_COLORS.sat_required.text,
								tier === "yellow" && TIER_COLORS.alert_required.text,
								tier === "grey" && TIER_COLORS.kyc_optional.text,
							)}
						>
							{label}
						</div>
						<p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
							{helper}
						</p>
					</div>
				</div>
				<span className="shrink-0 text-xs tabular-nums text-muted-foreground">
					{total === 0 ? t("completenessNotApplicable") : `${filled}/${total}`}
				</span>
			</div>
			{total > 0 ? (
				<div
					className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-background/60"
					role="progressbar"
					aria-valuenow={pct}
					aria-valuemin={0}
					aria-valuemax={100}
					aria-label={label}
				>
					<div
						className={cn("h-full transition-all", tierBarClass(tier))}
						style={{ width: `${pct}%` }}
					/>
				</div>
			) : null}
		</div>
	);
}

interface CompletenessIndicatorProps {
	result: CompletenessResult;
	className?: string;
	/** Tighter table styling when true (default) */
	compact?: boolean;
}

/**
 * Status-first completeness: primary pill (SAT/alert/KYC aggregate) with a
 * popover for per-tier progress and missing field labels.
 */
export function CompletenessIndicator({
	result,
	className,
	compact = true,
}: CompletenessIndicatorProps): React.ReactElement {
	const { t } = useLanguage();
	const status = getPrimaryStatus(result);
	const { summary, missing } = result;
	const [showAllMissing, setShowAllMissing] = React.useState(false);

	const onOpenChange = React.useCallback((next: boolean) => {
		if (!next) {
			setShowAllMissing(false);
		}
	}, []);

	if (status.kind === "noData") {
		return (
			<div
				className={cn(
					"inline-flex items-center gap-1 text-muted-foreground",
					compact && "text-xs",
					className,
				)}
				role="status"
				aria-label={t("completenessNoData")}
			>
				<MinusCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
				<span className="font-medium tabular-nums">
					{t("completenessNoData")}
				</span>
			</div>
		);
	}

	const pillConfig = (() => {
		if (status.kind === "missingSat") {
			return {
				Icon: AlertTriangle,
				label: replaceCount(t("completenessMissingSat"), status.missingCount),
				badgeClass: cn(badgeVariants({ variant: "destructive" }), "shrink-0"),
			} as const;
		}
		if (status.kind === "partial") {
			return {
				Icon: Info,
				label: t("completenessPartial"),
				badgeClass: cn(
					badgeVariants({ variant: "outline" }),
					"border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-200",
					"shrink-0",
				),
			} as const;
		}
		return {
			Icon: CheckCircle2,
			label: t("completenessReady"),
			badgeClass: cn(
				badgeVariants({ variant: "outline" }),
				"border-emerald-500/50 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
				"shrink-0",
			),
		} as const;
	})();

	const Icon = pillConfig.Icon;
	const ariaLabel = `${pillConfig.label}. ${t("completenessTitle")}.`;

	const shownMissing = showAllMissing
		? missing
		: missing.slice(0, MISSING_FIELD_PREVIEW);
	const hasMoreMissing = missing.length > MISSING_FIELD_PREVIEW;
	const hiddenMissingCount = missing.length - MISSING_FIELD_PREVIEW;

	return (
		<div className={cn("inline-flex", className)}>
			<Popover onOpenChange={onOpenChange} modal={false}>
				<PopoverTrigger asChild>
					<button
						type="button"
						className={cn(
							pillConfig.badgeClass,
							"max-w-full cursor-pointer text-left",
							compact && "h-6 px-1.5 py-0 text-[10px] [&>svg]:size-3",
							!compact && "px-2 py-0.5 text-xs",
						)}
						aria-label={ariaLabel}
						aria-haspopup="dialog"
						title={t("completenessDetailsHint")}
					>
						<Icon className="shrink-0" aria-hidden />
						<span className="truncate font-medium leading-none">
							{pillConfig.label}
						</span>
					</button>
				</PopoverTrigger>
				<PopoverContent
					side="top"
					align="start"
					className="w-80 space-y-3 p-3 text-left"
					onOpenAutoFocus={(e) => e.preventDefault()}
				>
					<div>
						<p className="text-sm font-semibold leading-tight">
							{t("completenessTitle")}
						</p>
						<p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
							{t("completenessLegend")}
						</p>
					</div>

					<div className="space-y-2">
						<TierRow
							tier="red"
							label={t("completenessTierSat")}
							helper={t("completenessTierSatHelper")}
							icon={FileText}
							filled={summary.red.filled}
							total={summary.red.total}
						/>
						<TierRow
							tier="yellow"
							label={t("completenessTierAlert")}
							helper={t("completenessTierAlertHelper")}
							icon={Bell}
							filled={summary.yellow.filled}
							total={summary.yellow.total}
						/>
						<TierRow
							tier="grey"
							label={t("completenessTierKyc")}
							helper={t("completenessTierKycHelper")}
							icon={UserCheck}
							filled={summary.grey.filled}
							total={summary.grey.total}
						/>
					</div>

					{missing.length > 0 ? (
						<div className="border-t pt-2">
							<p className="text-xs font-medium">
								{t("completenessMissingFieldsLabel")} ({missing.length})
							</p>
							<ul className="mt-1.5 max-h-32 list-inside list-disc space-y-0.5 overflow-y-auto text-xs text-muted-foreground">
								{shownMissing.map((m) => (
									<li key={m.field.fieldPath} className="leading-snug">
										<span className="text-foreground">{m.field.label}</span>
									</li>
								))}
							</ul>
							{hasMoreMissing && !showAllMissing ? (
								<Button
									type="button"
									variant="link"
									size="sm"
									className="mt-1 h-auto px-0 text-xs"
									onClick={() => setShowAllMissing(true)}
								>
									{t("completenessShowAll")} (
									{replaceCount(
										t("completenessMoreFields"),
										hiddenMissingCount,
									)}
									)
								</Button>
							) : null}
						</div>
					) : null}
				</PopoverContent>
			</Popover>
		</div>
	);
}
