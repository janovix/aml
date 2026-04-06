import { requireEnv } from "@/lib/env";

export const getAuthServiceUrl = (): string => {
	return requireEnv(
		"NEXT_PUBLIC_AUTH_SERVICE_URL",
		process.env.NEXT_PUBLIC_AUTH_SERVICE_URL,
	);
};

export const getAuthAppUrl = (): string => {
	return requireEnv(
		"NEXT_PUBLIC_AUTH_APP_URL",
		process.env.NEXT_PUBLIC_AUTH_APP_URL,
	);
};

export const getWatchlistAppUrl = (): string => {
	return requireEnv(
		"NEXT_PUBLIC_WATCHLIST_APP_URL",
		process.env.NEXT_PUBLIC_WATCHLIST_APP_URL,
	);
};

export const getHomepageUrl = (): string => {
	return requireEnv(
		"NEXT_PUBLIC_HOMEPAGE_URL",
		process.env.NEXT_PUBLIC_HOMEPAGE_URL,
	);
};

export const getAmlAppUrl = (): string => {
	return requireEnv(
		"NEXT_PUBLIC_AML_APP_URL",
		process.env.NEXT_PUBLIC_AML_APP_URL,
	);
};

export const getNotificationsServiceUrl = (): string => {
	return requireEnv(
		"NEXT_PUBLIC_NOTIFICATIONS_SERVICE_URL",
		process.env.NEXT_PUBLIC_NOTIFICATIONS_SERVICE_URL,
	);
};

/** flags-svc base URL for server-side evaluation (use with JWT). */
export const getFlagsServiceUrl = (): string => {
	return requireEnv(
		"NEXT_PUBLIC_FLAGS_SERVICE_URL",
		process.env.NEXT_PUBLIC_FLAGS_SERVICE_URL,
	);
};
