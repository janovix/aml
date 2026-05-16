"use client";

import * as React from "react";

import type { SidebarBadgesData } from "@/lib/api/sidebar";
import { getSidebarBadges } from "@/lib/api/sidebar";

const ZERO_BADGES: SidebarBadgesData = {
	alerts: 0,
	notices: 0,
	reports: 0,
	riskModels: 0,
	imports: 0,
	training: 0,
};

const POLL_MS = 60_000;

/** Org-scoped nav badge counts from aml-svc; refreshes on org change, window focus, and every 60s when visible. */
export function useSidebarBadges(orgSlug: string | undefined) {
	const [badges, setBadges] = React.useState<SidebarBadgesData>(ZERO_BADGES);
	const requestIdRef = React.useRef(0);

	const loadBadges = React.useCallback(
		async (init?: RequestInit & { jwt?: string }) => {
			if (!orgSlug) {
				setBadges(ZERO_BADGES);
				return;
			}
			const reqId = ++requestIdRef.current;
			try {
				const { json } = await getSidebarBadges(init);
				if (init?.signal?.aborted) return;
				if (reqId !== requestIdRef.current) return;
				setBadges(json.data ?? ZERO_BADGES);
			} catch {
				if (init?.signal?.aborted) return;
				if (reqId !== requestIdRef.current) return;
				setBadges(ZERO_BADGES);
			}
		},
		[orgSlug],
	);

	React.useEffect(() => {
		if (!orgSlug) {
			setBadges(ZERO_BADGES);
			return;
		}
		const ac = new AbortController();
		void loadBadges({ signal: ac.signal });
		return () => {
			ac.abort();
			requestIdRef.current++;
		};
	}, [orgSlug, loadBadges]);

	React.useEffect(() => {
		if (!orgSlug) return;
		const onFocus = () => void loadBadges();
		window.addEventListener("focus", onFocus);
		return () => window.removeEventListener("focus", onFocus);
	}, [orgSlug, loadBadges]);

	React.useEffect(() => {
		if (!orgSlug) return;
		const timer = window.setInterval(() => {
			if (document.visibilityState === "visible") void loadBadges();
		}, POLL_MS);
		return () => clearInterval(timer);
	}, [orgSlug, loadBadges]);

	return { badges, refresh: loadBadges };
}
