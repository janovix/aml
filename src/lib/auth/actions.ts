"use client";

import { authClient } from "./authClient";
import { clearSession } from "./sessionStore";
import { getAuthAppUrl } from "./config";

export async function logout(): Promise<void> {
	const authAppUrl = getAuthAppUrl();

	try {
		await authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					// Clear local session state
					clearSession();
					// Redirect to auth app login
					window.location.href = `${authAppUrl}/login`;
				},
			},
		});
	} catch {
		// If signOut fails, still clear session and redirect
		clearSession();
		window.location.href = `${authAppUrl}/login`;
	}
}
