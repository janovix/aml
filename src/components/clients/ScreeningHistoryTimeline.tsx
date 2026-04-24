"use client";

import { useCallback, useEffect, useState } from "react";
import {
	Calendar,
	ExternalLink,
	History,
	Loader2,
	AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useJwt } from "@/hooks/useJwt";
import { useLanguage } from "@/components/LanguageProvider";
import { cn } from "@/lib/utils";
import {
	getBeneficialControllerScreeningHistory,
	getClientScreeningHistory,
	type ScreeningHistoryItem,
} from "@/lib/api/screening";
import type { TranslationKeys } from "@/lib/translations";

const CHANGE_FLAG_ORDER = [
	"ofac",
	"un",
	"sat69b",
	"pep",
	"adverse_media",
] as const;

const TRIGGER_TRANSLATION: Record<string, string> = {
	scheduled: "screeningHistoryTriggerScheduled",
	manual: "screeningHistoryTriggerManual",
	callback: "screeningHistoryTriggerCallback",
	client_create: "screeningHistoryTriggerClientCreate",
};

const FLAG_TRANSLATION: Record<(typeof CHANGE_FLAG_ORDER)[number], string> = {
	ofac: "screeningHistoryFlagOfac",
	un: "screeningHistoryFlagUn",
	sat69b: "screeningHistoryFlagSat69b",
	pep: "screeningHistoryFlagPep",
	adverse_media: "screeningHistoryFlagAdverse",
};

type ScreeningHistoryMode = { kind: "client" } | { kind: "bc"; bcId: string };

function formatLocalDateTime(iso: string, language: "en" | "es"): string {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso;
	return d.toLocaleString(language === "es" ? "es-MX" : "en-US", {
		year: "numeric",
		month: "short",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function resultBadgeClass(result: string): string {
	const r = result.toLowerCase();
	if (r === "clear" || r === "pending")
		return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300";
	if (r === "flagged")
		return "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300";
	if (r === "error")
		return "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200";
	return "border-muted-foreground/30";
}

function TriggerBadge({
	t,
	v,
}: {
	t: (k: TranslationKeys) => string;
	v: string;
}) {
	const tk = TRIGGER_TRANSLATION[v];
	const label = tk ? t(tk as TranslationKeys) : v.replace(/_/g, " ");
	return (
		<span className="inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
			{label}
		</span>
	);
}

function ChangeFlagBadges({
	t,
	flags,
}: {
	t: (k: TranslationKeys) => string;
	flags: Record<string, "new"> | null;
}) {
	if (!flags) return null;
	return (
		<div className="mt-1 flex flex-wrap gap-1">
			{CHANGE_FLAG_ORDER.map((k) => {
				if (flags[k] !== "new") return null;
				const text = t(FLAG_TRANSLATION[k] as TranslationKeys);
				return (
					<Badge key={k} variant="secondary" className="text-xs">
						{text}
					</Badge>
				);
			})}
		</div>
	);
}

function screeningRowId(item: ScreeningHistoryItem): string {
	return item.id;
}

export function ScreeningHistoryTimeline(props: {
	clientId: string;
	mode?: ScreeningHistoryMode;
}) {
	const { jwt } = useJwt();
	const { t, language } = useLanguage();
	const mode: ScreeningHistoryMode = props.mode ?? { kind: "client" };
	const [items, setItems] = useState<ScreeningHistoryItem[] | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	const load = useCallback(
		async (token: string) => {
			setLoading(true);
			setError(null);
			try {
				const res =
					mode.kind === "client"
						? await getClientScreeningHistory(props.clientId, {
								jwt: token,
								limit: 25,
							})
						: await getBeneficialControllerScreeningHistory(
								props.clientId,
								mode.bcId,
								{ jwt: token, limit: 25 },
							);
				setItems(res.items);
			} catch (e) {
				setError(e instanceof Error ? e.message : "Failed to load");
				setItems(null);
			} finally {
				setLoading(false);
			}
		},
		[props.clientId, mode],
	);

	useEffect(() => {
		if (!jwt) return;
		void load(jwt);
	}, [jwt, load]);

	const baseWatchlist = process.env.NEXT_PUBLIC_WATCHLIST_APP_URL;

	return (
		<div className="rounded-lg border bg-muted/20 p-3">
			<div className="mb-2 flex items-center gap-2 text-sm font-medium">
				<History className="h-4 w-4 text-muted-foreground" />
				{t("screeningHistoryTitle")}
			</div>

			{loading && (
				<div className="flex items-center gap-2 text-xs text-muted-foreground py-4">
					<Loader2 className="h-4 w-4 animate-spin" />
					{t("loading")}
				</div>
			)}

			{error && (
				<div className="flex items-center gap-2 text-xs text-destructive">
					<AlertCircle className="h-4 w-4 shrink-0" />
					{error}
				</div>
			)}

			{!loading && !error && items && items.length === 0 && (
				<p className="text-xs text-muted-foreground">
					{t("screeningHistoryEmpty")}
				</p>
			)}

			{!loading && items && items.length > 0 && (
				<ul className="space-y-3">
					{items.map((row) => (
						<li
							key={screeningRowId(row)}
							className="border-l-2 pl-3 border-border relative"
						>
							<div className="flex flex-wrap items-start justify-between gap-2">
								<div className="min-w-0">
									<div className="flex items-center gap-1.5 flex-wrap text-xs text-muted-foreground">
										<Calendar className="h-3.5 w-3.5 shrink-0" />
										<time dateTime={row.screenedAt}>
											{formatLocalDateTime(
												row.screenedAt,
												language as "en" | "es",
											)}
										</time>
										<TriggerBadge t={t} v={row.triggeredBy} />
									</div>
									<div className="mt-1 flex flex-wrap items-center gap-2">
										<Badge
											variant="outline"
											className={cn(
												"text-xs",
												resultBadgeClass(row.screeningResult),
											)}
										>
											{row.screeningResult}
										</Badge>
										<ChangeFlagBadges t={t} flags={row.changeFlags} />
									</div>
									{row.errorMessage && (
										<p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
											{row.errorMessage}
										</p>
									)}
								</div>
								{row.watchlistQueryId && baseWatchlist && (
									<a
										href={`${baseWatchlist.replace(/\/$/, "")}/queries/${row.watchlistQueryId}`}
										className="inline-flex shrink-0 items-center gap-1 text-xs text-primary hover:underline"
										target="_blank"
										rel="noopener noreferrer"
									>
										<ExternalLink className="h-3.5 w-3.5" />
										{t("clientViewWatchlistQuery")}
									</a>
								)}
							</div>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
