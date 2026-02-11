"use client";

import { authClient } from "./authClient";
import { clearSession } from "./sessionStore";
import { getAuthAppUrl } from "./config";
import { broadcastSignOut } from "./sessionSync";

export async function logout(): Promise<void> {
	const authAppUrl = getAuthAppUrl();

	try {
		await authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					// Clear local session state
					clearSession();
					// Notify other tabs of sign-out
					broadcastSignOut();
					// Redirect to auth app login
					window.location.href = `${authAppUrl}/login`;
				},
			},
		});
	} catch {
		// If signOut fails, still clear session and redirect
		clearSession();
		// Notify other tabs of sign-out even on error
		broadcastSignOut();
		window.location.href = `${authAppUrl}/login`;
	}
}
