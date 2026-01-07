"use client";

import * as React from "react";
import { TrendingUp } from "lucide-react";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/components/LanguageProvider";
import { useJwt } from "@/hooks/useJwt";
import { useOrgStore } from "@/lib/org-store";
import {
	getActiveUmaValue,
	calculateUmaThreshold,
	type UmaValue,
} from "@/lib/api/uma";
import { getLocaleForLanguage } from "@/lib/translations";

export function UmaBadge(): React.ReactElement | null {
	const { t, language } = useLanguage();
	const { jwt, isLoading: isJwtLoading } = useJwt();
	const { currentOrg } = useOrgStore();
	const locale = getLocaleForLanguage(language);

	const [umaValue, setUmaValue] = React.useState<UmaValue | null>(null);
	const [isLoading, setIsLoading] = React.useState(true);

	const formatCurrency = React.useCallback(
		(value: number, compact = false): string => {
			return new Intl.NumberFormat(locale, {
				style: "currency",
				currency: "MXN",
				minimumFractionDigits: 0,
				maximumFractionDigits: 0,
				...(compact && { notation: "compact" }),
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
		return <Skeleton className="h-6 w-20 rounded-full" />;
	}

	if (!umaValue) {
		return null;
	}

	const threshold = calculateUmaThreshold(umaValue);
	const dailyValue = parseFloat(umaValue.dailyValue);

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Badge
						variant="outline"
						className="gap-1.5 px-2.5 py-1 font-medium text-xs cursor-default border-muted-foreground/30 bg-muted/50 text-muted-foreground hover:bg-muted"
					>
						<TrendingUp className="h-3 w-3" />
						<span>
							UMA:{" "}
							<span className="tabular-nums">{formatCurrency(dailyValue)}</span>
						</span>
					</Badge>
				</TooltipTrigger>
				<TooltipContent
					side="bottom"
					className="max-w-xs bg-popover text-popover-foreground border shadow-md"
				>
					<div className="space-y-2">
						<div>
							<p className="text-xs text-muted-foreground">
								{t("dashboardUmaDescription")}
							</p>
						</div>
						<div className="border-t border-border pt-2">
							<p className="font-medium text-primary">
								{t("dashboardUmaThreshold")}
							</p>
							<p className="text-sm tabular-nums text-foreground">
								{formatCurrency(threshold)}
							</p>
							<p className="text-xs text-muted-foreground mt-1">
								{t("dashboardUmaThresholdNote")}
							</p>
						</div>
						<div className="border-t border-border pt-2 text-xs text-muted-foreground">
							<p>
								{t("dashboardUmaYear")}: {umaValue.year}
							</p>
							<p>
								{t("dashboardUmaDailyValue")}: {formatCurrency(dailyValue)}
							</p>
						</div>
					</div>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
