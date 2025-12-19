export const getAuthServiceUrl = (): string => {
	return (
		process.env.AUTH_SERVICE_URL ||
		"https://auth-svc.example.workers.dev"
	);
};

export const getAuthAppUrl = (): string => {
	return (
		process.env.NEXT_PUBLIC_AUTH_APP_URL || "https://auth.example.workers.dev"
	);
};
