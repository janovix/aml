import { getAmlCoreBaseUrl } from "./config";
import { fetchJson } from "./http";

export interface ClientStats {
	totalClients: number;
	physicalClients: number;
	moralClients: number;
	trustClients: number;
}

export interface OperationStats {
	transactionsToday: number;
	suspiciousTransactions: number;
	totalVolume: string;
	totalVehicles: number;
}

export interface AlertAggregation {
	total: number;
	bySeverity: Record<string, number>;
	byStatus: Record<string, number>;
	byRule: Array<{ ruleId: string; ruleName: string; count: number }>;
	byMonth: Array<{ month: string; count: number }>;
	avgResolutionDays: number;
	overdueCount: number;
}

export interface OperationAggregation {
	total: number;
	totalAmount: number;
	avgAmount: number;
	byOperationType: Record<string, { count: number; amount: number }>;
	byVehicleType: Record<string, { count: number; amount: number }>;
	byCurrency: Record<string, { count: number; amount: number }>;
	byMonth: Array<{ month: string; count: number; amount: number }>;
	topClients: Array<{
		clientId: string;
		clientName: string;
		count: number;
		amount: number;
	}>;
}

export interface ClientAggregation {
	total: number;
	byPersonType: Record<string, number>;
	byCountry: Record<string, number>;
	withAlerts: number;
	newInPeriod: number;
}

export interface ComparisonMetrics {
	alertsChange?: number;
	transactionsChange?: number;
	amountChange?: number;
	clientsChange?: number;
}

export interface RiskIndicators {
	highRiskClients: number;
	criticalAlerts: number;
	overdueSubmissions: number;
	complianceScore: number;
}

export interface ReportAggregation {
	alerts: AlertAggregation;
	operations?: OperationAggregation;
	clients: ClientAggregation;
	comparison?: ComparisonMetrics;
	riskIndicators: RiskIndicators;
}

export interface StatsOptions {
	baseUrl?: string;
	signal?: AbortSignal;
	/** JWT token for authentication */
	jwt?: string;
}

export interface ReportSummaryOptions extends StatsOptions {
	periodStart: string;
	periodEnd: string;
	comparisonPeriodStart?: string;
	comparisonPeriodEnd?: string;
}

export async function getClientStats(
	opts?: StatsOptions,
): Promise<ClientStats> {
	const baseUrl = opts?.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL("/api/v1/clients/stats", baseUrl);

	const { json } = await fetchJson<ClientStats>(url.toString(), {
		method: "GET",
		cache: "no-store",
		signal: opts?.signal,
		jwt: opts?.jwt,
	});
	return json;
}

export async function getOperationStats(
	opts?: StatsOptions,
): Promise<OperationStats> {
	const baseUrl = opts?.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL("/api/v1/operations/stats", baseUrl);

	const { json } = await fetchJson<OperationStats>(url.toString(), {
		method: "GET",
		cache: "no-store",
		signal: opts?.signal,
		jwt: opts?.jwt,
	});
	return json;
}

export async function getReportSummary(
	opts: ReportSummaryOptions,
): Promise<ReportAggregation> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL("/api/v1/reports/aggregate/summary", baseUrl);

	url.searchParams.set("periodStart", opts.periodStart);
	url.searchParams.set("periodEnd", opts.periodEnd);
	if (opts.comparisonPeriodStart) {
		url.searchParams.set("comparisonPeriodStart", opts.comparisonPeriodStart);
	}
	if (opts.comparisonPeriodEnd) {
		url.searchParams.set("comparisonPeriodEnd", opts.comparisonPeriodEnd);
	}

	const { json } = await fetchJson<ReportAggregation>(url.toString(), {
		method: "GET",
		cache: "no-store",
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}
