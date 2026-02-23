"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useOrgSettings } from "@/hooks/useOrgSettings";
import { getActivityVisual } from "@/lib/activity-registry";
import { useLanguage } from "@/components/LanguageProvider";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Subtle chip displayed below the org switcher in the sidebar showing the
 * org's configured vulnerable activity. Non-interactive — purely contextual.
 * Collapses to an icon-only view with tooltip when the sidebar is in icon mode.
 */
export function ActivityChip(): React.ReactElement | null {
	const { activityCode, isLoading } = useOrgSettings();
	const { t } = useLanguage();

	if (isLoading || !activityCode) return null;

	const visual = getActivityVisual(activityCode);
	const Icon = visual.icon;

	return (
		<div className="border-b border-sidebar-border">
			{/* Expanded state */}
			<div className="flex items-center gap-2 px-4 py-2 group-data-[collapsible=icon]:hidden">
				<div
					className={cn(
						"size-8 rounded-lg border flex items-center justify-center shrink-0",
						visual.color.background,
						visual.color.border,
					)}
				>
					<Icon
						className={cn("h-5 w-5 translate-y-px", visual.color.icon)}
						strokeWidth={2}
					/>
				</div>
				<div className="flex-1 min-w-0">
					<p className="text-[10px] font-medium uppercase tracking-wide leading-none mb-0.5 text-muted-foreground/60">
						{t("sidebarVulnerableActivity")}
					</p>
					<p className="text-xs font-medium truncate text-foreground/75">
						{visual.shortLabel}
					</p>
				</div>
			</div>

			{/* Collapsed (icon-only) state */}
			<div className="hidden group-data-[collapsible=icon]:flex justify-center py-2">
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<div
								className={cn(
									"size-8 rounded-lg border flex items-center justify-center cursor-default",
									visual.color.background,
									visual.color.border,
								)}
							>
								<Icon
									className={cn("h-5 w-5 translate-y-px", visual.color.icon)}
									strokeWidth={2}
								/>
							</div>
						</TooltipTrigger>
						<TooltipContent side="right" className="flex flex-col gap-0.5">
							<span className="font-medium">{visual.shortLabel}</span>
							<span className="text-xs text-muted-foreground">
								{t("sidebarVulnerableActivity")}
							</span>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</div>
		</div>
	);
}
