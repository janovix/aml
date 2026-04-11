import { getAmlCoreBaseUrl } from "./config";
import { fetchJson } from "./http";

export interface RiskApiOptions {
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
	/** Fills `ClientRiskDashboard.organizationId` (API does not return it). */
	organizationId?: string;
}

// ─── Client Risk ────────────────────────────────────────────────────────────

export type RiskLevel =
	| "LOW"
	| "MEDIUM_LOW"
	| "MEDIUM"
	| "MEDIUM_HIGH"
	| "HIGH";
export type DDLevel = "SIMPLIFIED" | "STANDARD" | "ENHANCED";

export interface FactorScore {
	name: string;
	score: number;
	weight: number;
	weightedScore: number;
}

export interface ElementScore {
	elementType: string;
	factors: FactorScore[];
	rawScore: number;
	riskLevel: RiskLevel;
}

export interface DDProfile {
	clientAcceptance: DDLevel;
	identificationVerification: DDLevel;
	ongoingMonitoring: DDLevel;
	transactionScrutiny: DDLevel;
	reportingObligations: DDLevel;
}

export interface ClientRiskAssessment {
	id: string;
	clientId: string;
	organizationId: string;
	version: number;
	riskLevel: RiskLevel;
	riskScore: number;
	inherentRiskScore: number;
	residualRiskScore: number;
	mitigantEffect: number;
	ddLevel: DDLevel;
	ddProfile: DDProfile;
	elements: ElementScore[];
	triggerReason: string;
	createdAt: string;
}

export interface ClientRiskDashboard {
	organizationId: string;
	distribution: {
		total: number;
		LOW: number;
		MEDIUM_LOW: number;
		MEDIUM: number;
		MEDIUM_HIGH: number;
		HIGH: number;
	};
	dueForReview: number;
}

/** Wire shape from aml-svc `GET /api/v1/risk/dashboard` */
interface RiskDashboardApiResponse {
	clientRiskDistribution?: {
		total: number;
		distribution: Record<string, number>;
	};
	clientsPendingReview?: number;
	orgAssessment?: unknown;
}

function normalizeClientRiskDashboard(
	json: RiskDashboardApiResponse,
	organizationId = "",
): ClientRiskDashboard {
	const inner = json.clientRiskDistribution;
	const d = inner?.distribution ?? {};
	const total = inner?.total ?? 0;
	return {
		organizationId,
		distribution: {
			total,
			LOW: d.LOW ?? 0,
			MEDIUM_LOW: d.MEDIUM_LOW ?? 0,
			MEDIUM: d.MEDIUM ?? 0,
			MEDIUM_HIGH: d.MEDIUM_HIGH ?? 0,
			HIGH: d.HIGH ?? 0,
		},
		dueForReview: json.clientsPendingReview ?? 0,
	};
}

// ─── Org Risk ───────────────────────────────────────────────────────────────

export interface OrgRiskElement {
	elementType: string;
	riskScore: number;
	riskLevel: RiskLevel;
	impactScore: number;
	probabilityScore: number;
	factorBreakdown: Record<string, number>;
}

export interface OrgMitigant {
	mitigantKey: string;
	mitigantName: string;
	exists: boolean;
	effectivenessScore: number;
	riskEffect: number;
}

export interface OrgRiskAssessment {
	id: string;
	organizationId: string;
	version: number;
	riskLevel: RiskLevel;
	inherentRiskScore: number;
	residualRiskScore: number;
	requiredAuditType: string;
	fpRiskLevel: string;
	periodStartDate: string;
	periodEndDate: string;
	elements: OrgRiskElement[];
	mitigants: OrgMitigant[];
	createdAt: string;
}

export interface OrgEvolutionPoint {
	version: number;
	date: string;
	riskLevel: RiskLevel;
	inherentRiskScore: number;
	residualRiskScore: number;
	requiredAuditType: string;
	elements: Array<{
		elementType: string;
		riskScore: number;
		riskLevel: RiskLevel;
	}>;
}

// ─── API Functions ──────────────────────────────────────────────────────────

export async function getRiskDashboard(
	opts?: RiskApiOptions,
): Promise<ClientRiskDashboard> {
	const baseUrl = opts?.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL("/api/v1/risk/dashboard", baseUrl);

	const { json } = await fetchJson<RiskDashboardApiResponse>(url.toString(), {
		method: "GET",
		cache: "no-store",
		signal: opts?.signal,
		jwt: opts?.jwt,
	});
	return normalizeClientRiskDashboard(json, opts?.organizationId);
}

export async function getClientRiskAssessment(
	clientId: string,
	opts?: RiskApiOptions,
): Promise<ClientRiskAssessment | null> {
	const baseUrl = opts?.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/risk/${clientId}/assessment`, baseUrl);

	try {
		const { json } = await fetchJson<{ assessment: ClientRiskAssessment }>(
			url.toString(),
			{
				method: "GET",
				cache: "no-store",
				signal: opts?.signal,
				jwt: opts?.jwt,
			},
		);
		return json.assessment;
	} catch {
		return null;
	}
}

export async function getClientRiskHistory(
	clientId: string,
	opts?: RiskApiOptions,
): Promise<ClientRiskAssessment[]> {
	const baseUrl = opts?.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/risk/${clientId}/history`, baseUrl);

	const { json } = await fetchJson<{ assessments: ClientRiskAssessment[] }>(
		url.toString(),
		{
			method: "GET",
			cache: "no-store",
			signal: opts?.signal,
			jwt: opts?.jwt,
		},
	);
	return json.assessments;
}

export async function triggerClientRiskAssessment(
	clientId: string,
	opts?: RiskApiOptions,
): Promise<void> {
	const baseUrl = opts?.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/risk/${clientId}/assessment`, baseUrl);

	await fetchJson(url.toString(), {
		method: "POST",
		cache: "no-store",
		signal: opts?.signal,
		jwt: opts?.jwt,
	});
}

export async function getOrgRiskAssessment(
	opts?: RiskApiOptions,
): Promise<OrgRiskAssessment | null> {
	const baseUrl = opts?.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL("/api/v1/risk/org-assessment", baseUrl);

	try {
		const { json } = await fetchJson<
			{ assessment: OrgRiskAssessment | null } | OrgRiskAssessment
		>(url.toString(), {
			method: "GET",
			cache: "no-store",
			signal: opts?.signal,
			jwt: opts?.jwt,
		});
		if (json && typeof json === "object" && "assessment" in json) {
			return (json as { assessment: OrgRiskAssessment | null }).assessment;
		}
		// Legacy aml-svc: undecorated body when an assessment exists
		if (
			json &&
			typeof json === "object" &&
			"id" in json &&
			"organizationId" in json &&
			"riskLevel" in json
		) {
			return json as OrgRiskAssessment;
		}
		return null;
	} catch {
		return null;
	}
}

export async function getOrgRiskEvolution(
	opts?: RiskApiOptions,
): Promise<OrgEvolutionPoint[]> {
	const baseUrl = opts?.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL("/api/v1/risk/org-assessment/evolution", baseUrl);

	const { json } = await fetchJson<{
		organizationId: string;
		evolution: OrgEvolutionPoint[];
	}>(url.toString(), {
		method: "GET",
		cache: "no-store",
		signal: opts?.signal,
		jwt: opts?.jwt,
	});
	return json.evolution;
}

export async function triggerOrgRiskAssessment(
	opts?: RiskApiOptions,
): Promise<void> {
	const baseUrl = opts?.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL("/api/v1/risk/org-assessment", baseUrl);

	await fetchJson(url.toString(), {
		method: "POST",
		cache: "no-store",
		signal: opts?.signal,
		jwt: opts?.jwt,
	});
}

// ─── Evaluations List/Detail ────────────────────────────────────────────────

export interface RiskEvaluationRow {
	id: string;
	clientId: string;
	clientName: string;
	clientRfc: string;
	clientPersonType: string;
	riskLevel: RiskLevel;
	dueDiligenceLevel: DDLevel;
	inherentRiskScore: number;
	residualRiskScore: number;
	triggerReason: string | null;
	assessedAt: string;
	methodologyId: string | null;
	version: number;
}

export interface RiskEvaluationDetail {
	id: string;
	clientId: string;
	client: {
		id: string;
		name: string;
		rfc: string;
		personType: string;
		isPEP: boolean;
		countryCode: string | null;
		stateCode: string | null;
	};
	riskLevel: RiskLevel;
	dueDiligenceLevel: DDLevel;
	inherentRiskScore: number;
	residualRiskScore: number;
	clientFactors: ElementScore & { ddProfile?: DDProfile };
	geographicFactors: ElementScore;
	activityFactors: ElementScore;
	transactionFactors: ElementScore;
	mitigantFactors: { effect: number; factors: FactorScore[] };
	assessedAt: string;
	nextReviewAt: string;
	assessedBy: string;
	triggerReason: string | null;
	methodologyId: string | null;
	version: number;
}

export interface RiskFilterMeta {
	riskLevels: Array<{ value: string; count: number }>;
	triggerReasons: Array<{ value: string; count: number }>;
}

export interface EvaluationsListResponse {
	success: boolean;
	data: RiskEvaluationRow[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
	filterMeta: RiskFilterMeta;
}

export interface ListEvaluationsOptions {
	page?: number;
	limit?: number;
	search?: string;
	riskLevel?: string;
	triggerReason?: string;
	clientId?: string;
	sort?: string;
	direction?: "asc" | "desc";
	filters?: Record<string, string | string[]>;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}

export async function listRiskEvaluations(
	opts?: ListEvaluationsOptions,
): Promise<EvaluationsListResponse> {
	const baseUrl = opts?.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL("/api/v1/risk/evaluations", baseUrl);

	if (opts?.page) url.searchParams.set("page", String(opts.page));
	if (opts?.limit) url.searchParams.set("limit", String(opts.limit));
	if (opts?.search) url.searchParams.set("search", opts.search);
	if (opts?.riskLevel) url.searchParams.set("riskLevel", opts.riskLevel);
	if (opts?.triggerReason)
		url.searchParams.set("triggerReason", opts.triggerReason);
	if (opts?.clientId) url.searchParams.set("clientId", opts.clientId);
	if (opts?.sort) url.searchParams.set("sort", opts.sort);
	if (opts?.direction) url.searchParams.set("direction", opts.direction);

	if (opts?.filters) {
		for (const [key, value] of Object.entries(opts.filters)) {
			if (Array.isArray(value)) {
				value.forEach((v) => url.searchParams.append(key, v));
			} else {
				url.searchParams.set(key, value);
			}
		}
	}

	const { json } = await fetchJson<EvaluationsListResponse>(url.toString(), {
		method: "GET",
		cache: "no-store",
		signal: opts?.signal,
		jwt: opts?.jwt,
	});
	return json;
}

export async function getRiskEvaluationDetail(
	id: string,
	opts?: RiskApiOptions,
): Promise<RiskEvaluationDetail> {
	const baseUrl = opts?.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/risk/evaluations/${id}`, baseUrl);

	const { json } = await fetchJson<{
		success: boolean;
		data: RiskEvaluationDetail;
	}>(url.toString(), {
		method: "GET",
		cache: "no-store",
		signal: opts?.signal,
		jwt: opts?.jwt,
	});
	return json.data;
}

// ─── Methodology (org-scoped) ───────────────────────────────────────────────

export interface MethodologyCategory {
	name: string;
	displayName: string;
	weight: number;
	factors: Array<{
		name: string;
		displayName: string;
		weight: number;
		factorType: string;
		dataSource: string;
		scoreMaps: Array<{
			conditionType: string;
			conditionValue: string;
			score: number;
			label?: string;
		}>;
	}>;
}

export interface MethodologyThreshold {
	riskLevel: string;
	minScore: number;
	maxScore: number;
	ddLevel: string;
	reviewMonths: number;
}

export interface MethodologyMitigant {
	mitigantKey: string;
	displayName: string;
	maxEffect: number;
	weight: number;
	dataSource: string;
}

export interface MethodologyData {
	id: string;
	scope: string;
	sourceScope: string;
	name: string;
	version: number;
	scaleMax: number;
	categories: MethodologyCategory[];
	thresholds: MethodologyThreshold[];
	mitigants: MethodologyMitigant[];
}

export async function getEffectiveMethodology(
	opts?: RiskApiOptions,
): Promise<MethodologyData> {
	const baseUrl = opts?.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL("/api/v1/risk/methodology", baseUrl);

	const { json } = await fetchJson<{ success: boolean; data: MethodologyData }>(
		url.toString(),
		{
			method: "GET",
			cache: "no-store",
			signal: opts?.signal,
			jwt: opts?.jwt,
		},
	);
	return json.data;
}

export async function saveMethodologyOverride(
	methodology: {
		name?: string;
		description?: string;
		categories: MethodologyCategory[];
		thresholds: MethodologyThreshold[];
		mitigants: MethodologyMitigant[];
	},
	opts?: RiskApiOptions,
): Promise<MethodologyData> {
	const baseUrl = opts?.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL("/api/v1/risk/methodology", baseUrl);

	const { json } = await fetchJson<{ success: boolean; data: MethodologyData }>(
		url.toString(),
		{
			method: "PUT",
			cache: "no-store",
			signal: opts?.signal,
			jwt: opts?.jwt,
			body: JSON.stringify(methodology),
			headers: { "Content-Type": "application/json" },
		},
	);
	return json.data;
}

export async function resetMethodologyToDefault(
	opts?: RiskApiOptions,
): Promise<MethodologyData> {
	const baseUrl = opts?.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL("/api/v1/risk/methodology/reset", baseUrl);

	const { json } = await fetchJson<{ success: boolean; data: MethodologyData }>(
		url.toString(),
		{
			method: "POST",
			cache: "no-store",
			signal: opts?.signal,
			jwt: opts?.jwt,
		},
	);
	return json.data;
}
