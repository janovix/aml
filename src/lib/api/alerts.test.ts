import { describe, expect, it, vi } from "vitest";
import {
	cancelAlert,
	generateAlertSatFile,
	getAlertById,
	listAlerts,
	updateAlertStatus,
	createManualAlert,
	listAlertRules,
	getAlertRuleById,
} from "./alerts";
import type {
	Alert,
	AlertsListResponse,
	AlertRule,
	AlertRulesListResponse,
} from "./alerts";

const mockAlert: Alert = {
	id: "ALERT123",
	alertRuleId: "RULE001",
	clientId: "CLIENT123",
	status: "DETECTED",
	severity: "HIGH",
	idempotencyKey: "idem-key-123",
	contextHash: "hash-123",
	metadata: { key: "value" },
	isManual: false,
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

	it("listAlerts uses default baseUrl when not provided", async () => {
		const fetchSpy = vi.fn(async (url: RequestInfo | URL) => {
			const u = new URL(typeof url === "string" ? url : url.toString());
			// Should use default baseUrl from getAmlCoreBaseUrl()
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

		await listAlerts();
		expect(fetchSpy).toHaveBeenCalled();
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

	it("getAlertById uses default baseUrl when not provided", async () => {
		const fetchSpy = vi.fn(async (url: RequestInfo | URL) => {
			return new Response(JSON.stringify(mockAlert), {
				status: 200,
				headers: { "content-type": "application/json" },
			});
		});
		vi.stubGlobal("fetch", fetchSpy);

		await getAlertById({ id: "ALERT123" });
		expect(fetchSpy).toHaveBeenCalled();
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

	it("updateAlertStatus uses default baseUrl when not provided", async () => {
		const updatedAlert: Alert = { ...mockAlert, status: "SUBMITTED" };

		const fetchSpy = vi.fn(async (url: RequestInfo | URL) => {
			return new Response(JSON.stringify(updatedAlert), {
				status: 200,
				headers: { "content-type": "application/json" },
			});
		});
		vi.stubGlobal("fetch", fetchSpy);

		await updateAlertStatus({
			id: "ALERT123",
			status: "SUBMITTED",
			notes: "Updated notes",
		});
		expect(fetchSpy).toHaveBeenCalled();
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

	it("cancelAlert uses default baseUrl when not provided", async () => {
		const cancelledAlert: Alert = {
			...mockAlert,
			status: "CANCELLED",
			cancelledAt: "2024-01-16T10:00:00Z",
			cancelledBy: "user-123",
			cancellationReason: "Duplicate alert",
		};

		const fetchSpy = vi.fn(async (url: RequestInfo | URL) => {
			return new Response(JSON.stringify(cancelledAlert), {
				status: 200,
				headers: { "content-type": "application/json" },
			});
		});
		vi.stubGlobal("fetch", fetchSpy);

		await cancelAlert({
			id: "ALERT123",
			reason: "Duplicate alert",
		});
		expect(fetchSpy).toHaveBeenCalled();
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

	it("generateAlertSatFile uses default baseUrl when not provided", async () => {
		const fileResponse = { fileUrl: "https://example.com/files/alert-sat.xml" };

		const fetchSpy = vi.fn(async (url: RequestInfo | URL) => {
			return new Response(JSON.stringify(fileResponse), {
				status: 200,
				headers: { "content-type": "application/json" },
			});
		});
		vi.stubGlobal("fetch", fetchSpy);

		await generateAlertSatFile({ id: "ALERT123" });
		expect(fetchSpy).toHaveBeenCalled();
	});

	it("createManualAlert sends POST with isManual=true", async () => {
		const createdAlert: Alert = {
			...mockAlert,
			id: "ALERT456",
			isManual: true,
		};

		const fetchSpy = vi.fn(
			async (url: RequestInfo | URL, init?: RequestInit) => {
				expect((init?.method ?? "POST").toUpperCase()).toBe("POST");
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.origin + u.pathname).toBe("https://example.com/api/v1/alerts");
				const body = JSON.parse(init?.body as string);
				expect(body.isManual).toBe(true);
				expect(body.alertRuleId).toBe("RULE001");
				expect(body.clientId).toBe("CLIENT123");
				return new Response(JSON.stringify(createdAlert), {
					status: 201,
					headers: { "content-type": "application/json" },
				});
			},
		);
		vi.stubGlobal("fetch", fetchSpy);

		const res = await createManualAlert({
			alertRuleId: "RULE001",
			clientId: "CLIENT123",
			severity: "HIGH",
			idempotencyKey: "manual-key-123",
			contextHash: "hash-123",
			metadata: { reason: "Test reason" },
			baseUrl: "https://example.com",
		});
		expect(res.id).toBe("ALERT456");
		expect(res.isManual).toBe(true);
	});

	it("createManualAlert uses default baseUrl when not provided", async () => {
		const createdAlert: Alert = {
			...mockAlert,
			id: "ALERT456",
			isManual: true,
		};

		const fetchSpy = vi.fn(async (url: RequestInfo | URL) => {
			return new Response(JSON.stringify(createdAlert), {
				status: 201,
				headers: { "content-type": "application/json" },
			});
		});
		vi.stubGlobal("fetch", fetchSpy);

		await createManualAlert({
			alertRuleId: "RULE001",
			clientId: "CLIENT123",
			severity: "HIGH",
			idempotencyKey: "manual-key-123",
			contextHash: "hash-123",
			metadata: { reason: "Test reason" },
		});
		expect(fetchSpy).toHaveBeenCalled();
	});

	it("listAlertRules fetches alert rules with filters", async () => {
		const mockRules: AlertRule[] = [
			{
				id: "2501",
				name: "Test Rule",
				description: "Test description",
				active: true,
				severity: "HIGH",
				ruleType: null,
				isManualOnly: true,
				activityCode: "VEH",
				createdAt: "2024-01-15T10:00:00Z",
				updatedAt: "2024-01-15T10:00:00Z",
			},
		];

		const fetchSpy = vi.fn(
			async (url: RequestInfo | URL, init?: RequestInit) => {
				expect((init?.method ?? "GET").toUpperCase()).toBe("GET");
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.origin + u.pathname).toBe(
					"https://example.com/api/v1/alert-rules",
				);
				expect(u.searchParams.get("active")).toBe("true");
				expect(u.searchParams.get("limit")).toBe("50");
				return new Response(
					JSON.stringify({
						data: mockRules,
						pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
					}),
					{
						status: 200,
						headers: { "content-type": "application/json" },
					},
				);
			},
		);
		vi.stubGlobal("fetch", fetchSpy);

		const res = await listAlertRules({
			baseUrl: "https://example.com",
			active: true,
			limit: 50,
		});
		expect(res.data).toHaveLength(1);
		expect(res.data[0].id).toBe("2501");
	});

	it("getAlertRuleById fetches a single alert rule", async () => {
		const mockRule: AlertRule = {
			id: "2501",
			name: "Test Rule",
			description: "Test description",
			active: true,
			severity: "HIGH",
			ruleType: null,
			isManualOnly: true,
			activityCode: "VEH",
			createdAt: "2024-01-15T10:00:00Z",
			updatedAt: "2024-01-15T10:00:00Z",
		};

		const fetchSpy = vi.fn(
			async (url: RequestInfo | URL, init?: RequestInit) => {
				expect((init?.method ?? "GET").toUpperCase()).toBe("GET");
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.origin + u.pathname).toBe(
					"https://example.com/api/v1/alert-rules/2501",
				);
				return new Response(JSON.stringify(mockRule), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			},
		);
		vi.stubGlobal("fetch", fetchSpy);

		const res = await getAlertRuleById({
			id: "2501",
			baseUrl: "https://example.com",
		});
		expect(res.id).toBe("2501");
		expect(res.name).toBe("Test Rule");
	});

	it("getAlertRuleById uses default baseUrl when not provided", async () => {
		const mockRule: AlertRule = {
			id: "2501",
			name: "Test Rule",
			description: "Test description",
			active: true,
			severity: "HIGH",
			ruleType: null,
			isManualOnly: true,
			activityCode: "VEH",
			createdAt: "2024-01-15T10:00:00Z",
			updatedAt: "2024-01-15T10:00:00Z",
		};

		const fetchSpy = vi.fn(async (url: RequestInfo | URL) => {
			return new Response(JSON.stringify(mockRule), {
				status: 200,
				headers: { "content-type": "application/json" },
			});
		});
		vi.stubGlobal("fetch", fetchSpy);

		await getAlertRuleById({ id: "2501" });
		expect(fetchSpy).toHaveBeenCalled();
	});

	it("listAlerts handles isManual=false correctly", async () => {
		const fetchSpy = vi.fn(
			async (url: RequestInfo | URL, init?: RequestInit) => {
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.searchParams.get("isManual")).toBe("false");
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
			},
		);
		vi.stubGlobal("fetch", fetchSpy);

		await listAlerts({
			baseUrl: "https://example.com",
			isManual: false,
		});
	});

	it("listAlerts handles isManual=true correctly", async () => {
		const fetchSpy = vi.fn(
			async (url: RequestInfo | URL, init?: RequestInit) => {
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.searchParams.get("isManual")).toBe("true");
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
			},
		);
		vi.stubGlobal("fetch", fetchSpy);

		await listAlerts({
			baseUrl: "https://example.com",
			isManual: true,
		});
	});

	it("listAlerts omits isManual when undefined", async () => {
		const fetchSpy = vi.fn(
			async (url: RequestInfo | URL, init?: RequestInit) => {
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.searchParams.get("isManual")).toBeNull();
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
			},
		);
		vi.stubGlobal("fetch", fetchSpy);

		await listAlerts({
			baseUrl: "https://example.com",
		});
	});

	it("listAlertRules handles all optional filters", async () => {
		const fetchSpy = vi.fn(
			async (url: RequestInfo | URL, init?: RequestInit) => {
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.searchParams.get("search")).toBe("test");
				expect(u.searchParams.get("active")).toBe("true");
				expect(u.searchParams.get("severity")).toBe("HIGH");
				expect(u.searchParams.get("activityCode")).toBe("VEH");
				expect(u.searchParams.get("isManualOnly")).toBe("true");
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
			},
		);
		vi.stubGlobal("fetch", fetchSpy);

		await listAlertRules({
			baseUrl: "https://example.com",
			search: "test",
			active: true,
			severity: "HIGH",
			activityCode: "VEH",
			isManualOnly: true,
		});
	});

	it("listAlertRules handles active=false correctly", async () => {
		const fetchSpy = vi.fn(
			async (url: RequestInfo | URL, init?: RequestInit) => {
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.searchParams.get("active")).toBe("false");
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
			},
		);
		vi.stubGlobal("fetch", fetchSpy);

		await listAlertRules({
			baseUrl: "https://example.com",
			active: false,
		});
	});

	it("listAlertRules handles isManualOnly=false correctly", async () => {
		const fetchSpy = vi.fn(
			async (url: RequestInfo | URL, init?: RequestInit) => {
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.searchParams.get("isManualOnly")).toBe("false");
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
			},
		);
		vi.stubGlobal("fetch", fetchSpy);

		await listAlertRules({
			baseUrl: "https://example.com",
			isManualOnly: false,
		});
	});

	it("listAlertRules omits active and isManualOnly when undefined", async () => {
		const fetchSpy = vi.fn(
			async (url: RequestInfo | URL, init?: RequestInit) => {
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.searchParams.get("active")).toBeNull();
				expect(u.searchParams.get("isManualOnly")).toBeNull();
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
			},
		);
		vi.stubGlobal("fetch", fetchSpy);

		await listAlertRules({
			baseUrl: "https://example.com",
		});
	});

	it("updateAlertStatus omits notes when not provided", async () => {
		const fetchSpy = vi.fn(
			async (url: RequestInfo | URL, init?: RequestInit) => {
				const body = JSON.parse(init?.body as string);
				expect(body).not.toHaveProperty("notes");
				return new Response(JSON.stringify(mockAlert), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			},
		);
		vi.stubGlobal("fetch", fetchSpy);

		await updateAlertStatus({
			id: "ALERT123",
			status: "SUBMITTED",
			baseUrl: "https://example.com",
		});
	});

	it("createManualAlert includes optional transactionId and notes", async () => {
		const fetchSpy = vi.fn(
			async (url: RequestInfo | URL, init?: RequestInit) => {
				const body = JSON.parse(init?.body as string);
				expect(body.transactionId).toBe("TXN123");
				expect(body.notes).toBe("Test notes");
				return new Response(JSON.stringify(mockAlert), {
					status: 201,
					headers: { "content-type": "application/json" },
				});
			},
		);
		vi.stubGlobal("fetch", fetchSpy);

		await createManualAlert({
			alertRuleId: "RULE001",
			clientId: "CLIENT123",
			severity: "HIGH",
			idempotencyKey: "key-123",
			contextHash: "hash-123",
			metadata: {},
			transactionId: "TXN123",
			notes: "Test notes",
			baseUrl: "https://example.com",
		});
	});
});
