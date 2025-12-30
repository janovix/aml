"use client";
import type { LucideIcon } from "lucide-react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

export interface StatCard {
	label: string;
	value: number | string;
	icon: LucideIcon;
	variant?: "default" | "primary";
	href?: string;
}

export interface PageHeroProps {
	title: string;
	subtitle: string;
	icon: LucideIcon;
	stats: StatCard[];
	ctaLabel?: string;
	ctaIcon?: LucideIcon;
	onCtaClick?: () => void;
	className?: string;
}

export function PageHero({
	title,
	subtitle,
	icon: PageIcon,
	stats,
	ctaLabel = "Nuevo Registro",
	ctaIcon: CtaIcon = Plus,
	onCtaClick,
	className,
}: PageHeroProps) {
	return (
		<div className={cn("space-y-6", className)}>
			{/* Title row with CTA */}
			<div className="flex items-start justify-between gap-4">
				<div className="flex items-start gap-3 min-w-0">
					<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
						<PageIcon className="h-5 w-5" />
					</div>
					<div className="min-w-0">
						<h1 className="text-2xl font-semibold text-foreground tracking-tight">
							{title}
						</h1>
						<p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
					</div>
				</div>
				{onCtaClick && (
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									onClick={onCtaClick}
									size="icon"
									className="shrink-0 sm:hidden"
									aria-label={ctaLabel}
								>
									<CtaIcon className="h-4 w-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent side="left">
								<p>{ctaLabel}</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				)}
				{onCtaClick && (
					<Button
						onClick={onCtaClick}
						className="gap-2 shrink-0 hidden sm:inline-flex"
					>
						<CtaIcon className="h-4 w-4" />
						<span>{ctaLabel}</span>
					</Button>
				)}
			</div>

			{/* Stats cards */}
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{stats.slice(0, 3).map((stat, index) => {
					const StatIcon = stat.icon;
					const isPrimary = stat.variant === "primary";

					return (
						<div
							key={stat.label}
							className={cn(
								"group relative flex items-center justify-between gap-4 rounded-xl border p-4 transition-all",
								isPrimary
									? "border-primary/30 bg-primary/5"
									: "border-border/50 bg-card/50 hover:border-border hover:bg-card",
							)}
						>
							<div className="flex flex-col gap-1 min-w-0">
								<span className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
									{stat.label}
								</span>
								<span
									className={cn(
										"text-2xl font-semibold tabular-nums",
										isPrimary ? "text-primary" : "text-foreground",
									)}
								>
									{stat.value}
								</span>
							</div>
							<div
								className={cn(
									"flex h-10 w-10 items-center justify-center rounded-lg shrink-0",
									isPrimary
										? "bg-primary/15 text-primary"
										: "bg-muted/50 text-muted-foreground",
								)}
							>
								<StatIcon className="h-5 w-5" />
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
