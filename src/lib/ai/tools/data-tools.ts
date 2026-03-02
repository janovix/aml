/**
 * AI Data Tools
 *
 * Tools that allow the AI to query real data from the aml-svc API.
 * These tools make authenticated requests on behalf of the user.
 */

import { z } from "zod";
import { getAmlCoreBaseUrl } from "@/lib/api/config";

async function fetchWithAuth<T>(
	endpoint: string,
	jwt: string,
	params?: Record<string, string>,
): Promise<T> {
	const baseUrl = getAmlCoreBaseUrl();
	const url = new URL(endpoint, baseUrl);

	if (params) {
		Object.entries(params).forEach(([key, value]) => {
			if (value !== undefined && value !== "") {
				url.searchParams.set(key, value);
			}
		});
	}

	const response = await fetch(url.toString(), {
		method: "GET",
		headers: {
			Authorization: `Bearer ${jwt}`,
			Accept: "application/json",
		},
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`API error ${response.status}: ${error}`);
	}

	return response.json();
}

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const emptySchema = z.object({});

const idSchema = z.object({
	id: z.string().describe("The unique ID of the record"),
});

const listClientsSchema = z.object({
	search: z.string().optional().describe("Search by name, RFC, or email"),
	personType: z
		.enum(["PHYSICAL", "MORAL", "TRUST"])
		.optional()
		.describe("Filter by person type"),
	limit: z
		.number()
		.min(1)
		.max(50)
		.default(10)
		.describe("Number of results to return (max 50)"),
	page: z.number().min(1).default(1).describe("Page number"),
});

const listOperationsSchema = z.object({
	clientId: z.string().optional().describe("Filter by client ID"),
	activityCode: z
		.string()
		.optional()
		.describe(
			"Filter by activity code (e.g. VEH, INM, MJR, JYS, ARI, BLI, etc.)",
		),
	startDate: z.string().optional().describe("Start date filter (YYYY-MM-DD)"),
	endDate: z.string().optional().describe("End date filter (YYYY-MM-DD)"),
	limit: z
		.number()
		.min(1)
		.max(50)
		.default(10)
		.describe("Number of results to return (max 50)"),
	page: z.number().min(1).default(1).describe("Page number"),
});

const listAlertsSchema = z.object({
	status: z
		.enum(["DETECTED", "FILE_GENERATED", "SUBMITTED", "CANCELLED", "OVERDUE"])
		.optional()
		.describe("Filter by alert status"),
	severity: z
		.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
		.optional()
		.describe("Filter by severity level"),
	clientId: z.string().optional().describe("Filter alerts by client ID"),
	limit: z
		.number()
		.min(1)
		.max(50)
		.default(10)
		.describe("Number of results to return (max 50)"),
	page: z.number().min(1).default(1).describe("Page number"),
});

const listInvoicesSchema = z.object({
	issuerRfc: z.string().optional().describe("Filter by issuer RFC"),
	receiverRfc: z.string().optional().describe("Filter by receiver RFC"),
	voucherTypeCode: z
		.string()
		.optional()
		.describe(
			"Voucher type: I=ingreso, E=egreso, T=traslado, N=nómina, P=pago",
		),
	startDate: z
		.string()
		.optional()
		.describe("Invoices issued on or after (YYYY-MM-DD)"),
	endDate: z
		.string()
		.optional()
		.describe("Invoices issued on or before (YYYY-MM-DD)"),
	limit: z
		.number()
		.min(1)
		.max(50)
		.default(10)
		.describe("Number of results to return (max 50)"),
	page: z.number().min(1).default(1).describe("Page number"),
});

const listReportsSchema = z.object({
	type: z
		.enum(["MONTHLY", "QUARTERLY", "ANNUAL", "CUSTOM"])
		.optional()
		.describe("Filter by report type"),
	status: z
		.enum(["DRAFT", "GENERATED", "SUBMITTED", "REJECTED"])
		.optional()
		.describe("Filter by report status"),
	limit: z
		.number()
		.min(1)
		.max(50)
		.default(10)
		.describe("Number of results to return (max 50)"),
	page: z.number().min(1).default(1).describe("Page number"),
});

const listNoticesSchema = z.object({
	status: z
		.enum(["DRAFT", "GENERATED", "SUBMITTED", "ACKNOWLEDGED"])
		.optional()
		.describe("Filter by notice status"),
	year: z.number().optional().describe("Filter by year"),
	limit: z
		.number()
		.min(1)
		.max(50)
		.default(10)
		.describe("Number of results to return (max 50)"),
	page: z.number().min(1).default(1).describe("Page number"),
});

const listAlertRulesSchema = z.object({
	active: z.boolean().optional().describe("Filter by active status"),
	severity: z
		.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
		.optional()
		.describe("Filter by severity"),
	search: z.string().optional().describe("Search by name or description"),
	limit: z
		.number()
		.min(1)
		.max(50)
		.default(20)
		.describe("Number of results (max 50)"),
	page: z.number().min(1).default(1).describe("Page number"),
});

const periodSchema = z.object({
	periodStart: z
		.string()
		.describe("Period start ISO date-time (e.g. 2026-01-01T00:00:00Z)"),
	periodEnd: z
		.string()
		.describe("Period end ISO date-time (e.g. 2026-01-31T23:59:59Z)"),
	clientId: z.string().optional().describe("Optional: filter by client ID"),
});

const exchangeRateSchema = z.object({
	from: z
		.string()
		.default("USD")
		.describe("Source currency ISO code (e.g. USD)"),
	to: z.string().default("MXN").describe("Target currency ISO code (e.g. MXN)"),
});

const noticePreviewSchema = z.object({
	year: z.number().describe("Year (e.g. 2026)"),
	month: z.number().min(1).max(12).describe("Month (1-12)"),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtMoney(v: string | number): string {
	const n = typeof v === "string" ? parseFloat(v) : v;
	if (isNaN(n)) return "$0";
	return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function wrap(label: string, fn: () => Promise<string>) {
	return async () => {
		try {
			return await fn();
		} catch (error) {
			console.error(`[AI Tool] ${label} error:`, error);
			const msg =
				error instanceof Error ? error.message : `Failed to fetch ${label}`;
			return `Error: ${msg}`;
		}
	};
}

function wrapWithArgs<T>(label: string, fn: (args: T) => Promise<string>) {
	return async (args: T) => {
		try {
			return await fn(args);
		} catch (error) {
			console.error(`[AI Tool] ${label} error:`, error);
			const msg =
				error instanceof Error ? error.message : `Failed to fetch ${label}`;
			return `Error: ${msg}`;
		}
	};
}

// ---------------------------------------------------------------------------
// Tool factory
// ---------------------------------------------------------------------------

export function createDataTools(jwt: string) {
	return {
		// ===================================================================
		// STATS
		// ===================================================================

		getClientStats: {
			description:
				"Get aggregate client statistics: total count and breakdown by person type (physical, moral, trust)",
			inputSchema: emptySchema,
			execute: wrap("getClientStats", async () => {
				const s = await fetchWithAuth<{
					totalClients: number;
					physicalClients: number;
					moralClients: number;
					trustClients: number;
				}>("/api/v1/clients/stats", jwt);
				return `Total clients: ${s.totalClients} (${s.physicalClients} physical, ${s.moralClients} moral/companies, ${s.trustClients} trusts)`;
			}),
		},

		getOperationStats: {
			description:
				"Get aggregate operation statistics: transactions today, active alerts, total volume, total vehicles",
			inputSchema: emptySchema,
			execute: wrap("getOperationStats", async () => {
				const s = await fetchWithAuth<{
					transactionsToday: number;
					suspiciousTransactions: number;
					totalVolume: string;
					totalVehicles: number;
				}>("/api/v1/operations/stats", jwt);
				return `Transactions today: ${s.transactionsToday}, Active alerts: ${s.suspiciousTransactions}, Total volume: ${fmtMoney(s.totalVolume)} MXN, Total vehicles: ${s.totalVehicles}`;
			}),
		},

		getInvoiceStats: {
			description:
				"Get CFDI invoice statistics: total count and breakdown by voucher type (ingreso/egreso)",
			inputSchema: emptySchema,
			execute: wrap("getInvoiceStats", async () => {
				const s = await fetchWithAuth<{
					totalInvoices: number;
					ingresoInvoices: number;
					egresoInvoices: number;
				}>("/api/v1/invoices/stats", jwt);
				return `Total invoices: ${s.totalInvoices} (${s.ingresoInvoices} ingreso/income, ${s.egresoInvoices} egreso/expense)`;
			}),
		},

		// ===================================================================
		// DETAIL LOOKUPS
		// ===================================================================

		getClientById: {
			description:
				"Get full details of a specific client by ID: personal/business info, RFC, CURP, address, email, phone, notes",
			inputSchema: idSchema,
			execute: wrapWithArgs(
				"getClientById",
				async ({ id }: z.infer<typeof idSchema>) => {
					const c = await fetchWithAuth<{
						id: string;
						personType: string;
						firstName?: string;
						lastName?: string;
						secondLastName?: string;
						businessName?: string;
						rfc: string;
						curp?: string;
						email?: string;
						phone?: string;
						nationality?: string;
						street?: string;
						externalNumber?: string;
						postalCode?: string;
						city?: string;
						stateCode?: string;
						notes?: string;
						createdAt: string;
					}>(`/api/v1/clients/${id}`, jwt);
					const name =
						c.personType === "MORAL"
							? c.businessName
							: [c.firstName, c.lastName, c.secondLastName]
									.filter(Boolean)
									.join(" ");
					const addr = [
						c.street,
						c.externalNumber,
						c.postalCode,
						c.city,
						c.stateCode,
					]
						.filter(Boolean)
						.join(", ");
					return [
						`**${name}** (${c.personType})`,
						`RFC: ${c.rfc}${c.curp ? ` | CURP: ${c.curp}` : ""}`,
						c.email ? `Email: ${c.email}` : null,
						c.phone ? `Phone: ${c.phone}` : null,
						addr ? `Address: ${addr}` : null,
						c.nationality ? `Nationality: ${c.nationality}` : null,
						c.notes ? `Notes: ${c.notes}` : null,
						`Created: ${c.createdAt}`,
					]
						.filter(Boolean)
						.join("\n");
				},
			),
		},

		getClientKycStatus: {
			description:
				"Check KYC compliance status of a client: overall status, completeness, missing fields, completion date",
			inputSchema: idSchema,
			execute: wrapWithArgs(
				"getClientKycStatus",
				async ({ id }: z.infer<typeof idSchema>) => {
					const k = await fetchWithAuth<{
						kycStatus: string;
						completenessStatus: string;
						missingFields: string[];
						kycCompletedAt: string | null;
					}>(`/api/v1/clients/${id}/kyc-status`, jwt);
					const missing =
						k.missingFields.length > 0
							? `Missing fields: ${k.missingFields.join(", ")}`
							: "No missing fields";
					return `KYC Status: ${k.kycStatus} | Completeness: ${k.completenessStatus}\n${missing}${k.kycCompletedAt ? `\nCompleted at: ${k.kycCompletedAt}` : ""}`;
				},
			),
		},

		getOperationById: {
			description:
				"Get full details of a specific operation/transaction by ID: amount, date, activity code, payments, vehicle info",
			inputSchema: idSchema,
			execute: wrapWithArgs(
				"getOperationById",
				async ({ id }: z.infer<typeof idSchema>) => {
					const o = await fetchWithAuth<{
						id: string;
						clientId: string;
						operationDate: string;
						activityCode?: string;
						amount: string;
						currencyCode?: string;
						branchPostalCode?: string;
						brand?: string;
						model?: string;
						year?: number;
						vehicleType?: string;
						plates?: string;
						engineNumber?: string;
						createdAt: string;
					}>(`/api/v1/operations/${id}`, jwt);
					const vehicle =
						o.brand || o.model
							? `Vehicle: ${o.year ?? ""} ${o.brand ?? ""} ${o.model ?? ""} (${o.vehicleType ?? "N/A"})${o.plates ? `, Plates: ${o.plates}` : ""}${o.engineNumber ? `, Engine: ${o.engineNumber}` : ""}`
							: null;
					return [
						`Operation ${o.id} — ${o.activityCode ?? "N/A"}`,
						`Date: ${o.operationDate} | Amount: ${fmtMoney(o.amount)} ${o.currencyCode ?? "MXN"}`,
						`Client ID: ${o.clientId}`,
						o.branchPostalCode
							? `Branch Postal Code: ${o.branchPostalCode}`
							: null,
						vehicle,
						`Created: ${o.createdAt}`,
					]
						.filter(Boolean)
						.join("\n");
				},
			),
		},

		getAlertById: {
			description:
				"Get full details of an alert by ID: status, severity, rule, client, deadline, notes, SAT info",
			inputSchema: idSchema,
			execute: wrapWithArgs(
				"getAlertById",
				async ({ id }: z.infer<typeof idSchema>) => {
					const a = await fetchWithAuth<{
						id: string;
						alertRuleId: string;
						clientId: string;
						status: string;
						severity: string;
						isManual: boolean;
						isOverdue: boolean;
						submissionDeadline?: string;
						notes?: string;
						transactionId?: string;
						fileGeneratedAt?: string;
						submittedAt?: string;
						satAcknowledgmentReceipt?: string;
						satFolioNumber?: string;
						cancelledAt?: string;
						cancellationReason?: string;
						createdAt: string;
						alertRule?: { id: string; name: string; description?: string };
					}>(`/api/v1/alerts/${id}`, jwt);
					return [
						`Alert ${a.id} — ${a.severity} / ${a.status}${a.isOverdue ? " ⚠️ OVERDUE" : ""}${a.isManual ? " (manual)" : ""}`,
						a.alertRule
							? `Rule: ${a.alertRule.name} (${a.alertRuleId})${a.alertRule.description ? ` — ${a.alertRule.description}` : ""}`
							: `Rule ID: ${a.alertRuleId}`,
						`Client ID: ${a.clientId}${a.transactionId ? ` | Transaction: ${a.transactionId}` : ""}`,
						a.submissionDeadline ? `Deadline: ${a.submissionDeadline}` : null,
						a.notes ? `Notes: ${a.notes}` : null,
						a.fileGeneratedAt ? `File generated: ${a.fileGeneratedAt}` : null,
						a.submittedAt ? `Submitted: ${a.submittedAt}` : null,
						a.satAcknowledgmentReceipt
							? `SAT Receipt: ${a.satAcknowledgmentReceipt}`
							: null,
						a.satFolioNumber ? `SAT Folio: ${a.satFolioNumber}` : null,
						a.cancelledAt
							? `Cancelled: ${a.cancelledAt} — ${a.cancellationReason ?? ""}`
							: null,
						`Created: ${a.createdAt}`,
					]
						.filter(Boolean)
						.join("\n");
				},
			),
		},

		getNoticeById: {
			description:
				"Get details of a SAT notice (Aviso) by ID: status, period, record count, XML file, submission info",
			inputSchema: idSchema,
			execute: wrapWithArgs(
				"getNoticeById",
				async ({ id }: z.infer<typeof idSchema>) => {
					const n = await fetchWithAuth<{
						id: string;
						name: string;
						status: string;
						periodStart: string;
						periodEnd: string;
						reportedMonth: string;
						recordCount: number;
						xmlFileUrl?: string;
						generatedAt?: string;
						submittedAt?: string;
						amendmentCycle: number;
						notes?: string;
						createdAt: string;
					}>(`/api/v1/notices/${id}`, jwt);
					return [
						`Notice: ${n.name} — ${n.status}`,
						`Period: ${n.periodStart} to ${n.periodEnd} (reported month: ${n.reportedMonth})`,
						`Records: ${n.recordCount} | Amendment cycle: ${n.amendmentCycle}`,
						n.generatedAt ? `XML generated: ${n.generatedAt}` : null,
						n.xmlFileUrl
							? `XML file: available`
							: "XML file: not yet generated",
						n.submittedAt ? `Submitted to SAT: ${n.submittedAt}` : null,
						n.notes ? `Notes: ${n.notes}` : null,
						`Created: ${n.createdAt}`,
					]
						.filter(Boolean)
						.join("\n");
				},
			),
		},

		// ===================================================================
		// LIST TOOLS
		// ===================================================================

		listClients: {
			description:
				"List clients with optional filters. Returns paginated results with name, RFC, type.",
			inputSchema: listClientsSchema,
			execute: wrapWithArgs(
				"listClients",
				async ({
					search,
					personType,
					limit = 10,
					page = 1,
				}: z.infer<typeof listClientsSchema>) => {
					const params: Record<string, string> = {
						limit: String(limit),
						page: String(page),
					};
					if (search) params.search = search;
					if (personType) params.personType = personType;
					const r = await fetchWithAuth<{
						data: Array<{
							id: string;
							rfc: string;
							personType: string;
							firstName?: string;
							lastName?: string;
							businessName?: string;
							email: string;
						}>;
						pagination: {
							total: number;
							page: number;
							limit: number;
							totalPages: number;
						};
					}>("/api/v1/clients", jwt, params);
					if (r.data.length === 0)
						return "No clients found matching the criteria.";
					const list = r.data
						.map((c) => {
							const name =
								c.personType === "MORAL"
									? c.businessName
									: `${c.firstName || ""} ${c.lastName || ""}`.trim();
							return `- ${name} (RFC: ${c.rfc}, Type: ${c.personType}, ID: ${c.id})`;
						})
						.join("\n");
					return `Found ${r.pagination.total} clients (page ${r.pagination.page}/${r.pagination.totalPages}):\n${list}`;
				},
			),
		},

		listOperations: {
			description:
				"List operations/transactions with optional filters by client, activity, date range.",
			inputSchema: listOperationsSchema,
			execute: wrapWithArgs(
				"listOperations",
				async ({
					clientId,
					activityCode,
					startDate,
					endDate,
					limit = 10,
					page = 1,
				}: z.infer<typeof listOperationsSchema>) => {
					const params: Record<string, string> = {
						limit: String(limit),
						page: String(page),
					};
					if (clientId) params.clientId = clientId;
					if (activityCode) params.operationType = activityCode;
					if (startDate) params.startDate = startDate;
					if (endDate) params.endDate = endDate;
					const r = await fetchWithAuth<{
						data: Array<{
							id: string;
							activityCode?: string;
							amount: string;
							currencyCode?: string;
							operationDate: string;
							brand?: string;
							model?: string;
							year?: number;
							vehicleType?: string;
						}>;
						pagination: {
							total: number;
							page: number;
							limit: number;
							totalPages: number;
						};
					}>("/api/v1/operations", jwt, params);
					if (r.data.length === 0)
						return "No operations found matching the criteria.";
					const list = r.data
						.map((t) => {
							const vehicle = t.brand
								? ` (${t.year ?? ""} ${t.brand} ${t.model ?? ""})`
								: "";
							return `- [${t.activityCode ?? "N/A"}]${vehicle} ${fmtMoney(t.amount)} ${t.currencyCode ?? "MXN"} on ${t.operationDate} (ID: ${t.id})`;
						})
						.join("\n");
					return `Found ${r.pagination.total} operations (page ${r.pagination.page}/${r.pagination.totalPages}):\n${list}`;
				},
			),
		},

		listAlerts: {
			description:
				"List alerts (unusual operations) with optional filters by status, severity, or client.",
			inputSchema: listAlertsSchema,
			execute: wrapWithArgs(
				"listAlerts",
				async ({
					status,
					severity,
					clientId,
					limit = 10,
					page = 1,
				}: z.infer<typeof listAlertsSchema>) => {
					const params: Record<string, string> = {
						limit: String(limit),
						page: String(page),
					};
					if (status) params.status = status;
					if (severity) params.severity = severity;
					if (clientId) params.clientId = clientId;
					const r = await fetchWithAuth<{
						data: Array<{
							id: string;
							status: string;
							severity: string;
							alertRuleId: string;
							clientId: string;
							isOverdue: boolean;
							submissionDeadline?: string;
							createdAt: string;
							alertRule?: { name: string };
						}>;
						pagination: {
							total: number;
							page: number;
							limit: number;
							totalPages: number;
						};
					}>("/api/v1/alerts", jwt, params);
					if (r.data.length === 0)
						return "No alerts found matching the criteria.";
					const list = r.data
						.map((a) => {
							const rule = a.alertRule?.name ?? a.alertRuleId;
							const overdue = a.isOverdue ? " ⚠️OVERDUE" : "";
							return `- [${a.severity}] ${rule} — ${a.status}${overdue} | Client: ${a.clientId} | Deadline: ${a.submissionDeadline ?? "N/A"} (ID: ${a.id})`;
						})
						.join("\n");
					return `Found ${r.pagination.total} alerts (page ${r.pagination.page}/${r.pagination.totalPages}):\n${list}`;
				},
			),
		},

		listInvoices: {
			description:
				"List CFDI invoices with optional filters. Returns issuer, receiver, amounts, dates.",
			inputSchema: listInvoicesSchema,
			execute: wrapWithArgs(
				"listInvoices",
				async ({
					issuerRfc,
					receiverRfc,
					voucherTypeCode,
					startDate,
					endDate,
					limit = 10,
					page = 1,
				}: z.infer<typeof listInvoicesSchema>) => {
					const params: Record<string, string> = {
						limit: String(limit),
						page: String(page),
					};
					if (issuerRfc) params.issuerRfc = issuerRfc;
					if (receiverRfc) params.receiverRfc = receiverRfc;
					if (voucherTypeCode) params.voucherTypeCode = voucherTypeCode;
					if (startDate) params.startDate = startDate;
					if (endDate) params.endDate = endDate;
					const r = await fetchWithAuth<{
						data: Array<{
							id: string;
							uuid: string | null;
							issuerRfc: string;
							issuerName: string;
							receiverRfc: string;
							receiverName: string;
							total: string;
							currencyCode: string;
							voucherTypeCode: string;
							issueDate: string;
							folio: string | null;
							series: string | null;
						}>;
						pagination: {
							total: number;
							page: number;
							limit: number;
							totalPages: number;
						};
					}>("/api/v1/invoices", jwt, params);
					if (r.data.length === 0)
						return "No invoices found matching the criteria.";
					const list = r.data
						.map((inv) => {
							const ref = inv.series
								? `${inv.series}-${inv.folio ?? ""}`
								: (inv.folio ?? inv.uuid ?? inv.id);
							return `- [${inv.voucherTypeCode}] ${ref}: ${inv.issuerName} → ${inv.receiverName} | ${fmtMoney(inv.total)} ${inv.currencyCode} on ${inv.issueDate}`;
						})
						.join("\n");
					return `Found ${r.pagination.total} invoices (page ${r.pagination.page}/${r.pagination.totalPages}):\n${list}`;
				},
			),
		},

		listReports: {
			description:
				"List compliance reports with optional filters by type and status.",
			inputSchema: listReportsSchema,
			execute: wrapWithArgs(
				"listReports",
				async ({
					type,
					status,
					limit = 10,
					page = 1,
				}: z.infer<typeof listReportsSchema>) => {
					const params: Record<string, string> = {
						limit: String(limit),
						page: String(page),
					};
					if (type) params.type = type;
					if (status) params.status = status;
					const r = await fetchWithAuth<{
						data: Array<{
							id: string;
							name: string;
							periodType: string;
							status: string;
							periodStart: string;
							periodEnd: string;
							recordCount: number;
							createdAt: string;
						}>;
						pagination: {
							total: number;
							page: number;
							limit: number;
							totalPages: number;
						};
					}>("/api/v1/reports", jwt, params);
					if (r.data.length === 0)
						return "No reports found matching the criteria.";
					const list = r.data
						.map(
							(rpt) =>
								`- ${rpt.name} (${rpt.periodType}) — ${rpt.status} | ${rpt.periodStart} to ${rpt.periodEnd} | ${rpt.recordCount} records (ID: ${rpt.id})`,
						)
						.join("\n");
					return `Found ${r.pagination.total} reports (page ${r.pagination.page}/${r.pagination.totalPages}):\n${list}`;
				},
			),
		},

		listNotices: {
			description:
				"List SAT notices (Avisos) with optional filters by status and year.",
			inputSchema: listNoticesSchema,
			execute: wrapWithArgs(
				"listNotices",
				async ({
					status,
					year,
					limit = 10,
					page = 1,
				}: z.infer<typeof listNoticesSchema>) => {
					const params: Record<string, string> = {
						limit: String(limit),
						page: String(page),
					};
					if (status) params.status = status;
					if (year) params.year = String(year);
					const r = await fetchWithAuth<{
						data: Array<{
							id: string;
							name: string;
							status: string;
							reportedMonth: string;
							recordCount: number;
							submittedAt?: string;
							createdAt: string;
						}>;
						pagination: {
							total: number;
							page: number;
							limit: number;
							totalPages: number;
						};
					}>("/api/v1/notices", jwt, params);
					if (r.data.length === 0)
						return "No notices found matching the criteria.";
					const list = r.data
						.map(
							(n) =>
								`- ${n.name} — ${n.status} | Month: ${n.reportedMonth} | ${n.recordCount} records${n.submittedAt ? ` | Submitted: ${n.submittedAt}` : ""} (ID: ${n.id})`,
						)
						.join("\n");
					return `Found ${r.pagination.total} notices (page ${r.pagination.page}/${r.pagination.totalPages}):\n${list}`;
				},
			),
		},

		listAlertRules: {
			description:
				"List configured alert rules: name, severity, active status, activity code. Helps understand what triggers alerts.",
			inputSchema: listAlertRulesSchema,
			execute: wrapWithArgs(
				"listAlertRules",
				async ({
					active,
					severity,
					search,
					limit = 20,
					page = 1,
				}: z.infer<typeof listAlertRulesSchema>) => {
					const params: Record<string, string> = {
						limit: String(limit),
						page: String(page),
					};
					if (active !== undefined) params.active = String(active);
					if (severity) params.severity = severity;
					if (search) params.search = search;
					const r = await fetchWithAuth<{
						data: Array<{
							id: string;
							name: string;
							description?: string;
							active: boolean;
							severity: string;
							activityCode: string;
							isManualOnly: boolean;
						}>;
						pagination: {
							total: number;
							page: number;
							limit: number;
							totalPages: number;
						};
					}>("/api/v1/alert-rules", jwt, params);
					if (r.data.length === 0) return "No alert rules found.";
					const list = r.data
						.map(
							(rule) =>
								`- [${rule.severity}] ${rule.name} (${rule.id}) — ${rule.active ? "Active" : "Inactive"} | Activity: ${rule.activityCode}${rule.isManualOnly ? " | Manual only" : ""}${rule.description ? ` — ${rule.description}` : ""}`,
						)
						.join("\n");
					return `Found ${r.pagination.total} alert rules (page ${r.pagination.page}/${r.pagination.totalPages}):\n${list}`;
				},
			),
		},

		// ===================================================================
		// ANALYTICS
		// ===================================================================

		getExecutiveSummary: {
			description:
				"Get a comprehensive executive summary for a period: alert totals by severity/status, operation volume/top-clients, client stats, risk indicators (compliance score, critical alerts, high-risk clients), and period-over-period comparison.",
			inputSchema: periodSchema,
			execute: wrapWithArgs(
				"getExecutiveSummary",
				async ({
					periodStart,
					periodEnd,
					clientId,
				}: z.infer<typeof periodSchema>) => {
					const params: Record<string, string> = { periodStart, periodEnd };
					if (clientId) params.clientId = clientId;
					const s = await fetchWithAuth<{
						alerts: {
							total: number;
							bySeverity: Record<string, number>;
							byStatus: Record<string, number>;
							avgResolutionDays: number;
							overdueCount: number;
						};
						operations?: {
							total: number;
							totalAmount: number;
							avgAmount: number;
							topClients: Array<{
								clientName: string;
								count: number;
								amount: number;
							}>;
						};
						clients: {
							total: number;
							withAlerts: number;
							newInPeriod: number;
							byPersonType: Record<string, number>;
						};
						riskIndicators: {
							complianceScore: number;
							criticalAlerts: number;
							highRiskClients: number;
							overdueSubmissions: number;
						};
						comparison?: {
							alertsChange?: number;
							transactionsChange?: number;
							amountChange?: number;
							clientsChange?: number;
						};
					}>("/api/v1/reports/aggregate/summary", jwt, params);

					const sevStr = Object.entries(s.alerts.bySeverity)
						.map(([k, v]) => `${k}: ${v}`)
						.join(", ");
					const statusStr = Object.entries(s.alerts.byStatus)
						.map(([k, v]) => `${k}: ${v}`)
						.join(", ");
					const topClientsStr =
						s.operations?.topClients
							?.slice(0, 5)
							.map(
								(c) =>
									`  ${c.clientName}: ${c.count} ops, ${fmtMoney(c.amount)}`,
							)
							.join("\n") ?? "N/A";
					const compStr = s.comparison
						? `Alerts: ${s.comparison.alertsChange?.toFixed(1) ?? "N/A"}%, Transactions: ${s.comparison.transactionsChange?.toFixed(1) ?? "N/A"}%, Amount: ${s.comparison.amountChange?.toFixed(1) ?? "N/A"}%, Clients: ${s.comparison.clientsChange?.toFixed(1) ?? "N/A"}%`
						: "No comparison data";

					return [
						"## Executive Summary",
						`**Alerts**: ${s.alerts.total} total (overdue: ${s.alerts.overdueCount}, avg resolution: ${s.alerts.avgResolutionDays.toFixed(1)} days)`,
						`By severity: ${sevStr}`,
						`By status: ${statusStr}`,
						"",
						s.operations
							? `**Operations**: ${s.operations.total} total, Volume: ${fmtMoney(s.operations.totalAmount)}, Avg: ${fmtMoney(s.operations.avgAmount)}`
							: "**Operations**: N/A",
						`Top clients:\n${topClientsStr}`,
						"",
						`**Clients**: ${s.clients.total} total, ${s.clients.newInPeriod} new in period, ${s.clients.withAlerts} with alerts`,
						"",
						`**Risk Indicators**: Compliance Score: ${s.riskIndicators.complianceScore}%, Critical Alerts: ${s.riskIndicators.criticalAlerts}, High-Risk Clients: ${s.riskIndicators.highRiskClients}, Overdue Submissions: ${s.riskIndicators.overdueSubmissions}`,
						"",
						`**Period Comparison**: ${compStr}`,
					].join("\n");
				},
			),
		},

		getAlertAggregation: {
			description:
				"Get aggregated alert metrics for a period: total, by severity, by status, by rule, by month, average resolution days, overdue count.",
			inputSchema: periodSchema,
			execute: wrapWithArgs(
				"getAlertAggregation",
				async ({
					periodStart,
					periodEnd,
					clientId,
				}: z.infer<typeof periodSchema>) => {
					const params: Record<string, string> = { periodStart, periodEnd };
					if (clientId) params.clientId = clientId;
					const a = await fetchWithAuth<{
						total: number;
						bySeverity: Record<string, number>;
						byStatus: Record<string, number>;
						byRule: Array<{ ruleName: string; count: number }>;
						byMonth: Array<{ month: string; count: number }>;
						avgResolutionDays: number;
						overdueCount: number;
					}>("/api/v1/reports/aggregate/alerts", jwt, params);
					const sevStr = Object.entries(a.bySeverity)
						.map(([k, v]) => `${k}: ${v}`)
						.join(", ");
					const statusStr = Object.entries(a.byStatus)
						.map(([k, v]) => `${k}: ${v}`)
						.join(", ");
					const ruleStr = a.byRule
						.slice(0, 10)
						.map((r) => `  ${r.ruleName}: ${r.count}`)
						.join("\n");
					const monthStr = a.byMonth
						.map((m) => `  ${m.month}: ${m.count}`)
						.join("\n");
					return [
						`**Alert Aggregation**: ${a.total} total, ${a.overdueCount} overdue, avg resolution: ${a.avgResolutionDays.toFixed(1)} days`,
						`By severity: ${sevStr}`,
						`By status: ${statusStr}`,
						`By rule:\n${ruleStr || "  None"}`,
						`By month:\n${monthStr || "  None"}`,
					].join("\n");
				},
			),
		},

		getTransactionAggregation: {
			description:
				"Get aggregated transaction metrics for a period: total count, total/avg amount, by operation type, by currency, by month, top clients.",
			inputSchema: periodSchema,
			execute: wrapWithArgs(
				"getTransactionAggregation",
				async ({
					periodStart,
					periodEnd,
					clientId,
				}: z.infer<typeof periodSchema>) => {
					const params: Record<string, string> = { periodStart, periodEnd };
					if (clientId) params.clientId = clientId;
					const t = await fetchWithAuth<{
						total: number;
						totalAmount: number;
						avgAmount: number;
						byOperationType: Record<string, { count: number; amount: number }>;
						byCurrency: Record<string, { count: number; amount: number }>;
						byMonth: Array<{ month: string; count: number; amount: number }>;
						topClients: Array<{
							clientName: string;
							count: number;
							amount: number;
						}>;
					}>("/api/v1/reports/aggregate/transactions", jwt, params);
					const opTypeStr = Object.entries(t.byOperationType)
						.map(([k, v]) => `  ${k}: ${v.count} ops, ${fmtMoney(v.amount)}`)
						.join("\n");
					const currStr = Object.entries(t.byCurrency)
						.map(([k, v]) => `  ${k}: ${v.count} ops, ${fmtMoney(v.amount)}`)
						.join("\n");
					const monthStr = t.byMonth
						.map((m) => `  ${m.month}: ${m.count} ops, ${fmtMoney(m.amount)}`)
						.join("\n");
					const topStr = t.topClients
						.slice(0, 5)
						.map(
							(c) => `  ${c.clientName}: ${c.count} ops, ${fmtMoney(c.amount)}`,
						)
						.join("\n");
					return [
						`**Transaction Aggregation**: ${t.total} total, Volume: ${fmtMoney(t.totalAmount)}, Avg: ${fmtMoney(t.avgAmount)}`,
						`By operation type:\n${opTypeStr || "  None"}`,
						`By currency:\n${currStr || "  None"}`,
						`By month:\n${monthStr || "  None"}`,
						`Top clients:\n${topStr || "  None"}`,
					].join("\n");
				},
			),
		},

		// ===================================================================
		// NOTICES & UMA
		// ===================================================================

		getAvailableNoticeMonths: {
			description:
				"Get which months are available for creating a new SAT notice. Shows existing notice status for each month.",
			inputSchema: emptySchema,
			execute: wrap("getAvailableNoticeMonths", async () => {
				const r = await fetchWithAuth<{
					months: Array<{
						year: number;
						month: number;
						displayName: string;
						hasNotice: boolean;
						hasPendingNotice: boolean;
						hasSubmittedNotice: boolean;
						noticeCount: number;
					}>;
				}>("/api/v1/notices/available-months", jwt);
				if (!r.months || r.months.length === 0)
					return "No months available for notice creation.";
				const list = r.months
					.map((m) => {
						const status = m.hasSubmittedNotice
							? "✅ Submitted"
							: m.hasPendingNotice
								? "⏳ Pending"
								: "📝 Available";
						return `- ${m.displayName} (${m.year}-${String(m.month).padStart(2, "0")}): ${status} (${m.noticeCount} notices)`;
					})
					.join("\n");
				return `Available months:\n${list}`;
			}),
		},

		previewNotice: {
			description:
				"Preview alerts that would go into a notice for a given month. Shows totals by severity/status and deadline before creating.",
			inputSchema: noticePreviewSchema,
			execute: wrapWithArgs(
				"previewNotice",
				async ({ year, month }: z.infer<typeof noticePreviewSchema>) => {
					const params: Record<string, string> = {
						year: String(year),
						month: String(month),
					};
					const p = await fetchWithAuth<{
						total: number;
						bySeverity: Record<string, number>;
						byStatus: Record<string, number>;
						periodStart: string;
						periodEnd: string;
						reportedMonth: string;
						displayName: string;
						submissionDeadline: string;
					}>("/api/v1/notices/preview", jwt, params);
					const sevStr = Object.entries(p.bySeverity)
						.map(([k, v]) => `${k}: ${v}`)
						.join(", ");
					const statusStr = Object.entries(p.byStatus)
						.map(([k, v]) => `${k}: ${v}`)
						.join(", ");
					return [
						`**Notice Preview: ${p.displayName}**`,
						`Period: ${p.periodStart} to ${p.periodEnd}`,
						`Submission deadline: ${p.submissionDeadline}`,
						`Total alerts: ${p.total}`,
						`By severity: ${sevStr || "None"}`,
						`By status: ${statusStr || "None"}`,
					].join("\n");
				},
			),
		},

		getActiveUmaValue: {
			description:
				"Get the current active UMA daily value. Essential for calculating LFPIORPI thresholds in MXN (threshold_UMA × daily_value = MXN amount).",
			inputSchema: emptySchema,
			execute: wrap("getActiveUmaValue", async () => {
				const u = await fetchWithAuth<{
					id: string;
					year: number;
					dailyValue: string;
					effectiveDate: string;
					active: boolean;
				}>("/api/v1/uma-values/active", jwt);
				return `Active UMA (${u.year}): $${u.dailyValue} MXN/day (effective since ${u.effectiveDate}). Example thresholds: 6,420 UMA = ${fmtMoney(parseFloat(u.dailyValue) * 6420)} MXN, 3,210 UMA = ${fmtMoney(parseFloat(u.dailyValue) * 3210)} MXN`;
			}),
		},

		getExchangeRate: {
			description:
				"Get currency exchange rate (e.g. USD→MXN). Useful when operations are in foreign currencies.",
			inputSchema: exchangeRateSchema,
			execute: wrapWithArgs(
				"getExchangeRate",
				async ({
					from = "USD",
					to = "MXN",
				}: z.infer<typeof exchangeRateSchema>) => {
					const r = await fetchWithAuth<{
						from: string;
						to: string;
						rate: number;
						date: string;
					}>("/api/v1/exchange-rates", jwt, { from, to });
					return `Exchange rate ${r.from}/${r.to}: ${r.rate.toFixed(4)} (as of ${r.date}). Example: 1,000 ${r.from} = ${fmtMoney(1000 * r.rate)} ${r.to}`;
				},
			),
		},
	};
}

export type DataTools = ReturnType<typeof createDataTools>;
