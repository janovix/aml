"use client";

import { useSubscriptionSafe } from "@/lib/subscription";
import { useLanguage } from "@/components/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Zap, AlertTriangle, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface SubscriptionBannerProps {
	/** The billing page URL */
	billingUrl?: string;
	/** Metrics to check for limit warnings */
	checkMetrics?: ("notices" | "users" | "alerts" | "transactions")[];
	/** Whether to show the banner even without limits (for free tier) */
	showFreeTierBanner?: boolean;
	/** Whether the banner can be dismissed */
	dismissible?: boolean;
}

/**
 * Banner component that shows subscription status warnings
 *
 * - Shows upgrade prompt for free tier users
 * - Shows warnings when approaching usage limits
 * - Shows urgent warnings when at limits
 */
export function SubscriptionBanner({
	billingUrl,
	checkMetrics = ["notices", "users"],
	showFreeTierBanner = true,
	dismissible = true,
}: SubscriptionBannerProps) {
	const subscription = useSubscriptionSafe();
	const { t } = useLanguage();
	const [dismissed, setDismissed] = useState(false);

	// Build auth billing URL based on current location
	const authBillingUrl =
		billingUrl ||
		(typeof window !== "undefined"
			? `${window.location.origin.replace("aml.", "auth.")}/settings/billing`
			: "/settings/billing");

	// Don't render if dismissed or no subscription context
	if (dismissed || !subscription) {
		return null;
	}

	const { isLoading, isFreeTier, hasPaidSubscription, isAtLimit, isNearLimit } =
		subscription;

	// Don't show while loading
	if (isLoading) {
		return null;
	}

	// Check for metrics at limit
	const atLimitMetrics = checkMetrics.filter((m) => isAtLimit(m));
	const nearLimitMetrics = checkMetrics.filter(
		(m) => isNearLimit(m) && !isAtLimit(m),
	);

	// Determine banner content
	let severity: "info" | "warning" | "urgent" = "info";
	let title = "";
	let description = "";
	let showBanner = false;

	if (atLimitMetrics.length > 0) {
		// Urgent: At limit
		severity = "urgent";
		title = t("subscription.banner.limitReached");
		description = t("subscription.banner.limitReachedDesc").replace(
			"{metrics}",
			atLimitMetrics.map((m) => t(`subscription.metrics.${m}`)).join(", "),
		);
		showBanner = true;
	} else if (nearLimitMetrics.length > 0) {
		// Warning: Near limit
		severity = "warning";
		title = t("subscription.banner.nearLimit");
		description = t("subscription.banner.nearLimitDesc").replace(
			"{metrics}",
			nearLimitMetrics.map((m) => t(`subscription.metrics.${m}`)).join(", "),
		);
		showBanner = true;
	} else if (isFreeTier && showFreeTierBanner) {
		// Info: Free tier
		severity = "info";
		title = t("subscription.banner.freeTier");
		description = t("subscription.banner.freeTierDesc");
		showBanner = true;
	}

	// Don't render if nothing to show, or if they have a paid subscription without warnings
	if (!showBanner || (hasPaidSubscription && severity === "info")) {
		return null;
	}

	// Styling based on severity
	const getBannerStyles = () => {
		switch (severity) {
			case "urgent":
				return "bg-destructive/10 border-destructive/30 text-destructive";
			case "warning":
				return "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400";
			default:
				return "bg-primary/10 border-primary/30 text-primary";
		}
	};

	const Icon =
		severity === "urgent" || severity === "warning" ? AlertTriangle : Zap;

	return (
		<Alert
			className={`rounded-none border-x-0 border-t-0 ${getBannerStyles()}`}
		>
			<div className="flex items-center justify-between w-full">
				<div className="flex items-center gap-3">
					<Icon className="h-4 w-4" />
					<div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
						<span className="font-medium text-sm">{title}</span>
						<AlertDescription className="text-sm opacity-90">
							{description}
						</AlertDescription>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Button size="sm" variant="outline" asChild>
						<Link
							href={authBillingUrl}
							target="_blank"
							rel="noopener noreferrer"
						>
							{t("subscription.banner.upgrade")}
						</Link>
					</Button>
					{dismissible && (
						<Button
							size="icon"
							variant="ghost"
							className="h-8 w-8"
							onClick={() => setDismissed(true)}
						>
							<X className="h-4 w-4" />
							<span className="sr-only">{t("common.dismiss")}</span>
						</Button>
					)}
				</div>
			</div>
		</Alert>
	);
}
