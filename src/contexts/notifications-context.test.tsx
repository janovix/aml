import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
	NotificationsProvider,
	useNotifications,
} from "./notifications-context";

vi.mock("@sentry/nextjs", () => ({
	captureException: vi.fn(),
	captureMessage: vi.fn(),
}));

const getClientJwt = vi.fn();
vi.mock("@/lib/auth/authClient", () => ({
	getClientJwt: (...a: unknown[]) => getClientJwt(...a),
}));

vi.mock("@/lib/auth/config", () => ({
	getNotificationsServiceUrl: () => "https://notifications.test",
}));

const useAuthSession = vi.fn();
vi.mock("@/lib/auth/useAuthSession", () => ({
	useAuthSession: () => useAuthSession(),
}));

class MockWebSocket {
	static instances: MockWebSocket[] = [];
	sent: string[] = [];
	onopen: ((ev: Event) => void) | null = null;
	onmessage: ((ev: MessageEvent) => void) | null = null;
	onerror: ((ev: Event) => void) | null = null;
	onclose: ((ev: CloseEvent) => void) | null = null;
	constructor(public url: string) {
		MockWebSocket.instances.push(this);
		queueMicrotask(() => this.onopen?.(new Event("open")));
	}
	send(data: string) {
		this.sent.push(data);
	}
	close() {
		this.onclose?.({} as CloseEvent);
	}
}

const sampleNotification = {
	id: "n1",
	channelId: "system",
	channelSlug: null,
	type: "alert",
	title: "Hello",
	body: "World",
	payload: null,
	severity: "info" as const,
	callbackUrl: null,
	createdAt: "2024-01-01T00:00:00.000Z",
	read: false,
};

function Consumer() {
	const ctx = useNotifications();
	return (
		<div>
			<span data-testid="unread">{ctx.unreadCount}</span>
			<span data-testid="connected">{String(ctx.isConnected)}</span>
			<span data-testid="count">{ctx.notifications.length}</span>
			<button type="button" onClick={() => ctx.markNotificationAsRead("n1")}>
				mark-local
			</button>
		</div>
	);
}

describe("notifications-context", () => {
	let OriginalWebSocket: typeof WebSocket;

	beforeEach(() => {
		OriginalWebSocket = globalThis.WebSocket;
		globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;
		MockWebSocket.instances = [];
		getClientJwt.mockResolvedValue("jwt-token");
		useAuthSession.mockReturnValue({
			data: {
				user: { id: "user-1" },
				session: { activeOrganizationId: "org-1" },
			},
		});

		vi.stubGlobal(
			"fetch",
			vi.fn(async (url: string | URL, init?: RequestInit) => {
				const u = String(url);
				if (u.includes("/api/notifications/unread")) {
					return new Response(
						JSON.stringify({ success: true, data: { total: 2 } }),
						{ status: 200 },
					);
				}
				if (u.includes("/api/notifications?limit=20")) {
					return new Response(
						JSON.stringify({
							success: true,
							data: [sampleNotification],
						}),
						{ status: 200 },
					);
				}
				if (init?.method === "POST" && u.includes("/api/notifications/read")) {
					return new Response(
						JSON.stringify({
							success: true,
							data: { unreadCount: 0 },
						}),
						{ status: 200 },
					);
				}
				return new Response("not found", { status: 404 });
			}),
		);
	});

	afterEach(() => {
		globalThis.WebSocket = OriginalWebSocket;
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it("throws when useNotifications is used outside provider", () => {
		const Bad = () => {
			useNotifications();
			return null;
		};
		expect(() => render(<Bad />)).toThrow(
			/useNotifications must be used within a NotificationsProvider/,
		);
	});

	it("fetches unread + list, opens websocket, and markNotificationAsRead updates state", async () => {
		const user = userEvent.setup();
		render(
			<NotificationsProvider>
				<Consumer />
			</NotificationsProvider>,
		);

		await waitFor(() =>
			expect(screen.getByTestId("unread")).toHaveTextContent("2"),
		);
		await waitFor(() =>
			expect(screen.getByTestId("count")).toHaveTextContent("1"),
		);
		await waitFor(() =>
			expect(screen.getByTestId("connected")).toHaveTextContent("true"),
		);

		expect(MockWebSocket.instances.length).toBeGreaterThan(0);
		const ws = MockWebSocket.instances[0];
		expect(ws.url).toContain("wss://notifications.test");
		expect(ws.url).toContain("token=");

		await user.click(screen.getByRole("button", { name: /mark-local/i }));
		await waitFor(() =>
			expect(screen.getByTestId("unread")).toHaveTextContent("1"),
		);
	});
});
