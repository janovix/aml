import { describe, expect, it, vi, afterEach } from "vitest";
import {
	createKycSession,
	getKycSession,
	listKycSessions,
} from "./kyc-sessions";

const sessionEntity = {
	id: "ks1",
	organizationId: "o1",
	clientId: "c1",
	token: "t",
	status: "ACTIVE" as const,
	expiresAt: "",
	createdBy: "u1",
	emailSentAt: null,
	startedAt: null,
	submittedAt: null,
	reviewedAt: null,
	reviewedBy: null,
	rejectionReason: null,
	editableSections: null,
	uploadLinkId: null,
	identificationTier: "ALWAYS" as const,
	thresholdAmountMxn: null,
	clientCumulativeMxn: null,
	completedSections: null,
	lastActivityAt: null,
	createdAt: "",
	updatedAt: "",
};

describe("api/kyc-sessions", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("createKycSession unwraps session from response", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.pathname).toBe("/api/v1/kyc-sessions");
				expect(init?.method?.toUpperCase()).toBe("POST");
				return new Response(JSON.stringify({ session: sessionEntity }), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			}),
		);

		const s = await createKycSession({
			baseUrl: "https://aml.example",
			input: { clientId: "c1" },
		});
		expect(s.id).toBe("ks1");
	});

	it("listKycSessions appends query params", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async (url: RequestInfo | URL) => {
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.searchParams.get("clientId")).toBe("c1");
				expect(u.searchParams.getAll("status")).toEqual(["ACTIVE", "APPROVED"]);
				expect(u.searchParams.get("page")).toBe("2");
				return new Response(
					JSON.stringify({ data: [], total: 0, page: 2, limit: 10 }),
					{
						status: 200,
						headers: { "content-type": "application/json" },
					},
				);
			}),
		);

		const res = await listKycSessions({
			baseUrl: "https://aml.example",
			clientId: "c1",
			status: ["ACTIVE", "APPROVED"],
			page: 2,
			limit: 10,
		});
		expect(res.page).toBe(2);
	});

	it("getKycSession fetches by id", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async (url: RequestInfo | URL) => {
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.pathname).toBe("/api/v1/kyc-sessions/ks1");
				return new Response(JSON.stringify({ session: sessionEntity }), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			}),
		);

		const s = await getKycSession({
			id: "ks1",
			baseUrl: "https://aml.example",
		});
		expect(s.clientId).toBe("c1");
	});
});
