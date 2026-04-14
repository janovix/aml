import { describe, expect, it, vi, afterEach } from "vitest";
import {
	approveKycSession,
	createKycSession,
	getKycSession,
	getKycSessionEvents,
	listKycSessions,
	rejectKycSession,
	resendKycEmail,
	revokeKycSession,
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

	it("getKycSessionEvents GETs /events", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async (url: RequestInfo | URL) => {
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.pathname).toBe("/api/v1/kyc-sessions/ks1/events");
				return new Response(JSON.stringify({ events: [] }), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			}),
		);

		const ev = await getKycSessionEvents({
			id: "ks1",
			baseUrl: "https://aml.example",
		});
		expect(ev).toEqual([]);
	});

	it("resendKycEmail POSTs resend-email", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.pathname).toBe("/api/v1/kyc-sessions/ks1/resend-email");
				expect(init?.method?.toUpperCase()).toBe("POST");
				return new Response(JSON.stringify({ ok: true }), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			}),
		);

		await resendKycEmail({ id: "ks1", baseUrl: "https://aml.example" });
	});

	it("approveKycSession POSTs approve", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.pathname).toBe("/api/v1/kyc-sessions/ks1/approve");
				expect(init?.method?.toUpperCase()).toBe("POST");
				return new Response(JSON.stringify({ session: sessionEntity }), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			}),
		);

		const s = await approveKycSession({
			id: "ks1",
			baseUrl: "https://aml.example",
		});
		expect(s.id).toBe("ks1");
	});

	it("rejectKycSession POSTs body", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
				expect(JSON.parse(String(init?.body))).toEqual({
					reason: "bad",
					reopenForCorrections: true,
				});
				return new Response(JSON.stringify({ session: sessionEntity }), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			}),
		);

		const s = await rejectKycSession({
			id: "ks1",
			baseUrl: "https://aml.example",
			input: { reason: "bad", reopenForCorrections: true },
		});
		expect(s.id).toBe("ks1");
	});

	it("revokeKycSession POSTs revoke", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
				const u = new URL(typeof url === "string" ? url : url.toString());
				expect(u.pathname).toBe("/api/v1/kyc-sessions/ks1/revoke");
				expect(init?.method?.toUpperCase()).toBe("POST");
				return new Response(JSON.stringify({ ok: true }), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			}),
		);

		await revokeKycSession({ id: "ks1", baseUrl: "https://aml.example" });
	});
});
