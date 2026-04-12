import { describe, expect, it, vi, afterEach } from "vitest";
import { getClientRiskAssessment, getRiskDashboard } from "./risk";

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
});
