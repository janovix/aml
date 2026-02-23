"use client";

import { useState, useEffect, useCallback } from "react";
import { useOrgStore } from "@/lib/org-store";
import { useJwt } from "@/hooks/useJwt";
import {
	getOrganizationSettings,
	type OrganizationSettingsEntity,
} from "@/lib/api/organization-settings";
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
 * Hook that fetches and caches the organization's AML settings.
 * Single source of truth for the org's vulnerable activity throughout the app.
 */
export function useOrgSettings(): UseOrgSettingsReturn {
	const { currentOrg } = useOrgStore();
	const { jwt, isLoading: isJwtLoading } = useJwt();

	const [settings, setSettings] = useState<OrganizationSettingsEntity | null>(
		null,
	);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchSettings = useCallback(async () => {
		if (!jwt || !currentOrg?.id) {
			setIsLoading(false);
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			const result = await getOrganizationSettings({ jwt });
			setSettings(result);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Error al cargar configuración",
			);
		} finally {
			setIsLoading(false);
		}
	}, [jwt, currentOrg?.id]);

	useEffect(() => {
		if (!isJwtLoading) {
			fetchSettings();
		}
	}, [fetchSettings, isJwtLoading]);

	const activityCode = (settings?.activityKey as ActivityCode) ?? null;
	const isConfigured = Boolean(
		settings?.activityKey && settings?.obligatedSubjectKey,
	);

	return {
		settings,
		activityCode,
		isLoading: isLoading || isJwtLoading,
		isConfigured,
		error,
		refresh: fetchSettings,
	};
}
