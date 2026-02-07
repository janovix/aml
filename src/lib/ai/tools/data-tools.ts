/**
 * AI Data Tools
 *
 * Tools that allow the AI to query real data from the aml-svc API.
 * These tools make authenticated requests on behalf of the user.
 */

import { z } from "zod";
import { getAmlCoreBaseUrl } from "@/lib/api/config";

/**
 * Helper to make authenticated API calls
 */
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

// Define schemas for tool parameters
const emptySchema = z.object({});

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
	operationType: z
		.enum(["PURCHASE", "SALE"])
		.optional()
		.describe("Filter by operation type"),
	vehicleType: z
		.enum(["LAND", "MARINE", "AIR"])
		.optional()
		.describe("Filter by vehicle type"),
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

/**
 * Create data tools that can query the aml-svc API
 * Returns tools compatible with AI SDK streamText
 */
export function createDataTools(jwt: string) {
	return {
		getClientStats: {
			description:
				"Get statistics about clients in the organization, including total count and breakdown by type (physical/moral persons)",
			inputSchema: emptySchema,
			execute: async () => {
				try {
					const stats = await fetchWithAuth<{
						totalClients: number;
						physicalClients: number;
						moralClients: number;
					}>("/api/v1/clients/stats", jwt);
					return `Total clients: ${stats.totalClients} (${stats.physicalClients} physical persons, ${stats.moralClients} companies)`;
				} catch (error) {
					const msg =
						error instanceof Error ? error.message : "Failed to fetch stats";
					return `Error fetching client stats: ${msg}`;
				}
			},
		},

		getOperationStats: {
			description:
				"Get statistics about operations, including today's count, suspicious count, and total volume",
			inputSchema: emptySchema,
			execute: async () => {
				try {
					const stats = await fetchWithAuth<{
						operationsToday: number;
						suspiciousOperations: number;
						totalVolume: string;
					}>("/api/v1/operations/stats", jwt);
					return `Operations today: ${stats.operationsToday}, Suspicious: ${stats.suspiciousOperations}, Total volume: ${stats.totalVolume}`;
				} catch (error) {
					const msg =
						error instanceof Error ? error.message : "Failed to fetch stats";
					return `Error fetching operation stats: ${msg}`;
				}
			},
		},

		listClients: {
			description:
				"List clients in the organization with optional filters. Returns paginated results.",
			inputSchema: listClientsSchema,
			execute: async ({
				search,
				personType,
				limit = 10,
				page = 1,
			}: z.infer<typeof listClientsSchema>) => {
				try {
					const params: Record<string, string> = {
						limit: String(limit),
						page: String(page),
					};
					if (search) params.search = search;
					if (personType) params.personType = personType;

					const result = await fetchWithAuth<{
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

					if (result.data.length === 0) {
						return `No clients found matching the criteria.`;
					}

					const clientList = result.data
						.map((c) => {
							const name =
								c.personType === "MORAL"
									? c.businessName
									: `${c.firstName || ""} ${c.lastName || ""}`.trim();
							return `- ${name} (RFC: ${c.rfc}, Type: ${c.personType})`;
						})
						.join("\n");

					return `Found ${result.pagination.total} clients (showing ${result.data.length} on page ${result.pagination.page}):\n${clientList}`;
				} catch (error) {
					const msg =
						error instanceof Error ? error.message : "Failed to fetch clients";
					return `Error fetching clients: ${msg}`;
				}
			},
		},

		listOperations: {
			description:
				"List operations in the organization with optional filters. Returns paginated results.",
			inputSchema: listOperationsSchema,
			execute: async ({
				clientId,
				operationType,
				vehicleType,
				limit = 10,
				page = 1,
			}: z.infer<typeof listOperationsSchema>) => {
				try {
					const params: Record<string, string> = {
						limit: String(limit),
						page: String(page),
					};
					if (clientId) params.clientId = clientId;
					if (operationType) params.operationType = operationType;
					if (vehicleType) params.vehicleType = vehicleType;

					const result = await fetchWithAuth<{
						data: Array<{
							id: string;
							operationType: string;
							vehicleType: string;
							vehicleBrand?: string;
							vehicleModel?: string;
							vehicleYear?: number;
							amount: number;
							operationDate: string;
						}>;
						pagination: {
							total: number;
							page: number;
							limit: number;
							totalPages: number;
						};
					}>("/api/v1/operations", jwt, params);

					if (result.data.length === 0) {
						return `No operations found matching the criteria.`;
					}

					const txList = result.data
						.map((t) => {
							const vehicle =
								`${t.vehicleYear || ""} ${t.vehicleBrand || ""} ${t.vehicleModel || ""}`.trim();
							return `- ${t.operationType}: ${vehicle} (${t.vehicleType}) - $${t.amount.toLocaleString()} on ${t.operationDate}`;
						})
						.join("\n");

					return `Found ${result.pagination.total} operations (showing ${result.data.length} on page ${result.pagination.page}):\n${txList}`;
				} catch (error) {
					const msg =
						error instanceof Error
							? error.message
							: "Failed to fetch operations";
					return `Error fetching operations: ${msg}`;
				}
			},
		},

		listAlerts: {
			description:
				"List alerts (unusual operations) in the organization with optional filters.",
			inputSchema: listAlertsSchema,
			execute: async ({
				status,
				severity,
				limit = 10,
				page = 1,
			}: z.infer<typeof listAlertsSchema>) => {
				try {
					const params: Record<string, string> = {
						limit: String(limit),
						page: String(page),
					};
					if (status) params.status = status;
					if (severity) params.severity = severity;

					const result = await fetchWithAuth<{
						data: Array<{
							id: string;
							status: string;
							severity: string;
							description: string;
							detectedAt: string;
							deadline?: string;
						}>;
						pagination: {
							total: number;
							page: number;
							limit: number;
							totalPages: number;
						};
					}>("/api/v1/alerts", jwt, params);

					if (result.data.length === 0) {
						return `No alerts found matching the criteria.`;
					}

					const alertList = result.data
						.map(
							(a) =>
								`- [${a.severity}] ${a.description} (Status: ${a.status}, Detected: ${a.detectedAt})`,
						)
						.join("\n");

					return `Found ${result.pagination.total} alerts (showing ${result.data.length} on page ${result.pagination.page}):\n${alertList}`;
				} catch (error) {
					const msg =
						error instanceof Error ? error.message : "Failed to fetch alerts";
					return `Error fetching alerts: ${msg}`;
				}
			},
		},

		listReports: {
			description:
				"List compliance reports in the organization with optional filters.",
			inputSchema: listReportsSchema,
			execute: async ({
				type,
				status,
				limit = 10,
				page = 1,
			}: z.infer<typeof listReportsSchema>) => {
				try {
					const params: Record<string, string> = {
						limit: String(limit),
						page: String(page),
					};
					if (type) params.type = type;
					if (status) params.status = status;

					const result = await fetchWithAuth<{
						data: Array<{
							id: string;
							type: string;
							status: string;
							periodStart: string;
							periodEnd: string;
							createdAt: string;
						}>;
						pagination: {
							total: number;
							page: number;
							limit: number;
							totalPages: number;
						};
					}>("/api/v1/reports", jwt, params);

					if (result.data.length === 0) {
						return `No reports found matching the criteria.`;
					}

					const reportList = result.data
						.map(
							(r) =>
								`- ${r.type} Report (${r.periodStart} to ${r.periodEnd}) - Status: ${r.status}`,
						)
						.join("\n");

					return `Found ${result.pagination.total} reports (showing ${result.data.length} on page ${result.pagination.page}):\n${reportList}`;
				} catch (error) {
					const msg =
						error instanceof Error ? error.message : "Failed to fetch reports";
					return `Error fetching reports: ${msg}`;
				}
			},
		},
	};
}

export type DataTools = ReturnType<typeof createDataTools>;
