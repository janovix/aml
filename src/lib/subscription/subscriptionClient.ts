"use client";

/**
 * Subscription API client for the aml frontend
 *
 * Provides functions to fetch subscription status from auth-svc.
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
	| "business"
	| "pro"
	| "enterprise";

export interface UsageCheckResult {
	allowed: boolean;
	used: number;
	included: number;
	remaining: number;
	overage: number;
	planTier: PlanTier;
}

export interface SubscriptionStatus {
	hasSubscription: boolean;
	isEnterprise: boolean;
	status:
		| "inactive"
		| "trialing"
		| "active"
		| "past_due"
		| "canceled"
		| "unpaid";
	planTier: PlanTier;
	planName: string | null;
	currentPeriodStart: string | null;
	currentPeriodEnd: string | null;
	cancelAtPeriodEnd: boolean;
	usage: {
		notices: UsageCheckResult;
		users: UsageCheckResult;
		alerts?: UsageCheckResult;
		operations?: UsageCheckResult;
	} | null;
	features: string[];
	stripeCustomerId: string;
	organizationsOwned: number;
	organizationsLimit: number;
}

interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
}

/**
 * Get subscription status for current organization
 */
export async function getSubscriptionStatus(): Promise<SubscriptionStatus | null> {
	try {
		const response = await fetch(`${getBaseUrl()}/api/subscription`, {
			credentials: "include",
		});

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
 * Check if user is on free tier
 */
export function isFreeTier(subscription: SubscriptionStatus | null): boolean {
	if (!subscription) return false;
	return (
		subscription.planTier === "free" ||
		(!!subscription.stripeCustomerId && !subscription.hasSubscription)
	);
}

/**
 * Check if user has any active paid subscription
 */
export function hasPaidSubscription(
	subscription: SubscriptionStatus | null,
): boolean {
	if (!subscription) return false;
	return (
		subscription.hasSubscription &&
		subscription.planTier !== "none" &&
		subscription.planTier !== "free"
	);
}

/**
 * Get usage percentage for a metric
 */
export function getUsagePercentage(usage: UsageCheckResult): number {
	if (usage.included === -1 || usage.included === 0) return 0; // Unlimited or none
	return Math.round((usage.used / usage.included) * 100);
}

/**
 * Check if usage is at or near limit (>= 80%)
 */
export function isNearLimit(usage: UsageCheckResult): boolean {
	const percentage = getUsagePercentage(usage);
	return percentage >= 80;
}

/**
 * Check if usage has reached limit (>= 100%)
 */
export function isAtLimit(usage: UsageCheckResult): boolean {
	const percentage = getUsagePercentage(usage);
	return percentage >= 100;
}

/**
 * Product feature types
 */
export type ProductFeature = "product_aml" | "product_watchlist";

/**
 * Check if user has access to a specific product
 * @param subscription - Current subscription status
 * @param product - Product feature to check ("product_aml" or "product_watchlist")
 * @returns true if user has access to the product
 */
export function hasProductAccess(
	subscription: SubscriptionStatus | null,
	product: ProductFeature,
): boolean {
	if (!subscription) return false;
	if (!subscription.hasSubscription) return false;

	// Check if subscription is active or trialing
	if (subscription.status !== "active" && subscription.status !== "trialing") {
		return false;
	}

	// Check if the product feature is in the features array
	return subscription.features.includes(product);
}

/**
 * Check if user has AML access
 * Requires product_aml feature (included in business, pro, ultra plans)
 */
export function hasAMLAccess(subscription: SubscriptionStatus | null): boolean {
	return hasProductAccess(subscription, "product_aml");
}

/**
 * Check if user has Watchlist access
 * Requires product_watchlist feature (included in all plans)
 */
export function hasWatchlistAccess(
	subscription: SubscriptionStatus | null,
): boolean {
	return hasProductAccess(subscription, "product_watchlist");
}
