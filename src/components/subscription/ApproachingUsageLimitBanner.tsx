"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { getUsageDetails } from "@/lib/subscription/subscriptionClient";
import { getAuthAppUrl } from "@/lib/auth/config";
import { useFlags } from "@/hooks/useFlags";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const THRESHOLD_PCT = 80;

/**
 * Dismissible banner when any AML metered metric is at/above 80% of included quota.
 */
export function ApproachingUsageLimitBanner() {
	const { flags: stripeFlags, error: stripeFlagsError } = useFlags([
		"stripe-billing-enabled",
	]);
	const stripeBillingEnabled =
		stripeFlagsError !== null
			? true
			: stripeFlags["stripe-billing-enabled"] !== false;

	const [visible, setVisible] = useState(false);
	const [text, setText] = useState("");
	const [storageKey, setStorageKey] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		void (async () => {
			const d = await getUsageDetails();
			if (!d?.limits || cancelled) return;

			const periodKey = d.period.end;
			const key = `janovix:usage-banner-dismissed:${periodKey}`;
			if (typeof window !== "undefined" && localStorage.getItem(key) === "1") {
				return;
			}

			const pairs: Array<{ label: string; used: number; lim: number }> = [
				{ label: "reports", used: d.usage.reports, lim: d.limits.reports },
				{ label: "notices", used: d.usage.notices, lim: d.limits.notices },
				{ label: "alerts", used: d.usage.alerts, lim: d.limits.alerts },
				{
					label: "operations",
					used: d.usage.operations,
					lim: d.limits.operations,
				},
				{ label: "clients", used: d.usage.clients, lim: d.limits.clients },
				{ label: "team members", used: d.usage.users, lim: d.limits.users },
			];

			const high = pairs.filter(
				(p) => p.lim > 0 && (p.used / p.lim) * 100 >= THRESHOLD_PCT,
			);
			if (high.length === 0) return;

			const parts = high.map((p) => {
				const pct = Math.round((p.used / p.lim) * 100);
				return `${p.label} ${pct}%`;
			});

			setStorageKey(key);
			setText(
				`You're approaching plan limits this billing period: ${parts.join(", ")}.`,
			);
			setVisible(true);
		})();

		return () => {
			cancelled = true;
		};
	}, []);

	if (!visible || !storageKey) return null;

	const billingUrl = `${getAuthAppUrl().replace(/\/$/, "")}/settings/billing`;

	return (
		<Alert className="mb-4 border-amber-500/50 bg-amber-500/10">
			<AlertTitle className="text-amber-900 dark:text-amber-100">
				Usage alert
			</AlertTitle>
			<AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<span className="text-sm">{text}</span>
				<div className="flex shrink-0 items-center gap-2">
					{stripeBillingEnabled && (
						<Button asChild variant="outline" size="sm">
							<Link href={billingUrl}>Usage & billing</Link>
						</Button>
					)}
					<Button
						variant="ghost"
						size="icon"
						aria-label="Dismiss"
						onClick={() => {
							try {
								localStorage.setItem(storageKey, "1");
							} catch {
								/* ignore */
							}
							setVisible(false);
						}}
					>
						<X className="h-4 w-4" />
					</Button>
				</div>
			</AlertDescription>
		</Alert>
	);
}
