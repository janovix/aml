"use client";

import { useSubscriptionSafe } from "@/lib/subscription";
import { useLanguage } from "@/components/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Zap, AlertTriangle, X, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface SubscriptionBannerProps {
	/** The billing page URL */
	billingUrl?: string;
	/** Whether to show the banner even without limits (for free tier) */
	showFreeTierBanner?: boolean;
	/** Whether the banner can be dismissed */
	dismissible?: boolean;
}

/**
 * Banner component that shows subscription status warnings
 *
 * - Shows upgrade prompt for free tier users
 * - Shows "Enterprise license active" for license-based subscriptions
 * - Hides for active Stripe subscriptions without warnings
 */
export function SubscriptionBanner({
	billingUrl,
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

	const { isLoading, isFreeTier, hasPaidSubscription, isEnterprise } =
		subscription;

	// Don't show while loading
	if (isLoading) {
		return null;
	}

	// Enterprise license users get a positive confirmation, not a warning
	if (isEnterprise) {
		return null;
	}

	// Determine banner content
	let title = "";
	let description = "";
	let showBanner = false;

	if (isFreeTier && showFreeTierBanner) {
		// Info: Free tier
		title = t("subscription.banner.freeTier");
		description = t("subscription.banner.freeTierDesc");
		showBanner = true;
	}

	// Don't render if nothing to show, or if they have a paid subscription
	if (!showBanner || hasPaidSubscription) {
		return null;
	}

	const Icon = Zap;

	return (
		<Alert
			className={`rounded-none border-x-0 border-t-0 bg-primary/10 border-primary/30 text-primary`}
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
