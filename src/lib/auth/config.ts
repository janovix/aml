export const getAuthCoreBaseUrl = (): string => {
	return (
		process.env.NEXT_PUBLIC_AUTH_CORE_BASE_URL ||
		"https://auth-svc.example.workers.dev"
	);
};

export const getAuthAppUrl = (): string => {
	return (
		process.env.NEXT_PUBLIC_AUTH_APP_URL || "https://auth.example.workers.dev"
	);
};
