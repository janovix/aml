"use client";

import { createContext, useContext } from "react";
import type { OrganizationSettingsEntity } from "@/lib/api/organization-settings";

export interface OrgSettingsContextValue {
	settings: OrganizationSettingsEntity | null;
	isLoading: boolean;
	refresh: () => Promise<void>;
}

export const OrgSettingsContext = createContext<OrgSettingsContextValue>({
	settings: null,
	isLoading: true,
	refresh: async () => {},
});

export function useOrgSettingsContext(): OrgSettingsContextValue {
	return useContext(OrgSettingsContext);
}
