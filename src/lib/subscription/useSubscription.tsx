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
	isEnterprise as checkIsEnterprise,
	type SubscriptionStatus,
} from "./subscriptionClient";

export interface SubscriptionContextValue {
	/** Current subscription status */
	subscription: SubscriptionStatus | null;
	/** Whether data is loading */
	isLoading: boolean;
	/** Any error that occurred */
	error: Error | null;
	/** Refresh subscription status */
	refresh: () => Promise<void>;
	/** Check if on free tier (no active subscription) */
	isFreeTier: boolean;
	/** Check if has paid subscription (Stripe or license) */
	hasPaidSubscription: boolean;
	/** Check if on enterprise license */
	isEnterprise: boolean;
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

	const value: SubscriptionContextValue = {
		subscription,
		isLoading,
		error,
		refresh,
		isFreeTier: checkIsFreeTier(subscription),
		hasPaidSubscription: checkHasPaidSubscription(subscription),
		isEnterprise: checkIsEnterprise(subscription),
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
