"use server";

import { cookies, headers } from "next/headers";
import { getAuthServiceUrl } from "@/lib/auth/config";
import type { UserSettings, UIPreferences } from "./types";

interface SettingsApiResponse<T> {
	success: boolean;
	data: T;
	error?: string;
}

/**
 * Fetch user settings from auth-svc (server-side)
 * This can be called from Server Components or Server Actions
 */
export async function getUserSettingsServer(): Promise<UserSettings | null> {
	try {
		const baseUrl = getAuthServiceUrl();
		const cookieStore = await cookies();
		const headersList = await headers();

		// Forward cookies for authentication
		const cookieHeader = cookieStore.toString();

		const response = await fetch(`${baseUrl}/api/settings/user`, {
			headers: {
				Cookie: cookieHeader,
				// Forward any additional headers that might be needed
				"User-Agent": headersList.get("user-agent") || "",
			},
			// Don't cache this response
			cache: "no-store",
		});

		if (!response.ok) {
			return null;
		}

		const result =
			(await response.json()) as SettingsApiResponse<UserSettings | null>;
		return result.data;
	} catch (error) {
		console.error("[settingsServer] Failed to fetch user settings:", error);
		return null;
	}
}

/**
 * Get UI preferences from user settings (server-side)
 */
export async function getUIPreferencesServer(): Promise<UIPreferences> {
	const settings = await getUserSettingsServer();
	return settings?.metadata ?? {};
}

/**
 * Get sidebar collapsed state from user settings (server-side)
 */
export async function getSidebarCollapsedServer(): Promise<boolean> {
	const prefs = await getUIPreferencesServer();
	return prefs.sidebarCollapsed ?? false;
}
