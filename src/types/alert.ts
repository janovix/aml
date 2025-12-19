export type AlertStatus = "pending" | "in_review" | "resolved" | "dismissed";
export type AlertSeverity = "low" | "medium" | "high" | "critical";
export type AlertSource = "manual" | "olap" | "system";

export interface Alert {
	id: string;
	title: string;
	description: string;
	status: AlertStatus;
	severity: AlertSeverity;
	source: AlertSource;
	clientId?: string | null;
	clientRfc?: string | null;
	transactionId?: string | null;
	fiscalMonth: string; // Format: YYYY-MM (e.g., "2024-01" for fiscal month ending Jan 17)
	detectedAt: string; // date-time format
	createdAt: string; // date-time format
	updatedAt: string; // date-time format
	resolvedAt?: string | null; // date-time format
	resolvedBy?: string | null;
	notes?: string | null;
	metadata?: Record<string, unknown> | null;
}

export interface AlertCreateRequest {
	title: string;
	description: string;
	severity: AlertSeverity;
	clientId?: string | null;
	clientRfc?: string | null;
	transactionId?: string | null;
	notes?: string | null;
	metadata?: Record<string, unknown> | null;
}

export interface AlertUpdateRequest {
	status?: AlertStatus;
	notes?: string | null;
	resolvedBy?: string | null;
}

export interface AlertPagination {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

export interface AlertListResponse {
	data: Alert[];
	pagination: AlertPagination;
}

export interface FiscalMonthGroup {
	fiscalMonth: string; // Format: YYYY-MM
	displayName: string; // e.g., "Enero 2024" (Jan 17, 2024 - Feb 16, 2024)
	startDate: Date;
	endDate: Date;
	alerts: Alert[];
}
