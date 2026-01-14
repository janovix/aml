"use client";

import {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
	type ReactNode,
} from "react";
import {
	getSubscriptionStatus,
	isFreeTier as checkIsFreeTier,
	hasPaidSubscription as checkHasPaidSubscription,
	isNearLimit as checkIsNearLimit,
	isAtLimit as checkIsAtLimit,
	getUsagePercentage,
	type SubscriptionStatus,
	type UsageCheckResult,
} from "./subscriptionClient";

interface SubscriptionContextValue {
	/** Current subscription status */
	subscription: SubscriptionStatus | null;
	/** Whether data is loading */
	isLoading: boolean;
	/** Any error that occurred */
	error: Error | null;
	/** Refresh subscription status */
	refresh: () => Promise<void>;
	/** Check if on free tier */
	isFreeTier: boolean;
	/** Check if has paid subscription */
	hasPaidSubscription: boolean;
	/** Get usage info for a specific metric */
	getUsage: (
		metric: "notices" | "users" | "alerts" | "transactions",
	) => UsageCheckResult | null;
	/** Check if a metric is near limit */
	isNearLimit: (
		metric: "notices" | "users" | "alerts" | "transactions",
	) => boolean;
	/** Check if a metric is at limit */
	isAtLimit: (
		metric: "notices" | "users" | "alerts" | "transactions",
	) => boolean;
	/** Get usage percentage for a metric */
	getUsagePercentage: (
		metric: "notices" | "users" | "alerts" | "transactions",
	) => number;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(
	null,
);

interface SubscriptionProviderProps {
	children: ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
	const [subscription, setSubscription] = useState<SubscriptionStatus | null>(
		null,
	);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	const refresh = useCallback(async () => {
		try {
			setIsLoading(true);
			setError(null);
			const status = await getSubscriptionStatus();
			setSubscription(status);
		} catch (err) {
			setError(err instanceof Error ? err : new Error("Unknown error"));
		} finally {
			setIsLoading(false);
		}
	}, []);

	// Initial fetch
	useEffect(() => {
		refresh();
	}, [refresh]);

	const getUsage = useCallback(
		(metric: "notices" | "users" | "alerts" | "transactions") => {
			if (!subscription?.usage) return null;
			return subscription.usage[metric] ?? null;
		},
		[subscription],
	);

	const isNearLimit = useCallback(
		(metric: "notices" | "users" | "alerts" | "transactions") => {
			const usage = getUsage(metric);
			if (!usage) return false;
			return checkIsNearLimit(usage);
		},
		[getUsage],
	);

	const isAtLimit = useCallback(
		(metric: "notices" | "users" | "alerts" | "transactions") => {
			const usage = getUsage(metric);
			if (!usage) return false;
			return checkIsAtLimit(usage);
		},
		[getUsage],
	);

	const getMetricUsagePercentage = useCallback(
		(metric: "notices" | "users" | "alerts" | "transactions") => {
			const usage = getUsage(metric);
			if (!usage) return 0;
			return getUsagePercentage(usage);
		},
		[getUsage],
	);

	const value: SubscriptionContextValue = {
		subscription,
		isLoading,
		error,
		refresh,
		isFreeTier: checkIsFreeTier(subscription),
		hasPaidSubscription: checkHasPaidSubscription(subscription),
		getUsage,
		isNearLimit,
		isAtLimit,
		getUsagePercentage: getMetricUsagePercentage,
	};

	return (
		<SubscriptionContext.Provider value={value}>
			{children}
		</SubscriptionContext.Provider>
	);
}

/**
 * Hook to access subscription status and helpers
 */
export function useSubscription(): SubscriptionContextValue {
	const context = useContext(SubscriptionContext);
	if (!context) {
		throw new Error(
			"useSubscription must be used within a SubscriptionProvider",
		);
	}
	return context;
}

/**
 * Hook to safely access subscription status, returns null if not in provider
 */
export function useSubscriptionSafe(): SubscriptionContextValue | null {
	return useContext(SubscriptionContext);
}
