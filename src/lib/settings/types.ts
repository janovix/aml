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

export interface UserSettings {
	id: string;
	userId: string;
	theme: Theme | null;
	timezone: string | null;
	language: LanguageCode | null;
	dateFormat: DateFormat | null;
	avatarUrl: string | null;
	metadata: Record<string, unknown> | null;
	createdAt: string;
	updatedAt: string;
}

export interface ResolvedSettings {
	theme: Theme;
	timezone: string;
	language: LanguageCode;
	dateFormat: DateFormat;
	avatarUrl: string | null;
	sources: {
		theme: "user" | "organization" | "browser" | "default";
		timezone: "user" | "organization" | "browser" | "default";
		language: "user" | "organization" | "browser" | "default";
		dateFormat: "user" | "organization" | "default";
	};
}

export interface UpdateUserSettingsInput {
	theme?: Theme | null;
	timezone?: string | null;
	language?: LanguageCode | null;
	dateFormat?: DateFormat | null;
	avatarUrl?: string | null;
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
	avatarUrl: null,
	sources: {
		theme: "default",
		timezone: "default",
		language: "default",
		dateFormat: "default",
	},
};
