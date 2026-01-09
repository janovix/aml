import { describe, expect, it, vi } from "vitest";
import {
	listReports,
	getReportById,
	previewReport,
	createReport,
	updateReport,
	deleteReport,
	generateReportFile,
	getReportDownloadUrl,
	downloadReportFile,
	calculateMonthlyPeriod,
	calculateQuarterlyPeriod,
	calculateAnnualPeriod,
	type Report,
	type ReportWithAlertSummary,
	type ReportPreviewResponse,
} from "./reports";

const mockReport: Report = {
	id: "REPORT123",
	organizationId: "ORG123",
	name: "Reporte Mensual Enero 2024",
	periodType: "MONTHLY",
	status: "DRAFT",
	periodStart: "2024-01-01T00:00:00Z",
	periodEnd: "2024-01-31T23:59:59.999Z",
	reportedMonth: "202401",
	recordCount: 10,
	pdfFileUrl: null,
	fileSize: null,
	generatedAt: null,
	createdBy: "user-123",
	notes: null,
	createdAt: "2024-01-15T10:00:00Z",
	updatedAt: "2024-01-15T10:00:00Z",
};

const mockReportWithSummary: ReportWithAlertSummary = {
	...mockReport,
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

describe("api/reports", () => {
	describe("listReports", () => {
		it("omits query params when not provided", async () => {
			const fetchSpy = vi.fn(async (url: RequestInfo | URL) => {
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.origin + u.pathname).toBe(
					"https://example.com/api/v1/reports",
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

			const res = await listReports({ baseUrl: "https://example.com" });
			expect(res.data).toEqual([]);
			expect(res.pagination.page).toBe(1);
		});

		it("listReports uses default baseUrl when not provided", async () => {
			const fetchSpy = vi.fn(async () => {
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

			await listReports();
			expect(fetchSpy).toHaveBeenCalled();
		});

		it("builds query params correctly", async () => {
			const fetchSpy = vi.fn(
				async (url: RequestInfo | URL, init?: RequestInit) => {
					expect((init?.method ?? "GET").toUpperCase()).toBe("GET");
					const u = new URL(typeof url === "string" ? url : url.toString());
					expect(u.origin + u.pathname).toBe(
						"https://example.com/api/v1/reports",
					);
					expect(u.searchParams.get("page")).toBe("2");
					expect(u.searchParams.get("limit")).toBe("20");
					expect(u.searchParams.get("periodType")).toBe("MONTHLY");
					expect(u.searchParams.get("status")).toBe("DRAFT");
					return new Response(
						JSON.stringify({
							data: [mockReport],
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

			const res = await listReports({
				baseUrl: "https://example.com",
				page: 2,
				limit: 20,
				periodType: "MONTHLY",
				status: "DRAFT",
			});
			expect(res.pagination.page).toBe(2);
			expect(res.pagination.limit).toBe(20);
			expect(res.data).toHaveLength(1);
		});

		it("only includes page when provided", async () => {
			const fetchSpy = vi.fn(async (url: RequestInfo | URL) => {
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.searchParams.get("page")).toBe("3");
				expect(u.searchParams.get("limit")).toBeNull();
				expect(u.searchParams.get("periodType")).toBeNull();
				expect(u.searchParams.get("status")).toBeNull();
				return new Response(
					JSON.stringify({
						data: [],
						pagination: { page: 3, limit: 10, total: 0, totalPages: 0 },
					}),
					{
						status: 200,
						headers: { "content-type": "application/json" },
					},
				);
			});
			vi.stubGlobal("fetch", fetchSpy);

			await listReports({
				baseUrl: "https://example.com",
				page: 3,
			});
		});

		it("only includes periodType when provided", async () => {
			const fetchSpy = vi.fn(async (url: RequestInfo | URL) => {
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.searchParams.get("periodType")).toBe("QUARTERLY");
				expect(u.searchParams.get("page")).toBeNull();
				expect(u.searchParams.get("limit")).toBeNull();
				expect(u.searchParams.get("status")).toBeNull();
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

			await listReports({
				baseUrl: "https://example.com",
				periodType: "QUARTERLY",
			});
		});

		it("only includes status when provided", async () => {
			const fetchSpy = vi.fn(async (url: RequestInfo | URL) => {
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.searchParams.get("status")).toBe("GENERATED");
				expect(u.searchParams.get("page")).toBeNull();
				expect(u.searchParams.get("limit")).toBeNull();
				expect(u.searchParams.get("periodType")).toBeNull();
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

			await listReports({
				baseUrl: "https://example.com",
				status: "GENERATED",
			});
		});
	});

	describe("getReportById", () => {
		it("requests /api/v1/reports/:id", async () => {
			const fetchSpy = vi.fn(
				async (url: RequestInfo | URL, init?: RequestInit) => {
					expect((init?.method ?? "GET").toUpperCase()).toBe("GET");
					const u = new URL(typeof url === "string" ? url : url.toString());
					expect(u.origin + u.pathname).toBe(
						"https://example.com/api/v1/reports/REPORT123",
					);
					return new Response(JSON.stringify(mockReportWithSummary), {
						status: 200,
						headers: { "content-type": "application/json" },
					});
				},
			);
			vi.stubGlobal("fetch", fetchSpy);

			const res = await getReportById({
				id: "REPORT123",
				baseUrl: "https://example.com",
			});
			expect(res.id).toBe("REPORT123");
			expect(res.alertSummary.total).toBe(10);
		});

		it("getReportById uses default baseUrl when not provided", async () => {
			const fetchSpy = vi.fn(async () => {
				return new Response(JSON.stringify(mockReportWithSummary), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			});
			vi.stubGlobal("fetch", fetchSpy);

			await getReportById({ id: "REPORT123" });
			expect(fetchSpy).toHaveBeenCalled();
		});
	});

	describe("previewReport", () => {
		it("builds preview URL with query params", async () => {
			const mockPreview: ReportPreviewResponse = {
				total: 10,
				bySeverity: { HIGH: 5, MEDIUM: 3, LOW: 2 },
				byStatus: { DETECTED: 8, SUBMITTED: 2 },
				periodStart: "2024-01-01T00:00:00Z",
				periodEnd: "2024-01-31T23:59:59.999Z",
			};

			const fetchSpy = vi.fn(
				async (url: RequestInfo | URL, init?: RequestInit) => {
					expect((init?.method ?? "GET").toUpperCase()).toBe("GET");
					const u = new URL(typeof url === "string" ? url : url.toString());
					expect(u.origin + u.pathname).toBe(
						"https://example.com/api/v1/reports/preview",
					);
					expect(u.searchParams.get("periodType")).toBe("MONTHLY");
					expect(u.searchParams.get("periodStart")).toBe(
						"2024-01-01T00:00:00Z",
					);
					expect(u.searchParams.get("periodEnd")).toBe(
						"2024-01-31T23:59:59.999Z",
					);
					return new Response(JSON.stringify(mockPreview), {
						status: 200,
						headers: { "content-type": "application/json" },
					});
				},
			);
			vi.stubGlobal("fetch", fetchSpy);

			const res = await previewReport({
				periodType: "MONTHLY",
				periodStart: "2024-01-01T00:00:00Z",
				periodEnd: "2024-01-31T23:59:59.999Z",
				baseUrl: "https://example.com",
			});
			expect(res.total).toBe(10);
			expect(res.bySeverity.HIGH).toBe(5);
		});

		it("previewReport uses default baseUrl when not provided", async () => {
			const mockPreview: ReportPreviewResponse = {
				total: 10,
				bySeverity: { HIGH: 5, MEDIUM: 3, LOW: 2 },
				byStatus: { DETECTED: 8, SUBMITTED: 2 },
				periodStart: "2024-01-01T00:00:00Z",
				periodEnd: "2024-01-31T23:59:59.999Z",
			};

			const fetchSpy = vi.fn(async () => {
				return new Response(JSON.stringify(mockPreview), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			});
			vi.stubGlobal("fetch", fetchSpy);

			await previewReport({
				periodType: "MONTHLY",
				periodStart: "2024-01-01T00:00:00Z",
				periodEnd: "2024-01-31T23:59:59.999Z",
			});
			expect(fetchSpy).toHaveBeenCalled();
		});
	});

	describe("createReport", () => {
		it("sends POST with correct body", async () => {
			const createdReport: Report = { ...mockReport, id: "REPORT456" };

			const fetchSpy = vi.fn(
				async (url: RequestInfo | URL, init?: RequestInit) => {
					expect((init?.method ?? "POST").toUpperCase()).toBe("POST");
					const u = new URL(typeof url === "string" ? url : url.toString());
					expect(u.origin + u.pathname).toBe(
						"https://example.com/api/v1/reports",
					);
					expect(init?.headers).toMatchObject({
						"content-type": "application/json",
					});
					const body = JSON.parse(init?.body as string);
					expect(body).toEqual({
						name: "Reporte Mensual Enero 2024",
						periodType: "MONTHLY",
						periodStart: "2024-01-01T00:00:00Z",
						periodEnd: "2024-01-31T23:59:59.999Z",
						reportedMonth: "202401",
						notes: null,
					});
					return new Response(JSON.stringify(createdReport), {
						status: 201,
						headers: { "content-type": "application/json" },
					});
				},
			);
			vi.stubGlobal("fetch", fetchSpy);

			const res = await createReport({
				name: "Reporte Mensual Enero 2024",
				periodType: "MONTHLY",
				periodStart: "2024-01-01T00:00:00Z",
				periodEnd: "2024-01-31T23:59:59.999Z",
				reportedMonth: "202401",
				notes: null,
				baseUrl: "https://example.com",
			});
			expect(res.id).toBe("REPORT456");
			expect(res.periodType).toBe("MONTHLY");
		});

		it("createReport uses default baseUrl when not provided", async () => {
			const createdReport: Report = { ...mockReport, id: "REPORT456" };

			const fetchSpy = vi.fn(async () => {
				return new Response(JSON.stringify(createdReport), {
					status: 201,
					headers: { "content-type": "application/json" },
				});
			});
			vi.stubGlobal("fetch", fetchSpy);

			await createReport({
				name: "Reporte Mensual Enero 2024",
				periodType: "MONTHLY",
				periodStart: "2024-01-01T00:00:00Z",
				periodEnd: "2024-01-31T23:59:59.999Z",
				reportedMonth: "202401",
				notes: null,
			});
			expect(fetchSpy).toHaveBeenCalled();
		});

		it("includes notes when provided", async () => {
			const fetchSpy = vi.fn(
				async (url: RequestInfo | URL, init?: RequestInit) => {
					const body = JSON.parse(init?.body as string);
					expect(body.notes).toBe("Test notes");
					return new Response(JSON.stringify(mockReport), {
						status: 201,
						headers: { "content-type": "application/json" },
					});
				},
			);
			vi.stubGlobal("fetch", fetchSpy);

			await createReport({
				name: "Test Report",
				periodType: "QUARTERLY",
				periodStart: "2024-01-01T00:00:00Z",
				periodEnd: "2024-03-31T23:59:59.999Z",
				reportedMonth: "2024Q1",
				notes: "Test notes",
				baseUrl: "https://example.com",
			});
		});
	});

	describe("updateReport", () => {
		it("sends PATCH with correct body", async () => {
			const updatedReport: Report = { ...mockReport, name: "Updated Name" };

			const fetchSpy = vi.fn(
				async (url: RequestInfo | URL, init?: RequestInit) => {
					expect((init?.method ?? "PATCH").toUpperCase()).toBe("PATCH");
					const u = new URL(typeof url === "string" ? url : url.toString());
					expect(u.origin + u.pathname).toBe(
						"https://example.com/api/v1/reports/REPORT123",
					);
					expect(init?.headers).toMatchObject({
						"content-type": "application/json",
					});
					const body = JSON.parse(init?.body as string);
					expect(body).toEqual({ name: "Updated Name", status: "GENERATED" });
					return new Response(JSON.stringify(updatedReport), {
						status: 200,
						headers: { "content-type": "application/json" },
					});
				},
			);
			vi.stubGlobal("fetch", fetchSpy);

			const res = await updateReport({
				id: "REPORT123",
				name: "Updated Name",
				status: "GENERATED",
				baseUrl: "https://example.com",
			});
			expect(res.name).toBe("Updated Name");
		});

		it("only includes defined fields in body", async () => {
			const fetchSpy = vi.fn(
				async (url: RequestInfo | URL, init?: RequestInit) => {
					const body = JSON.parse(init?.body as string);
					expect(body).toEqual({ name: "Updated Name" });
					expect(body).not.toHaveProperty("status");
					expect(body).not.toHaveProperty("notes");
					return new Response(JSON.stringify(mockReport), {
						status: 200,
						headers: { "content-type": "application/json" },
					});
				},
			);
			vi.stubGlobal("fetch", fetchSpy);

			await updateReport({
				id: "REPORT123",
				name: "Updated Name",
				baseUrl: "https://example.com",
			});
		});

		it("handles null values for optional fields", async () => {
			const fetchSpy = vi.fn(
				async (url: RequestInfo | URL, init?: RequestInit) => {
					const body = JSON.parse(init?.body as string);
					expect(body.notes).toBeNull();
					return new Response(JSON.stringify(mockReport), {
						status: 200,
						headers: { "content-type": "application/json" },
					});
				},
			);
			vi.stubGlobal("fetch", fetchSpy);

			await updateReport({
				id: "REPORT123",
				notes: null,
				baseUrl: "https://example.com",
			});
		});

		it("omits name when undefined", async () => {
			const fetchSpy = vi.fn(
				async (url: RequestInfo | URL, init?: RequestInit) => {
					const body = JSON.parse(init?.body as string);
					expect(body).not.toHaveProperty("name");
					expect(body.status).toBe("GENERATED");
					return new Response(JSON.stringify(mockReport), {
						status: 200,
						headers: { "content-type": "application/json" },
					});
				},
			);
			vi.stubGlobal("fetch", fetchSpy);

			await updateReport({
				id: "REPORT123",
				status: "GENERATED",
				baseUrl: "https://example.com",
			});
		});
	});

	describe("deleteReport", () => {
		it("sends DELETE request", async () => {
			const fetchSpy = vi.fn(
				async (url: RequestInfo | URL, init?: RequestInit) => {
					expect((init?.method ?? "DELETE").toUpperCase()).toBe("DELETE");
					const u = new URL(typeof url === "string" ? url : url.toString());
					expect(u.origin + u.pathname).toBe(
						"https://example.com/api/v1/reports/REPORT123",
					);
					return new Response(null, { status: 204 });
				},
			);
			vi.stubGlobal("fetch", fetchSpy);

			await deleteReport({
				id: "REPORT123",
				baseUrl: "https://example.com",
			});
		});

		it("deleteReport uses default baseUrl when not provided", async () => {
			const fetchSpy = vi.fn(async () => {
				return new Response(null, { status: 204 });
			});
			vi.stubGlobal("fetch", fetchSpy);

			await deleteReport({ id: "REPORT123" });
			expect(fetchSpy).toHaveBeenCalled();
		});
	});

	describe("generateReportFile", () => {
		it("sends POST to /generate endpoint", async () => {
			const generateResponse = {
				message: "Report generated successfully",
				reportId: "REPORT123",
				alertCount: 10,
				types: ["XML", "PDF"] as const,
			};

			const fetchSpy = vi.fn(
				async (url: RequestInfo | URL, init?: RequestInit) => {
					expect((init?.method ?? "POST").toUpperCase()).toBe("POST");
					const u = new URL(typeof url === "string" ? url : url.toString());
					expect(u.origin + u.pathname).toBe(
						"https://example.com/api/v1/reports/REPORT123/generate",
					);
					return new Response(JSON.stringify(generateResponse), {
						status: 200,
						headers: { "content-type": "application/json" },
					});
				},
			);
			vi.stubGlobal("fetch", fetchSpy);

			const res = await generateReportFile({
				id: "REPORT123",
				baseUrl: "https://example.com",
			});
			expect(res.reportId).toBe("REPORT123");
			expect(res.types).toEqual(["XML", "PDF"]);
		});

		it("generateReportFile uses default baseUrl when not provided", async () => {
			const generateResponse = {
				message: "Report generated successfully",
				reportId: "REPORT123",
				alertCount: 10,
				types: ["XML", "PDF"] as const,
			};

			const fetchSpy = vi.fn(async () => {
				return new Response(JSON.stringify(generateResponse), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			});
			vi.stubGlobal("fetch", fetchSpy);

			await generateReportFile({ id: "REPORT123" });
			expect(fetchSpy).toHaveBeenCalled();
		});
	});

	describe("getReportDownloadUrl", () => {
		it("requests download URL without format", async () => {
			const downloadResponse = {
				fileUrl: "https://example.com/files/report.xml",
				fileSize: 1024,
				format: "xml" as const,
			};

			const fetchSpy = vi.fn(
				async (url: RequestInfo | URL, init?: RequestInit) => {
					expect((init?.method ?? "GET").toUpperCase()).toBe("GET");
					const u = new URL(typeof url === "string" ? url : url.toString());
					expect(u.origin + u.pathname).toBe(
						"https://example.com/api/v1/reports/REPORT123/download",
					);
					expect(u.searchParams.get("format")).toBeNull();
					return new Response(JSON.stringify(downloadResponse), {
						status: 200,
						headers: { "content-type": "application/json" },
					});
				},
			);
			vi.stubGlobal("fetch", fetchSpy);

			const res = await getReportDownloadUrl({
				id: "REPORT123",
				baseUrl: "https://example.com",
			});
			expect(res.fileUrl).toBe("https://example.com/files/report.xml");
			expect(res.format).toBe("xml");
		});

		it("includes format query param when specified", async () => {
			const fetchSpy = vi.fn(
				async (url: RequestInfo | URL, init?: RequestInit) => {
					const u = new URL(typeof url === "string" ? url : url.toString());
					expect(u.searchParams.get("format")).toBe("pdf");
					return new Response(
						JSON.stringify({
							fileUrl: "https://example.com/files/report.pdf",
							fileSize: 2048,
							format: "pdf" as const,
						}),
						{
							status: 200,
							headers: { "content-type": "application/json" },
						},
					);
				},
			);
			vi.stubGlobal("fetch", fetchSpy);

			const res = await getReportDownloadUrl({
				id: "REPORT123",
				format: "pdf",
				baseUrl: "https://example.com",
			});
			expect(res.format).toBe("pdf");
		});

		it("getReportDownloadUrl uses default baseUrl when not provided", async () => {
			const downloadResponse = {
				fileUrl: "https://example.com/files/report.xml",
				fileSize: 1024,
				format: "xml" as const,
			};

			const fetchSpy = vi.fn(async () => {
				return new Response(JSON.stringify(downloadResponse), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			});
			vi.stubGlobal("fetch", fetchSpy);

			await getReportDownloadUrl({ id: "REPORT123" });
			expect(fetchSpy).toHaveBeenCalled();
		});
	});

	describe("downloadReportFile", () => {
		it("downloads file and triggers browser download", async () => {
			const htmlContent = "<html><body>Report</body></html>";
			const blob = new Blob([htmlContent], { type: "text/html" });

			const fetchSpy = vi.fn(async () => {
				return new Response(blob, {
					status: 200,
					headers: {
						"Content-Type": "text/html",
						"Content-Disposition": 'attachment; filename="report_2024.html"',
					},
				});
			});
			vi.stubGlobal("fetch", fetchSpy);

			// Mock DOM methods
			const mockLink = {
				href: "",
				download: "",
				click: vi.fn(),
			};
			const createElementSpy = vi
				.spyOn(document, "createElement")
				.mockReturnValue(mockLink as unknown as HTMLAnchorElement);
			const appendChildSpy = vi
				.spyOn(document.body, "appendChild")
				.mockReturnValue(mockLink as unknown as Node);
			const removeChildSpy = vi
				.spyOn(document.body, "removeChild")
				.mockReturnValue(mockLink as unknown as Node);
			const createObjectURLSpy = vi
				.spyOn(URL, "createObjectURL")
				.mockReturnValue("blob:http://localhost/test");
			const revokeObjectURLSpy = vi
				.spyOn(URL, "revokeObjectURL")
				.mockReturnValue();

			await downloadReportFile({
				id: "REPORT123",
				baseUrl: "https://example.com",
			});

			expect(fetchSpy).toHaveBeenCalled();
			expect(createElementSpy).toHaveBeenCalledWith("a");
			expect(mockLink.download).toBe("report_2024.html");
			expect(mockLink.click).toHaveBeenCalled();
			expect(appendChildSpy).toHaveBeenCalled();
			expect(removeChildSpy).toHaveBeenCalled();
			expect(createObjectURLSpy).toHaveBeenCalled();
			expect(revokeObjectURLSpy).toHaveBeenCalled();

			createElementSpy.mockRestore();
			appendChildSpy.mockRestore();
			removeChildSpy.mockRestore();
			createObjectURLSpy.mockRestore();
			revokeObjectURLSpy.mockRestore();
		});

		it("throws error on non-OK response with message", async () => {
			const fetchSpy = vi.fn(async () => {
				return new Response(JSON.stringify({ message: "Report not found" }), {
					status: 404,
					headers: { "Content-Type": "application/json" },
				});
			});
			vi.stubGlobal("fetch", fetchSpy);

			await expect(
				downloadReportFile({
					id: "REPORT123",
					baseUrl: "https://example.com",
				}),
			).rejects.toThrow("Report not found");
		});

		it("throws error with status when JSON response has no message", async () => {
			const fetchSpy = vi.fn(async () => {
				return new Response(JSON.stringify({}), {
					status: 500,
					headers: { "Content-Type": "application/json" },
				});
			});
			vi.stubGlobal("fetch", fetchSpy);

			await expect(
				downloadReportFile({
					id: "REPORT123",
					baseUrl: "https://example.com",
				}),
			).rejects.toThrow("Download failed: 500");
		});

		it("throws error with status for non-JSON error response", async () => {
			const fetchSpy = vi.fn(async () => {
				return new Response("Server Error", {
					status: 500,
					statusText: "Internal Server Error",
					headers: { "Content-Type": "text/plain" },
				});
			});
			vi.stubGlobal("fetch", fetchSpy);

			await expect(
				downloadReportFile({
					id: "REPORT123",
					baseUrl: "https://example.com",
				}),
			).rejects.toThrow("Download failed: 500 Internal Server Error");
		});

		it("uses default filename when no Content-Disposition header", async () => {
			const htmlContent = "<html><body>Report</body></html>";
			const blob = new Blob([htmlContent], { type: "text/html" });

			const fetchSpy = vi.fn(async () => {
				return new Response(blob, {
					status: 200,
					headers: { "Content-Type": "text/html" },
				});
			});
			vi.stubGlobal("fetch", fetchSpy);

			const mockLink = {
				href: "",
				download: "",
				click: vi.fn(),
			};
			const createElementSpy = vi
				.spyOn(document, "createElement")
				.mockReturnValue(mockLink as unknown as HTMLAnchorElement);
			vi.spyOn(document.body, "appendChild").mockReturnValue(
				mockLink as unknown as Node,
			);
			vi.spyOn(document.body, "removeChild").mockReturnValue(
				mockLink as unknown as Node,
			);
			vi.spyOn(URL, "createObjectURL").mockReturnValue(
				"blob:http://localhost/test",
			);
			vi.spyOn(URL, "revokeObjectURL").mockReturnValue();

			await downloadReportFile({
				id: "REPORT123",
				baseUrl: "https://example.com",
			});

			expect(mockLink.download).toBe("report_REPORT123.html");

			vi.restoreAllMocks();
		});

		it("includes JWT in authorization header when provided", async () => {
			const htmlContent = "<html><body>Report</body></html>";
			const blob = new Blob([htmlContent], { type: "text/html" });

			const fetchSpy = vi.fn(
				async (url: RequestInfo | URL, init?: RequestInit) => {
					expect(init?.headers).toHaveProperty(
						"Authorization",
						"Bearer test-token",
					);
					return new Response(blob, {
						status: 200,
						headers: { "Content-Type": "text/html" },
					});
				},
			);
			vi.stubGlobal("fetch", fetchSpy);

			const mockLink = {
				href: "",
				download: "",
				click: vi.fn(),
			};
			vi.spyOn(document, "createElement").mockReturnValue(
				mockLink as unknown as HTMLAnchorElement,
			);
			vi.spyOn(document.body, "appendChild").mockReturnValue(
				mockLink as unknown as Node,
			);
			vi.spyOn(document.body, "removeChild").mockReturnValue(
				mockLink as unknown as Node,
			);
			vi.spyOn(URL, "createObjectURL").mockReturnValue(
				"blob:http://localhost/test",
			);
			vi.spyOn(URL, "revokeObjectURL").mockReturnValue();

			await downloadReportFile({
				id: "REPORT123",
				jwt: "test-token",
				baseUrl: "https://example.com",
			});

			expect(fetchSpy).toHaveBeenCalled();
			vi.restoreAllMocks();
		});
	});

	// Note: SAT submission tests moved to notices.test.ts
	// The following functions are still in reports.ts for backwards compatibility
	// but will be deprecated. SAT-specific workflows should use the notices API.

	describe("calculateMonthlyPeriod (17-17 SAT cycle)", () => {
		it("calculates period for January (month 1)", () => {
			const result = calculateMonthlyPeriod(2024, 1);
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
			const result = calculateMonthlyPeriod(2024, 2);
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
			const result = calculateMonthlyPeriod(2024, 12);
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
			const result = calculateMonthlyPeriod(2024, 2);
			expect(result.periodEnd.getUTCHours()).toBe(23);
			expect(result.periodEnd.getUTCMinutes()).toBe(59);
			expect(result.periodEnd.getUTCSeconds()).toBe(59);
			expect(result.periodEnd.getUTCMilliseconds()).toBe(999);
		});
	});

	describe("calculateQuarterlyPeriod", () => {
		it("calculates Q1 period", () => {
			const result = calculateQuarterlyPeriod(2024, 1);
			expect(result.periodStart.getUTCFullYear()).toBe(2024);
			expect(result.periodStart.getUTCMonth()).toBe(0); // January (0-indexed)
			expect(result.periodStart.getUTCDate()).toBe(1);
			expect(result.periodEnd.getUTCFullYear()).toBe(2024);
			expect(result.periodEnd.getUTCMonth()).toBe(2); // March (0-indexed)
			expect(result.periodEnd.getUTCDate()).toBe(31); // Last day of March
			expect(result.reportedMonth).toBe("2024Q1");
			expect(result.displayName).toBe("Q1 2024");
		});

		it("calculates Q2 period", () => {
			const result = calculateQuarterlyPeriod(2024, 2);
			expect(result.periodStart.getUTCFullYear()).toBe(2024);
			expect(result.periodStart.getUTCMonth()).toBe(3); // April (0-indexed)
			expect(result.periodStart.getUTCDate()).toBe(1);
			expect(result.periodEnd.getUTCFullYear()).toBe(2024);
			expect(result.periodEnd.getUTCMonth()).toBe(5); // June (0-indexed)
			expect(result.periodEnd.getUTCDate()).toBe(30); // Last day of June
			expect(result.reportedMonth).toBe("2024Q2");
			expect(result.displayName).toBe("Q2 2024");
		});

		it("calculates Q3 period", () => {
			const result = calculateQuarterlyPeriod(2024, 3);
			expect(result.periodStart.getUTCFullYear()).toBe(2024);
			expect(result.periodStart.getUTCMonth()).toBe(6); // July (0-indexed)
			expect(result.periodStart.getUTCDate()).toBe(1);
			expect(result.periodEnd.getUTCFullYear()).toBe(2024);
			expect(result.periodEnd.getUTCMonth()).toBe(8); // September (0-indexed)
			expect(result.periodEnd.getUTCDate()).toBe(30); // Last day of September
			expect(result.reportedMonth).toBe("2024Q3");
			expect(result.displayName).toBe("Q3 2024");
		});

		it("calculates Q4 period", () => {
			const result = calculateQuarterlyPeriod(2024, 4);
			expect(result.periodStart.getUTCFullYear()).toBe(2024);
			expect(result.periodStart.getUTCMonth()).toBe(9); // October (0-indexed)
			expect(result.periodStart.getUTCDate()).toBe(1);
			expect(result.periodEnd.getUTCFullYear()).toBe(2024);
			expect(result.periodEnd.getUTCMonth()).toBe(11); // December (0-indexed)
			expect(result.periodEnd.getUTCDate()).toBe(31); // Last day of December
			expect(result.reportedMonth).toBe("2024Q4");
			expect(result.displayName).toBe("Q4 2024");
		});
	});

	describe("calculateAnnualPeriod", () => {
		it("calculates annual period", () => {
			const result = calculateAnnualPeriod(2024);
			expect(result.periodStart.getUTCFullYear()).toBe(2024);
			expect(result.periodStart.getUTCMonth()).toBe(0); // January (0-indexed)
			expect(result.periodStart.getUTCDate()).toBe(1);
			expect(result.periodEnd.getUTCFullYear()).toBe(2024);
			expect(result.periodEnd.getUTCMonth()).toBe(11); // December (0-indexed)
			expect(result.periodEnd.getUTCDate()).toBe(31);
			expect(result.reportedMonth).toBe("2024");
			expect(result.displayName).toBe("Anual 2024");
		});

		it("handles end time correctly (23:59:59.999)", () => {
			const result = calculateAnnualPeriod(2024);
			expect(result.periodEnd.getUTCHours()).toBe(23);
			expect(result.periodEnd.getUTCMinutes()).toBe(59);
			expect(result.periodEnd.getUTCSeconds()).toBe(59);
			expect(result.periodEnd.getUTCMilliseconds()).toBe(999);
		});
	});
});
