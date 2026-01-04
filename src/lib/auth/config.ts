export const getAuthServiceUrl = (): string => {
	return (
		process.env.NEXT_PUBLIC_AUTH_SERVICE_URL ||
		"https://auth-svc.janovix.workers.dev"
	);
};

export const getAuthAppUrl = (): string => {
	return (
		process.env.NEXT_PUBLIC_AUTH_APP_URL || "https://auth.janovix.workers.dev"
	);
};
