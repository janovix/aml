import { describe, expect, it, vi, afterEach } from "vitest";
import {
	getClientRiskAssessment,
	getClientRiskHistory,
	getEffectiveMethodology,
	getOrgRiskAssessment,
	getOrgRiskEvolution,
	getRiskDashboard,
	getRiskEvaluationDetail,
	listRiskEvaluations,
	resetMethodologyToDefault,
	saveMethodologyOverride,
	triggerClientRiskAssessment,
	triggerOrgRiskAssessment,
	type ClientRiskAssessment,
	type OrgRiskAssessment,
} from "./risk";

describe("api/risk", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("getRiskDashboard normalizes distribution", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async (url: RequestInfo | URL) => {
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.pathname).toBe("/api/v1/risk/dashboard");
				return new Response(
					JSON.stringify({
						clientRiskDistribution: {
							distribution: {
								LOW: 1,
								MEDIUM: 2,
							},
							total: 10,
						},
						clientsPendingReview: 3,
					}),
					{
						status: 200,
						headers: { "content-type": "application/json" },
					},
				);
			}),
		);

		const dash = await getRiskDashboard({
			baseUrl: "https://aml.example",
			organizationId: "org-1",
		});
		expect(dash.organizationId).toBe("org-1");
		expect(dash.distribution.total).toBe(10);
		expect(dash.distribution.LOW).toBe(1);
		expect(dash.distribution.MEDIUM_HIGH).toBe(0);
		expect(dash.dueForReview).toBe(3);
	});

	it("getRiskDashboard defaults missing distribution to zeros", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => {
				return new Response(JSON.stringify({}), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			}),
		);

		const dash = await getRiskDashboard({ baseUrl: "https://aml.example" });
		expect(dash.distribution.total).toBe(0);
		expect(dash.distribution.LOW).toBe(0);
		expect(dash.dueForReview).toBe(0);
	});

	it("getClientRiskAssessment returns null on error", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => {
				return new Response(JSON.stringify({ message: "nope" }), {
					status: 404,
					headers: { "content-type": "application/json" },
				});
			}),
		);

		expect(
			await getClientRiskAssessment("c1", { baseUrl: "https://aml.example" }),
		).toBeNull();
	});

	it("getClientRiskAssessment returns assessment on success", async () => {
		const assessment = { id: "a1", clientId: "c1" };
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => {
				return new Response(JSON.stringify({ assessment }), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			}),
		);

		const out = await getClientRiskAssessment("c1", {
			baseUrl: "https://aml.example",
		});
		expect(out).toEqual(assessment);
	});

	it("getClientRiskHistory returns array body as-is", async () => {
		const items: ClientRiskAssessment[] = [
			{ id: "h1", clientId: "c1" } as ClientRiskAssessment,
		];
		vi.stubGlobal(
			"fetch",
			vi.fn(async (url: RequestInfo | URL) => {
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.pathname).toBe("/api/v1/risk/c1/history");
				return new Response(JSON.stringify(items), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			}),
		);

		const out = await getClientRiskHistory("c1", {
			baseUrl: "https://aml.example",
		});
		expect(out).toEqual(items);
	});

	it("getClientRiskHistory unwraps assessments object", async () => {
		const items: ClientRiskAssessment[] = [
			{ id: "h2", clientId: "c1" } as ClientRiskAssessment,
		];
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => {
				return new Response(JSON.stringify({ assessments: items }), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			}),
		);

		expect(
			await getClientRiskHistory("c1", { baseUrl: "https://aml.example" }),
		).toEqual(items);
	});

	it("getClientRiskHistory returns empty when assessments missing", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => {
				return new Response(JSON.stringify({}), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			}),
		);

		expect(
			await getClientRiskHistory("c1", { baseUrl: "https://aml.example" }),
		).toEqual([]);
	});

	it("triggerClientRiskAssessment POSTs to assessment URL", async () => {
		const fetchSpy = vi.fn(
			async (_url: RequestInfo | URL, _init?: RequestInit) => {
				return new Response(JSON.stringify({ ok: true }), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			},
		);
		vi.stubGlobal("fetch", fetchSpy);

		await triggerClientRiskAssessment("c99", {
			baseUrl: "https://aml.example",
		});

		expect(fetchSpy).toHaveBeenCalled();
		const call = fetchSpy.mock.calls[0]!;
		expect(String(call[0])).toContain("/api/v1/risk/c99/assessment");
		expect(call[1]?.method).toBe("POST");
	});

	it("getOrgRiskAssessment returns wrapped assessment", async () => {
		const assessment: OrgRiskAssessment = {
			id: "o1",
			organizationId: "org-1",
			version: 1,
			riskLevel: "LOW",
			inherentRiskScore: 1,
			residualRiskScore: 1,
			requiredAuditType: "A",
			fpRiskLevel: "LOW",
			periodStartDate: "2024-01-01",
			periodEndDate: "2024-12-31",
			elements: [],
			mitigants: [],
			createdAt: "2024-01-01",
		};
		vi.stubGlobal(
			"fetch",
			vi.fn(async (url: RequestInfo | URL) => {
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.pathname).toBe("/api/v1/risk/org-assessment");
				return new Response(JSON.stringify({ assessment }), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			}),
		);

		const out = await getOrgRiskAssessment({ baseUrl: "https://aml.example" });
		expect(out).toEqual(assessment);
	});

	it("getOrgRiskAssessment accepts legacy undecorated body", async () => {
		const assessment: OrgRiskAssessment = {
			id: "o2",
			organizationId: "org-1",
			version: 2,
			riskLevel: "MEDIUM",
			inherentRiskScore: 2,
			residualRiskScore: 2,
			requiredAuditType: "B",
			fpRiskLevel: "MEDIUM",
			periodStartDate: "2024-01-01",
			periodEndDate: "2024-12-31",
			elements: [],
			mitigants: [],
			createdAt: "2024-01-01",
		};
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => {
				return new Response(JSON.stringify(assessment), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			}),
		);

		expect(
			await getOrgRiskAssessment({ baseUrl: "https://aml.example" }),
		).toEqual(assessment);
	});

	it("getOrgRiskAssessment returns null for wrapped null", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => {
				return new Response(JSON.stringify({ assessment: null }), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			}),
		);

		expect(
			await getOrgRiskAssessment({ baseUrl: "https://aml.example" }),
		).toBeNull();
	});

	it("getOrgRiskAssessment returns null on non-assessment JSON", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => {
				return new Response(JSON.stringify({ foo: 1 }), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			}),
		);

		expect(
			await getOrgRiskAssessment({ baseUrl: "https://aml.example" }),
		).toBeNull();
	});

	it("getOrgRiskAssessment returns null on HTTP error", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => {
				return new Response(JSON.stringify({ message: "err" }), {
					status: 500,
					headers: { "content-type": "application/json" },
				});
			}),
		);

		expect(
			await getOrgRiskAssessment({ baseUrl: "https://aml.example" }),
		).toBeNull();
	});

	it("getOrgRiskEvolution returns evolution array", async () => {
		const evolution = [{ version: 1, date: "2024-01-01" }];
		vi.stubGlobal(
			"fetch",
			vi.fn(async (url: RequestInfo | URL) => {
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.pathname).toBe("/api/v1/risk/org-assessment/evolution");
				return new Response(
					JSON.stringify({ organizationId: "org-1", evolution }),
					{
						status: 200,
						headers: { "content-type": "application/json" },
					},
				);
			}),
		);

		const out = await getOrgRiskEvolution({ baseUrl: "https://aml.example" });
		expect(out).toEqual(evolution);
	});

	it("triggerOrgRiskAssessment POSTs org-assessment", async () => {
		const fetchSpy = vi.fn(
			async (_url: RequestInfo | URL, _init?: RequestInit) => {
				return new Response(JSON.stringify({ ok: true }), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			},
		);
		vi.stubGlobal("fetch", fetchSpy);

		await triggerOrgRiskAssessment({ baseUrl: "https://aml.example" });
		const call = fetchSpy.mock.calls[0]!;
		expect(String(call[0])).toContain("/api/v1/risk/org-assessment");
		expect(call[1]?.method).toBe("POST");
	});

	it("listRiskEvaluations builds query string and returns json", async () => {
		const body = {
			success: true,
			data: [],
			pagination: {
				page: 2,
				limit: 10,
				total: 0,
				totalPages: 0,
			},
			filterMeta: { riskLevels: [], triggerReasons: [] },
		};
		vi.stubGlobal(
			"fetch",
			vi.fn(async (url: RequestInfo | URL) => {
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.pathname).toBe("/api/v1/risk/evaluations");
				expect(u.searchParams.get("page")).toBe("2");
				expect(u.searchParams.get("limit")).toBe("10");
				expect(u.searchParams.get("search")).toBe("acme");
				expect(u.searchParams.get("riskLevel")).toBe("HIGH");
				expect(u.searchParams.get("triggerReason")).toBe("MANUAL");
				expect(u.searchParams.get("clientId")).toBe("c1");
				expect(u.searchParams.get("sort")).toBe("assessedAt");
				expect(u.searchParams.get("direction")).toBe("desc");
				expect(u.searchParams.getAll("status")).toEqual(["A", "B"]);
				return new Response(JSON.stringify(body), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			}),
		);

		const res = await listRiskEvaluations({
			baseUrl: "https://aml.example",
			page: 2,
			limit: 10,
			search: "acme",
			riskLevel: "HIGH",
			triggerReason: "MANUAL",
			clientId: "c1",
			sort: "assessedAt",
			direction: "desc",
			filters: { status: ["A", "B"] },
		});
		expect(res).toEqual(body);
	});

	it("getRiskEvaluationDetail returns nested data", async () => {
		const detail = { id: "e1", clientId: "c1" };
		vi.stubGlobal(
			"fetch",
			vi.fn(async (url: RequestInfo | URL) => {
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.pathname).toBe("/api/v1/risk/evaluations/e1");
				return new Response(JSON.stringify({ success: true, data: detail }), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			}),
		);

		expect(
			await getRiskEvaluationDetail("e1", { baseUrl: "https://aml.example" }),
		).toEqual(detail);
	});

	it("getEffectiveMethodology returns data", async () => {
		const methodology = {
			id: "m1",
			scope: "ORG",
			sourceScope: "DEFAULT",
			name: "Default",
			version: 1,
			scaleMax: 100,
			categories: [],
			thresholds: [],
			mitigants: [],
		};
		vi.stubGlobal(
			"fetch",
			vi.fn(async (url: RequestInfo | URL) => {
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.pathname).toBe("/api/v1/risk/methodology");
				return new Response(
					JSON.stringify({ success: true, data: methodology }),
					{
						status: 200,
						headers: { "content-type": "application/json" },
					},
				);
			}),
		);

		expect(
			await getEffectiveMethodology({ baseUrl: "https://aml.example" }),
		).toEqual(methodology);
	});

	it("saveMethodologyOverride PUTs body and returns data", async () => {
		const methodology = {
			id: "m2",
			scope: "ORG",
			sourceScope: "OVERRIDE",
			name: "Custom",
			version: 2,
			scaleMax: 100,
			categories: [],
			thresholds: [],
			mitigants: [],
		};
		const fetchSpy = vi.fn(
			async (_url: RequestInfo | URL, _init?: RequestInit) => {
				return new Response(
					JSON.stringify({ success: true, data: methodology }),
					{
						status: 200,
						headers: { "content-type": "application/json" },
					},
				);
			},
		);
		vi.stubGlobal("fetch", fetchSpy);

		const payload = {
			name: "X",
			categories: [],
			thresholds: [],
			mitigants: [],
		};
		const out = await saveMethodologyOverride(payload, {
			baseUrl: "https://aml.example",
		});
		expect(out).toEqual(methodology);
		const init = fetchSpy.mock.calls[0]![1];
		expect(init?.method).toBe("PUT");
		expect(init?.body).toBe(JSON.stringify(payload));
	});

	it("resetMethodologyToDefault POSTs reset endpoint", async () => {
		const methodology = {
			id: "m3",
			scope: "ORG",
			sourceScope: "DEFAULT",
			name: "Reset",
			version: 1,
			scaleMax: 100,
			categories: [],
			thresholds: [],
			mitigants: [],
		};
		const fetchSpy = vi.fn(
			async (url: RequestInfo | URL, init?: RequestInit) => {
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.pathname).toBe("/api/v1/risk/methodology/reset");
				return new Response(
					JSON.stringify({ success: true, data: methodology }),
					{
						status: 200,
						headers: { "content-type": "application/json" },
					},
				);
			},
		);
		vi.stubGlobal("fetch", fetchSpy);

		const out = await resetMethodologyToDefault({
			baseUrl: "https://aml.example",
		});
		expect(out).toEqual(methodology);
		expect(fetchSpy.mock.calls[0]![1]?.method).toBe("POST");
	});
});
