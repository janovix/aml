"use client";

/**
 * Subscription API client for the aml frontend
 *
 * Provides functions to fetch subscription status from auth-svc.
 * Supports both Stripe subscriptions and enterprise licenses.
 */
import { getAuthServiceUrl } from "../auth/config";

const getBaseUrl = () => getAuthServiceUrl();

export type PlanTier =
	| "none"
	| "free"
	| "watchlist"
	| "business"
	| "pro"
	| "ultra"
	| "enterprise";

/**
 * Plan limits returned by auth-svc
 */
export interface PlanLimits {
	maxOrganizations: number;
	usersPerOrg: number;
	reportsPerMonth: number;
	noticesPerMonth: number;
	alertsPerMonth: number;
	operationsPerMonth: number;
	clientsPerMonth: number;
}

/**
 * Subscription status aligned with auth-svc UserSubscriptionStatus
 */
export interface SubscriptionStatus {
	hasSubscription: boolean;
	status:
		| "trialing"
		| "active"
		| "canceled"
		| "past_due"
		| "unpaid"
		| "incomplete"
		| "incomplete_expired"
		| "paused"
		| null;
	plan: PlanTier | null;
	limits: PlanLimits | null;
	isTrialing: boolean;
	trialDaysRemaining: number | null;
	currentPeriodStart: string | null;
	currentPeriodEnd: string | null;
	cancelAtPeriodEnd: boolean;
	// License support (enterprise licenses)
	isLicenseBased: boolean;
	licenseExpiresAt: string | null;
	// Organization stats
	organizationsOwned: number;
	organizationsLimit: number;
}

interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
}

/** Matches auth-svc GET /api/subscription/usage-details */
export interface UsageDetailsPayload {
	usage: {
		reports: number;
		notices: number;
		alerts: number;
		operations: number;
		clients: number;
		users: number;
		watchlistQueries: number;
	};
	limits: {
		reports: number;
		notices: number;
		alerts: number;
		operations: number;
		clients: number;
		users: number;
		watchlistQueriesPerMonth: number;
		maxOrganizations: number;
	} | null;
	period: { start: string; end: string };
	overage: {
		enabled: boolean;
		spendLimitCents: number | null;
		periodChargeCents: number;
		currency: string;
	};
}

/**
 * Get subscription status for current user
 */
export async function getSubscriptionStatus(): Promise<SubscriptionStatus | null> {
	try {
		const response = await fetch(
			`${getBaseUrl()}/api/subscription/status?resolveFromOrg=true`,
			{
				credentials: "include",
			},
		);

		if (!response.ok) {
			console.warn("Failed to fetch subscription status:", response.status);
			return null;
		}

		const result = (await response.json()) as ApiResponse<SubscriptionStatus>;
		return result.success ? (result.data ?? null) : null;
	} catch (error) {
		console.warn("Error fetching subscription status:", error);
		return null;
	}
}

/**
 * Usage vs limits for the active org (owner entitlements). Used for nearing-limit UI.
 */
export async function getUsageDetails(): Promise<UsageDetailsPayload | null> {
	try {
		const response = await fetch(
			`${getBaseUrl()}/api/subscription/usage-details`,
			{
				credentials: "include",
			},
		);
		if (!response.ok) return null;
		const result = (await response.json()) as ApiResponse<UsageDetailsPayload>;
		return result.success ? (result.data ?? null) : null;
	} catch {
		return null;
	}
}

/**
 * Check if user is on free tier (no active subscription or license)
 */
export function isFreeTier(subscription: SubscriptionStatus | null): boolean {
	if (!subscription) return false;
	return !subscription.hasSubscription;
}

/**
 * Check if user has any active paid subscription (Stripe or license)
 */
export function hasPaidSubscription(
	subscription: SubscriptionStatus | null,
): boolean {
	if (!subscription) return false;
	return (
		subscription.hasSubscription &&
		subscription.plan !== null &&
		subscription.plan !== "none" &&
		subscription.plan !== "free"
	);
}

/**
 * Check if user has an enterprise license (not Stripe)
 */
export function isEnterprise(subscription: SubscriptionStatus | null): boolean {
	if (!subscription) return false;
	return subscription.isLicenseBased || subscription.plan === "enterprise";
}

/**
 * Get usage percentage for a metric (based on limits)
 */
export function getUsagePercentage(used: number, included: number): number {
	if (included <= 0) return 0; // Unlimited or none
	return Math.round((used / included) * 100);
}

/**
 * Check if user has AML product access.
 * Watchlist-only plans (plan === "watchlist") do not include AML access.
 * All other active Stripe subscriptions and enterprise licenses include AML access.
 */
export function hasAMLAccess(subscription: SubscriptionStatus | null): boolean {
	if (!subscription) return false;
	if (!subscription.hasSubscription) return false;
	// Watchlist-only Stripe plan does not include AML product access
	if (subscription.plan === "watchlist") return false;

	return subscription.status === "active" || subscription.status === "trialing";
}

/**
 * Check if user has Watchlist access.
 * All active subscriptions (including watchlist-only plan) include Watchlist access.
 */
export function hasWatchlistAccess(
	subscription: SubscriptionStatus | null,
): boolean {
	if (!subscription) return false;
	if (!subscription.hasSubscription) return false;

	return subscription.status === "active" || subscription.status === "trialing";
}
