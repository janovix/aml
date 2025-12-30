import { describe, expect, it, vi } from "vitest";
import {
	cancelAlert,
	generateAlertSatFile,
	getAlertById,
	listAlerts,
	updateAlertStatus,
} from "./alerts";
import type { Alert, AlertsListResponse } from "./alerts";

const mockAlert: Alert = {
	id: "ALERT123",
	alertRuleId: "RULE001",
	clientId: "CLIENT123",
	status: "DETECTED",
	severity: "HIGH",
	idempotencyKey: "idem-key-123",
	contextHash: "hash-123",
	alertData: '{"key": "value"}',
	isOverdue: false,
	createdAt: "2024-01-15T10:00:00Z",
	updatedAt: "2024-01-15T10:00:00Z",
};

describe("api/alerts", () => {
	it("listAlerts omits query params when not provided", async () => {
		const fetchSpy = vi.fn(async (url: RequestInfo | URL) => {
			const u = new URL(typeof url === "string" ? url : url.toString());
			expect(u.origin + u.pathname).toBe("https://example.com/api/v1/alerts");
			expect(u.search).toBe("");
			return new Response(
				JSON.stringify({
					data: [],
					pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
				}),
				{
					status: 200,
					headers: { "content-type": "application/json" },
				},
			);
		});
		vi.stubGlobal("fetch", fetchSpy);

		const res = await listAlerts({ baseUrl: "https://example.com" });
		expect(res.data).toEqual([]);
		expect(res.pagination.page).toBe(1);
	});

	it("listAlerts builds query params correctly", async () => {
		const fetchSpy = vi.fn(
			async (url: RequestInfo | URL, init?: RequestInit) => {
				expect((init?.method ?? "GET").toUpperCase()).toBe("GET");
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.origin + u.pathname).toBe("https://example.com/api/v1/alerts");
				expect(u.searchParams.get("page")).toBe("2");
				expect(u.searchParams.get("limit")).toBe("20");
				expect(u.searchParams.get("alertRuleId")).toBe("RULE001");
				expect(u.searchParams.get("clientId")).toBe("CLIENT123");
				expect(u.searchParams.get("status")).toBe("DETECTED");
				expect(u.searchParams.get("severity")).toBe("HIGH");
				return new Response(
					JSON.stringify({
						data: [mockAlert],
						pagination: { page: 2, limit: 20, total: 1, totalPages: 1 },
					}),
					{
						status: 200,
						headers: { "content-type": "application/json" },
					},
				);
			},
		);
		vi.stubGlobal("fetch", fetchSpy);

		const res = await listAlerts({
			baseUrl: "https://example.com",
			page: 2,
			limit: 20,
			alertRuleId: "RULE001",
			clientId: "CLIENT123",
			status: "DETECTED",
			severity: "HIGH",
		});
		expect(res.pagination.page).toBe(2);
		expect(res.pagination.limit).toBe(20);
		expect(res.data).toHaveLength(1);
	});

	it("getAlertById requests /api/v1/alerts/:id", async () => {
		const fetchSpy = vi.fn(
			async (url: RequestInfo | URL, init?: RequestInit) => {
				expect((init?.method ?? "GET").toUpperCase()).toBe("GET");
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.origin + u.pathname).toBe(
					"https://example.com/api/v1/alerts/ALERT123",
				);
				return new Response(JSON.stringify(mockAlert), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			},
		);
		vi.stubGlobal("fetch", fetchSpy);

		const res = await getAlertById({
			id: "ALERT123",
			baseUrl: "https://example.com",
		});
		expect(res.id).toBe("ALERT123");
		expect(res.clientId).toBe("CLIENT123");
	});

	it("updateAlertStatus sends PATCH with correct body", async () => {
		const updatedAlert: Alert = { ...mockAlert, status: "SUBMITTED" };

		const fetchSpy = vi.fn(
			async (url: RequestInfo | URL, init?: RequestInit) => {
				expect((init?.method ?? "PATCH").toUpperCase()).toBe("PATCH");
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.origin + u.pathname).toBe(
					"https://example.com/api/v1/alerts/ALERT123",
				);
				expect(init?.headers).toMatchObject({
					"content-type": "application/json",
				});
				const body = JSON.parse(init?.body as string);
				expect(body).toEqual({ status: "SUBMITTED", notes: "Updated notes" });
				return new Response(JSON.stringify(updatedAlert), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			},
		);
		vi.stubGlobal("fetch", fetchSpy);

		const res = await updateAlertStatus({
			id: "ALERT123",
			status: "SUBMITTED",
			notes: "Updated notes",
			baseUrl: "https://example.com",
		});
		expect(res.id).toBe("ALERT123");
		expect(res.status).toBe("SUBMITTED");
	});

	it("cancelAlert sends POST to /cancel endpoint with reason", async () => {
		const cancelledAlert: Alert = {
			...mockAlert,
			status: "CANCELLED",
			cancelledAt: "2024-01-16T10:00:00Z",
			cancelledBy: "user-123",
			cancellationReason: "Duplicate alert",
		};

		const fetchSpy = vi.fn(
			async (url: RequestInfo | URL, init?: RequestInit) => {
				expect((init?.method ?? "POST").toUpperCase()).toBe("POST");
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.origin + u.pathname).toBe(
					"https://example.com/api/v1/alerts/ALERT123/cancel",
				);
				expect(init?.headers).toMatchObject({
					"content-type": "application/json",
				});
				const body = JSON.parse(init?.body as string);
				expect(body).toEqual({ reason: "Duplicate alert" });
				return new Response(JSON.stringify(cancelledAlert), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			},
		);
		vi.stubGlobal("fetch", fetchSpy);

		const res = await cancelAlert({
			id: "ALERT123",
			reason: "Duplicate alert",
			baseUrl: "https://example.com",
		});
		expect(res.id).toBe("ALERT123");
		expect(res.status).toBe("CANCELLED");
		expect(res.cancellationReason).toBe("Duplicate alert");
	});

	it("generateAlertSatFile sends POST to /generate-file endpoint", async () => {
		const fileResponse = { fileUrl: "https://example.com/files/alert-sat.xml" };

		const fetchSpy = vi.fn(
			async (url: RequestInfo | URL, init?: RequestInit) => {
				expect((init?.method ?? "POST").toUpperCase()).toBe("POST");
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.origin + u.pathname).toBe(
					"https://example.com/api/v1/alerts/ALERT123/generate-file",
				);
				return new Response(JSON.stringify(fileResponse), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			},
		);
		vi.stubGlobal("fetch", fetchSpy);

		const res = await generateAlertSatFile({
			id: "ALERT123",
			baseUrl: "https://example.com",
		});
		expect(res.fileUrl).toBe("https://example.com/files/alert-sat.xml");
	});
});
