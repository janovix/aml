import { describe, expect, it, vi } from "vitest";
import {
	listNotices,
	getNoticeById,
	previewNotice,
	createNotice,
	updateNotice,
	deleteNotice,
	generateNoticeFile,
	getNoticeDownloadUrl,
	submitNoticeToSat,
	acknowledgeNotice,
	calculateNoticePeriod,
	type Notice,
	type NoticeWithAlertSummary,
	type NoticePreviewResponse,
} from "./notices";

const mockNotice: Notice = {
	id: "NOTICE123",
	organizationId: "ORG123",
	name: "Aviso SAT Enero 2024",
	status: "DRAFT",
	periodStart: "2023-12-17T00:00:00Z",
	periodEnd: "2024-01-16T23:59:59.999Z",
	reportedMonth: "202401",
	recordCount: 10,
	xmlFileUrl: null,
	fileSize: null,
	generatedAt: null,
	submittedAt: null,
	satFolioNumber: null,
	createdBy: "user-123",
	notes: null,
	createdAt: "2024-01-15T10:00:00Z",
	updatedAt: "2024-01-15T10:00:00Z",
};

const mockNoticeWithSummary: NoticeWithAlertSummary = {
	...mockNotice,
	alertSummary: {
		total: 10,
		bySeverity: { HIGH: 5, MEDIUM: 3, LOW: 2 },
		byStatus: { DETECTED: 8, SUBMITTED: 2 },
		byRule: [
			{ ruleId: "RULE001", ruleName: "Rule 1", count: 5 },
			{ ruleId: "RULE002", ruleName: "Rule 2", count: 5 },
		],
	},
};

describe("api/notices", () => {
	describe("listNotices", () => {
		it("omits query params when not provided", async () => {
			const fetchSpy = vi.fn(async (url: RequestInfo | URL) => {
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.origin + u.pathname).toBe(
					"https://example.com/api/v1/notices",
				);
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

			const res = await listNotices({ baseUrl: "https://example.com" });
			expect(res.data).toEqual([]);
			expect(res.pagination.page).toBe(1);
		});

		it("builds query params correctly", async () => {
			const fetchSpy = vi.fn(
				async (url: RequestInfo | URL, init?: RequestInit) => {
					expect((init?.method ?? "GET").toUpperCase()).toBe("GET");
					const u = new URL(typeof url === "string" ? url : url.toString());
					expect(u.origin + u.pathname).toBe(
						"https://example.com/api/v1/notices",
					);
					expect(u.searchParams.get("page")).toBe("2");
					expect(u.searchParams.get("limit")).toBe("20");
					expect(u.searchParams.get("status")).toBe("SUBMITTED");
					expect(u.searchParams.get("year")).toBe("2024");
					return new Response(
						JSON.stringify({
							data: [mockNotice],
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

			const res = await listNotices({
				baseUrl: "https://example.com",
				page: 2,
				limit: 20,
				status: "SUBMITTED",
				year: 2024,
			});
			expect(res.pagination.page).toBe(2);
			expect(res.data).toHaveLength(1);
		});

		it("only includes status when provided", async () => {
			const fetchSpy = vi.fn(async (url: RequestInfo | URL) => {
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.searchParams.get("status")).toBe("ACKNOWLEDGED");
				expect(u.searchParams.get("page")).toBeNull();
				expect(u.searchParams.get("limit")).toBeNull();
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

			await listNotices({
				baseUrl: "https://example.com",
				status: "ACKNOWLEDGED",
			});
		});
	});

	describe("getNoticeById", () => {
		it("requests /api/v1/notices/:id", async () => {
			const fetchSpy = vi.fn(
				async (url: RequestInfo | URL, init?: RequestInit) => {
					expect((init?.method ?? "GET").toUpperCase()).toBe("GET");
					const u = new URL(typeof url === "string" ? url : url.toString());
					expect(u.origin + u.pathname).toBe(
						"https://example.com/api/v1/notices/NOTICE123",
					);
					return new Response(JSON.stringify(mockNoticeWithSummary), {
						status: 200,
						headers: { "content-type": "application/json" },
					});
				},
			);
			vi.stubGlobal("fetch", fetchSpy);

			const res = await getNoticeById({
				id: "NOTICE123",
				baseUrl: "https://example.com",
			});
			expect(res.id).toBe("NOTICE123");
			expect(res.alertSummary.total).toBe(10);
		});

		it("getNoticeById uses default baseUrl when not provided", async () => {
			const fetchSpy = vi.fn(async () => {
				return new Response(JSON.stringify(mockNoticeWithSummary), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			});
			vi.stubGlobal("fetch", fetchSpy);

			await getNoticeById({ id: "NOTICE123" });
			expect(fetchSpy).toHaveBeenCalled();
		});
	});

	describe("previewNotice", () => {
		it("builds preview URL with year/month params", async () => {
			const mockPreview: NoticePreviewResponse = {
				total: 10,
				bySeverity: { HIGH: 5, MEDIUM: 3, LOW: 2 },
				byStatus: { DETECTED: 8, SUBMITTED: 2 },
				periodStart: "2023-12-17T00:00:00Z",
				periodEnd: "2024-01-16T23:59:59.999Z",
				reportedMonth: "202401",
				displayName: "Enero 2024",
				submissionDeadline: "2024-02-17T23:59:59.999Z",
			};

			const fetchSpy = vi.fn(
				async (url: RequestInfo | URL, init?: RequestInit) => {
					expect((init?.method ?? "GET").toUpperCase()).toBe("GET");
					const u = new URL(typeof url === "string" ? url : url.toString());
					expect(u.origin + u.pathname).toBe(
						"https://example.com/api/v1/notices/preview",
					);
					expect(u.searchParams.get("year")).toBe("2024");
					expect(u.searchParams.get("month")).toBe("1");
					return new Response(JSON.stringify(mockPreview), {
						status: 200,
						headers: { "content-type": "application/json" },
					});
				},
			);
			vi.stubGlobal("fetch", fetchSpy);

			const res = await previewNotice({
				year: 2024,
				month: 1,
				baseUrl: "https://example.com",
			});
			expect(res.total).toBe(10);
			expect(res.reportedMonth).toBe("202401");
			expect(res.displayName).toBe("Enero 2024");
		});
	});

	describe("createNotice", () => {
		it("sends POST with year/month", async () => {
			const createdNotice: Notice = { ...mockNotice, id: "NOTICE456" };

			const fetchSpy = vi.fn(
				async (url: RequestInfo | URL, init?: RequestInit) => {
					expect((init?.method ?? "POST").toUpperCase()).toBe("POST");
					const u = new URL(typeof url === "string" ? url : url.toString());
					expect(u.origin + u.pathname).toBe(
						"https://example.com/api/v1/notices",
					);
					const body = JSON.parse(init?.body as string);
					expect(body).toEqual({
						name: "Aviso SAT Enero 2024",
						year: 2024,
						month: 1,
						notes: null,
					});
					return new Response(JSON.stringify(createdNotice), {
						status: 201,
						headers: { "content-type": "application/json" },
					});
				},
			);
			vi.stubGlobal("fetch", fetchSpy);

			const res = await createNotice({
				name: "Aviso SAT Enero 2024",
				year: 2024,
				month: 1,
				notes: null,
				baseUrl: "https://example.com",
			});
			expect(res.id).toBe("NOTICE456");
		});

		it("includes notes when provided", async () => {
			const fetchSpy = vi.fn(
				async (url: RequestInfo | URL, init?: RequestInit) => {
					const body = JSON.parse(init?.body as string);
					expect(body.notes).toBe("Test notes");
					return new Response(JSON.stringify(mockNotice), {
						status: 201,
						headers: { "content-type": "application/json" },
					});
				},
			);
			vi.stubGlobal("fetch", fetchSpy);

			await createNotice({
				name: "Test Notice",
				year: 2024,
				month: 6,
				notes: "Test notes",
				baseUrl: "https://example.com",
			});
		});
	});

	describe("updateNotice", () => {
		it("sends PATCH with correct body", async () => {
			const updatedNotice: Notice = { ...mockNotice, name: "Updated Name" };

			const fetchSpy = vi.fn(
				async (url: RequestInfo | URL, init?: RequestInit) => {
					expect((init?.method ?? "PATCH").toUpperCase()).toBe("PATCH");
					const u = new URL(typeof url === "string" ? url : url.toString());
					expect(u.origin + u.pathname).toBe(
						"https://example.com/api/v1/notices/NOTICE123",
					);
					const body = JSON.parse(init?.body as string);
					expect(body).toEqual({ name: "Updated Name" });
					return new Response(JSON.stringify(updatedNotice), {
						status: 200,
						headers: { "content-type": "application/json" },
					});
				},
			);
			vi.stubGlobal("fetch", fetchSpy);

			const res = await updateNotice({
				id: "NOTICE123",
				name: "Updated Name",
				baseUrl: "https://example.com",
			});
			expect(res.name).toBe("Updated Name");
		});

		it("handles satFolioNumber", async () => {
			const fetchSpy = vi.fn(
				async (url: RequestInfo | URL, init?: RequestInit) => {
					const body = JSON.parse(init?.body as string);
					expect(body.satFolioNumber).toBe("SAT-12345");
					return new Response(JSON.stringify(mockNotice), {
						status: 200,
						headers: { "content-type": "application/json" },
					});
				},
			);
			vi.stubGlobal("fetch", fetchSpy);

			await updateNotice({
				id: "NOTICE123",
				satFolioNumber: "SAT-12345",
				baseUrl: "https://example.com",
			});
		});

		it("only includes defined fields in body", async () => {
			const fetchSpy = vi.fn(
				async (url: RequestInfo | URL, init?: RequestInit) => {
					const body = JSON.parse(init?.body as string);
					expect(body).toEqual({ name: "Updated Name" });
					expect(body).not.toHaveProperty("notes");
					expect(body).not.toHaveProperty("satFolioNumber");
					return new Response(JSON.stringify(mockNotice), {
						status: 200,
						headers: { "content-type": "application/json" },
					});
				},
			);
			vi.stubGlobal("fetch", fetchSpy);

			await updateNotice({
				id: "NOTICE123",
				name: "Updated Name",
				baseUrl: "https://example.com",
			});
		});
	});

	describe("deleteNotice", () => {
		it("sends DELETE request", async () => {
			const fetchSpy = vi.fn(
				async (url: RequestInfo | URL, init?: RequestInit) => {
					expect((init?.method ?? "DELETE").toUpperCase()).toBe("DELETE");
					const u = new URL(typeof url === "string" ? url : url.toString());
					expect(u.origin + u.pathname).toBe(
						"https://example.com/api/v1/notices/NOTICE123",
					);
					return new Response(null, { status: 204 });
				},
			);
			vi.stubGlobal("fetch", fetchSpy);

			await deleteNotice({
				id: "NOTICE123",
				baseUrl: "https://example.com",
			});
		});
	});

	describe("generateNoticeFile", () => {
		it("sends POST to /generate endpoint", async () => {
			const generateResponse = {
				message: "Notice generated successfully",
				noticeId: "NOTICE123",
				alertCount: 10,
			};

			const fetchSpy = vi.fn(
				async (url: RequestInfo | URL, init?: RequestInit) => {
					expect((init?.method ?? "POST").toUpperCase()).toBe("POST");
					const u = new URL(typeof url === "string" ? url : url.toString());
					expect(u.origin + u.pathname).toBe(
						"https://example.com/api/v1/notices/NOTICE123/generate",
					);
					return new Response(JSON.stringify(generateResponse), {
						status: 200,
						headers: { "content-type": "application/json" },
					});
				},
			);
			vi.stubGlobal("fetch", fetchSpy);

			const res = await generateNoticeFile({
				id: "NOTICE123",
				baseUrl: "https://example.com",
			});
			expect(res.noticeId).toBe("NOTICE123");
			expect(res.alertCount).toBe(10);
		});
	});

	describe("getNoticeDownloadUrl", () => {
		it("requests download URL", async () => {
			const downloadResponse = {
				fileUrl: "https://example.com/files/notice.xml",
				fileSize: 1024,
				format: "xml" as const,
			};

			const fetchSpy = vi.fn(
				async (url: RequestInfo | URL, init?: RequestInit) => {
					expect((init?.method ?? "GET").toUpperCase()).toBe("GET");
					const u = new URL(typeof url === "string" ? url : url.toString());
					expect(u.origin + u.pathname).toBe(
						"https://example.com/api/v1/notices/NOTICE123/download",
					);
					return new Response(JSON.stringify(downloadResponse), {
						status: 200,
						headers: { "content-type": "application/json" },
					});
				},
			);
			vi.stubGlobal("fetch", fetchSpy);

			const res = await getNoticeDownloadUrl({
				id: "NOTICE123",
				baseUrl: "https://example.com",
			});
			expect(res.fileUrl).toBe("https://example.com/files/notice.xml");
			expect(res.format).toBe("xml");
		});
	});

	describe("submitNoticeToSat", () => {
		it("sends POST to /submit endpoint with satFolioNumber", async () => {
			const submittedNotice: Notice = {
				...mockNotice,
				status: "SUBMITTED",
				satFolioNumber: "SAT-12345",
				submittedAt: "2024-01-20T10:00:00Z",
			};

			const fetchSpy = vi.fn(
				async (url: RequestInfo | URL, init?: RequestInit) => {
					expect((init?.method ?? "POST").toUpperCase()).toBe("POST");
					const u = new URL(typeof url === "string" ? url : url.toString());
					expect(u.origin + u.pathname).toBe(
						"https://example.com/api/v1/notices/NOTICE123/submit",
					);
					const body = JSON.parse(init?.body as string);
					expect(body.satFolioNumber).toBe("SAT-12345");
					return new Response(JSON.stringify(submittedNotice), {
						status: 200,
						headers: { "content-type": "application/json" },
					});
				},
			);
			vi.stubGlobal("fetch", fetchSpy);

			const res = await submitNoticeToSat({
				id: "NOTICE123",
				satFolioNumber: "SAT-12345",
				baseUrl: "https://example.com",
			});
			expect(res.status).toBe("SUBMITTED");
			expect(res.satFolioNumber).toBe("SAT-12345");
		});

		it("omits satFolioNumber when not provided", async () => {
			const fetchSpy = vi.fn(
				async (url: RequestInfo | URL, init?: RequestInit) => {
					const body = JSON.parse(init?.body as string);
					expect(body.satFolioNumber).toBeUndefined();
					return new Response(JSON.stringify(mockNotice), {
						status: 200,
						headers: { "content-type": "application/json" },
					});
				},
			);
			vi.stubGlobal("fetch", fetchSpy);

			await submitNoticeToSat({
				id: "NOTICE123",
				baseUrl: "https://example.com",
			});
		});
	});

	describe("acknowledgeNotice", () => {
		it("sends POST to /acknowledge endpoint with satFolioNumber", async () => {
			const acknowledgedNotice: Notice = {
				...mockNotice,
				status: "ACKNOWLEDGED",
				satFolioNumber: "SAT-ACK-12345",
			};

			const fetchSpy = vi.fn(
				async (url: RequestInfo | URL, init?: RequestInit) => {
					expect((init?.method ?? "POST").toUpperCase()).toBe("POST");
					const u = new URL(typeof url === "string" ? url : url.toString());
					expect(u.origin + u.pathname).toBe(
						"https://example.com/api/v1/notices/NOTICE123/acknowledge",
					);
					const body = JSON.parse(init?.body as string);
					expect(body.satFolioNumber).toBe("SAT-ACK-12345");
					return new Response(JSON.stringify(acknowledgedNotice), {
						status: 200,
						headers: { "content-type": "application/json" },
					});
				},
			);
			vi.stubGlobal("fetch", fetchSpy);

			const res = await acknowledgeNotice({
				id: "NOTICE123",
				satFolioNumber: "SAT-ACK-12345",
				baseUrl: "https://example.com",
			});
			expect(res.status).toBe("ACKNOWLEDGED");
			expect(res.satFolioNumber).toBe("SAT-ACK-12345");
		});
	});

	describe("calculateNoticePeriod (17-17 SAT cycle)", () => {
		it("calculates period for January (month 1)", () => {
			const result = calculateNoticePeriod(2024, 1);
			// January 2024: period is Dec 17, 2023 to Jan 16, 2024
			expect(result.periodStart.getUTCFullYear()).toBe(2023);
			expect(result.periodStart.getUTCMonth()).toBe(11); // December (0-indexed)
			expect(result.periodStart.getUTCDate()).toBe(17);
			expect(result.periodEnd.getUTCFullYear()).toBe(2024);
			expect(result.periodEnd.getUTCMonth()).toBe(0); // January (0-indexed)
			expect(result.periodEnd.getUTCDate()).toBe(16);
			expect(result.reportedMonth).toBe("202401");
			expect(result.displayName).toBe("Enero 2024");
		});

		it("calculates period for February (month 2)", () => {
			const result = calculateNoticePeriod(2024, 2);
			// February 2024: period is Jan 17, 2024 to Feb 16, 2024
			expect(result.periodStart.getUTCFullYear()).toBe(2024);
			expect(result.periodStart.getUTCMonth()).toBe(0); // January (0-indexed)
			expect(result.periodStart.getUTCDate()).toBe(17);
			expect(result.periodEnd.getUTCFullYear()).toBe(2024);
			expect(result.periodEnd.getUTCMonth()).toBe(1); // February (0-indexed)
			expect(result.periodEnd.getUTCDate()).toBe(16);
			expect(result.reportedMonth).toBe("202402");
			expect(result.displayName).toBe("Febrero 2024");
		});

		it("calculates period for December (month 12)", () => {
			const result = calculateNoticePeriod(2024, 12);
			// December 2024: period is Nov 17, 2024 to Dec 16, 2024
			expect(result.periodStart.getUTCFullYear()).toBe(2024);
			expect(result.periodStart.getUTCMonth()).toBe(10); // November (0-indexed)
			expect(result.periodStart.getUTCDate()).toBe(17);
			expect(result.periodEnd.getUTCFullYear()).toBe(2024);
			expect(result.periodEnd.getUTCMonth()).toBe(11); // December (0-indexed)
			expect(result.periodEnd.getUTCDate()).toBe(16);
			expect(result.reportedMonth).toBe("202412");
			expect(result.displayName).toBe("Diciembre 2024");
		});

		it("handles end time correctly (23:59:59.999)", () => {
			const result = calculateNoticePeriod(2024, 2);
			expect(result.periodEnd.getUTCHours()).toBe(23);
			expect(result.periodEnd.getUTCMinutes()).toBe(59);
			expect(result.periodEnd.getUTCSeconds()).toBe(59);
			expect(result.periodEnd.getUTCMilliseconds()).toBe(999);
		});

		it("includes submission deadline", () => {
			// January 2024 notice: deadline is Feb 17, 2024
			const result = calculateNoticePeriod(2024, 1);
			expect(result.submissionDeadline.getUTCFullYear()).toBe(2024);
			expect(result.submissionDeadline.getUTCMonth()).toBe(1); // February
			expect(result.submissionDeadline.getUTCDate()).toBe(17);
		});

		it("handles year rollover for December deadline", () => {
			// December 2024 notice: deadline is Jan 17, 2025
			const result = calculateNoticePeriod(2024, 12);
			expect(result.submissionDeadline.getUTCFullYear()).toBe(2025);
			expect(result.submissionDeadline.getUTCMonth()).toBe(0); // January
			expect(result.submissionDeadline.getUTCDate()).toBe(17);
		});
	});

	describe("getAvailableMonths", () => {
		it("fetches available months from the API", async () => {
			const mockMonths = [
				{
					year: 2024,
					month: 12,
					displayName: "Diciembre 2024",
					hasNotice: false,
					periodStart: "2024-11-17T00:00:00Z",
					periodEnd: "2024-12-16T23:59:59Z",
				},
				{
					year: 2024,
					month: 11,
					displayName: "Noviembre 2024",
					hasNotice: true,
					periodStart: "2024-10-17T00:00:00Z",
					periodEnd: "2024-11-16T23:59:59Z",
				},
			];

			const fetchSpy = vi.fn(async () => {
				return new Response(JSON.stringify({ months: mockMonths }), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			});
			vi.stubGlobal("fetch", fetchSpy);

			const { getAvailableMonths } = await import("./notices");
			const result = await getAvailableMonths({
				baseUrl: "https://example.com",
			});

			expect(result.months).toHaveLength(2);
			expect(result.months[0].displayName).toBe("Diciembre 2024");
			expect(result.months[1].hasNotice).toBe(true);
		});
	});

	describe("getNoticeStatusColor", () => {
		it("returns correct color for DRAFT status", async () => {
			const { getNoticeStatusColor } = await import("./notices");
			expect(getNoticeStatusColor("DRAFT")).toBe("bg-gray-100 text-gray-800");
		});

		it("returns correct color for GENERATED status", async () => {
			const { getNoticeStatusColor } = await import("./notices");
			expect(getNoticeStatusColor("GENERATED")).toBe(
				"bg-blue-100 text-blue-800",
			);
		});

		it("returns correct color for SUBMITTED status", async () => {
			const { getNoticeStatusColor } = await import("./notices");
			expect(getNoticeStatusColor("SUBMITTED")).toBe(
				"bg-yellow-100 text-yellow-800",
			);
		});

		it("returns correct color for ACKNOWLEDGED status", async () => {
			const { getNoticeStatusColor } = await import("./notices");
			expect(getNoticeStatusColor("ACKNOWLEDGED")).toBe(
				"bg-green-100 text-green-800",
			);
		});
	});

	describe("getNoticeStatusLabel", () => {
		it("returns correct label for DRAFT status", async () => {
			const { getNoticeStatusLabel } = await import("./notices");
			expect(getNoticeStatusLabel("DRAFT")).toBe("Borrador");
		});

		it("returns correct label for GENERATED status", async () => {
			const { getNoticeStatusLabel } = await import("./notices");
			expect(getNoticeStatusLabel("GENERATED")).toBe("Generado");
		});

		it("returns correct label for SUBMITTED status", async () => {
			const { getNoticeStatusLabel } = await import("./notices");
			expect(getNoticeStatusLabel("SUBMITTED")).toBe("Enviado");
		});

		it("returns correct label for ACKNOWLEDGED status", async () => {
			const { getNoticeStatusLabel } = await import("./notices");
			expect(getNoticeStatusLabel("ACKNOWLEDGED")).toBe("Acusado");
		});
	});
});
