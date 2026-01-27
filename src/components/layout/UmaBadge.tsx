"use client";

import * as React from "react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/LanguageProvider";
import { useJwt } from "@/hooks/useJwt";
import { useOrgStore } from "@/lib/org-store";
import {
	getActiveUmaValue,
	calculateUmaThreshold,
	type UmaValue,
} from "@/lib/api/uma";
import { getLocaleForLanguage } from "@/lib/translations";

interface UmaBadgeProps {
	className?: string;
}

export function UmaBadge({
	className,
}: UmaBadgeProps): React.ReactElement | null {
	const { t, language } = useLanguage();
	const { jwt, isLoading: isJwtLoading } = useJwt();
	const { currentOrg } = useOrgStore();
	const locale = getLocaleForLanguage(language);

	const [umaValue, setUmaValue] = React.useState<UmaValue | null>(null);
	const [isLoading, setIsLoading] = React.useState(true);

	// Format as plain number (no currency symbol for badge)
	const formatNumber = React.useCallback(
		(value: number): string => {
			return new Intl.NumberFormat(locale, {
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			}).format(value);
		},
		[locale],
	);

	// Format with currency for popover details
	const formatCurrency = React.useCallback(
		(value: number): string => {
			return new Intl.NumberFormat(locale, {
				style: "currency",
				currency: "MXN",
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			}).format(value);
		},
		[locale],
	);

	React.useEffect(() => {
		async function fetchUma() {
			if (!jwt || !currentOrg?.id) {
				setIsLoading(false);
				return;
			}

			try {
				const uma = await getActiveUmaValue({ jwt });
				setUmaValue(uma);
			} catch {
				// Silently fail - UMA is optional info
			} finally {
				setIsLoading(false);
			}
		}

		if (!isJwtLoading) {
			fetchUma();
		}
	}, [jwt, currentOrg?.id, isJwtLoading]);

	// Don't render anything if no org selected
	if (!currentOrg?.id) {
		return null;
	}

	if (isLoading) {
		return <Skeleton className="h-7 w-20 rounded-lg sm:w-28" />;
	}

	if (!umaValue) {
		return null;
	}

	const threshold = calculateUmaThreshold(umaValue);
	const dailyValue = parseFloat(umaValue.dailyValue);

	return (
		<Popover>
			<PopoverTrigger asChild>
				<div
					className={cn(
						"inline-flex items-center rounded-lg bg-muted/50 border border-border/50 hover:bg-muted/70 transition-all cursor-pointer select-none active:scale-[0.97] px-2 py-1",
						className,
					)}
					title={t("dashboardUmaClickForInfo")}
				>
					<span className="text-xs font-semibold tabular-nums tracking-tight text-foreground">
						{formatNumber(dailyValue)}
					</span>
				</div>
			</PopoverTrigger>

			<PopoverContent side="bottom" align="end" className="w-64 p-3">
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<h4 className="font-semibold text-sm">{t("dashboardUmaTitle")}</h4>
						<span className="text-xs text-muted-foreground">
							{umaValue.year}
						</span>
					</div>

					<div className="space-y-2 text-sm">
						<p className="text-xs text-muted-foreground">
							{t("dashboardUmaDescription")}
						</p>

						<div className="border-t border-border pt-2">
							<div className="flex justify-between items-center">
								<span className="text-muted-foreground">
									{t("dashboardUmaDailyValue")}:
								</span>
								<span className="font-medium tabular-nums">
									{formatCurrency(dailyValue)}
								</span>
							</div>
						</div>

						<div className="flex items-center gap-2 p-2 rounded-md bg-primary/10 border border-primary/20">
							<div className="flex-1">
								<p className="font-medium text-primary text-xs">
									{t("dashboardUmaThreshold")}
								</p>
								<p className="text-sm tabular-nums font-semibold text-foreground">
									{formatCurrency(threshold)}
								</p>
								<p className="text-[10px] text-muted-foreground mt-0.5">
									{t("dashboardUmaThresholdNote")}
								</p>
							</div>
						</div>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
