/**
 * Settings types for the aml frontend
 */

export type Theme = "light" | "dark" | "system";
export type DateFormat =
	| "MM/DD/YYYY"
	| "DD/MM/YYYY"
	| "YYYY-MM-DD"
	| "DD.MM.YYYY";
export type LanguageCode = "en" | "es";
export type ClockFormat = "12h" | "24h";

/**
 * UI preferences stored in metadata
 */
export interface UIPreferences {
	sidebarCollapsed?: boolean;
}

/**
 * Type-safe metadata for user settings
 */
export interface UserSettingsMetadata extends UIPreferences {
	[key: string]: unknown;
}

export interface UserSettings {
	id: string;
	userId: string;
	theme: Theme | null;
	timezone: string | null;
	language: LanguageCode | null;
	dateFormat: DateFormat | null;
	clockFormat: ClockFormat | null;
	avatarUrl: string | null;
	metadata: UserSettingsMetadata | null;
	createdAt: string;
	updatedAt: string;
}

export interface ResolvedSettings {
	theme: Theme;
	timezone: string;
	language: LanguageCode;
	dateFormat: DateFormat;
	clockFormat: ClockFormat;
	avatarUrl: string | null;
	sources: {
		theme: "user" | "organization" | "browser" | "default";
		timezone: "user" | "organization" | "browser" | "default";
		language: "user" | "organization" | "browser" | "default";
		dateFormat: "user" | "organization" | "default";
		clockFormat: "user" | "organization" | "default";
	};
}

export interface UpdateUserSettingsInput {
	theme?: Theme | null;
	timezone?: string | null;
	language?: LanguageCode | null;
	dateFormat?: DateFormat | null;
	clockFormat?: ClockFormat | null;
	avatarUrl?: string | null;
	metadata?: UserSettingsMetadata;
}

export interface SettingsApiResponse<T> {
	success: boolean;
	data: T;
	error?: string;
}

/**
 * Default settings when auth-svc is unavailable
 */
export const DEFAULT_SETTINGS: ResolvedSettings = {
	theme: "system",
	timezone: "UTC",
	language: "es",
	dateFormat: "DD/MM/YYYY",
	clockFormat: "12h",
	avatarUrl: null,
	sources: {
		theme: "default",
		timezone: "default",
		language: "default",
		dateFormat: "default",
		clockFormat: "default",
	},
};
