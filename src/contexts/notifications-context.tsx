"use client";

import {
	createContext,
	useContext,
	useEffect,
	useState,
	useRef,
	useCallback,
	useMemo,
	type ReactNode,
} from "react";
import { useAuthSession } from "@/lib/auth/useAuthSession";
import { getNotificationsServiceUrl } from "@/lib/auth/config";
import { getClientJwt } from "@/lib/auth/authClient";
import {
	NotificationsContext as BlocksNotificationsContext,
	type BlocksNotification,
	type NotificationsContextValue as BlocksNotificationsContextValue,
} from "@janovix/blocks";

export interface Notification {
	id: string;
	channelId: string | null;
	channelSlug: string | null;
	type: string;
	title: string;
	body: string;
	payload: Record<string, unknown> | null;
	severity: "info" | "warn" | "error";
	callbackUrl: string | null;
	createdAt: string;
	read?: boolean; // Local read state (not from server)
}

interface NotificationsContextValue {
	notifications: Notification[];
	unreadCount: number;
	isConnected: boolean;
	markAsRead: (channelId: string, upToNotificationId: string) => Promise<void>;
	/**
	 * Mark a single notification as read via API call.
	 * Throws on failure so the widget can handle rollback.
	 */
	markNotificationAsReadAsync: (notificationId: string) => Promise<void>;
	markNotificationAsRead: (notificationId: string) => void;
	/**
	 * Mark all notifications as read via API call.
	 * Throws on failure so the widget can handle rollback.
	 */
	markAllAsReadAsync: () => Promise<void>;
	markAllAsRead: () => void;
	clearAll: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(
	null,
);

/**
 * Map auth's severity to blocks' notification type.
 */
function mapSeverityToType(
	severity: "info" | "warn" | "error",
): "info" | "success" | "warning" | "error" {
	switch (severity) {
		case "warn":
			return "warning";
		case "error":
			return "error";
		case "info":
		default:
			return "info";
	}
}

export function useNotifications() {
	const context = useContext(NotificationsContext);
	if (!context) {
		throw new Error(
			"useNotifications must be used within a NotificationsProvider",
		);
	}
	return context;
}

interface NotificationsProviderProps {
	children: ReactNode;
}

export function NotificationsProvider({
	children,
}: NotificationsProviderProps) {
	const { data: session } = useAuthSession();
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const [isConnected, setIsConnected] = useState(false);
	const wsRef = useRef<WebSocket | null>(null);
	const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const reconnectAttempts = useRef(0);

	const activeOrgId = (
		session?.session as { activeOrganizationId?: string } | undefined
	)?.activeOrganizationId;

	const userId = session?.user?.id;

	// Connect to WebSocket
	const connect = useCallback(async () => {
		if (!activeOrgId || !userId) return;

		// Clean up existing connection
		if (wsRef.current) {
			wsRef.current.close();
			wsRef.current = null;
		}

		try {
			const baseUrl = getNotificationsServiceUrl();
			const wsProtocol = baseUrl.startsWith("https") ? "wss" : "ws";
			const wsHost = baseUrl.replace(/^https?:\/\//, "");

			// Get auth token for WebSocket authentication
			const token = await getClientJwt();
			if (!token) {
				console.error(
					"[Notifications] No auth token found, cannot connect to WebSocket",
				);
				return;
			}

			// Connect to org-wide broadcasts with token in query param
			const wsUrl = `${wsProtocol}://${wsHost}/realtime/org?token=${encodeURIComponent(token)}`;
			const orgWs = new WebSocket(wsUrl);

			orgWs.onopen = () => {
				console.log("[Notifications] WebSocket connected");
				setIsConnected(true);
				reconnectAttempts.current = 0;

				// Send client_hello with topic subscriptions
				orgWs.send(
					JSON.stringify({
						type: "client_hello",
						topics: ["system", "billing", "security"], // Subscribe to relevant channels
					}),
				);
			};

			orgWs.onmessage = (event) => {
				try {
					const message = JSON.parse(event.data);

					if (message.type === "notify") {
						// New notification received
						const notification = message.notification;
						// Mark as unread by default (new notifications are always unread)
						setNotifications((prev) =>
							[{ ...notification, read: false }, ...prev].slice(0, 50),
						); // Keep last 50
						setUnreadCount((prev) => prev + 1);

						// Show toast notification (optional)
						console.log("[Notifications] New notification:", notification);
					} else if (message.type === "server_hello") {
						console.log(
							"[Notifications] Subscribed to topics:",
							message.subscribedTopics,
						);
					} else if (message.type === "read_ack") {
						// Update unread count after mark as read
						setUnreadCount(message.unreadCount || 0);
					}
				} catch (error) {
					console.error("[Notifications] Failed to parse message:", error);
				}
			};

			orgWs.onerror = (error) => {
				console.error("[Notifications] WebSocket error:", error);
			};

			orgWs.onclose = () => {
				console.log("[Notifications] WebSocket disconnected");
				setIsConnected(false);

				// Attempt to reconnect with exponential backoff
				if (reconnectAttempts.current < 10) {
					const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 30000);
					reconnectTimeoutRef.current = setTimeout(() => {
						reconnectAttempts.current++;
						connect();
					}, delay);
				}
			};

			wsRef.current = orgWs;
		} catch (error) {
			console.error("[Notifications] Failed to establish connection:", error);
		}
	}, [activeOrgId, userId]);

	// Fetch initial unread count
	const fetchUnreadCount = useCallback(async () => {
		if (!activeOrgId) return;

		try {
			const baseUrl = getNotificationsServiceUrl();
			const token = await getClientJwt();
			if (!token) {
				console.error(
					"[Notifications] No JWT token available for unread count fetch",
				);
				return;
			}

			const response = await fetch(`${baseUrl}/api/notifications/unread`, {
				credentials: "include",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (response.ok) {
				const data = (await response.json()) as {
					success: boolean;
					data?: { total: number };
				};
				setUnreadCount(data.data?.total || 0);
			}
		} catch (error) {
			console.error("[Notifications] Failed to fetch unread count:", error);
		}
	}, [activeOrgId]);

	// Fetch recent notifications
	const fetchNotifications = useCallback(async () => {
		if (!activeOrgId) return;

		try {
			const baseUrl = getNotificationsServiceUrl();
			const token = await getClientJwt();
			if (!token) {
				console.error(
					"[Notifications] No JWT token available for notifications fetch",
				);
				return;
			}

			const response = await fetch(`${baseUrl}/api/notifications?limit=20`, {
				credentials: "include",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (response.ok) {
				const data = (await response.json()) as {
					success: boolean;
					data?: Notification[];
				};
				// Use the read status from the server (already computed)
				setNotifications(data.data || []);
			}
		} catch (error) {
			console.error("[Notifications] Failed to fetch notifications:", error);
		}
	}, [activeOrgId]);

	// Mark notifications as read
	const markAsRead = useCallback(
		async (channelId: string, upToNotificationId: string) => {
			if (!activeOrgId) return;

			try {
				const baseUrl = getNotificationsServiceUrl();
				const token = await getClientJwt();
				if (!token) {
					console.error(
						"[Notifications] No JWT token available for mark as read",
					);
					return;
				}

				const response = await fetch(`${baseUrl}/api/notifications/read`, {
					method: "POST",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ channelId, upToNotificationId }),
				});

				if (response.ok) {
					const data = (await response.json()) as {
						success: boolean;
						data?: { unreadCount: number };
					};
					setUnreadCount(data.data?.unreadCount || 0);

					// Update local notification read state
					setNotifications((prev) =>
						prev.map((n) =>
							n.channelId === channelId && n.id <= upToNotificationId
								? { ...n, read: true }
								: n,
						),
					);
				}
			} catch (error) {
				console.error("[Notifications] Failed to mark as read:", error);
			}
		},
		[activeOrgId],
	);

	// Mark single notification as read (local only for widget)
	const markNotificationAsRead = useCallback((notificationId: string) => {
		setNotifications((prev) =>
			prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
		);
		setUnreadCount((prev) => Math.max(0, prev - 1));
	}, []);

	/**
	 * Mark a single notification as read via API call.
	 * Throws on failure so the widget can handle rollback.
	 */
	const markNotificationAsReadAsync = useCallback(
		async (notificationId: string) => {
			if (!activeOrgId) {
				throw new Error("No active organization");
			}

			// Find the notification to get its channelId
			const notification = notifications.find((n) => n.id === notificationId);
			if (!notification) {
				throw new Error("Notification not found");
			}

			// Use a default channel if none specified
			const channelId = notification.channelId || "system";

			const baseUrl = getNotificationsServiceUrl();
			const token = await getClientJwt();
			if (!token) {
				throw new Error("No JWT token available");
			}

			const response = await fetch(`${baseUrl}/api/notifications/read`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ channelId, upToNotificationId: notificationId }),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(
					`Failed to mark as read: ${response.status} ${JSON.stringify(errorData)}`,
				);
			}

			const data = (await response.json()) as {
				success: boolean;
				data?: { unreadCount: number };
			};

			// IMPORTANT: The server uses cursor-based read tracking
			// When we mark notification X as read, the server marks ALL notifications
			// with id <= X in the same channel as read
			// So we need to update all older notifications in the same channel
			// Note: We use the same channelId fallback logic as above for comparison
			setNotifications((prev) =>
				prev.map((n) => {
					const notificationChannelId = n.channelId || "system";
					// Mark this notification and all older ones in the same channel as read
					if (notificationChannelId === channelId && n.id <= notificationId) {
						return { ...n, read: true };
					}
					return n;
				}),
			);

			if (data.data?.unreadCount !== undefined) {
				setUnreadCount(data.data.unreadCount);
			} else {
				// Recalculate unread count based on updated notifications
				const newUnreadCount = notifications.filter(
					(n) =>
						!(n.channelId === channelId && n.id <= notificationId && !n.read),
				).length;
				setUnreadCount(newUnreadCount);
			}
		},
		[activeOrgId, notifications],
	);

	// Mark all notifications as read (local only for widget)
	const markAllAsRead = useCallback(() => {
		setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
		setUnreadCount(0);
	}, []);

	/**
	 * Mark all notifications as read via API call.
	 * Groups notifications by channelId and marks each channel.
	 * Throws on failure so the widget can handle rollback.
	 */
	const markAllAsReadAsync = useCallback(async () => {
		if (!activeOrgId) {
			throw new Error("No active organization");
		}

		const baseUrl = getNotificationsServiceUrl();
		const token = await getClientJwt();
		if (!token) {
			throw new Error("No JWT token available");
		}

		// Group unread notifications by channelId and find the latest in each
		const unreadByChannel = new Map<string, string>();
		for (const n of notifications) {
			if (!n.read) {
				const channelId = n.channelId || "system";
				// Keep the latest (highest) notification ID per channel
				const existing = unreadByChannel.get(channelId);
				if (!existing || n.id > existing) {
					unreadByChannel.set(channelId, n.id);
				}
			}
		}

		if (unreadByChannel.size === 0) return;

		// Mark each channel as read (parallel requests)
		const results = await Promise.allSettled(
			Array.from(unreadByChannel.entries()).map(
				async ([channelId, upToNotificationId]) => {
					const response = await fetch(`${baseUrl}/api/notifications/read`, {
						method: "POST",
						credentials: "include",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${token}`,
						},
						body: JSON.stringify({ channelId, upToNotificationId }),
					});

					if (!response.ok) {
						throw new Error(`Failed to mark channel ${channelId} as read`);
					}
					return response.json();
				},
			),
		);

		// Check if any failed
		const failures = results.filter((r) => r.status === "rejected");
		if (failures.length > 0) {
			console.error(
				"[Notifications] Some channels failed to mark as read:",
				failures,
			);
			throw new Error(`Failed to mark ${failures.length} channel(s) as read`);
		}

		// Update local state on success
		setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
		setUnreadCount(0);
	}, [activeOrgId, notifications]);

	// Clear all notifications
	const clearAll = useCallback(() => {
		setNotifications([]);
	}, []);

	// Initialize connection and fetch data
	useEffect(() => {
		if (activeOrgId && userId) {
			connect();
			fetchUnreadCount();
			fetchNotifications();
		}

		return () => {
			if (wsRef.current) {
				wsRef.current.close();
				wsRef.current = null;
			}
			if (reconnectTimeoutRef.current) {
				clearTimeout(reconnectTimeoutRef.current);
			}
		};
	}, [activeOrgId, userId, connect, fetchUnreadCount, fetchNotifications]);

	const value: NotificationsContextValue = {
		notifications,
		unreadCount,
		isConnected,
		markAsRead,
		markNotificationAsReadAsync,
		markNotificationAsRead,
		markAllAsReadAsync,
		markAllAsRead,
		clearAll,
	};

	// Create blocks context value by mapping auth's notification format to blocks' format
	const blocksContextValue: BlocksNotificationsContextValue = useMemo(
		() => ({
			notifications: notifications.map(
				(n): BlocksNotification => ({
					id: n.id,
					title: n.title,
					message: n.body,
					timestamp: new Date(n.createdAt),
					type: mapSeverityToType(n.severity),
					read: n.read,
					href: n.callbackUrl || undefined,
					channelId: n.channelId || undefined,
				}),
			),
			unreadCount,
			markAsRead: markNotificationAsReadAsync,
			markAllAsRead: markAllAsReadAsync,
			dismiss: undefined, // Not implemented - notifications are managed by server
			clearAll,
			onNotificationClick: undefined, // Let the widget handle this via props if needed
		}),
		[
			notifications,
			unreadCount,
			markNotificationAsReadAsync,
			markAllAsReadAsync,
			clearAll,
		],
	);

	return (
		<NotificationsContext.Provider value={value}>
			<BlocksNotificationsContext.Provider value={blocksContextValue}>
				{children}
			</BlocksNotificationsContext.Provider>
		</NotificationsContext.Provider>
	);
}
