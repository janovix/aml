import { atom } from "nanostores";
import { getCookie, setCookie, COOKIE_NAMES } from "@/lib/cookies";

/** Data plane scope (matches aml-svc tenant environment) */
export type DataEnvironment = "production" | "staging" | "development";

export const DATA_ENVIRONMENTS: readonly DataEnvironment[] = [
	"production",
	"staging",
	"development",
] as const;

function parseDataEnvironment(raw: string | undefined): DataEnvironment {
	if (raw === "staging" || raw === "development") return raw;
	return "production";
}

export const environmentAtom = atom<DataEnvironment>("production");

/** True after `initEnvironmentFromCookie()` has run on the client (for toast gating). */
export const envHydratedAtom = atom<boolean>(false);

/**
 * Hydrate atom from cross-subdomain cookie (call once on client mount).
 */
export function initEnvironmentFromCookie(): void {
	if (typeof window === "undefined") return;
	environmentAtom.set(
		parseDataEnvironment(getCookie(COOKIE_NAMES.ENVIRONMENT)),
	);
	envHydratedAtom.set(true);
}

export function setDataEnvironment(env: DataEnvironment): void {
	environmentAtom.set(env);
	setCookie(COOKIE_NAMES.ENVIRONMENT, env);
}

export function getDataEnvironment(): DataEnvironment {
	return environmentAtom.get();
}
