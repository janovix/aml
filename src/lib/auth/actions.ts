"use client";

import { authClient } from "./authClient";
import { clearSession } from "./sessionStore";
import { getAuthAppUrl } from "./config";

export async function logout(): Promise<void> {
	try {
		await authClient.signOut();
	} catch {
		// Continue even if API call fails
	}

	// Clear local session state
	clearSession();

	// Redirect to auth app login
	window.location.href = `${getAuthAppUrl()}/login`;
}
