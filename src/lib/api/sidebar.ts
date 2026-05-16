/**
 * AML sidebar badge counts (`aml-svc` `/api/v1/sidebar/*`).
 */

import { getAmlCoreBaseUrl } from "@/lib/api/config";
import { fetchJson } from "@/lib/api/http";

function base(): string {
	return `${getAmlCoreBaseUrl()}/api/v1/sidebar`;
}

export type SidebarBadgesData = {
	alerts: number;
	notices: number;
	reports: number;
	riskModels: number;
	imports: number;
	training: number;
};

export type SidebarIndicatorKey = keyof SidebarBadgesData;

export async function getSidebarBadges(init?: RequestInit & { jwt?: string }) {
	return fetchJson<{ data: SidebarBadgesData }>(`${base()}/badges`, {
		method: "GET",
		cache: "no-store",
		...init,
	});
}
