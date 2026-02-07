"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { getThresholdStatus, getActivityVisual } from "@/lib/activity-registry";
import type { ActivityCode } from "@/types/operation";

interface ThresholdIndicatorProps {
	code: ActivityCode;
	amountMxn: number;
	umaValue: number;
	className?: string;
}

/**
 * Traffic-light indicator showing whether an operation exceeds LFPIORPI thresholds.
 * Green = below identification. Yellow = above identification. Red = above notice.
 */
export function ThresholdIndicator({
	code,
	amountMxn,
	umaValue,
	className,
}: ThresholdIndicatorProps): React.ReactElement {
	const status = getThresholdStatus(code, amountMxn, umaValue);
	const visual = getActivityVisual(code);

	const formatMxn = (value: number | null): string => {
		if (value === null) return "Siempre";
		return new Intl.NumberFormat("es-MX", {
			style: "currency",
			currency: "MXN",
			maximumFractionDigits: 0,
		}).format(value);
	};

	let dotColor: string;
	let label: string;

	if (status.exceedsNotice) {
		dotColor = "bg-red-500";
		label = "Sujeta a aviso";
	} else if (status.exceedsIdentification) {
		dotColor = "bg-yellow-500";
		label = "Supera identificación";
	} else {
		dotColor = "bg-green-500";
		label = "Bajo umbral";
	}

	const tooltipContent = (
		<div className="space-y-1.5 text-xs">
			<p className="font-medium">
				Art. 17, Fracc. {visual.lfpiropiFraccion} LFPIORPI
			</p>
			<div className="space-y-0.5">
				<p>
					Identificación:{" "}
					{visual.identificationThresholdUma === "ALWAYS"
						? "Siempre"
						: `${visual.identificationThresholdUma} UMA (${formatMxn(status.identificationMxn)})`}
				</p>
				<p>
					Aviso:{" "}
					{visual.noticeThresholdUma === "ALWAYS"
						? "Siempre"
						: `${visual.noticeThresholdUma} UMA (${formatMxn(status.noticeMxn)})`}
				</p>
			</div>
		</div>
	);

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<div
						className={cn(
							"inline-flex items-center gap-1.5 text-xs text-muted-foreground",
							className,
						)}
					>
						<span
							className={cn("h-2.5 w-2.5 rounded-full shrink-0", dotColor)}
						/>
						<span>{label}</span>
					</div>
				</TooltipTrigger>
				<TooltipContent side="top" className="max-w-xs">
					{tooltipContent}
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
