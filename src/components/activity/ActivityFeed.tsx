"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
	Info,
	AlertTriangle,
	CheckCircle,
	XCircle,
	Bell,
	Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/LanguageProvider";
import { useAuthSession } from "@/lib/auth/useAuthSession";
import { getNotificationsServiceUrl } from "@/lib/auth/config";
import { getClientJwt } from "@/lib/auth/authClient";

interface Notification {
	id: string;
	channelId: string | null;
	type: string;
	title: string;
	body: string;
	payload: Record<string, unknown> | null;
	severity: "info" | "warn" | "error";
	callbackUrl: string | null;
	createdAt: string;
	read?: boolean;
}

interface PaginatedResponse {
	success: boolean;
	data: Notification[];
	pagination: {
		nextCursor: string | null;
		hasMore: boolean;
		limit: number;
	};
}

const severityConfig = {
	info: {
		icon: Info,
		color: "text-blue-500",
		bg: "bg-blue-500/10",
	},
	warn: {
		icon: AlertTriangle,
		color: "text-amber-500",
		bg: "bg-amber-500/10",
	},
	error: {
		icon: XCircle,
		color: "text-red-500",
		bg: "bg-red-500/10",
	},
} as const;

function getDayKey(dateStr: string): string {
	const date = new Date(dateStr);
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatTimeOnly(dateStr: string): string {
	const date = new Date(dateStr);
	return date.toLocaleTimeString(undefined, {
		hour: "2-digit",
		minute: "2-digit",
	});
}

function groupByDay(
	notifications: Notification[],
): Map<string, Notification[]> {
	const groups = new Map<string, Notification[]>();
	for (const n of notifications) {
		const key = getDayKey(n.createdAt);
		const existing = groups.get(key);
		if (existing) {
			existing.push(n);
		} else {
			groups.set(key, [n]);
		}
	}
	return groups;
}

function NotificationCard({
	notification,
	onClick,
}: {
	notification: Notification;
	onClick?: () => void;
}) {
	const config = severityConfig[notification.severity] || severityConfig.info;
	const Icon = config.icon;
	const hasLink = !!notification.callbackUrl;

	return (
		<button
			type="button"
			className={cn(
				"flex gap-3 px-4 py-3 w-full text-left transition-colors group",
				hasLink && "cursor-pointer hover:bg-muted/50",
				!hasLink && "cursor-default",
				!notification.read && "bg-primary/5",
			)}
			onClick={hasLink ? onClick : undefined}
			disabled={!hasLink}
		>
			<div
				className={cn(
					"shrink-0 w-9 h-9 rounded-full flex items-center justify-center mt-0.5",
					config.bg,
				)}
			>
				<Icon className={cn("w-4 h-4", config.color)} />
			</div>

			<div className="flex-1 min-w-0">
				<div className="flex items-start justify-between gap-2">
					<p
						className={cn(
							"text-sm",
							!notification.read ? "font-semibold" : "font-medium",
						)}
					>
						{notification.title}
					</p>
					<span className="text-[11px] text-muted-foreground/70 whitespace-nowrap shrink-0">
						{formatTimeOnly(notification.createdAt)}
					</span>
				</div>
				{notification.body && (
					<p className="text-xs text-muted-foreground mt-0.5">
						{notification.body}
					</p>
				)}
			</div>

			{!notification.read && (
				<div className="shrink-0 mt-2">
					<div className="w-2 h-2 rounded-full bg-primary" />
				</div>
			)}
		</button>
	);
}

function SkeletonCard() {
	return (
		<div className="flex gap-3 px-4 py-3 animate-pulse">
			<div className="w-9 h-9 rounded-full bg-muted shrink-0" />
			<div className="flex-1 space-y-2">
				<div className="h-4 bg-muted rounded w-3/4" />
				<div className="h-3 bg-muted rounded w-full" />
				<div className="h-3 bg-muted rounded w-1/2" />
			</div>
		</div>
	);
}

export function ActivityFeed() {
	const { t } = useLanguage();
	const router = useRouter();
	const { data: session } = useAuthSession();
	const activeOrgId = (
		session?.session as { activeOrganizationId?: string } | undefined
	)?.activeOrganizationId;

	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [cursor, setCursor] = useState<string | null>(null);
	const [hasMore, setHasMore] = useState(true);
	const [isLoading, setIsLoading] = useState(false);
	const [isInitialLoad, setIsInitialLoad] = useState(true);
	const sentinelRef = useRef<HTMLDivElement>(null);
	const fetchingRef = useRef(false);

	const fetchPage = useCallback(
		async (pageCursor: string | null) => {
			if (!activeOrgId || fetchingRef.current) return;
			fetchingRef.current = true;
			setIsLoading(true);

			try {
				const baseUrl = getNotificationsServiceUrl();
				const token = await getClientJwt();
				if (!token) return;

				const params = new URLSearchParams({ limit: "20" });
				if (pageCursor) {
					params.set("cursor", pageCursor);
				}

				const response = await fetch(
					`${baseUrl}/api/notifications?${params.toString()}`,
					{
						credentials: "include",
						headers: { Authorization: `Bearer ${token}` },
					},
				);

				if (response.ok) {
					const data = (await response.json()) as PaginatedResponse;
					setNotifications((prev) => {
						const existingIds = new Set(prev.map((n) => n.id));
						const newItems = data.data.filter((n) => !existingIds.has(n.id));
						return [...prev, ...newItems];
					});
					setCursor(data.pagination.nextCursor);
					setHasMore(data.pagination.hasMore);
				}
			} finally {
				setIsLoading(false);
				setIsInitialLoad(false);
				fetchingRef.current = false;
			}
		},
		[activeOrgId],
	);

	useEffect(() => {
		if (activeOrgId) {
			fetchPage(null);
		}
	}, [activeOrgId, fetchPage]);

	useEffect(() => {
		const sentinel = sentinelRef.current;
		if (!sentinel) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasMore && !fetchingRef.current) {
					fetchPage(cursor);
				}
			},
			{ threshold: 0.1 },
		);

		observer.observe(sentinel);
		return () => observer.disconnect();
	}, [cursor, hasMore, fetchPage]);

	const grouped = useMemo(() => groupByDay(notifications), [notifications]);

	const getDayLabel = useCallback(
		(dayKey: string): string => {
			const today = getDayKey(new Date().toISOString());
			const yesterday = getDayKey(
				new Date(Date.now() - 86_400_000).toISOString(),
			);

			if (dayKey === today) return t("activityToday");
			if (dayKey === yesterday) return t("activityYesterday");

			const [year, month, day] = dayKey.split("-").map(Number);
			const date = new Date(year, month - 1, day);
			return date.toLocaleDateString(undefined, {
				weekday: "long",
				year: "numeric",
				month: "long",
				day: "numeric",
			});
		},
		[t],
	);

	const handleNotificationClick = useCallback(
		(notification: Notification) => {
			if (notification.callbackUrl) {
				router.push(notification.callbackUrl);
			}
		},
		[router],
	);

	if (isInitialLoad) {
		return (
			<div className="space-y-6">
				<h1 className="text-2xl font-bold tracking-tight">
					{t("activityTitle")}
				</h1>
				<div className="rounded-lg border bg-card divide-y divide-border">
					{Array.from({ length: 5 }).map((_, i) => (
						<SkeletonCard key={i} />
					))}
				</div>
			</div>
		);
	}

	if (notifications.length === 0) {
		return (
			<div className="space-y-6">
				<h1 className="text-2xl font-bold tracking-tight">
					{t("activityTitle")}
				</h1>
				<div className="flex flex-col items-center justify-center py-16 text-center">
					<div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
						<Bell className="w-8 h-8 text-muted-foreground" />
					</div>
					<p className="text-muted-foreground">{t("activityEmpty")}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold tracking-tight">
				{t("activityTitle")}
			</h1>

			<div className="space-y-6">
				{Array.from(grouped.entries()).map(([dayKey, items]) => (
					<section key={dayKey}>
						<h2 className="text-sm font-semibold text-muted-foreground mb-2 px-1">
							{getDayLabel(dayKey)}
						</h2>
						<div className="rounded-lg border bg-card divide-y divide-border">
							{items.map((notification) => (
								<NotificationCard
									key={notification.id}
									notification={notification}
									onClick={() => handleNotificationClick(notification)}
								/>
							))}
						</div>
					</section>
				))}
			</div>

			<div ref={sentinelRef} className="py-4 flex justify-center">
				{isLoading && (
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<Loader2 className="w-4 h-4 animate-spin" />
						{t("activityLoadingMore")}
					</div>
				)}
			</div>
		</div>
	);
}
