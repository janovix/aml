/**
 * Unified Janbot tool registry (AML data tools + extensions + auth + optional import).
 */

import { getFlagsServiceUrl } from "@/lib/auth/config";
import { createDataTools } from "./data-tools";
import { createExtendedJanbotTools } from "./extended-tools";
import { createAuthJanbotTools } from "./auth-tools";
import { createImportTool, type FileUpload } from "./import-tool";
import { getDataToolInventoryMarkdown } from "./data-tools";
import { getExtendedToolInventoryMarkdown } from "./extended-tools";
import { getAuthToolInventoryMarkdown } from "./auth-tools";

export const JANBOT_TOOL_FLAG_PREFIX = "janbot.tools.";

export type FileUploadContext = FileUpload;

export type JanbotTools = ReturnType<typeof buildJanbotTools>;

function decodeJwtSub(jwt: string): string | undefined {
	try {
		const payload = jwt.split(".")[1];
		if (!payload) return undefined;
		const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
		const json = JSON.parse(atob(b64)) as { sub?: string };
		return typeof json.sub === "string" ? json.sub : undefined;
	} catch {
		return undefined;
	}
}

/**
 * Evaluates flags-svc keys `janbot.tools.<toolName>`; when a flag is explicitly false, the tool is removed.
 */
export async function filterToolsByJanbotFlags<
	T extends Record<string, unknown>,
>(tools: T, jwt: string, organizationId?: string): Promise<T> {
	const names = Object.keys(tools);
	if (names.length === 0) return tools;

	let base: string;
	try {
		base = getFlagsServiceUrl().replace(/\/$/, "");
	} catch {
		return tools;
	}

	const keys = names.map((n) => `${JANBOT_TOOL_FLAG_PREFIX}${n}`);
	const userId = decodeJwtSub(jwt);

	try {
		const res = await fetch(`${base}/api/flags/evaluate`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${jwt}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				context: {
					organizationId,
					userId,
					environment: process.env.NEXT_PUBLIC_ENVIRONMENT ?? "development",
				},
				keys,
			}),
			cache: "no-store",
		});
		if (!res.ok) return tools;
		const body = (await res.json()) as {
			success?: boolean;
			result?: Record<string, boolean | string | number | unknown>;
		};
		const result = body.result ?? {};
		const out = { ...tools };
		for (const name of names) {
			const v = result[`${JANBOT_TOOL_FLAG_PREFIX}${name}`];
			if (v === false) {
				delete (out as Record<string, unknown>)[name];
			}
		}
		return out;
	} catch {
		return tools;
	}
}

export function buildJanbotTools(args: {
	jwt: string;
	orgSlug?: string;
	organizationId?: string;
	fileUpload?: FileUploadContext;
}) {
	const { jwt, orgSlug, fileUpload } = args;
	return {
		...createDataTools(jwt),
		...createExtendedJanbotTools(jwt),
		...createAuthJanbotTools(jwt),
		...(fileUpload ? createImportTool(jwt, fileUpload, orgSlug) : {}),
	};
}

export function getFullJanbotToolInventoryMarkdown(): string {
	return [
		getDataToolInventoryMarkdown(),
		getExtendedToolInventoryMarkdown(),
		getAuthToolInventoryMarkdown(),
	].join("\n\n");
}
