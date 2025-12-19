import { createAuthClient } from "better-auth/client";
import { getAuthServiceUrl } from "./config";

export const authClient = createAuthClient({
	baseURL: getAuthServiceUrl(),
	fetchOptions: {
		credentials: "include", // CRITICAL: Required for cookies
	},
});
