/**
 * Additional Janbot tools (AML core + watchlist proxy) with structured outputs.
 */

import { z } from "zod";
import { getAmlCoreBaseUrl } from "@/lib/api/config";

async function amlFetch<T>(
	jwt: string,
	path: string,
	init?: RequestInit,
): Promise<T> {
	const base = getAmlCoreBaseUrl().replace(/\/$/, "");
	const p = path.startsWith("/") ? path : `/${path}`;
	const res = await fetch(`${base}${p}`, {
		...init,
		headers: {
			Authorization: `Bearer ${jwt}`,
			Accept: "application/json",
			...(init?.headers ?? {}),
		},
	});
	if (!res.ok) {
		const t = await res.text();
		throw new Error(`AML API ${res.status}: ${t}`);
	}
	return res.json() as Promise<T>;
}

const clientIdSchema = z.object({
	clientId: z.string().describe("Client UUID"),
});

const rfcSchema = z.object({
	rfc: z.string().min(10).max(13).describe("Mexican RFC to check"),
});

const accumulatedSchema = z.object({
	clientId: z.string(),
	activityCode: z.string().optional(),
	startDate: z.string().optional().describe("YYYY-MM-DD"),
	endDate: z.string().optional().describe("YYYY-MM-DD"),
});

const riskEvalSchema = z.object({
	limit: z.number().min(1).max(50).optional(),
	offset: z.number().min(0).optional(),
	clientId: z.string().optional(),
});

const kycListSchema = z.object({
	status: z.string().optional(),
	limit: z.number().min(1).max(50).optional(),
});

const kycIdSchema = z.object({
	sessionId: z.string().describe("KYC session id"),
});

const watchlistScreenSchema = z.object({
	q: z.string().min(1).max(500),
	entityType: z.enum(["person", "organization"]).optional(),
	birthDate: z.string().optional(),
});

const cancelAlertSchema = z.object({
	alertId: z.string().describe("Alert id to cancel"),
	reason: z.string().min(3).max(500).describe("Cancellation reason for audit"),
});

export function createExtendedJanbotTools(jwt: string) {
	return {
		getRiskDashboardSummary: {
			description:
				"Fetch the organization risk dashboard (counts, heatmaps metadata, queue health).",
			inputSchema: z.object({}),
			execute: async () => {
				const data = await amlFetch<unknown>(jwt, "/api/v1/risk/dashboard", {
					method: "GET",
				});
				return {
					kind: "janbot.api" as const,
					title: "Risk dashboard",
					endpoint: "GET /api/v1/risk/dashboard",
					data,
				};
			},
		},

		getClientRiskAssessmentForJanbot: {
			description: "Get the latest stored risk assessment for a client.",
			inputSchema: clientIdSchema,
			execute: async ({ clientId }: z.infer<typeof clientIdSchema>) => {
				const data = await amlFetch<unknown>(
					jwt,
					`/api/v1/risk/${encodeURIComponent(clientId)}/assessment`,
					{ method: "GET" },
				);
				return {
					kind: "janbot.api" as const,
					title: "Client risk assessment",
					endpoint: "GET /api/v1/risk/:clientId/assessment",
					data,
				};
			},
		},

		listRiskEvaluationsForJanbot: {
			description: "Paginated list of client risk evaluations for the org.",
			inputSchema: riskEvalSchema,
			execute: async (q: z.infer<typeof riskEvalSchema>) => {
				const sp = new URLSearchParams();
				if (q.limit != null) sp.set("limit", String(q.limit));
				if (q.offset != null) sp.set("offset", String(q.offset));
				if (q.clientId) sp.set("clientId", q.clientId);
				const qs = sp.toString();
				const path = `/api/v1/risk/evaluations${qs ? `?${qs}` : ""}`;
				const data = await amlFetch<unknown>(jwt, path, { method: "GET" });
				return {
					kind: "janbot.api" as const,
					title: "Risk evaluations",
					endpoint: path,
					data,
				};
			},
		},

		getOperationsAccumulatedForJanbot: {
			description:
				"Six-month / period accumulated operation amounts for Art. 17 style reviews.",
			inputSchema: accumulatedSchema,
			execute: async (q: z.infer<typeof accumulatedSchema>) => {
				const sp = new URLSearchParams();
				if (q.activityCode) sp.set("activityCode", q.activityCode);
				if (q.startDate) sp.set("startDate", q.startDate);
				if (q.endDate) sp.set("endDate", q.endDate);
				const qs = sp.toString();
				const path = `/api/v1/operations/client/${encodeURIComponent(q.clientId)}/accumulated${qs ? `?${qs}` : ""}`;
				const data = await amlFetch<unknown>(jwt, path, { method: "GET" });
				return {
					kind: "janbot.api" as const,
					title: "Accumulated operations",
					endpoint: path,
					data,
				};
			},
		},

		checkClientRfcForJanbot: {
			description:
				"Check whether an RFC already exists for a client in the org.",
			inputSchema: rfcSchema,
			execute: async ({ rfc }: z.infer<typeof rfcSchema>) => {
				const data = await amlFetch<unknown>(
					jwt,
					`/api/v1/clients/check-rfc/${encodeURIComponent(rfc)}`,
					{ method: "GET" },
				);
				return {
					kind: "janbot.api" as const,
					title: "RFC check",
					endpoint: "GET /api/v1/clients/check-rfc/:rfc",
					data,
				};
			},
		},

		listKycSessionsForJanbot: {
			description: "List KYC self-service sessions for the organization.",
			inputSchema: kycListSchema,
			execute: async (q: z.infer<typeof kycListSchema>) => {
				const sp = new URLSearchParams();
				if (q.status) sp.set("status", q.status);
				if (q.limit != null) sp.set("limit", String(q.limit));
				const qs = sp.toString();
				const path = `/api/v1/kyc-sessions${qs ? `?${qs}` : ""}`;
				const data = await amlFetch<unknown>(jwt, path, { method: "GET" });
				return {
					kind: "janbot.api" as const,
					title: "KYC sessions",
					endpoint: path,
					data,
				};
			},
		},

		getKycSessionForJanbot: {
			description: "Get a single KYC session record.",
			inputSchema: kycIdSchema,
			execute: async ({ sessionId }: z.infer<typeof kycIdSchema>) => {
				const data = await amlFetch<unknown>(
					jwt,
					`/api/v1/kyc-sessions/${encodeURIComponent(sessionId)}`,
					{ method: "GET" },
				);
				return {
					kind: "janbot.api" as const,
					title: "KYC session",
					endpoint: "GET /api/v1/kyc-sessions/:id",
					data,
				};
			},
		},

		getKycSessionEventsForJanbot: {
			description: "Audit trail / events for a KYC session.",
			inputSchema: kycIdSchema,
			execute: async ({ sessionId }: z.infer<typeof kycIdSchema>) => {
				const data = await amlFetch<unknown>(
					jwt,
					`/api/v1/kyc-sessions/${encodeURIComponent(sessionId)}/events`,
					{ method: "GET" },
				);
				return {
					kind: "janbot.api" as const,
					title: "KYC session events",
					endpoint: "GET /api/v1/kyc-sessions/:id/events",
					data,
				};
			},
		},

		getOrganizationSettingsForJanbot: {
			description:
				"Read organization AML settings (SAT keys, self-service mode, etc.).",
			inputSchema: z.object({}),
			execute: async () => {
				const data = await amlFetch<unknown>(
					jwt,
					"/api/v1/organization-settings",
					{
						method: "GET",
					},
				);
				return {
					kind: "janbot.api" as const,
					title: "Organization settings",
					endpoint: "GET /api/v1/organization-settings",
					data,
				};
			},
		},

		screenWatchlistEntity: {
			description:
				"Run a full watchlist screen (OFAC/UNSC/SAT69-B + async PEP/adverse). Persists a SearchQuery and consumes watchlist quota — requires user approval.",
			inputSchema: watchlistScreenSchema,
			needsApproval: true,
			execute: async (input: z.infer<typeof watchlistScreenSchema>) => {
				const data = await amlFetch<{
					kind: string;
					queryId: string;
					ofacCount: number;
					unscCount: number;
					sat69bCount: number;
				}>(jwt, "/api/v1/janbot/watchlist/search", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						q: input.q,
						entityType: input.entityType ?? "person",
						birthDate: input.birthDate,
					}),
				});
				return {
					kind: "janbot.watchlist.screen" as const,
					queryId: data.queryId,
					ofacCount: data.ofacCount,
					unscCount: data.unscCount,
					sat69bCount: data.sat69bCount,
				};
			},
		},

		requestCancelAlertForJanbot: {
			description:
				"Cancel an AML alert (sets status to CANCELLED). High impact — requires explicit user approval.",
			inputSchema: cancelAlertSchema,
			needsApproval: true,
			execute: async (input: z.infer<typeof cancelAlertSchema>) => {
				const data = await amlFetch<unknown>(
					jwt,
					`/api/v1/alerts/${encodeURIComponent(input.alertId)}/cancel`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ reason: input.reason }),
					},
				);
				return {
					kind: "janbot.api" as const,
					title: "Alert cancelled",
					endpoint: "POST /api/v1/alerts/:id/cancel",
					data,
				};
			},
		},
	};
}

export type ExtendedJanbotTools = ReturnType<typeof createExtendedJanbotTools>;

const EXT_JWT_PLACEHOLDER = "extended-tool-inventory-placeholder";

export function getExtendedToolInventoryMarkdown(): string {
	const tools = createExtendedJanbotTools(EXT_JWT_PLACEHOLDER);
	const lines: string[] = [];
	for (const [name, def] of Object.entries(tools)) {
		const description =
			def && typeof (def as { description?: string }).description === "string"
				? (def as { description: string }).description
				: "";
		const hitl =
			def &&
			"needsApproval" in def &&
			(def as { needsApproval?: boolean }).needsApproval
				? " *(requires user approval)*"
				: "";
		lines.push(`- **${name}**: ${description}${hitl}`);
	}
	return ["### Extended AML & watchlist tools", "", lines.join("\n\n")].join(
		"\n",
	);
}
