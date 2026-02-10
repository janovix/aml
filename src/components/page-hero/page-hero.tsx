"use client";
import type { LucideIcon } from "lucide-react";
import { Plus, ArrowLeft, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/components/LanguageProvider";

export interface StatCard {
	label: string;
	value: number | string;
	icon: LucideIcon;
	variant?: "default" | "primary";
	href?: string;
}

export interface PageHeroAction {
	label: string;
	icon?: LucideIcon;
	onClick: () => void;
	variant?: "default" | "outline" | "destructive" | "ghost";
	disabled?: boolean;
	tooltip?: string;
}

export interface PageHeroProps {
	title: string;
	subtitle: string;
	icon: LucideIcon;
	/** Stats cards to display. Maximum of 3 will be rendered. Optional for detail/edit/create pages. */
	stats?: StatCard[];
	/** Multiple actions to display. First action is primary, rest are secondary. */
	actions?: PageHeroAction[];
	/** Back button configuration for navigation */
	backButton?: {
		label?: string;
		onClick: () => void;
	};
	// Legacy props for backward compatibility
	/** @deprecated Use `actions` instead */
	ctaLabel?: string;
	/** @deprecated Use `actions` instead */
	ctaIcon?: LucideIcon;
	/** @deprecated Use `actions` instead */
	onCtaClick?: () => void;
	className?: string;
}

export function PageHero({
	title,
	subtitle,
	icon: PageIcon,
	stats,
	actions,
	backButton,
	ctaLabel = "Nuevo Registro",
	ctaIcon: CtaIcon = Plus,
	onCtaClick,
	className,
}: PageHeroProps) {
	const { t } = useLanguage();

	// Convert legacy CTA prop to actions array for backward compatibility
	const resolvedActions: PageHeroAction[] =
		actions ??
		(onCtaClick
			? [
					{
						label: ctaLabel,
						icon: CtaIcon,
						onClick: onCtaClick,
						variant: "default" as const,
					},
				]
			: []);

	const primaryAction = resolvedActions[0];
	const secondaryActions = resolvedActions.slice(1);
	const hasStats = stats && stats.length > 0;

	return (
		<div className={cn("space-y-4 @lg/main:space-y-6", className)}>
			{/* Title row with actions */}
			<div className="flex flex-col @lg/main:flex-row @lg/main:items-start @lg/main:justify-between gap-3 @lg/main:gap-4">
				<div className="flex items-start gap-2 @lg/main:gap-3 min-w-0 flex-1">
					{/* Back button */}
					{backButton && (
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										onClick={backButton.onClick}
										className="shrink-0 -ml-2 h-8 w-8 @lg/main:h-10 @lg/main:w-10"
										aria-label={backButton.label ?? t("back")}
									>
										<ArrowLeft className="h-4 w-4 @lg/main:h-5 @lg/main:w-5" />
									</Button>
								</TooltipTrigger>
								<TooltipContent side="bottom">
									<p>{backButton.label ?? t("back")}</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					)}
					{/* Icon */}
					<div className="flex h-8 w-8 @lg/main:h-10 @lg/main:w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
						<PageIcon className="h-4 w-4 @lg/main:h-5 @lg/main:w-5" />
					</div>
					{/* Title and subtitle */}
					<div className="min-w-0 flex-1">
						<h1 className="text-base @lg/main:text-2xl font-semibold text-foreground tracking-tight wrap-break-word leading-snug">
							{title}
						</h1>
						<p className="text-xs @lg/main:text-sm text-muted-foreground mt-0.5">
							{subtitle}
						</p>
					</div>
				</div>

				{/* Actions - uses container queries for responsive behavior */}
				{resolvedActions.length > 0 && (
					<div className="flex items-center gap-2 shrink-0">
						{/* Compact view (narrow container): show all buttons */}
						<div className="flex items-center gap-2 @lg/main:hidden">
							{secondaryActions.map((action) => {
								const ActionIcon = action.icon;
								return (
									<Button
										key={action.label}
										onClick={action.onClick}
										variant={action.variant ?? "outline"}
										disabled={action.disabled}
										size="sm"
										className="gap-1.5"
									>
										{ActionIcon && <ActionIcon className="h-3.5 w-3.5" />}
										<span className="text-xs">{action.label}</span>
									</Button>
								);
							})}
							{primaryAction && (
								<Button
									onClick={primaryAction.onClick}
									variant={primaryAction.variant ?? "default"}
									disabled={primaryAction.disabled}
									size="sm"
									className="gap-1.5"
								>
									{primaryAction.icon && (
										<primaryAction.icon className="h-3.5 w-3.5" />
									)}
									<span className="text-xs">{primaryAction.label}</span>
								</Button>
							)}
						</div>
						{/* Full view (wide container): show all actions as buttons */}
						<div className="hidden @lg/main:flex items-center gap-2">
							{/* Secondary actions first (left side) */}
							{secondaryActions.map((action) => {
								const ActionIcon = action.icon;
								return (
									<Button
										key={action.label}
										onClick={action.onClick}
										variant={action.variant ?? "outline"}
										disabled={action.disabled}
										className="gap-2"
									>
										{ActionIcon && <ActionIcon className="h-4 w-4" />}
										<span>{action.label}</span>
									</Button>
								);
							})}
							{/* Primary action last (right side) */}
							{primaryAction && (
								<Button
									onClick={primaryAction.onClick}
									variant={primaryAction.variant ?? "default"}
									disabled={primaryAction.disabled}
									className="gap-2"
								>
									{primaryAction.icon && (
										<primaryAction.icon className="h-4 w-4" />
									)}
									<span>{primaryAction.label}</span>
								</Button>
							)}
						</div>
					</div>
				)}
			</div>

			{/* Stats cards - only render if stats are provided */}
			{hasStats && (
				<div className="grid grid-cols-1 gap-3 @lg/main:grid-cols-2 @2xl/main:grid-cols-3">
					{stats.slice(0, 3).map((stat) => {
						const StatIcon = stat.icon;
						const isPrimary = stat.variant === "primary";

						const cardContent = (
							<>
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
							</>
						);

						const cardClasses = cn(
							"group relative flex items-center justify-between gap-4 rounded-xl border p-4 transition-all",
							isPrimary
								? "border-primary/30 bg-primary/5"
								: "border-border/50 bg-card/50 hover:border-border hover:bg-card",
							stat.href && "cursor-pointer",
						);

						if (stat.href) {
							return (
								<Link key={stat.label} href={stat.href} className={cardClasses}>
									{cardContent}
								</Link>
							);
						}

						return (
							<div key={stat.label} className={cardClasses}>
								{cardContent}
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
