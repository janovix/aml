"use client";

/**
 * Settings API client for the aml frontend
 *
 * Provides functions to fetch and update user settings from auth-svc.
 */
import { getAuthServiceUrl } from "../auth/config";
import type {
	UserSettings,
	ResolvedSettings,
	UpdateUserSettingsInput,
	SettingsApiResponse,
	UIPreferences,
} from "./types";

const getBaseUrl = () => getAuthServiceUrl();

/**
 * Get current user's settings
 */
export async function getUserSettings(): Promise<UserSettings | null> {
	const response = await fetch(`${getBaseUrl()}/api/settings/user`, {
		credentials: "include",
	});

	if (!response.ok) {
		throw new Error("Failed to fetch user settings");
	}

	const result =
		(await response.json()) as SettingsApiResponse<UserSettings | null>;
	return result.data;
}

/**
 * Update current user's settings
 */
export async function updateUserSettings(
	input: UpdateUserSettingsInput,
): Promise<UserSettings> {
	const response = await fetch(`${getBaseUrl()}/api/settings/user`, {
		method: "PATCH",
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(input),
	});

	if (!response.ok) {
		const errorResponse = (await response
			.json()
			.catch(() => ({ error: "Unknown error" }))) as { error?: string };
		throw new Error(errorResponse.error || "Failed to update user settings");
	}

	const result = (await response.json()) as SettingsApiResponse<UserSettings>;
	return result.data;
}

/**
 * Get resolved settings (merged from all sources)
 */
export async function getResolvedSettings(): Promise<ResolvedSettings> {
	// Encode browser hints
	const browserHints = {
		"accept-language": navigator.language,
		"x-timezone": Intl.DateTimeFormat().resolvedOptions().timeZone,
		"x-preferred-theme": window.matchMedia("(prefers-color-scheme: dark)")
			.matches
			? "dark"
			: "light",
	};
	const encodedHeaders = btoa(JSON.stringify(browserHints));

	const response = await fetch(
		`${getBaseUrl()}/api/settings/resolved?headers=${encodeURIComponent(encodedHeaders)}`,
		{
			credentials: "include",
		},
	);

	if (!response.ok) {
		throw new Error("Failed to fetch resolved settings");
	}

	const result =
		(await response.json()) as SettingsApiResponse<ResolvedSettings>;
	return result.data;
}

/**
 * Get UI preferences from user settings metadata
 */
export async function getUIPreferences(): Promise<UIPreferences> {
	try {
		const settings = await getUserSettings();
		return settings?.metadata ?? {};
	} catch {
		return {};
	}
}

/**
 * Update UI preferences (merges with existing metadata)
 */
export async function updateUIPreferences(
	preferences: UIPreferences,
): Promise<UserSettings> {
	// First get current settings to merge metadata
	const currentSettings = await getUserSettings();
	const currentMetadata = currentSettings?.metadata ?? {};

	// Merge new preferences with existing metadata
	const mergedMetadata = {
		...currentMetadata,
		...preferences,
	};

	return updateUserSettings({ metadata: mergedMetadata });
}

/**
 * Get sidebar collapsed state from user settings
 */
export async function getSidebarCollapsed(): Promise<boolean | undefined> {
	const prefs = await getUIPreferences();
	return prefs.sidebarCollapsed;
}

/**
 * Update sidebar collapsed state in user settings
 */
export async function setSidebarCollapsed(
	collapsed: boolean,
): Promise<UserSettings> {
	return updateUIPreferences({ sidebarCollapsed: collapsed });
}
