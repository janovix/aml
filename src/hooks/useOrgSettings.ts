"use client";

import { useOrgSettingsContext } from "@/contexts/org-settings-context";
import type { OrganizationSettingsEntity } from "@/lib/api/organization-settings";
import type { ActivityCode } from "@/types/operation";

interface UseOrgSettingsReturn {
	settings: OrganizationSettingsEntity | null;
	activityCode: ActivityCode | null;
	isLoading: boolean;
	isConfigured: boolean;
	error: string | null;
	refresh: () => Promise<void>;
}

/**
 * Reads org settings from the OrgBootstrapper context.
 * OrgBootstrapper fetches settings once at startup and exposes them here —
 * no per-component HTTP requests, no duplicate fetches.
 */
export function useOrgSettings(): UseOrgSettingsReturn {
	const { settings, isLoading, refresh } = useOrgSettingsContext();

	const activityCode = (settings?.activityKey as ActivityCode) ?? null;
	const isConfigured = Boolean(
		settings?.activityKey && settings?.obligatedSubjectKey,
	);

	return {
		settings,
		activityCode,
		isLoading,
		isConfigured,
		error: null,
		refresh,
	};
}
