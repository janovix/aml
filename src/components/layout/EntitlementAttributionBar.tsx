"use client";

import { useOrgStore } from "@/lib/org-store";
import { useSubscriptionSafe } from "@/lib/subscription";
import { useLanguage } from "@/components/LanguageProvider";
import type { PlanTier } from "@/lib/subscription/subscriptionClient";
import { cn } from "@/lib/utils";

function planDisplayName(plan: PlanTier | null, lang: "es" | "en"): string {
	if (!plan || plan === "none" || plan === "free") {
		return lang === "es" ? "Sin plan activo" : "No active plan";
	}
	const labels: Record<string, { es: string; en: string }> = {
		watchlist: { es: "Watchlist", en: "Watchlist" },
		business: { es: "Business", en: "Business" },
		pro: { es: "Pro", en: "Pro" },
		ultra: { es: "Ultra", en: "Ultra" },
		enterprise: { es: "Enterprise", en: "Enterprise" },
	};
	const row = labels[plan];
	return row ? row[lang] : plan;
}

/**
 * Explains that product access follows the active organization's subscription (owner-billed).
 * Padding is typically applied by the parent footer; use `className` for alignment.
 */
export function EntitlementAttributionBar({
	className,
}: {
	className?: string;
} = {}) {
	const { t, language } = useLanguage();
	const currentOrg = useOrgStore((s) => s.currentOrg);
	const subState = useSubscriptionSafe();

	const orgName = currentOrg?.name?.trim();
	const plan = subState?.subscription?.plan ?? null;
	const planLabel = planDisplayName(plan, language);

	if (!orgName || subState?.isLoading) {
		return null;
	}

	const text = t("entitlementFooter")
		.replace("{organization}", orgName)
		.replace("{plan}", planLabel);

	return (
		<div className={cn("text-xs text-muted-foreground", className)}>{text}</div>
	);
}
